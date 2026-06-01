from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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

# JWT secret MUST be set via environment variable
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("FATAL: JWT_SECRET_KEY environment variable is not set. Cannot start server.")
ALGORITHM = "HS256"

security = HTTPBearer()

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication credentials missing")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if not email or not role:
            raise HTTPException(status_code=401, detail="Invalid token claims")
        
        user = await users_collection.find_one({"email": email, "role": role})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_recruiter(user: dict = Depends(get_current_user)):
    if user.get("role") != "recruiter":
        raise HTTPException(status_code=403, detail="Access forbidden: Recruiter role required")
    return user

async def get_current_candidate(user: dict = Depends(get_current_user)):
    if user.get("role") != "candidate":
        raise HTTPException(status_code=403, detail="Access forbidden: Candidate role required")
    return user

class RegisterInit(BaseModel):
    email: str
    role: Optional[str] = "candidate"

class VerifyOTP(BaseModel):
    email: str
    otp: str
    password: str
    role: Optional[str] = "candidate"

class LoginReq(BaseModel):
    email: str
    password: str
    role: Optional[str] = "candidate"
    create_missing: Optional[bool] = False

class GoogleLoginReq(BaseModel):
    email: str
    name: Optional[str] = None
    role: Optional[str] = "recruiter"
    create_missing: Optional[bool] = False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=1)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# In-memory OTP store with TTL (5-minute expiry)
# Format: {"email:role": {"otp": "123456", "expires_at": datetime}}
OTP_TTL_MINUTES = 5
otp_store = {}

@router.post("/register-init")
async def register_init(req: RegisterInit):
    user = await users_collection.find_one({"email": req.email})
    if user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    otp = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    otp_key = f"{req.email}:{req.role}"
    otp_store[otp_key] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)
    }
    print(f"DEBUG: OTP for {req.email} ({req.role}) is {otp}")
        
    return {"message": "OTP sent to email"}

@router.post("/verify-otp")
async def verify_otp(req: VerifyOTP):
    otp_key = f"{req.email}:{req.role}"
    stored = otp_store.get(otp_key)
    if not stored or stored["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if datetime.now(timezone.utc) > stored["expires_at"]:
        del otp_store[otp_key]
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    hashed_password = pwd_context.hash(req.password)
    new_user = {
        "email": req.email,
        "password_hash": hashed_password,
        "role": req.role,
        "status": "incomplete_profile",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await users_collection.insert_one(new_user)
    del otp_store[otp_key]
    
    return {"message": "Registration successful"}

@router.post("/login")
async def login(req: LoginReq):
    user = await users_collection.find_one({"email": req.email, "role": req.role})
    
    # Try to find user under any other role if not found for the requested role
    any_user = await users_collection.find_one({"email": req.email})
    if not any_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    try:
        is_verified = pwd_context.verify(req.password, any_user["password_hash"])
    except ValueError:
        is_verified = False
        
    if not is_verified:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not user:
        if req.create_missing:
            # Create a user record for the requested role sharing the same password hash
            new_user = {
                "email": req.email,
                "password_hash": any_user["password_hash"],
                "role": req.role,
                "status": "incomplete_profile",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            if "name" in any_user:
                new_user["name"] = any_user["name"]
            result = await users_collection.insert_one(new_user)
            user = await users_collection.find_one({"_id": result.inserted_id})
        else:
            # Return role_missing error so frontend can show confirmation dialog
            raise HTTPException(
                status_code=409,
                detail=f"role_missing:{any_user['role']}"
            )
    else:
        # Sync password hash if it was changed
        if user["password_hash"] != any_user["password_hash"]:
            await users_collection.update_one({"_id": user["_id"]}, {"$set": {"password_hash": any_user["password_hash"]}})
            
    token = create_access_token(data={"sub": req.email, "role": user["role"]})
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "role": user["role"], 
        "status": user["status"],
        "user_id": str(user["_id"])
    }

@router.post("/google")
async def google_login(req: GoogleLoginReq):
    user = await users_collection.find_one({"email": req.email, "role": req.role})
    
    if not user:
        other_user = await users_collection.find_one({"email": req.email})
        if other_user:
            if req.create_missing:
                new_user = {
                    "email": req.email,
                    "name": req.name or other_user.get("name"),
                    "password_hash": "google_oauth",
                    "role": req.role,
                    "status": "incomplete_profile",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                result = await users_collection.insert_one(new_user)
                user_id = str(result.inserted_id)
                role = req.role
                status = "incomplete_profile"
            else:
                # Return role_missing error so frontend can show confirmation dialog
                raise HTTPException(
                    status_code=409,
                    detail=f"role_missing:{other_user['role']}"
                )
        else:
            # Create new user record since this is a new Google signup
            new_user = {
                "email": req.email,
                "name": req.name,
                "password_hash": "google_oauth",
                "role": req.role,
                "status": "incomplete_profile",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            result = await users_collection.insert_one(new_user)
            user_id = str(result.inserted_id)
            role = req.role
            status = "incomplete_profile"
    else:
        user_id = str(user["_id"])
        role = user.get("role", req.role)
        status = user.get("status", "incomplete_profile")
        
    token = create_access_token(data={"sub": req.email, "role": role})
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "role": role, 
        "status": status,
        "user_id": user_id
    }

@router.get("/roles")
async def get_user_roles(current_user: dict = Depends(get_current_user)):
    email = current_user.get("email")
    cursor = users_collection.find({"email": email})
    users = await cursor.to_list(length=10)
    roles = [u["role"] for u in users if "role" in u]
    return {"roles": roles}

class SwitchRoleReq(BaseModel):
    email: str
    target_role: str
    create_missing: bool = False

@router.post("/switch-role")
async def switch_role(req: SwitchRoleReq, current_user: dict = Depends(get_current_user)):
    if current_user.get("email") != req.email:
        raise HTTPException(status_code=403, detail="Cannot switch role for another user")
        
    target_user = await users_collection.find_one({"email": req.email, "role": req.target_role})
    if not target_user:
        if req.create_missing:
            # Get existing user to copy basic details (credentials, password hash, etc.)
            existing_user = await users_collection.find_one({"email": req.email})
            new_user = {
                "email": req.email,
                "password_hash": existing_user.get("password_hash", "google_oauth"),
                "role": req.target_role,
                "status": "incomplete_profile",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            if "name" in existing_user:
                new_user["name"] = existing_user["name"]
            result = await users_collection.insert_one(new_user)
            target_user = await users_collection.find_one({"_id": result.inserted_id})
        else:
            raise HTTPException(status_code=404, detail="Target role account not found")
        
    token = create_access_token(data={"sub": req.email, "role": req.target_role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": req.target_role,
        "status": target_user.get("status", "incomplete_profile"),
        "user_id": str(target_user["_id"])
    }

