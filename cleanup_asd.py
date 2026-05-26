"""
Cleanup: Delete all jobs/companies named 'Unknown Company' or 'New Job Role'
"""
import os
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"), server_api=ServerApi('1'))
db = client["hr_helper_db"]

# 1. Find matching job descriptions
jd_query = {
    "$or": [
        {"company_details.company_name": {"$regex": "^Unknown Company$", "$options": "i"}},
        {"title": {"$regex": "^New Job Role$", "$options": "i"}},
    ]
}
jds = list(db["job_descriptions"].find(jd_query))
print(f"Found {len(jds)} matching job descriptions:")
for j in jds:
    cd = j.get("company_details") or {}
    print(f"  - title='{j.get('title')}', company='{cd.get('company_name','N/A')}', id={j['_id']}")

jd_ids = [str(j["_id"]) for j in jds]
r1 = db["job_descriptions"].delete_many(jd_query)
print(f"  [OK] Deleted {r1.deleted_count} job descriptions")

# 2. Delete related screenings
if jd_ids:
    r2 = db["screenings"].delete_many({"jd_id": {"$in": jd_ids}})
    print(f"  [OK] Deleted {r2.deleted_count} related screenings")

# 3. Delete 'Unknown Company' from companies collection
r3 = db["companies"].delete_many({"company_name": {"$regex": "^Unknown Company$", "$options": "i"}})
print(f"  [OK] Deleted {r3.deleted_count} companies named 'Unknown Company'")

print("\nDone!")
