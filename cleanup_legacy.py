"""
cleanup_legacy.py
Removes all job_descriptions and companies that were NOT seeded by seed_companies.py.
Also removes legacy HR/recruiter users tied to those old entries.

Run with:  python cleanup_legacy.py
"""

import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI, server_api=ServerApi("1"))
db = client["hr_helper_db"]

job_descriptions_collection = db["job_descriptions"]
companies_collection        = db["companies"]
users_collection            = db["users"]

# The 10 companies we intentionally seeded
SEEDED_COMPANIES = {
    "Systems Limited",
    "Arbisoft",
    "Netsol Technologies",
    "Folio3 Software",
    "10Pearls",
    "TPS (Transaction Processing Systems)",
    "Tkxel",
    "i2c Inc.",
    "Confiz",
    "Ignite (National Technology Fund)",
}

# The demo HR emails we created — keep these users
SEEDED_HR_EMAILS = {
    "hr@systemsltd.demo",
    "hr@arbisoft.demo",
    "hr@netsoltech.demo",
    "hr@folio3.demo",
    "hr@10pearls.demo",
    "hr@tps.demo",
    "hr@tkxel.demo",
    "hr@i2cinc.demo",
    "hr@confiz.demo",
    "hr@ignite.demo",
}


async def cleanup():
    print("=" * 60)
    print("CLEANUP: Removing legacy companies & job listings")
    print("=" * 60)

    # ----------------------------------------------------------------
    # 1. Delete job_descriptions NOT belonging to the 10 seeded companies
    # ----------------------------------------------------------------
    all_jobs_cursor = job_descriptions_collection.find({})
    all_jobs = await all_jobs_cursor.to_list(length=5000)

    legacy_job_ids = []
    for jd in all_jobs:
        comp_details = jd.get("company_details", {}) or {}
        company_name = comp_details.get("company_name") or jd.get("company_name", "")
        if company_name not in SEEDED_COMPANIES:
            legacy_job_ids.append(jd["_id"])

    if legacy_job_ids:
        result = await job_descriptions_collection.delete_many({"_id": {"$in": legacy_job_ids}})
        print(f"[DELETE] Removed {result.deleted_count} legacy job description(s)")
    else:
        print("[SKIP]   No legacy job descriptions found")

    # ----------------------------------------------------------------
    # 2. Delete companies NOT in the seeded list
    # ----------------------------------------------------------------
    all_companies_cursor = companies_collection.find({})
    all_companies = await all_companies_cursor.to_list(length=5000)

    legacy_company_ids   = []
    legacy_company_owners = []  # owner_ids of removed companies (for user cleanup)
    for company in all_companies:
        if company.get("company_name") not in SEEDED_COMPANIES:
            legacy_company_ids.append(company["_id"])
            if company.get("owner_id"):
                legacy_company_owners.append(company["owner_id"])

    if legacy_company_ids:
        result = await companies_collection.delete_many({"_id": {"$in": legacy_company_ids}})
        print(f"[DELETE] Removed {result.deleted_count} legacy company record(s)")
    else:
        print("[SKIP]   No legacy company records found")

    # ----------------------------------------------------------------
    # 3. Remove legacy recruiter users tied to those old companies
    #    (keep all candidates + the 10 seeded HR emails + any real user accounts)
    # ----------------------------------------------------------------
    if legacy_company_owners:
        from bson import ObjectId
        owner_queries = []
        for oid in legacy_company_owners:
            try:
                owner_queries.append({"_id": ObjectId(oid)})
            except Exception:
                owner_queries.append({"email": oid})

        if owner_queries:
            # Only delete recruiter users that are NOT in our seeded set
            for q in owner_queries:
                user = await users_collection.find_one(q)
                if user and user.get("email") not in SEEDED_HR_EMAILS and user.get("role") == "recruiter":
                    # Extra safety: don't delete if they have real jobs remaining
                    remaining = await job_descriptions_collection.find_one({"owner_id": str(user["_id"])})
                    if not remaining:
                        await users_collection.delete_one({"_id": user["_id"]})
                        print(f"[DELETE] Removed legacy HR user: {user.get('email')}")

    # ----------------------------------------------------------------
    # Final counts
    # ----------------------------------------------------------------
    remaining_jobs      = await job_descriptions_collection.count_documents({})
    remaining_companies = await companies_collection.count_documents({})
    print()
    print("=" * 60)
    print("CLEANUP COMPLETE")
    print(f"  Jobs remaining      : {remaining_jobs}")
    print(f"  Companies remaining : {remaining_companies}")
    print("=" * 60)

    client.close()


if __name__ == "__main__":
    asyncio.run(cleanup())
