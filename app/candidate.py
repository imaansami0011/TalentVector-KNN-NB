import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Header, Depends
from pydantic import BaseModel
from .auth import get_current_user, get_current_candidate
from .database import candidate_profiles_collection, job_descriptions_collection
from .extractor import extract_entities
from .models.classifier import predict_sector_nb
from datetime import datetime, timezone

router = APIRouter(prefix="/candidate", tags=["candidate"])

class CandidateProfile(BaseModel):
    name: str
    email: str
    phone: str
    sector: str
    raw_category: Optional[str] = None
    total_experience: float
    skills: List[str]
    original_cv_path: Optional[str] = None

def save_upload_file(upload_file: UploadFile, directory: str) -> str:
    os.makedirs(directory, exist_ok=True)
    file_path = os.path.join(directory, upload_file.filename)
    upload_file.file.seek(0)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    upload_file.file.seek(0)
    return file_path

@router.post("/extract")
async def extract_cv(
    cv_text: Optional[str] = Form(None),
    cv_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    from .main import extract_text_from_file  # Import here to avoid circular dep for now
    
    final_text = ""
    saved_path = None
    if cv_file:
        upload_dir = os.path.join("data", "cvs", str(uuid.uuid4()))
        saved_path = save_upload_file(cv_file, upload_dir)
        final_text = await extract_text_from_file(cv_file)
    elif cv_text:
        final_text = cv_text
        
    if not final_text:
        raise HTTPException(status_code=400, detail="Provide CV text or file")
        
    entities = extract_entities(final_text)
    
    # Classify resume category using Naive Bayes model
    nb_res = predict_sector_nb(final_text)
    sector = nb_res["mapped_sector"]
    raw_category = nb_res["raw_category"]
    
    # Construct profile document to save in the database directly
    profile_doc = {
        "name": current_user.get("name") or entities.get("Name") or "Candidate",
        "email": current_user.get("email"),
        "phone": entities.get("Phone", "") if entities.get("Phone") != "Not Found" else "",
        "sector": sector,
        "raw_category": raw_category,
        "total_experience": float(entities.get("Years_of_Experience", 0)),
        "skills": entities.get("Skills", []),
        "original_cv_path": saved_path,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await candidate_profiles_collection.update_one(
        {"email": current_user.get("email")},
        {"$set": profile_doc},
        upsert=True
    )
    
    return {
        "detected_name": entities.get("Name", ""),
        "detected_experience": float(entities.get("Years_of_Experience", 0)),
        "detected_sector": sector,
        "detected_raw_category": raw_category,
        "detected_skills": entities.get("Skills", []),
        "contact_email": entities.get("Email", ""),
        "contact_phone": entities.get("Phone", ""),
        "original_cv_path": saved_path,
        "original_text": final_text
    }

@router.get("/profile")
async def get_profile(email: str, current_user: dict = Depends(get_current_user)):
    profile = await candidate_profiles_collection.find_one({"email": email})
    
    if not profile:
        # Check if email is actually a user ObjectID hex string
        from bson import ObjectId
        from .database import users_collection
        try:
            user_obj_id = ObjectId(email)
            user = await users_collection.find_one({"_id": user_obj_id})
            if user and "email" in user:
                profile = await candidate_profiles_collection.find_one({"email": user["email"]})
        except Exception:
            pass

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    # Recruiters can view profiles, candidates can only view their own
    if current_user.get("role") != "recruiter" and current_user.get("email") != profile.get("email"):
        raise HTTPException(status_code=403, detail="Access forbidden: Cannot view another candidate's profile")

    profile["_id"] = str(profile["_id"])
    return profile

@router.post("/profile")
async def save_profile(profile: CandidateProfile, current_user: dict = Depends(get_current_candidate)):
    if current_user.get("email") != profile.email:
        raise HTTPException(status_code=403, detail="Access forbidden: Cannot update another candidate's profile")
    # Save the profile
    doc = profile.dict()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await candidate_profiles_collection.update_one(
        {"email": profile.email},
        {"$set": doc},
        upsert=True
    )
    
    # Update user status to onboarded in users_collection
    from .database import users_collection
    await users_collection.update_one(
        {"email": profile.email, "role": "candidate"},
        {"$set": {"status": "onboarded"}}
    )
    
    # Re-ranking logic (Find top 3 JDs)
    all_jds_cursor = job_descriptions_collection.find({})
    jds = await all_jds_cursor.to_list(length=100)
    
    matches = []
    # rank_resumes expects a JD string and list of resumes dicts
    candidate_dict = {
        "name": profile.name,
        "email": profile.email,
        "phone": profile.phone,
        "entities": {"Skills": profile.skills},
        "years_of_experience": profile.total_experience
    }
    
    for jd in jds:
        from .ranker import manual_ranker
        
        # Use pre-extracted core_skills if available; fallback to extracting from text
        jd_skills = jd.get("core_skills")
        if not jd_skills:
            from .extractor import extract_entities
            jd_text = jd.get("text", "") or ""
            jd_skills = extract_entities(jd_text).get("Skills", [])
            
        score = manual_ranker(jd_skills, profile.skills)
        matches.append({"jd_id": str(jd["_id"]), "title": jd.get("title", "Unknown Job"), "score": score})
        
    # Sort and take top 3 above 45% match
    matches = [m for m in matches if m["score"] > 0.45]
    matches.sort(key=lambda x: x["score"], reverse=True)
    top_matches = matches[:3]
    
    return {"message": "Profile saved", "top_matches": top_matches}

@router.get("/jobs")
async def get_jobs():
    cursor = job_descriptions_collection.find({"is_hidden": {"$ne": True}})
    jds = await cursor.to_list(length=200)
    results = []
    for jd in jds:
        jd_id = str(jd["_id"])
        comp_details = jd.get("company_details", {}) or {}

        # Resolve location_type — prefer explicit field, fall back to mode
        location_type = jd.get("location_type") or jd.get("mode") or "Onsite"

        # Resolve city — prefer top-level city, then company_details.hq_location
        city = jd.get("city") or comp_details.get("hq_location") or "Pakistan"

        results.append({
            "id": jd_id,
            "title": jd.get("title", "Unknown Role"),
            "min_experience": jd.get("min_experience", 0),
            "location_type": location_type,
            "core_skills": jd.get("core_skills", []),
            "sector": jd.get("sector", ""),
            "company_name": comp_details.get("company_name", jd.get("company_name", "Unknown Company")),
            "company_website": comp_details.get("website", jd.get("company_website", "")),
            "city": city,
            "created_at": jd.get("created_at", ""),
        })
    return results
