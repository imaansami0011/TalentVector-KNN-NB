
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
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
from .database import client, screenings_collection

# Import our classical modules
from .extractor import extract_entities, clean_text
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
