import os
import re
import uuid
from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Header, Depends, BackgroundTasks
from pydantic import BaseModel
from .auth import get_current_user, get_current_recruiter
from .database import (
    companies_collection, 
    job_descriptions_collection, 
    candidate_profiles_collection,
    screenings_collection
)
from .extractor import extract_entities, detect_domain
from datetime import datetime, timezone
import shutil

router = APIRouter(prefix="/recruiter", tags=["recruiter"])

# Step 1: Company Profile Models
class CompanyProfile(BaseModel):
    company_name: str
    website: Optional[str] = None
    address: Optional[str] = None
    hq_location: Optional[str] = None
    workplace_type: Optional[str] = None
    full_name: Optional[str] = None
    role_title: Optional[str] = None
    logo: Optional[str] = None

class RecruiterProfileUpdate(BaseModel):
    full_name: str
    role_title: Optional[str] = None
    bio: Optional[str] = None
    company_name: str
    website: Optional[str] = None
    hq_location: Optional[str] = None
    workplace_type: Optional[str] = None
    address: Optional[str] = None
    logo: Optional[str] = None

class JobDescriptionUpdate(BaseModel):
    id: Optional[str] = None
    title: str
    min_experience: int
    location_type: str  # Remote/Onsite
    core_skills: List[str]
    company_email: str
    mode: str  # Remote/Onsite (Standardizing)
    company_details: Optional[dict] = None # Added for Step 2
    sector: Optional[str] = None # Sector/domain of the position
    is_hidden: Optional[bool] = False
    auto_invite_count: Optional[int] = 0


# Helper to search user by _id or email
def get_user_query(x_user_id: str) -> dict:
    from bson import ObjectId
    try:
        return {"$or": [{"_id": ObjectId(x_user_id)}, {"email": x_user_id}]}
    except Exception:
        return {"email": x_user_id}

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
async def check_onboarding(current_user: dict = Depends(get_current_recruiter)):
    x_user_id = str(current_user["_id"])
    company = await companies_collection.find_one({"owner_id": x_user_id})
    if company:
        company["id"] = str(company["_id"])
        del company["_id"]
    return {"onboarded": company is not None, "company": company if company else None}

@router.post("/company")
async def save_company_profile(profile: CompanyProfile, current_user: dict = Depends(get_current_recruiter)):
    x_user_id = str(current_user["_id"])
    doc = profile.dict()
    doc["owner_id"] = x_user_id
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Extract user-specific fields so they aren't stored in the company collection
    full_name = doc.pop("full_name", None)
    role_title = doc.pop("role_title", None)
    
    await companies_collection.update_one(
        {"owner_id": x_user_id},
        {"$set": doc},
        upsert=True
    )
    
    # Update user status, name, and role title in users_collection
    from .database import users_collection
    user_update = {"status": "onboarded"}
    if full_name:
        user_update["name"] = full_name
    if role_title:
        user_update["role_title"] = role_title
        
    await users_collection.update_one(
        get_user_query(x_user_id),
        {"$set": user_update}
    )
    return {"message": "Company profile saved successfully"}

@router.get("/profile")
async def get_recruiter_profile(current_user: dict = Depends(get_current_recruiter)):
    x_user_id = str(current_user["_id"])
    from .database import users_collection
    user = await users_collection.find_one(get_user_query(x_user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    company = await companies_collection.find_one({"owner_id": x_user_id})
    
    return {
        "full_name": user.get("name", ""),
        "role_title": user.get("role_title", ""),
        "email": user.get("email", ""),
        "bio": user.get("bio", "Hiring across product, design, and engineering for fast-growing SaaS teams."),
        "company": {
            "company_name": company.get("company_name", "") if company else "",
            "website": company.get("website", "") if company else "",
            "address": company.get("address", "") if company else "",
            "hq_location": company.get("hq_location", "") if company else "",
            "workplace_type": company.get("workplace_type", "Remote") if company else "Remote",
            "logo": company.get("logo", "") if company else "",
        }
    }

@router.post("/profile")
async def update_recruiter_profile(profile: RecruiterProfileUpdate, current_user: dict = Depends(get_current_recruiter)):
    x_user_id = str(current_user["_id"])
    from .database import users_collection
    await users_collection.update_one(
        get_user_query(x_user_id),
        {"$set": {
            "name": profile.full_name,
            "role_title": profile.role_title,
            "bio": profile.bio
        }}
    )
    
    await companies_collection.update_one(
        {"owner_id": x_user_id},
        {"$set": {
            "company_name": profile.company_name,
            "website": profile.website,
            "hq_location": profile.hq_location,
            "workplace_type": profile.workplace_type,
            "address": profile.address,
            "logo": profile.logo,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"message": "Profile updated successfully"}

# --- STEP 2: JD Extraction (HITL) ---

@router.post("/jd/extract")
async def extract_jd_metadata(
    jd_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_recruiter)
):
    x_user_id = str(current_user["_id"])
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

async def send_campaign_invitations(
    matches: list,
    auto_invite_count: int,
    job_title: str,
    company_details: dict,
    recruiter_name: str,
    recruiter_role: str,
    recruiter_id: str
):
    from .mailer import send_candidate_invite_email
    from .database import candidate_profiles_collection
    from bson import ObjectId
    
    top_n = matches[:auto_invite_count]
    for m in top_n:
        try:
            import anyio
            await anyio.to_thread.run_sync(
                send_candidate_invite_email,
                m.get("email"),
                m.get("name", "Candidate"),
                job_title,
                company_details,
                recruiter_name,
                recruiter_role
            )
            await candidate_profiles_collection.update_one(
                {"_id": ObjectId(m["id"])},
                {"$set": {f"recruiter_statuses.{recruiter_id}": "shortlisted"}}
            )
        except Exception as e:
            print(f"Error dispatching background invitation to {m.get('email')}: {e}")

@router.post("/jd/save")
async def save_finalized_jd(
    jd: JobDescriptionUpdate, 
    background_tasks: BackgroundTasks, 
    current_user: dict = Depends(get_current_recruiter)
):
    x_user_id = str(current_user["_id"])
    # Fetch company details to attach
    company = await companies_collection.find_one({"owner_id": x_user_id})
    if company:
        company["id"] = str(company["_id"])
        del company["_id"]
    
    doc = jd.dict()
    auto_invite_count = doc.pop("auto_invite_count", 0) or 0
    doc["owner_id"] = x_user_id
    doc["company_details"] = company
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["is_hidden"] = jd.is_hidden or False
    
    result = await job_descriptions_collection.insert_one(doc)
    jd_id = str(result.inserted_id)

    # Automatically rank candidates and perform initial screening session
    user_email = current_user.get("email")
    visibility_or = [{"visibility": "public"}, {"owner_id": x_user_id}]
    if user_email:
        visibility_or.append({"email": user_email})

    query = {
        "$or": visibility_or
    }
    sector = doc.get("sector")
    if sector:
        escaped_sector = re.escape(sector)
        query = {
            "$and": [
                {"$or": visibility_or},
                {"$or": [
                    {"sector": {"$regex": f"^{escaped_sector}$", "$options": "i"}},
                    {"domain": {"$regex": f"^{escaped_sector}$", "$options": "i"}}
                ]}
            ]
        }
    cursor = candidate_profiles_collection.find(query)
    db_candidates = await cursor.to_list(length=100)
    
    if not db_candidates:
        cursor = candidate_profiles_collection.find({"$or": visibility_or})
        db_candidates = await cursor.to_list(length=100)
        
    from .ranker import manual_ranker
    target_skills = doc.get("core_skills", [])
    required_exp = doc.get("min_experience", 3)
    
    matches = []
    for c in db_candidates:
        cand_skills = c.get("skills", c.get("skills_extracted", []))
        skill_score = manual_ranker(target_skills, cand_skills) * 100
        
        actual_exp = c.get("total_experience", c.get("experience_years", c.get("experience", 0)))
        exp_score = 100 if actual_exp >= required_exp else (actual_exp / required_exp) * 100
        
        final_weighted_score = (skill_score * 0.7) + (exp_score * 0.3)
        score = round(final_weighted_score)
        
        if score > 45:
            matches.append({
                "id": str(c["_id"]),
                "name": c.get("name", "Unknown Candidate"),
                "email": c.get("email", ""),
                "phone": c.get("phone", ""),
                "title": c.get("title", "Candidate Profile"),
                "skills_extracted": cand_skills,
                "experience_years": actual_exp,
                "match_score_percentage": score,
                "cv_file_path": c.get("original_cv_path", "").replace("\\", "/") if c.get("original_cv_path") else "",
                "status": c.get("recruiter_statuses", {}).get(x_user_id, "new"),
                "experiences": c.get("experiences", []),
                "education": c.get("education", [])
            })
            
    matches.sort(key=lambda x: x.get("match_score_percentage", 0), reverse=True)
    
    # Process auto invitations in the background if requested
    if auto_invite_count > 0 and matches:
        company_details = company if company else {}
        from .database import users_collection
        user = await users_collection.find_one(get_user_query(x_user_id))
        recruiter_name = user.get("name", "Hiring Team") if user else "Hiring Team"
        recruiter_role = user.get("role_title", "Recruiter") if user else "Recruiter"
        
        # Only invite candidates scoring >= 75%
        eligible_matches = [m for m in matches if m.get("match_score_percentage", 0) >= 75]
        
        if eligible_matches:
            background_tasks.add_task(
                send_campaign_invitations,
                eligible_matches,
                auto_invite_count,
                doc.get("title", "the role"),
                company_details,
                recruiter_name,
                recruiter_role,
                x_user_id
            )
            
            for m in eligible_matches[:auto_invite_count]:
                m["status"] = "shortlisted"
            
    # Save the screening session to DB
    screening_doc = {
        "recruiter_id": x_user_id,
        "owner_id": x_user_id,
        "jd_id": jd_id,
        "mode": "global",
        "candidates": matches,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await screenings_collection.insert_one(screening_doc)
    
    return {"message": "Job Description saved", "id": jd_id}

@router.put("/jd/{jd_id}")
async def update_finalized_jd(jd_id: str, jd: JobDescriptionUpdate, current_user: dict = Depends(get_current_recruiter)):
    x_user_id = str(current_user["_id"])
    from bson import ObjectId
    try:
        obj_id = ObjectId(jd_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
        
    existing = await job_descriptions_collection.find_one({"_id": obj_id, "owner_id": x_user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Job description not found or unauthorized")
        
    doc = jd.dict()
    update_doc = {
        "title": doc["title"],
        "min_experience": doc["min_experience"],
        "location_type": doc["location_type"],
        "core_skills": doc["core_skills"],
        "company_email": doc["company_email"],
        "mode": doc["location_type"],
        "sector": doc.get("sector") or existing.get("sector") or "General",
        "is_hidden": doc.get("is_hidden") if doc.get("is_hidden") is not None else existing.get("is_hidden", False),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await job_descriptions_collection.update_one(
        {"_id": obj_id, "owner_id": x_user_id},
        {"$set": update_doc}
    )
    return {"message": "Job Description updated successfully"}

@router.post("/jd/{jd_id}/visibility")
async def toggle_jd_visibility(jd_id: str, is_hidden: bool, current_user: dict = Depends(get_current_recruiter)):
    x_user_id = str(current_user["_id"])
    from bson import ObjectId
    try:
        obj_id = ObjectId(jd_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
        
    result = await job_descriptions_collection.update_one(
        {"_id": obj_id, "owner_id": x_user_id},
        {"$set": {"is_hidden": is_hidden}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job description not found or unauthorized")
        
    return {"message": f"Job visibility updated to {'hidden' if is_hidden else 'visible'}", "is_hidden": is_hidden}

# --- STEP 3: Track 1 – Private Bulk Upload ---

@router.post("/screen/bulk")
async def screen_bulk_private(
    jd_id: str = Form(...),
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_recruiter)
):
    x_user_id = str(current_user["_id"])
    from .main import extract_text_from_file
    from bson import ObjectId
    
    try:
        obj_id = ObjectId(jd_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
        
    # Fetch JD with strict ownership check
    jd = await job_descriptions_collection.find_one({"_id": obj_id, "owner_id": x_user_id})
    if not jd:
        raise HTTPException(status_code=404, detail="Job Description not found or unauthorized")
        
    target_skills = jd.get("core_skills", [])
    required_exp = jd.get("min_experience", 3)
    
    processed_candidates = []
    upload_dir = os.path.join("data", "private_uploads", x_user_id, jd_id)
    
    for file in files:
        text = await extract_text_from_file(file)
        if not text: 
            continue
        
        saved_path = save_upload_file(file, upload_dir)
        entities = extract_entities(text)
        
        # Save private candidate profile to DB (Step 3.0 Requirement: visibility="private" & status="new")
        candidate_doc = {
            "name": entities.get("Name", "Unknown Name") if entities.get("Name") != "Not Found" else "Unknown Name",
            "email": entities.get("Email", "Not Found") if entities.get("Email") != "Not Found" else f"private.{uuid.uuid4().hex[:8]}@example.com",
            "phone": entities.get("Phone", "Not Found") if entities.get("Phone") != "Not Found" else "",
            "sector": detect_domain(entities.get("Categorized_Skills", {})),
            "total_experience": float(entities.get("Years_of_Experience", 0)),
            "skills": entities.get("Skills", []),
            "original_cv_path": saved_path,
            "visibility": "private",
            "owner_id": x_user_id,
            "status": "new",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Check if already exists for this owner to prevent duplicates
        existing = await candidate_profiles_collection.find_one({"email": candidate_doc["email"], "owner_id": x_user_id})
        if existing:
            candidate_id = str(existing["_id"])
            await candidate_profiles_collection.update_one({"_id": existing["_id"]}, {"$set": candidate_doc})
        else:
            res = await candidate_profiles_collection.insert_one(candidate_doc)
            candidate_id = str(res.inserted_id)
        
        # Calculate score (Cosine similarity 70% / Exp 30% - Step 3.0 Requirement)
        from .ranker import manual_ranker
        skill_score = manual_ranker(target_skills, entities["Skills"]) * 100
        actual_exp = entities.get("Years_of_Experience", 0)
        exp_score = 100 if actual_exp >= required_exp else (actual_exp / required_exp) * 100
        final_weighted_score = (skill_score * 0.7) + (exp_score * 0.3)
        
        processed_candidates.append({
            "id": candidate_id,
            "name": candidate_doc["name"],
            "email": candidate_doc["email"],
            "phone": candidate_doc["phone"],
            "skills_extracted": candidate_doc["skills"],
            "experience_years": actual_exp,
            "match_score_percentage": round(final_weighted_score, 2),
            "cv_file_path": saved_path.replace("\\", "/")
        })
        
    # Sort and take top matches descending
    processed_candidates.sort(key=lambda x: x['match_score_percentage'], reverse=True)
    processed_candidates = [c for c in processed_candidates if c.get("match_score_percentage", 0) > 45]
    
    # Save ranked results to a screening session
    screening_doc = {
        "recruiter_id": x_user_id,
        "owner_id": x_user_id,
        "jd_id": jd_id,
        "mode": "private",
        "candidates": processed_candidates,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await screenings_collection.insert_one(screening_doc)
    
    return {"status": "success", "candidates": processed_candidates}

# Route screen/private to screen/bulk for unified handling
@router.post("/screen/private")
async def screen_private_batch(
    jd_id: str = Form(...),
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_recruiter)
):
    return await screen_bulk_private(jd_id=jd_id, files=files, current_user=current_user)

# --- STEP 4: Track 2 – Global Search ---

@router.get("/screen/global")
async def search_global_candidates(
    jd_id: str,
    current_user: dict = Depends(get_current_recruiter)
):
    x_user_id = str(current_user["_id"])
    from bson import ObjectId
    try:
        obj_id = ObjectId(jd_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
        
    # Ensure HR can only search for JDs they own
    jd = await job_descriptions_collection.find_one({"_id": obj_id, "owner_id": x_user_id})
    if not jd:
        raise HTTPException(status_code=404, detail="Job Description not found")
        
    jd_text = jd.get("title", "") + " " + " ".join(jd.get("core_skills", []))
    target_skills = jd.get("core_skills", [])
    required_exp = jd.get("min_experience", 3)
    
    # Determine the sector filter (Step 3.1 Requirement: sector == active_jd_sector)
    active_jd_sector = jd.get("sector")
    if not active_jd_sector:
        from .extractor import manual_extract_categorized_skills
        categorized, _ = manual_extract_categorized_skills(jd_text)
        active_jd_sector = detect_domain(categorized)
    
    # Query database for candidates matching visibility == "public" (or owned email) and sector == {active_jd_sector}
    # Match sector or domain fields case-insensitively
    user_email = current_user.get("email")
    visibility_or = [{"visibility": "public"}]
    if user_email:
        visibility_or.append({"email": user_email})

    escaped_sector = re.escape(active_jd_sector)
    query = {
        "$and": [
            {"$or": visibility_or},
            {"$or": [
                {"sector": {"$regex": f"^{escaped_sector}$", "$options": "i"}},
                {"domain": {"$regex": f"^{escaped_sector}$", "$options": "i"}}
            ]}
        ]
    }
    
    cursor = candidate_profiles_collection.find(query)
    global_candidates = await cursor.to_list(length=1000)
    
    # Fallback to general search if no candidate profile matches the specific sector
    if not global_candidates:
        cursor = candidate_profiles_collection.find({"$or": visibility_or})
        global_candidates = await cursor.to_list(length=1000)
        
    candidate_list = []
    for c in global_candidates:
        # Step 3.1: Semantic Matching using 70/30 algorithm against public profiles
        from .ranker import manual_ranker
        skill_score = manual_ranker(target_skills, c.get("skills", [])) * 100
        
        actual_exp = c.get("total_experience", 0) or c.get("experience", 0)
        exp_score = 100 if actual_exp >= required_exp else (actual_exp / required_exp) * 100
        
        final_weighted_score = (skill_score * 0.7) + (exp_score * 0.3)
        
        candidate_list.append({
            "id": str(c["_id"]),
            "name": c["name"],
            "email": c["email"],
            "phone": c.get("phone", "Not Found"),
            "location": c.get("location", "Bengaluru, India"),
            "title": c.get("title", "Candidate Profile"),
            "skills_extracted": c.get("skills", []),
            "experience_years": actual_exp,
            "education": c.get("education", []),
            "experiences": c.get("experiences", []),
            "cv_file_path": c.get("original_cv_path", ""),
            "match_score_percentage": round(final_weighted_score, 2),
            "status": c.get("recruiter_statuses", {}).get(x_user_id, "new")
        })
        
    candidate_list.sort(key=lambda x: x['match_score_percentage'], reverse=True)
    candidate_list = [c for c in candidate_list if c.get("match_score_percentage", 0) > 45]
    
    # Save the screening session to DB
    screening_doc = {
        "recruiter_id": x_user_id,
        "owner_id": x_user_id,
        "jd_id": jd_id,
        "mode": "global",
        "candidates": candidate_list,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await screenings_collection.insert_one(screening_doc)
    
    return {"status": "success", "candidates": candidate_list}

# --- STEP 5: Automated Communication ---

class InviteRequest(BaseModel):
    jd_id: str

@router.post("/candidates/{candidate_id}/invite")
async def invite_candidate_by_id(
    candidate_id: str,
    payload: InviteRequest,
    current_user: dict = Depends(get_current_recruiter)
):
    x_user_id = str(current_user["_id"])
    from bson import ObjectId
    try:
        cand_obj_id = ObjectId(candidate_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid candidate ID format")
        
    candidate = await candidate_profiles_collection.find_one({"_id": cand_obj_id})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
        
    try:
        jd_obj_id = ObjectId(payload.jd_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JD ID format")
        
    jd = await job_descriptions_collection.find_one({"_id": jd_obj_id, "owner_id": x_user_id})
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
        
    company = await companies_collection.find_one({"owner_id": x_user_id})
    company_details = company if company else {}
    
    from .database import users_collection
    user = await users_collection.find_one(get_user_query(x_user_id))
    recruiter_name = user.get("name", "Hiring Team") if user else "Hiring Team"
    recruiter_role = user.get("role_title", "Recruiter") if user else "Recruiter"
    
    from .mailer import send_candidate_invite_email
    import anyio
    email_sent = await anyio.to_thread.run_sync(
        send_candidate_invite_email,
        candidate.get("email"),
        candidate.get("name", "Candidate"),
        jd.get("title", "the role"),
        company_details,
        recruiter_name,
        recruiter_role
    )
    
    await candidate_profiles_collection.update_one(
        {"_id": cand_obj_id},
        {"$set": {f"recruiter_statuses.{x_user_id}": "shortlisted"}}
    )
    
    return {"message": f"Branded invitation sent to {candidate.get('email')}", "status": "shortlisted"}

# --- Additional Recruiter Endpoints for UI ---

class StatusUpdate(BaseModel):
    status: str

@router.get("/jds")
async def get_jds(current_user: dict = Depends(get_current_recruiter)):
    x_user_id = str(current_user["_id"])
    cursor = job_descriptions_collection.find({"owner_id": x_user_id})
    jds = await cursor.to_list(length=100)
    for jd in jds:
        jd["id"] = str(jd["_id"])
        del jd["_id"]
    return jds

@router.get("/candidates")
async def get_candidates(
    q: Optional[str] = None,
    domain: Optional[str] = None,
    status: Optional[str] = None,
    jd_id: Optional[str] = None,
    current_user: dict = Depends(get_current_recruiter)
):
    x_user_id = str(current_user["_id"])
    user_email = current_user.get("email")
    visibility_or = [{"visibility": "public"}, {"owner_id": x_user_id}]
    if user_email:
        visibility_or.append({"email": user_email})

    query = {
        "$or": visibility_or
    }
    
    # Merge text search if present
    if q:
        regex_query = {"$regex": q, "$options": "i"}
        # Check if query contains name, title, or skills
        query = {
            "$and": [
                {"$or": visibility_or},
                {"$or": [
                    {"name": regex_query},
                    {"title": regex_query},
                    {"skills": regex_query}
                ]}
            ]
        }
        
    if domain and domain != "All" and domain != "Any":
        escaped_domain = re.escape(domain)
        if "$and" not in query:
            query = {"$and": [query]}
        query["$and"].append({
            "$or": [
                {"domain": {"$regex": f"^{escaped_domain}$", "$options": "i"}},
                {"sector": {"$regex": f"^{escaped_domain}$", "$options": "i"}}
            ]
        })
        
    if status and status != "Any" and status != "All":
        if "$and" not in query:
            query = {"$and": [query]}
        if status == "new":
            query["$and"].append({
                "$or": [
                    {f"recruiter_statuses.{x_user_id}": "new"},
                    {f"recruiter_statuses.{x_user_id}": {"$exists": False}}
                ]
            })
        else:
            query["$and"].append({
                f"recruiter_statuses.{x_user_id}": status
            })

    cursor = candidate_profiles_collection.find(query)
    candidates = await cursor.to_list(length=100)
    
    target_jd = None
    if jd_id:
        from bson import ObjectId
        try:
            target_jd = await job_descriptions_collection.find_one({"_id": ObjectId(jd_id), "owner_id": x_user_id})
        except Exception:
            pass

    for c in candidates:
        c["id"] = str(c["_id"])
        del c["_id"]
        c["status"] = c.get("recruiter_statuses", {}).get(x_user_id, "new")
        
        if target_jd:
            from .ranker import manual_ranker
            target_skills = target_jd.get("core_skills", [])
            required_exp = target_jd.get("min_experience", 3)
            
            cand_skills = c.get("skills", c.get("skills_extracted", []))
            skill_score = manual_ranker(target_skills, cand_skills) * 100
            
            actual_exp = c.get("total_experience", c.get("experience_years", c.get("experience", 0)))
            exp_score = 100 if actual_exp >= required_exp else (actual_exp / required_exp) * 100
            
            final_weighted_score = (skill_score * 0.7) + (exp_score * 0.3)
            c["score"] = round(final_weighted_score)
        else:
            # Clean static scores if no job context is present
            if "score" in c:
                del c["score"]
            if "match_score_percentage" in c:
                del c["match_score_percentage"]
                
    if target_jd:
        # Sort by dynamic match score descending
        candidates.sort(key=lambda x: x.get("score", 0), reverse=True)
        candidates = [c for c in candidates if c.get("score", 0) > 45]
        
    return candidates

@router.get("/candidates/filters")
async def get_candidate_filters(current_user: dict = Depends(get_current_recruiter)):
    x_user_id = str(current_user["_id"])
    user_email = current_user.get("email")
    """Return distinct domains, statuses, and total count for filter UI."""
    visibility_or = [{"visibility": "public"}, {"owner_id": x_user_id}]
    if user_email:
        visibility_or.append({"email": user_email})
    query = {"$or": visibility_or}
    
    domains_1 = await candidate_profiles_collection.distinct("domain", query)
    domains_2 = await candidate_profiles_collection.distinct("sector", query)
    domains = list(set(domains_1 + domains_2))
    recruiter_statuses = await candidate_profiles_collection.distinct(f"recruiter_statuses.{x_user_id}", query)
    statuses = list(set(recruiter_statuses + ["new"]))
    total = await candidate_profiles_collection.count_documents(query)
    
    # Clean up None/empty values
    domains = sorted([d for d in domains if d and d.strip()])
    statuses = sorted([s for s in statuses if s and s.strip()])
    
    return {
        "domains": domains,
        "statuses": statuses,
        "total": total
    }

@router.get("/candidates/{candidate_id}")
async def get_candidate_details(
    candidate_id: str,
    jd_id: Optional[str] = None,
    current_user: dict = Depends(get_current_recruiter)
):
    x_user_id = str(current_user["_id"])
    from bson import ObjectId
    try:
        obj_id = ObjectId(candidate_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid candidate ID format")
        
    candidate = await candidate_profiles_collection.find_one({"_id": obj_id})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    candidate["id"] = str(candidate["_id"])
    del candidate["_id"]
    candidate["status"] = candidate.get("recruiter_statuses", {}).get(x_user_id, "new")
    
    # Dynamic match evaluation if jd_id is provided
    target_jd = None
    if jd_id:
        try:
            target_jd = await job_descriptions_collection.find_one({"_id": ObjectId(jd_id), "owner_id": x_user_id})
        except Exception:
            pass
            
    if target_jd:
        from .ranker import manual_ranker
        target_skills = target_jd.get("core_skills", [])
        required_exp = target_jd.get("min_experience", 3)
        
        cand_skills = candidate.get("skills", candidate.get("skills_extracted", []))
        skill_score = manual_ranker(target_skills, cand_skills) * 100
        
        actual_exp = candidate.get("total_experience", candidate.get("experience_years", candidate.get("experience", 0)))
        exp_score = 100 if actual_exp >= required_exp else (actual_exp / required_exp) * 100
        
        final_weighted_score = (skill_score * 0.7) + (exp_score * 0.3)
        
        # Inject metrics
        candidate["score"] = round(final_weighted_score)
        candidate["skillMatch"] = round(skill_score)
        candidate["expMatch"] = round(exp_score)
        
        # Calculate matched vs missing skills
        target_skills_lower = [ts.lower() for ts in target_skills]
        cand_skills_lower = [cs.lower() for cs in cand_skills]
        
        matched_skills = [ts for ts in target_skills if ts.lower() in cand_skills_lower]
        missing_skills = [ts for ts in target_skills if ts.lower() not in cand_skills_lower]
        
        candidate["matchedSkills"] = matched_skills
        candidate["missingSkills"] = missing_skills
    else:
        # Clean static scores
        if "score" in candidate:
            del candidate["score"]
        if "match_score_percentage" in candidate:
            del candidate["match_score_percentage"]
            
    return candidate

@router.post("/candidates/{candidate_id}/status")
async def update_candidate_status(
    candidate_id: str,
    status_update: StatusUpdate,
    current_user: dict = Depends(get_current_recruiter)
):
    x_user_id = str(current_user["_id"])
    from bson import ObjectId
    try:
        obj_id = ObjectId(candidate_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid candidate ID format")
        
    result = await candidate_profiles_collection.update_one(
        {"_id": obj_id},
        {"$set": {f"recruiter_statuses.{x_user_id}": status_update.status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    return {"message": "Status updated successfully", "status": status_update.status}

@router.get("/stats")
async def get_recruiter_stats(current_user: dict = Depends(get_current_recruiter)):
    x_user_id = str(current_user["_id"])
    active_jobs = await job_descriptions_collection.count_documents({"owner_id": x_user_id})
    
    screenings_cursor = screenings_collection.find({
        "$or": [
            {"recruiter_id": x_user_id},
            {"owner_id": x_user_id}
        ]
    })
    screenings = await screenings_cursor.to_list(length=1000)
    
    resumes_screened = 0
    total_score = 0
    score_count = 0
    
    for scr in screenings:
        candidates_list = scr.get("candidates", [])
        resumes_screened += len(candidates_list)
        for c in candidates_list:
            score = c.get("score", 0)
            # Match scores could be stored as 0-1 (e.g. 0.85) or 0-100 (e.g. 85)
            if score <= 1.0:
                score = score * 100
            total_score += score
            score_count += 1
            
    avg_match = round(total_score / score_count) if score_count > 0 else 78
    
    user_email = current_user.get("email")
    visibility_or = [{"visibility": "public"}, {"owner_id": x_user_id}]
    if user_email:
        visibility_or.append({"email": user_email})

    shortlisted_count = await candidate_profiles_collection.count_documents({
        f"recruiter_statuses.{x_user_id}": "shortlisted",
        "$or": visibility_or
    })
    
    pipeline = {
        "new": await candidate_profiles_collection.count_documents({
            "$and": [
                {"$or": visibility_or},
                {"$or": [
                    {f"recruiter_statuses.{x_user_id}": "new"},
                    {f"recruiter_statuses.{x_user_id}": {"$exists": False}}
                ]}
            ]
        }),
        "review": await candidate_profiles_collection.count_documents({
            f"recruiter_statuses.{x_user_id}": "review",
            "$or": visibility_or
        }),
        "rejected": await candidate_profiles_collection.count_documents({
            f"recruiter_statuses.{x_user_id}": "rejected",
            "$or": visibility_or
        }),
        "shortlisted": shortlisted_count,
        "hired": await candidate_profiles_collection.count_documents({
            f"recruiter_statuses.{x_user_id}": "hired",
            "$or": visibility_or
        })
    }
    
    return {
        "activeJobs": active_jobs,
        "resumesScreened": resumes_screened,
        "avgMatch": avg_match,
        "shortlisted": shortlisted_count,
        "pipeline": pipeline
    }

@router.get("/screenings")
async def get_screenings(current_user: dict = Depends(get_current_recruiter)):
    x_user_id = str(current_user["_id"])
    cursor = screenings_collection.find({
        "$or": [
            {"recruiter_id": x_user_id},
            {"owner_id": x_user_id}
        ]
    }).sort("created_at", -1)
    screenings = await cursor.to_list(length=20)
    for scr in screenings:
        scr["id"] = str(scr["_id"])
        del scr["_id"]
    return screenings

@router.get("/jobs/{job_id}/results")
async def get_job_results(job_id: str, current_user: dict = Depends(get_current_recruiter)):
    x_user_id = str(current_user["_id"])
    from bson import ObjectId
    try:
        obj_id = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
        
    jd = await job_descriptions_collection.find_one({"_id": obj_id, "owner_id": x_user_id})
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
        
    # Find latest screening for this JD
    screening = await screenings_collection.find_one(
        {"jd_id": job_id, "$or": [{"recruiter_id": x_user_id}, {"owner_id": x_user_id}]},
        sort=[("created_at", -1)]
    )
    
    candidates = []
    mode = "global"
    if screening:
        candidates = screening.get("candidates", [])
        mode = screening.get("mode", "global")
        # Update each candidate's status with the latest recruiter-specific status
        cand_ids = []
        for c in candidates:
            c_id = c.get("id") or c.get("_id")
            if c_id:
                cand_ids.append(c_id)
        if cand_ids:
            from bson import ObjectId
            obj_ids = []
            for cid in cand_ids:
                try:
                    obj_ids.append(ObjectId(cid))
                except Exception:
                    pass
            profiles_cursor = candidate_profiles_collection.find({"_id": {"$in": obj_ids}})
            profiles = await profiles_cursor.to_list(length=len(obj_ids))
            profiles_map = {str(p["_id"]): p for p in profiles}
            for c in candidates:
                c_id = c.get("id") or c.get("_id")
                if c_id and str(c_id) in profiles_map:
                    c["status"] = profiles_map[str(c_id)].get("recruiter_statuses", {}).get(x_user_id, "new")
                else:
                    c["status"] = "new"
        
    if not candidates:
        mode = "global"
        user_email = current_user.get("email")
        visibility_or = [{"visibility": "public"}, {"owner_id": x_user_id}]
        if user_email:
            visibility_or.append({"email": user_email})
        query = {"$or": visibility_or}
        cursor = candidate_profiles_collection.find(query)
        db_candidates = await cursor.to_list(length=100)
        
        from .ranker import manual_ranker
        target_skills = jd.get("core_skills", [])
        required_exp = jd.get("min_experience", 3)
        
        for c in db_candidates:
            cand_skills = c.get("skills", c.get("skills_extracted", []))
            skill_score = manual_ranker(target_skills, cand_skills) * 100
            
            actual_exp = c.get("total_experience", c.get("experience_years", c.get("experience", 0)))
            exp_score = 100 if actual_exp >= required_exp else (actual_exp / required_exp) * 100
            
            final_weighted_score = (skill_score * 0.7) + (exp_score * 0.3)
            
            candidates.append({
                "id": str(c["_id"]),
                "name": c.get("name", "Unknown Candidate"),
                "email": c.get("email", ""),
                "phone": c.get("phone", ""),
                "title": c.get("title", "Candidate Profile"),
                "skills_extracted": cand_skills,
                "experience_years": actual_exp,
                "match_score_percentage": round(final_weighted_score),
                "cv_file_path": c.get("original_cv_path", "").replace("\\", "/") if c.get("original_cv_path") else "",
                "status": c.get("recruiter_statuses", {}).get(x_user_id, "new"),
                "experiences": c.get("experiences", []),
                "education": c.get("education", [])
            })
            
        candidates.sort(key=lambda x: x.get("match_score_percentage", 0), reverse=True)
        
    candidates = [c for c in candidates if c.get("match_score_percentage", 0) > 45]
    return {
        "job": {
            "id": str(jd["_id"]),
            "title": jd.get("title", ""),
            "min_experience": jd.get("min_experience", 0),
            "location_type": jd.get("location_type", ""),
            "core_skills": jd.get("core_skills", []),
            "company_email": jd.get("company_email", ""),
            "mode": jd.get("mode", "")
        },
        "mode": mode,
        "candidates": candidates
    }
