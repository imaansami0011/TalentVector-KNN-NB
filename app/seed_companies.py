"""
Seed script: 10 real Pakistani companies + HR users + real job postings.
Run via:  python -m app.seed_companies
"""

import asyncio
from datetime import datetime, timezone
from passlib.context import CryptContext
from .database import users_collection, companies_collection, job_descriptions_collection

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# ---------------------------------------------------------------------------
# MASTER DATA
# ---------------------------------------------------------------------------

COMPANIES = [
    {
        "company_name": "Systems Limited",
        "website": "https://www.systemsltd.com",
        "hq_location": "Lahore",
        "workplace_type": "Hybrid",
        "address": "Software Technology Park, Lahore, Pakistan",
        "industry": "Information Technology",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Systems_Limited_logo.png/200px-Systems_Limited_logo.png",
        "hr": {
            "name": "Ayesha Malik",
            "email": "hr@systemsltd.demo",
            "password": "Systems@123",
            "role_title": "Senior HR Manager",
        },
        "jobs": [
            {
                "title": "Senior Software Engineer – Java",
                "min_experience": 4,
                "location_type": "Hybrid",
                "city": "Lahore",
                "mode": "Hybrid",
                "sector": "Backend Development",
                "core_skills": ["Java", "Spring Boot", "Microservices", "PostgreSQL", "Docker", "Kubernetes", "REST APIs", "CI/CD"],
                "text": "Systems Limited is hiring a Senior Java Engineer to design and build high-performance microservices. You will own the backend for financial-grade applications.",
            },
            {
                "title": "React.js Frontend Developer",
                "min_experience": 2,
                "location_type": "Onsite",
                "city": "Lahore",
                "mode": "Onsite",
                "sector": "Web Development",
                "core_skills": ["React.js", "TypeScript", "Redux", "GraphQL", "HTML", "CSS", "Jest", "Webpack"],
                "text": "We need a React.js developer with 2+ years to build modern enterprise web applications for our global clients.",
            },
        ],
    },
    {
        "company_name": "Arbisoft",
        "website": "https://arbisoft.com",
        "hq_location": "Lahore",
        "workplace_type": "Remote",
        "address": "Johar Town, Lahore, Pakistan",
        "industry": "Software Outsourcing",
        "logo": "https://arbisoft.com/wp-content/uploads/2022/02/arbisoft-logo-dark.svg",
        "hr": {
            "name": "Usman Tariq",
            "email": "hr@arbisoft.demo",
            "password": "Arbisoft@123",
            "role_title": "Talent Acquisition Lead",
        },
        "jobs": [
            {
                "title": "Python Backend Engineer (Django/DRF)",
                "min_experience": 3,
                "location_type": "Remote",
                "city": "Lahore",
                "mode": "Remote",
                "sector": "Backend Development",
                "core_skills": ["Python", "Django", "Django REST Framework", "PostgreSQL", "Redis", "Celery", "AWS", "Docker"],
                "text": "Arbisoft is seeking a Python engineer to build scalable web services. Remote role with flexible hours. Work with US-based product teams.",
            },
            {
                "title": "DevOps Engineer",
                "min_experience": 3,
                "location_type": "Remote",
                "city": "Lahore",
                "mode": "Remote",
                "sector": "DevOps",
                "core_skills": ["AWS", "Terraform", "Kubernetes", "Docker", "Jenkins", "Linux", "Ansible", "CI/CD", "Monitoring"],
                "text": "Join Arbisoft as a DevOps Engineer responsible for infrastructure automation and cloud architecture across multiple client projects.",
            },
        ],
    },
    {
        "company_name": "Netsol Technologies",
        "website": "https://www.netsoltech.com",
        "hq_location": "Lahore",
        "workplace_type": "Onsite",
        "address": "Software Technology Park, Lahore, Pakistan",
        "industry": "Fintech Software",
        "logo": "https://www.netsoltech.com/wp-content/uploads/2023/01/netsol-logo.png",
        "hr": {
            "name": "Fatima Noor",
            "email": "hr@netsoltech.demo",
            "password": "Netsol@123",
            "role_title": "HR Business Partner",
        },
        "jobs": [
            {
                "title": "Full Stack .NET Developer",
                "min_experience": 3,
                "location_type": "Onsite",
                "city": "Lahore",
                "mode": "Onsite",
                "sector": "Web Development",
                "core_skills": ["C#", ".NET Core", "ASP.NET", "SQL Server", "Angular", "Entity Framework", "REST APIs", "Azure"],
                "text": "Netsol is looking for a Full Stack .NET Developer to work on its flagship automotive leasing finance platform used in 30+ countries.",
            },
            {
                "title": "QA Automation Engineer",
                "min_experience": 2,
                "location_type": "Onsite",
                "city": "Lahore",
                "mode": "Onsite",
                "sector": "Quality Assurance",
                "core_skills": ["Selenium", "Python", "Pytest", "Cypress", "JIRA", "SQL", "API Testing", "Postman", "Test Plans"],
                "text": "We are hiring a QA Automation Engineer to develop and maintain automated test suites for our enterprise finance applications.",
            },
        ],
    },
    {
        "company_name": "Folio3 Software",
        "website": "https://www.folio3.com",
        "hq_location": "Karachi",
        "workplace_type": "Hybrid",
        "address": "Shahrah-e-Faisal, Karachi, Pakistan",
        "industry": "Enterprise Software",
        "logo": "https://www.folio3.com/wp-content/themes/folio3/images/logo/folio3-logo.svg",
        "hr": {
            "name": "Zara Sheikh",
            "email": "hr@folio3.demo",
            "password": "Folio3@123",
            "role_title": "Recruiter",
        },
        "jobs": [
            {
                "title": "iOS Developer (Swift)",
                "min_experience": 3,
                "location_type": "Hybrid",
                "city": "Karachi",
                "mode": "Hybrid",
                "sector": "Mobile Development",
                "core_skills": ["Swift", "UIKit", "SwiftUI", "Xcode", "Core Data", "REST APIs", "Push Notifications", "TestFlight"],
                "text": "Folio3 needs an iOS Developer to build world-class mobile applications for our US & UAE clients. SwiftUI experience preferred.",
            },
            {
                "title": "Android Developer (Kotlin)",
                "min_experience": 2,
                "location_type": "Hybrid",
                "city": "Karachi",
                "mode": "Hybrid",
                "sector": "Mobile Development",
                "core_skills": ["Kotlin", "Android SDK", "Jetpack Compose", "MVVM", "Retrofit", "Room", "Firebase", "REST APIs"],
                "text": "We are looking for an Android Developer to create smooth native Android apps with modern Jetpack architecture.",
            },
        ],
    },
    {
        "company_name": "10Pearls",
        "website": "https://10pearls.com",
        "hq_location": "Karachi",
        "workplace_type": "Remote",
        "address": "Clifton, Karachi, Pakistan",
        "industry": "Digital Transformation",
        "logo": "https://10pearls.com/wp-content/uploads/2022/07/10pearls-logo-v2.png",
        "hr": {
            "name": "Hassan Raza",
            "email": "hr@10pearls.demo",
            "password": "Pearls@123",
            "role_title": "Head of People Operations",
        },
        "jobs": [
            {
                "title": "Data Engineer (Azure)",
                "min_experience": 3,
                "location_type": "Remote",
                "city": "Karachi",
                "mode": "Remote",
                "sector": "Data Engineering",
                "core_skills": ["Azure Data Factory", "PySpark", "SQL", "Python", "Databricks", "Azure Synapse", "Power BI", "ETL", "Delta Lake"],
                "text": "10Pearls is hiring a Data Engineer to build robust data pipelines on Microsoft Azure for US enterprise clients.",
            },
            {
                "title": "Machine Learning Engineer",
                "min_experience": 4,
                "location_type": "Remote",
                "city": "Karachi",
                "mode": "Remote",
                "sector": "Machine Learning",
                "core_skills": ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "MLOps", "Docker", "FastAPI", "NLP", "Computer Vision"],
                "text": "Join our AI team as an ML Engineer to develop production-grade machine learning models for intelligent automation products.",
            },
        ],
    },
    {
        "company_name": "TPS (Transaction Processing Systems)",
        "website": "https://www.tpsonline.com",
        "hq_location": "Karachi",
        "workplace_type": "Onsite",
        "address": "PECHS, Karachi, Pakistan",
        "industry": "Banking Technology",
        "logo": "https://www.tpsonline.com/assets/images/logo.png",
        "hr": {
            "name": "Sara Khan",
            "email": "hr@tps.demo",
            "password": "TPS@secure123",
            "role_title": "Talent Manager",
        },
        "jobs": [
            {
                "title": "Java EE Developer – Banking Systems",
                "min_experience": 4,
                "location_type": "Onsite",
                "city": "Karachi",
                "mode": "Onsite",
                "sector": "Backend Development",
                "core_skills": ["Java EE", "Spring", "Oracle DB", "SOAP", "REST APIs", "ATM Switching", "ISO 8583", "Hibernate", "Linux"],
                "text": "TPS is seeking a Java EE Developer to work on payment switching and card management solutions deployed at banks across Africa and Middle East.",
            },
            {
                "title": "Business Analyst – Fintech",
                "min_experience": 3,
                "location_type": "Onsite",
                "city": "Karachi",
                "mode": "Onsite",
                "sector": "Business Analysis",
                "core_skills": ["Requirements Gathering", "JIRA", "SQL", "MS Visio", "Agile", "Scrum", "Banking Domain", "BRD Writing", "User Stories"],
                "text": "We need a Business Analyst with banking domain expertise to bridge the gap between clients and our development teams for digital payment projects.",
            },
        ],
    },
    {
        "company_name": "Tkxel",
        "website": "https://tkxel.com",
        "hq_location": "Lahore",
        "workplace_type": "Hybrid",
        "address": "DHA Phase 6, Lahore, Pakistan",
        "industry": "Software Product Development",
        "logo": "https://tkxel.com/wp-content/uploads/2022/04/tkxel-logo.svg",
        "hr": {
            "name": "Bilal Ahmed",
            "email": "hr@tkxel.demo",
            "password": "Tkxel@123",
            "role_title": "Senior Recruiter",
        },
        "jobs": [
            {
                "title": "Node.js Backend Developer",
                "min_experience": 2,
                "location_type": "Hybrid",
                "city": "Lahore",
                "mode": "Hybrid",
                "sector": "Backend Development",
                "core_skills": ["Node.js", "Express.js", "MongoDB", "PostgreSQL", "REST APIs", "GraphQL", "JWT", "Redis", "AWS Lambda"],
                "text": "Tkxel is looking for a Node.js developer to build scalable APIs and microservices for SaaS product companies in the US.",
            },
            {
                "title": "UI/UX Designer",
                "min_experience": 2,
                "location_type": "Hybrid",
                "city": "Lahore",
                "mode": "Hybrid",
                "sector": "Design",
                "core_skills": ["Figma", "Adobe XD", "Sketch", "User Research", "Wireframing", "Prototyping", "Design Systems", "Usability Testing"],
                "text": "We need a UI/UX Designer to create delightful, user-centered design experiences for our SaaS clients. Portfolio required.",
            },
        ],
    },
    {
        "company_name": "i2c Inc.",
        "website": "https://i2cinc.com",
        "hq_location": "Lahore",
        "workplace_type": "Onsite",
        "address": "Gulberg III, Lahore, Pakistan",
        "industry": "Banking & Payments Technology",
        "logo": "https://i2cinc.com/wp-content/uploads/2021/07/i2c-logo.svg",
        "hr": {
            "name": "Amna Butt",
            "email": "hr@i2cinc.demo",
            "password": "i2cInc@123",
            "role_title": "Recruitment Specialist",
        },
        "jobs": [
            {
                "title": "Software Engineer – Payments Platform",
                "min_experience": 3,
                "location_type": "Onsite",
                "city": "Lahore",
                "mode": "Onsite",
                "sector": "Backend Development",
                "core_skills": ["Java", "C++", "Payment Systems", "SQL", "Multithreading", "Linux", "REST APIs", "Agile", "Git"],
                "text": "i2c is hiring a Software Engineer to work on our globally deployed card issuance and payments processing platform serving 200+ clients worldwide.",
            },
            {
                "title": "Data Scientist – Fraud Analytics",
                "min_experience": 3,
                "location_type": "Onsite",
                "city": "Lahore",
                "mode": "Onsite",
                "sector": "Data Science",
                "core_skills": ["Python", "Machine Learning", "Pandas", "Scikit-learn", "SQL", "Fraud Detection", "Statistical Modeling", "XGBoost", "Power BI"],
                "text": "Join our Data Science team to build fraud detection models for real-time transaction monitoring on our payments platform.",
            },
        ],
    },
    {
        "company_name": "Confiz",
        "website": "https://confiz.com",
        "hq_location": "Lahore",
        "workplace_type": "Hybrid",
        "address": "Township, Lahore, Pakistan",
        "industry": "Digital Commerce & Cloud",
        "logo": "https://confiz.com/wp-content/uploads/2022/04/Confiz-logo.png",
        "hr": {
            "name": "Maira Siddiqui",
            "email": "hr@confiz.demo",
            "password": "Confiz@123",
            "role_title": "People & Culture Manager",
        },
        "jobs": [
            {
                "title": "Cloud Solutions Architect (AWS)",
                "min_experience": 5,
                "location_type": "Hybrid",
                "city": "Lahore",
                "mode": "Hybrid",
                "sector": "Cloud Computing",
                "core_skills": ["AWS", "Solution Architecture", "Terraform", "Microservices", "EKS", "Lambda", "DynamoDB", "CloudFormation", "Cost Optimization"],
                "text": "Confiz is seeking a Cloud Solutions Architect to design and deliver scalable AWS-based cloud solutions for global e-commerce and retail clients.",
            },
            {
                "title": "Magento / Shopify Developer",
                "min_experience": 2,
                "location_type": "Hybrid",
                "city": "Lahore",
                "mode": "Hybrid",
                "sector": "E-Commerce",
                "core_skills": ["Magento 2", "Shopify", "PHP", "MySQL", "JavaScript", "REST APIs", "Theme Development", "Payment Gateways", "HTML", "CSS"],
                "text": "We are looking for an e-commerce developer with hands-on Magento 2 or Shopify experience to build and maintain online stores for US retailers.",
            },
        ],
    },
    {
        "company_name": "Ignite (National Technology Fund)",
        "website": "https://ignite.org.pk",
        "hq_location": "Islamabad",
        "workplace_type": "Onsite",
        "address": "F-7, Islamabad, Pakistan",
        "industry": "Government Technology & Innovation",
        "logo": "https://ignite.org.pk/wp-content/uploads/2022/03/ignite-logo.png",
        "hr": {
            "name": "Kamran Mirza",
            "email": "hr@ignite.demo",
            "password": "Ignite@123",
            "role_title": "HR Officer",
        },
        "jobs": [
            {
                "title": "Full Stack Developer (MEAN/MERN)",
                "min_experience": 2,
                "location_type": "Onsite",
                "city": "Islamabad",
                "mode": "Onsite",
                "sector": "Web Development",
                "core_skills": ["React.js", "Node.js", "MongoDB", "Express.js", "TypeScript", "REST APIs", "JWT", "Git", "HTML", "CSS"],
                "text": "Ignite seeks a Full Stack Developer to work on national-level digital transformation projects including citizen-facing e-government portals.",
            },
            {
                "title": "Cybersecurity Analyst",
                "min_experience": 3,
                "location_type": "Onsite",
                "city": "Islamabad",
                "mode": "Onsite",
                "sector": "Cybersecurity",
                "core_skills": ["SIEM", "Vulnerability Assessment", "Penetration Testing", "Firewall", "OWASP", "Network Security", "Incident Response", "Python", "Linux"],
                "text": "Join Ignite as a Cybersecurity Analyst to protect critical national digital infrastructure and support cyber readiness programs across Pakistan.",
            },
        ],
    },
]


# ---------------------------------------------------------------------------
# SEEDING FUNCTIONS
# ---------------------------------------------------------------------------

async def seed_companies_hr_jobs():
    """
    Main seed function. Idempotent — skips companies that already exist.
    """
    inserted_companies = 0
    inserted_users = 0
    inserted_jobs = 0

    for entry in COMPANIES:
        company_name = entry["company_name"]

        # --- 1. Check if company already exists ---
        existing = await companies_collection.find_one({"company_name": company_name})
        if existing:
            print(f"[SKIP] Company already exists: {company_name}")
            owner_id = existing.get("owner_id", "")
        else:
            # --- 2. Create HR user ---
            hr = entry["hr"]
            existing_user = await users_collection.find_one({"email": hr["email"]})
            if existing_user:
                owner_id = str(existing_user["_id"])
                print(f"[SKIP] HR user already exists: {hr['email']}")
            else:
                hashed = pwd_context.hash(hr["password"])
                user_doc = {
                    "email": hr["email"],
                    "name": hr["name"],
                    "password_hash": hashed,
                    "role": "recruiter",
                    "status": "onboarded",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                result = await users_collection.insert_one(user_doc)
                owner_id = str(result.inserted_id)
                inserted_users += 1
                print(f"[INSERT] HR user created: {hr['email']}  (id={owner_id})")

            # --- 3. Create company ---
            company_doc = {
                "company_name": company_name,
                "website": entry.get("website", ""),
                "hq_location": entry.get("hq_location", ""),
                "workplace_type": entry.get("workplace_type", "Onsite"),
                "address": entry.get("address", ""),
                "industry": entry.get("industry", ""),
                "owner_id": owner_id,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            await companies_collection.insert_one(company_doc)
            inserted_companies += 1
            print(f"[INSERT] Company created: {company_name}")

        # --- 4. Create jobs ---
        for job in entry.get("jobs", []):
            existing_job = await job_descriptions_collection.find_one({
                "title": job["title"],
                "company_details.company_name": company_name,
            })
            if existing_job:
                print(f"  [SKIP] Job already exists: {job['title']}")
                continue

            job_doc = {
                "title": job["title"],
                "min_experience": job["min_experience"],
                "location_type": job["location_type"],
                "mode": job["mode"],
                "core_skills": job["core_skills"],
                "sector": job["sector"],
                "text": job["text"],
                "company_email": entry["hr"]["email"],
                "owner_id": owner_id,
                "company_details": {
                    "company_name": company_name,
                    "website": entry.get("website", ""),
                    "hq_location": entry.get("hq_location", ""),
                    "workplace_type": entry.get("workplace_type", "Onsite"),
                },
                "city": job.get("city", entry.get("hq_location", "")),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "active",
            }
            await job_descriptions_collection.insert_one(job_doc)
            inserted_jobs += 1
            print(f"  [INSERT] Job created: {job['title']} @ {company_name}")

    print("\n" + "=" * 60)
    print(f"SEED COMPLETE")
    print(f"  Companies inserted : {inserted_companies}")
    print(f"  HR users inserted  : {inserted_users}")
    print(f"  Jobs inserted      : {inserted_jobs}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(seed_companies_hr_jobs())
