
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Header
from datetime import datetime, timezone
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import pdfplumber
from docx import Document
import io
import os
import shutil
import uuid
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from .auth import router as auth_router
from .candidate import router as candidate_router
from .recruiter import router as recruiter_router
from .database import client, screenings_collection, candidate_profiles_collection, job_descriptions_collection
from .seed import seed_candidates_if_empty
from .seed_companies import seed_companies_hr_jobs

# Import our classical modules
from .extractor import extract_entities, clean_text, detect_domain
from .ranker import rank_resumes
from .mailer import send_interview_invitations, send_hr_report

async def extract_text_from_file(file: UploadFile) -> str:
    """Helper to extract text from PDF, DOCX, or TXT files."""
    content = await file.read()
    text = ""
    filename = file.filename.lower()

    try:
        if filename.endswith('.pdf'):
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                text = "\n".join([page.extract_text() or "" for page in pdf.pages])
        elif filename.endswith('.docx'):
            doc = Document(io.BytesIO(content))
            text = "\n".join([p.text for p in doc.paragraphs])
        else:
            text = content.decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"   ! Extraction error for {file.filename}: {e}")
    
    return text.strip()

# Phase 4: Pydantic Models
class CandidateResponse(BaseModel):
    rank: int
    name: str
    email: str
    experience_years: int
    skills_extracted: List[str]
    match_score_percentage: float

class ScreenResponse(BaseModel):
    status: str
    job_domain_detected: str
    top_candidates: List[CandidateResponse]

app = FastAPI(title="Classical Resume Screener - Final Setup")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(candidate_router)
app.include_router(recruiter_router)

@app.on_event("startup")
async def startup_db_client():
    try:
        # Send a ping to confirm a successful connection
        await client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
        # Seed candidates
        await seed_candidates_if_empty()
        # Seed companies, HR users, and real jobs
        await seed_companies_hr_jobs()
    except Exception as e:
        print(f"MongoDB connection error: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.get("/")
async def root():
    return {"message": "Classical Resume Screener Production API is active"}

def save_upload_file(upload_file: UploadFile, directory: str) -> str:
    """Saves an UploadFile to disk and returns the file path."""
    os.makedirs(directory, exist_ok=True)
    file_path = os.path.join(directory, upload_file.filename)
    upload_file.file.seek(0)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    upload_file.file.seek(0)
    return file_path

def calculate_experience_score(candidate_exp, required_years, is_plus):
    """
    Advanced Scoring Logic:
    CASE A (Threshold): "3+ years" -> Full marks if >= 3, else ratio.
    CASE B (Precision): "3 years" exactly -> Distance-based penalty.
    """
    if required_years == 0:
        return 100.0

    if is_plus:
        if candidate_exp >= required_years:
            return 100.0
        return (candidate_exp / required_years) * 100

    # Case B: Precision matching (Gaussian-style penalty)
    distance = abs(candidate_exp - required_years)
    if distance == 0:
        return 100.0
    elif distance == 1:
        return 70.0
    elif distance == 2:
        return 40.0
    else:
        return 10.0

# Phase 4: /screen Endpoint
@app.post("/screen", response_model=ScreenResponse)
async def screen_resumes(
    recruiter_id: str = Form("default_recruiter"),
    job_description: Optional[str] = Form(None), 
    jd_file: Optional[UploadFile] = File(None),
    files: List[UploadFile] = File(...)
):
    print("\n" + "="*50)
    print(f"RECEIVED SCREENING REQUEST | Time: {datetime.now().strftime('%H:%M:%S')}")
    
    # Generate unique session ID for storage
    session_id = str(uuid.uuid4())
    upload_dir = os.path.join("uploads", recruiter_id, session_id)
    
    # 1. Determine the effective Job Description
    final_jd_text = ""
    saved_jd_path = None
    if jd_file:
        print(f"JD Source: File ({jd_file.filename})")
        saved_jd_path = save_upload_file(jd_file, upload_dir)
        final_jd_text = await extract_text_from_file(jd_file)
    elif job_description:
        print(f"JD Source: Manual Text")
        final_jd_text = job_description
    
    if not final_jd_text:
        print("ERROR: No Job Description provided")
        raise HTTPException(status_code=400, detail="Please provide a job description (text or file)")

    print(f"JD Length: {len(final_jd_text)} chars")
    print(f"Number of Resumes: {len(files)}")
    print("="*50)

    if not files:
        print("ERROR: No files uploaded")
        raise HTTPException(status_code=400, detail="No resumes uploaded")

    processed_candidates = []
    all_found_skills = []

    for i, file in enumerate(files):
        try:
            print(f"[{i+1}/{len(files)}] Processing: {file.filename}...")
            # Save file to disk
            saved_cv_path = save_upload_file(file, upload_dir)
            
            text = await extract_text_from_file(file)

            if not text:
                print(f"   ! WARNING: No text extracted from {file.filename}")
                continue

            # Phase 2: Extraction Layer
            entities = extract_entities(text)
            print(f"   - Name: {entities['Name']}")
            print(f"   - Skills Found: {len(entities['Skills'])}")
            print(f"   - Experience: {entities['Years_of_Experience']} years")
            
            processed_candidates.append({
                "filename": file.filename,
                "name": entities["Name"],
                "email": entities["Email"],
                "phone": entities["Phone"],
                "designation": entities["Designation"],
                "entities": {"Skills": entities["Skills"]},
                "years_of_experience": entities["Years_of_Experience"],
                "text": text, # Used for ranking
                "cv_file_path": saved_cv_path
            })

        except Exception as e:
            print(f"   ! CRITICAL ERROR processing {file.filename}: {e}")

    if not processed_candidates:
        print("ERROR: No valid candidates found after extraction")
        raise HTTPException(status_code=422, detail="No valid resumes could be parsed")

    # Phase 3: Ranking Engine
    print(f"\nRANKING {len(processed_candidates)} CANDIDATES...")
    
    # Extract Target Requirements from Job Description
    jd_entities = extract_entities(final_jd_text, is_jd=True)
    required_exp = jd_entities.get("Years_of_Experience", 5) 
    is_plus = jd_entities.get("Is_Plus_Requirement", False)
    if required_exp == 0: required_exp = 5
    
    print(f"Target Experience: {required_exp}{'+' if is_plus else ''} years")

    # Get raw skill scores from ranker
    ranked_results = rank_resumes(final_jd_text, processed_candidates)
    
    # Detect domain from the Job Description
    from .extractor import detect_domain
    detected_domain = detect_domain(jd_entities.get("Categorized_Skills", {}))
    print(f"DETECTED DOMAIN: {detected_domain}")

    # Phase 4: Final Weighted Scoring (70/30)
    top_candidates = []
    db_candidates = []
    print(f"\nTOP MATCHES (Weighted 70% Skills / 30% Exp [{'Threshold' if is_plus else 'Precision'}]):")
    for i, r in enumerate(ranked_results[:5]):
        skill_score = r["score"] * 100 
        
        # Advanced Experience Score Logic
        actual_exp = r["years_of_experience"]
        exp_score = calculate_experience_score(actual_exp, required_exp, is_plus)
        
        # Final Weighted Score
        final_weighted_score = (skill_score * 0.7) + (exp_score * 0.3)
        
        print(f"  #{i+1}: {r['name']} | Total: {round(final_weighted_score, 1)}% (Skill: {round(skill_score, 1)}%, Exp: {round(exp_score, 1)}%)")
        
        top_candidates.append(CandidateResponse(
            rank=i + 1,
            name=r["name"],
            email=r["email"],
            experience_years=actual_exp,
            skills_extracted=r["entities"]["Skills"],
            match_score_percentage=round(final_weighted_score, 2)
        ))
        
        db_candidates.append({
            "name": r["name"],
            "email": r["email"],
            "score": round(final_weighted_score / 100, 4), # Store as 0-1
            "skills": r["entities"]["Skills"],
            "experience_years": actual_exp,
            "cv_file_path": r["cv_file_path"].replace("\\", "/") # standardize path
        })

    # Save to MongoDB
    screening_doc = {
        "recruiter_id": recruiter_id,
        "job_description": {
            "text": final_jd_text,
            "detected_domain": detected_domain,
            "required_experience": required_exp,
            "file_path": saved_jd_path.replace("\\", "/") if saved_jd_path else None
        },
        "candidates": db_candidates,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        await screenings_collection.insert_one(screening_doc)
        print("Successfully saved screening session to MongoDB.")
    except Exception as e:
        print(f"Failed to save to MongoDB: {e}")

    print("="*50)
    print("REQUEST COMPLETED SUCCESSFULLY")
    print("="*50 + "\n")

    return ScreenResponse(
        status="success",
        job_domain_detected=detected_domain,
        top_candidates=top_candidates
    )

# --- Phase 2 Endpoints ---

class JDParseRequest(BaseModel):
    jd_text: Optional[str] = None

@app.post("/jd/parse")
async def parse_jd(
    request: Request,
    jd_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None)
):
    content_type = request.headers.get("content-type", "")
    text = ""
    if "application/json" in content_type:
        try:
            body = await request.json()
            text = body.get("jd_text", "")
        except Exception:
            pass
    elif jd_file:
        text = await extract_text_from_file(jd_file)
    elif jd_text:
        text = jd_text
        
    if not text:
        raise HTTPException(status_code=400, detail="Provide JD text or upload a JD file")
        
    entities = extract_entities(text, is_jd=True)
    
    # Heuristic for Location Type
    location_type = "Onsite"
    if "remote" in text.lower():
        location_type = "Remote"
    elif "hybrid" in text.lower():
        location_type = "Hybrid"
        
    # Domain detection
    detected_domain = detect_domain(entities.get("Categorized_Skills", {}))
    
    return {
        "title": entities.get("Designation", "New Job Role") if entities.get("Designation") != "Not Found" else "New Job Role",
        "min_experience": int(entities.get("Years_of_Experience", 3)) or 3,
        "location_type": location_type,
        "core_skills": entities.get("Skills", []),
        "company_email": entities.get("Email", "") if entities.get("Email") != "Not Found" else "",
        "sector": detected_domain,
        "original_text": text
    }

@app.post("/screen/bulk")
async def screen_bulk_private(
    jd_id: str = Form(...),
    files: List[UploadFile] = File(...),
    x_user_id: str = Header(...)
):
    from bson import ObjectId
    try:
        obj_id = ObjectId(jd_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
        
    jd = await job_descriptions_collection.find_one({"_id": obj_id, "owner_id": x_user_id})
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
        
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
        
        # Save private candidate profile to DB
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
        
        # Check if already exists to prevent duplicate insertion
        existing = await candidate_profiles_collection.find_one({"email": candidate_doc["email"], "owner_id": x_user_id})
        if existing:
            candidate_id = str(existing["_id"])
            await candidate_profiles_collection.update_one({"_id": existing["_id"]}, {"$set": candidate_doc})
        else:
            res = await candidate_profiles_collection.insert_one(candidate_doc)
            candidate_id = str(res.inserted_id)
            
        # Calculate score (Cosine similarity 70% / Exp 30%)
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
        
    processed_candidates.sort(key=lambda x: x['match_score_percentage'], reverse=True)
    
    # Save screening session to DB
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

@app.get("/screen/global")
async def screen_global_api(
    jd_id: str,
    x_user_id: str = Header(...)
):
    from .recruiter import search_global_candidates
    return await search_global_candidates(jd_id=jd_id, x_user_id=x_user_id)

@app.post("/predict")
async def predict_resume_category(
    cv_text: Optional[str] = Form(None),
    cv_file: Optional[UploadFile] = File(None)
):
    final_text = ""
    if cv_file:
        final_text = await extract_text_from_file(cv_file)
    elif cv_text:
        final_text = cv_text
        
    if not final_text:
        raise HTTPException(status_code=400, detail="Provide resume text or upload a file")
        
    from .models.classifier import predict_sector_nb
    nb_res = predict_sector_nb(final_text)
    
    return {
        "status": "success",
        "raw_category": nb_res["raw_category"],
        "mapped_sector": nb_res["mapped_sector"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
