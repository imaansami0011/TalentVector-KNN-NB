from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from .database import users_collection
import secrets
import os

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
SECRET_KEY = "your_secret_key_here"  # Move to env in prod
ALGORITHM = "HS256"

class RegisterInit(BaseModel):
    email: str

class VerifyOTP(BaseModel):
    email: str
    otp: str
    password: str
    role: Optional[str] = "candidate"

class LoginReq(BaseModel):
    email: str
    password: str

class GoogleLoginReq(BaseModel):
    email: str
    name: Optional[str] = None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=1)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# In-memory OTP store for brevity
otp_store = {}

@router.post("/register-init")
async def register_init(req: RegisterInit):
    user = await users_collection.find_one({"email": req.email})
    if user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    otp = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    otp_store[req.email] = otp
    print(f"DEBUG: OTP for {req.email} is {otp}")
    
    # Save to a debug file for automated verification / testing
    try:
        import json
        debug_path = "otp_debug.json"
        data = {}
        if os.path.exists(debug_path):
            try:
                with open(debug_path, "r") as f:
                    data = json.load(f)
            except Exception:
                pass
        data[req.email] = otp
        with open(debug_path, "w") as f:
            json.dump(data, f)
    except Exception as e:
        print(f"Failed to write otp debug log: {e}")
        
    # In production, send email via FastAPI-Mail here
    return {"message": "OTP sent to email"}

@router.post("/verify-otp")
async def verify_otp(req: VerifyOTP):
    if req.email not in otp_store or otp_store[req.email] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    hashed_password = pwd_context.hash(req.password)
    new_user = {
        "email": req.email,
        "password_hash": hashed_password,
        "role": req.role,
        "status": "incomplete_profile"
    }
    await users_collection.insert_one(new_user)
    del otp_store[req.email]
    
    return {"message": "Registration successful"}

@router.post("/login")
async def login(req: LoginReq):
    user = await users_collection.find_one({"email": req.email})
    if not user or not pwd_context.verify(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "role": user["role"], 
        "status": user["status"],
        "user_id": str(user["_id"])
    }

@router.post("/google")
async def google_login(req: GoogleLoginReq):
    user = await users_collection.find_one({"email": req.email})
    
    if not user:
        new_user = {
            "email": req.email,
            "name": req.name,
            "password_hash": "google_oauth",
            "role": "recruiter",  # Set to recruiter by default for HR helper login, or allow candidate. Let's make it candidate or check what the user wants. The prompt says: "make it back the one with half recruiter and hr login". Wait, recruiters are the ones using the dashboard, so let's default to recruiter! Or check the email to decide role.
            "status": "incomplete_profile",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        result = await users_collection.insert_one(new_user)
        user_id = str(result.inserted_id)
        role = "recruiter"
        status = "incomplete_profile"
    else:
        user_id = str(user["_id"])
        role = user.get("role", "recruiter")
        status = user.get("status", "incomplete_profile")
        
    token = create_access_token(data={"sub": req.email, "role": role})
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "role": role, 
        "status": status,
        "user_id": user_id
    }
