import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from pydantic import BaseModel
from .database import candidate_profiles_collection, job_descriptions_collection
from .extractor import extract_entities, detect_domain
from .ranker import rank_resumes
from datetime import datetime, timezone

router = APIRouter(prefix="/candidate", tags=["candidate"])

class CandidateProfile(BaseModel):
    name: str
    email: str
    phone: str
    sector: str
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
    cv_file: Optional[UploadFile] = File(None)
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
    sector = detect_domain(entities.get("Categorized_Skills", {}))
    
    return {
        "detected_name": entities.get("Name", ""),
        "detected_experience": float(entities.get("Years_of_Experience", 0)),
        "detected_sector": sector,
        "detected_skills": entities.get("Skills", []),
        "contact_email": entities.get("Email", ""),
        "contact_phone": entities.get("Phone", ""),
        "original_cv_path": saved_path,
        "original_text": final_text
    }

@router.get("/profile")
async def get_profile(email: str):
    profile = await candidate_profiles_collection.find_one({"email": email})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile["_id"] = str(profile["_id"])
    return profile

@router.post("/profile")
async def save_profile(profile: CandidateProfile):
    # Save the profile
    doc = profile.dict()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await candidate_profiles_collection.update_one(
        {"email": profile.email},
        {"$set": doc},
        upsert=True
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
        # We reuse manual_ranker
        from .ranker import manual_ranker
        from .extractor import extract_entities
        jd_skills = extract_entities(jd.get("text", "")).get("Skills", [])
        score = manual_ranker(jd_skills, profile.skills)
        matches.append({"jd_id": str(jd["_id"]), "title": jd.get("title", "Unknown Job"), "score": score})
        
    # Sort and take top 3
    matches.sort(key=lambda x: x["score"], reverse=True)
    top_matches = matches[:3]
    
    return {"message": "Profile saved", "top_matches": top_matches}
