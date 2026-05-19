import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI, server_api=ServerApi('1'))
db = client["hr_helper_db"]

users_collection = db["users"]
job_descriptions_collection = db["job_descriptions"]
candidate_profiles_collection = db["candidate_profiles"]
screenings_collection = db["screenings"]
companies_collection = db["companies"]
