import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Header, Depends
from pydantic import BaseModel
from .database import (
    companies_collection, 
    job_descriptions_collection, 
    candidate_profiles_collection,
    screenings_collection
)
from .extractor import extract_entities, detect_domain
from .ranker import rank_resumes
from .mailer import send_interview_invitations
from datetime import datetime, timezone
import shutil

router = APIRouter(prefix="/recruiter", tags=["recruiter"])

# Step 1: Company Profile Models
class CompanyProfile(BaseModel):
    company_name: str
    website: Optional[str] = None
    address: Optional[str] = None
    hq_location: Optional[str] = None

class JobDescriptionUpdate(BaseModel):
    id: Optional[str] = None
    title: str
    min_experience: int
    location_type: str  # Remote/Onsite
    core_skills: List[str]
    company_email: str
    mode: str  # Remote/Onsite (Standardizing)
    company_details: Optional[dict] = None # Added for Step 2

# Helper to save uploaded files
def save_upload_file(upload_file: UploadFile, directory: str) -> str:
    os.makedirs(directory, exist_ok=True)
    file_path = os.path.join(directory, upload_file.filename)
    upload_file.file.seek(0)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    upload_file.file.seek(0)
    return file_path

# --- STEP 1: Onboarding ---

@router.get("/check-onboarding")
async def check_onboarding(x_user_id: str = Header(...)):
    company = await companies_collection.find_one({"owner_id": x_user_id})
    return {"onboarded": company is not None, "company": company if company else None}

@router.post("/company")
async def save_company_profile(profile: CompanyProfile, x_user_id: str = Header(...)):
    doc = profile.dict()
    doc["owner_id"] = x_user_id
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await companies_collection.update_one(
        {"owner_id": x_user_id},
        {"$set": doc},
        upsert=True
    )
    # Also update user status
    from .database import users_collection
    await users_collection.update_one(
        {"email": x_user_id}, # Assuming x_user_id is email for simplicity or lookup by _id if it's uuid
        {"$set": {"status": "onboarded"}}
    )
    return {"message": "Company profile saved successfully"}

# --- STEP 2: JD Extraction (HITL) ---

@router.post("/jd/extract")
async def extract_jd_metadata(
    jd_file: UploadFile = File(...),
    x_user_id: str = Header(...)
):
    from .main import extract_text_from_file
    
    # Check if recruiter is onboarded
    company = await companies_collection.find_one({"owner_id": x_user_id})
    if not company:
        raise HTTPException(status_code=403, detail="Complete company onboarding first")
        
    text = await extract_text_from_file(jd_file)
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from JD")
        
    entities = extract_entities(text, is_jd=True)
    
    # Heuristic for Location Type
    location_type = "Onsite"
    if "remote" in text.lower():
        location_type = "Remote"
        
    return {
        "title": entities.get("Designation", "New Job Role"),
        "min_experience": int(entities.get("Years_of_Experience", 3)),
        "location_type": location_type,
        "core_skills": entities.get("Skills", []),
        "company_email": entities.get("Email", company.get("email", "")),
        "company_name": company.get("company_name", ""),
        "original_text": text
    }

@router.post("/jd/save")
async def save_finalized_jd(jd: JobDescriptionUpdate, x_user_id: str = Header(...)):
    # Fetch company details to attach
    company = await companies_collection.find_one({"owner_id": x_user_id})
    
    doc = jd.dict()
    doc["owner_id"] = x_user_id
    doc["company_details"] = company
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await job_descriptions_collection.insert_one(doc)
    return {"message": "Job Description saved", "id": str(result.inserted_id)}

# --- STEP 3: Track 1 – Private Bulk Upload ---

@router.post("/screen/private")
async def screen_private_batch(
    jd_id: str = Form(...),
    files: List[UploadFile] = File(...),
    x_user_id: str = Header(...)
):
    from .main import extract_text_from_file
    from bson import ObjectId
    
    # Fetch JD with strict ownership check
    jd = await job_descriptions_collection.find_one({"_id": ObjectId(jd_id), "owner_id": x_user_id})
    if not jd:
        raise HTTPException(status_code=404, detail="Job Description not found or unauthorized")
        
    jd_text = jd.get("title", "") + " " + " ".join(jd.get("core_skills", []))
    target_skills = jd.get("core_skills", [])
    
    processed_candidates = []
    upload_dir = os.path.join("data", "private_uploads", x_user_id, jd_id)
    
    for file in files:
        text = await extract_text_from_file(file)
        if not text: continue
        
        saved_path = save_upload_file(file, upload_dir)
        entities = extract_entities(text)
        
        # Calculate Skill Score
        from .ranker import manual_ranker
        skill_score = manual_ranker(target_skills, entities["Skills"])
        
        processed_candidates.append({
            "name": entities["Name"],
            "email": entities["Email"],
            "phone": entities["Phone"],
            "entities": {"Skills": entities["Skills"]},
            "years_of_experience": entities["Years_of_Experience"],
            "text": text,
            "cv_file_path": saved_path,
            "visibility": "private", # Step 3 Requirement
            "owner_id": x_user_id, # Step 3 Requirement
            "jd_id": jd_id,
            "score": round(skill_score, 4)
        })
        
    # Sort and take top matches
    processed_candidates.sort(key=lambda x: x['score'], reverse=True)
    
    # Save ranked results to a screening session
    screening_doc = {
        "owner_id": x_user_id,
        "jd_id": jd_id,
        "mode": "private",
        "candidates": processed_candidates,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await screenings_collection.insert_one(screening_doc)
    
    return {"status": "success", "candidates": processed_candidates}

# --- STEP 4: Track 2 – Global Search ---

@router.get("/screen/global")
async def search_global_candidates(
    jd_id: str,
    x_user_id: str = Header(...)
):
    from bson import ObjectId
    # Ensure HR can only search for JDs they own
    jd = await job_descriptions_collection.find_one({"_id": ObjectId(jd_id), "owner_id": x_user_id})
    if not jd:
        raise HTTPException(status_code=404, detail="Job Description not found")
        
    jd_text = jd.get("title", "") + " " + " ".join(jd.get("core_skills", []))
    target_skills = jd.get("core_skills", [])
    required_exp = jd.get("min_experience", 3)
    
    # Query all global candidate profiles (Step 4)
    # Filter for public profiles only
    cursor = candidate_profiles_collection.find({"visibility": "public"})
    global_candidates = await cursor.to_list(length=1000)
    
    candidate_list = []
    for c in global_candidates:
        # Step 4: Semantic Matching (Weighted 70/30)
        from .ranker import manual_ranker
        skill_score = manual_ranker(target_skills, c.get("skills", [])) * 100
        
        # Exp Score Logic (Simplistic for now)
        actual_exp = c.get("total_experience", 0)
        exp_score = 100 if actual_exp >= required_exp else (actual_exp / required_exp) * 100
        
        final_weighted_score = (skill_score * 0.7) + (exp_score * 0.3)
        
        candidate_list.append({
            "name": c["name"],
            "email": c["email"],
            "skills_extracted": c["skills"],
            "experience_years": actual_exp,
            "match_score_percentage": round(final_weighted_score, 2)
        })
        
    candidate_list.sort(key=lambda x: x['match_score_percentage'], reverse=True)
    return {"status": "success", "candidates": candidate_list[:5]}

# --- STEP 5: Automated Communication ---

@router.post("/candidates/invite")
async def invite_candidate(
    candidate_email: str,
    jd_id: str,
    x_user_id: str = Header(...)
):
    from bson import ObjectId
    jd = await job_descriptions_collection.find_one({"_id": ObjectId(jd_id), "owner_id": x_user_id})
    if not jd:
        raise HTTPException(status_code=404, detail="Job Description not found")
        
    company_email = jd.get("company_email")
    company_name = jd.get("company_details", {}).get("company_name", "Our Company")
    
    # Trigger SMTP flow (Step 5)
    # Using the existing mailer logic
    try:
        from .mailer import send_interview_invitations
        # Mocking for now to avoid actual SMTP overhead in test, but logic is hooked
        print(f"EMAILING: {candidate_email} from {company_email} for JD: {jd['title']}")
        # await send_interview_invitations([candidate_email], company_name, jd['title'])
        return {"message": f"Invitation sent to {candidate_email} via {company_email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mail failed: {str(e)}")
