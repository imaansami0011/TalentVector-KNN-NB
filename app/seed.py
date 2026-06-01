import os
import json
import re
import random
from datetime import datetime, timezone
from bson import ObjectId
from .database import candidate_profiles_collection
from .extractor import extract_entities, manual_extract_categorized_skills, detect_domain, calculate_experience_robust

def clean_skills(skills_text):
    # Splits by common delimiters and removes parenthesized timeframes
    cleaned = []
    delimiters = r'[\n,•\-\|]+'
    raw_splits = re.split(delimiters, skills_text)
    for part in raw_splits:
        part = part.strip()
        # Remove pattern "(Less than 1 year)" or "(3 years)" etc.
        part_clean = re.sub(r'\s*\(\s*Less than\s*\d+\s*years?\s*\)\s*', '', part, flags=re.IGNORECASE)
        part_clean = re.sub(r'\s*\(\s*\d+\s*years?\s*\)\s*', '', part_clean, flags=re.IGNORECASE)
        part_clean = re.sub(r'[\(\)]', '', part_clean).strip()
        if part_clean and len(part_clean) > 1 and not part_clean.lower().startswith("indeed") and not part_clean.lower().startswith("less than"):
            cleaned.append(part_clean.title())
    return list(set(cleaned))

def parse_resume_json_line(line_str):
    try:
        data = json.loads(line_str)
    except Exception as e:
        print(f"Error parsing JSON line: {e}")
        return None

    content = data.get("content", "")
    annotations = data.get("annotation", [])
    
    # Initialize fields
    name = "Unknown Name"
    email = "Not Found"
    phone = "Not Found"
    location = "Not Found"
    designation = "Not Found"
    skills = []
    college_names = []
    degrees = []
    grad_years = []
    companies = []
    designations = []

    for ann in annotations:
        labels = ann.get("label", [])
        points = ann.get("points", [])
        if not points:
            continue
        text = points[0].get("text", "").strip()
        if not text:
            continue
            
        if "Name" in labels:
            name = text
        elif "Email Address" in labels:
            email = text
        elif "Location" in labels:
            location = text
        elif "Designation" in labels:
            designations.append(text)
            designation = text
        elif "Companies worked at" in labels:
            companies.append(text)
        elif "Skills" in labels:
            skills.extend(clean_skills(text))
        elif "College Name" in labels:
            college_names.append(text)
        elif "Degree" in labels:
            degrees.append(text)
        elif "Graduation Year" in labels:
            grad_years.append(text)

    # Clean up name (often it has extra spacing/newlines)
    name = re.sub(r'\s+', ' ', name).strip()
    if not name or name == "Unknown Name" or len(name.split()) > 4:
        name = extract_name_heuristic(content)

    # Clean email and phone using regex if they are missing or malformed
    if email == "Not Found" or "@" not in email:
        email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', content)
        if email_match:
            email = email_match.group(0).lower()
        else:
            email_slug = re.sub(r'[^a-zA-Z0-9]', '.', name.lower())
            email = f"{email_slug}@example.com"
            
    # Normalize email: take the first email if multiple returned, clean up comma/whitespace
    email = email.split()[0].replace(",", "").strip()

    if phone == "Not Found":
        phone_match = re.search(r'(\+\d{1,3}[-.\s]??\d{1,4}[-.\s]??\d{1,4}[-.\s]??\d{1,9}|\d{10})', content)
        if phone_match:
            phone = phone_match.group(0)
        else:
            phone = f"+1 ({random.randint(200, 999)}) 555-{random.randint(1000, 9999)}"

    # Dedup and clean skills list
    skills = list(set(skills))
    
    # If no skills extracted, extract using manual_extract_categorized_skills or default to domain-based skills
    if not skills:
        cleaned_c = re.sub(r'\s+', ' ', content).strip()
        _, all_skills = manual_extract_categorized_skills(cleaned_c)
        skills = sorted(list(all_skills))
        
    if not skills:
        skills = ["React", "JavaScript", "HTML", "CSS", "Node.js"]

    # Standardize experiences
    experiences = []
    if not designations:
        designations = [designation] if designation != "Not Found" else ["Software Engineer"]
    if not companies:
        companies = ["Oracle", "Infosys", "Microsoft", "Accenture"]

    num_exp = max(len(designations), len(companies))
    for idx in range(min(num_exp, 3)):
        role = designations[idx] if idx < len(designations) else designations[0]
        comp = companies[idx] if idx < len(companies) else companies[0]
        experiences.append({
            "role": role,
            "company": comp,
            "period": f"202{2-idx} - {'Present' if idx == 0 else f'202{3-idx}'}",
            "summary": f"Collaborated with engineering team to implement and deploy robust applications, optimizing query performance and enhancing user experience."
        })
        
    # Standardize education
    educations = []
    num_edu = max(len(college_names), len(degrees), len(grad_years))
    if num_edu == 0:
        educations.append({
            "degree": "Bachelor of Science in Computer Science",
            "school": "State University",
            "year": "2018-2022"
        })
    else:
        for idx in range(min(num_edu, 2)):
            school = college_names[idx] if idx < len(college_names) else (college_names[0] if college_names else "State University")
            deg = degrees[idx] if idx < len(degrees) else (degrees[0] if degrees else "Bachelor of Science")
            yr = grad_years[idx] if idx < len(grad_years) else (grad_years[0] if grad_years else "2022")
            
            school = re.sub(r'\s+', ' ', school).strip()
            deg = re.sub(r'\s+', ' ', deg).strip()
            yr = re.sub(r'\s+', ' ', yr).strip()

            if re.match(r'^\d{4}$', yr):
                yr_val = int(yr)
                yr_str = f"{yr_val-4}-{yr_val}"
            else:
                yr_str = yr
            educations.append({
                "degree": deg,
                "school": school,
                "year": yr_str
            })

    # Location fallback
    location = re.sub(r'\s+', ' ', location).strip()
    if location == "Not Found" or not location:
        location = "Bengaluru, Karnataka"
        
    # Calculate experience
    exp_val, _ = calculate_experience_robust(content, is_jd=False)
    if not exp_val or exp_val == 0:
        exp_val = random.randint(2, 8)
    
    # Calculate fit score (70-95)
    skillMatch = random.randint(65, 95)
    expMatch = random.randint(70, 100)
    score = int(round(skillMatch * 0.7 + expMatch * 0.3))
    
    # Detect domain
    cleaned_c = re.sub(r'\s+', ' ', content).strip()
    cat_skills, _ = manual_extract_categorized_skills(cleaned_c)
    domain = detect_domain(cat_skills)
    if domain == "General" or domain == "Other":
        domain = "Web Development" # map to a standard domain category in the UI
        
    title = designations[0] if designations else "Software Engineer"
    title = re.sub(r'\s+', ' ', title).strip()

    status = random.choice(["new", "shortlisted", "review", "rejected"])
    avatar = f"https://api.dicebear.com/9.x/notionists/svg?seed={encodeURIComponent(name)}"
    appliedDate = f"2026-05-{random.randint(1, 20):02d}"
    
    return {
        "name": name,
        "email": email,
        "phone": phone,
        "location": location,
        "title": title,
        "experience": exp_val,
        "score": score,
        "skillMatch": skillMatch,
        "expMatch": expMatch,
        "domain": domain,
        "status": status,
        "skills": skills[:8],
        "education": educations,
        "experiences": experiences,
        "appliedFor": title,
        "avatar": avatar,
        "appliedDate": appliedDate,
        "visibility": "public" # Crucial for Track 2 global candidate search
    }

def extract_name_heuristic(content):
    # Fallback name extraction logic
    lines = [l.strip() for l in content.split('\n') if l.strip()]
    for line in lines[:5]:
        if any(w in line.lower() for w in ["resume", "cv", "experience", "email", "phone", "profile"]):
            continue
        if any(c.isdigit() for c in line):
            continue
        words = line.split()
        if 1 <= len(words) <= 3:
            return line
    return "John Doe"

def encodeURIComponent(val):
    # simple url encoding for dicebear seed
    return re.sub(r'[^a-zA-Z0-9]', '', val)

async def seed_candidates_if_empty():
    await seed_15_mock_candidate_accounts()
    
    count = await candidate_profiles_collection.count_documents({"visibility": "public"})
    print(f"Current public candidate count in DB: {count}")
    if count > 0:
        print("Candidates collection already seeded. Skipping.")
        return

    print("Seeding candidates collection with Pakistani identities & real calculated scores...")
    import math
    from collections import Counter

    JOBS = [
        {
            "title": "Senior Software Engineer – Java",
            "min_experience": 4,
            "sector": "Software Development",
            "core_skills": ["Java", "Spring Boot", "Microservices", "PostgreSQL", "Docker", "Kubernetes", "REST APIs", "CI/CD"],
            "domain": "Software Development"
        },
        {
            "title": "React.js Frontend Developer",
            "min_experience": 2,
            "sector": "Web Development",
            "core_skills": ["React.js", "JavaScript", "HTML", "CSS", "TypeScript", "Redux", "Tailwind CSS", "REST APIs", "Git"],
            "domain": "Web Development"
        },
        {
            "title": "Python Backend Engineer (Django/DRF)",
            "min_experience": 3,
            "sector": "Software Development",
            "core_skills": ["Python", "Django", "FastAPI", "PostgreSQL", "Redis", "Docker", "REST APIs", "Git", "Celery"],
            "domain": "Software Development"
        },
        {
            "title": "DevOps Engineer",
            "min_experience": 3,
            "sector": "Cloud & DevOps",
            "core_skills": ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Linux", "Bash", "GitHub Actions", "Nginx"],
            "domain": "Cloud & DevOps"
        },
        {
            "title": "Full Stack .NET Developer",
            "min_experience": 4,
            "sector": "Software Development",
            "core_skills": ["C#", ".NET Core", "ASP.NET MVC", "SQL Server", "Entity Framework", "JavaScript", "Angular", "Web API", "Azure"],
            "domain": "Software Development"
        },
        {
            "title": "QA Automation Engineer",
            "min_experience": 3,
            "sector": "QA & Testing",
            "core_skills": ["Selenium", "Python", "Cypress", "JavaScript", "QA Automation", "API Testing", "Postman", "CI/CD", "JIRA"],
            "domain": "QA & Testing"
        },
        {
            "title": "iOS Developer (Swift)",
            "min_experience": 3,
            "sector": "Mobile Development",
            "core_skills": ["Swift", "UIKit", "SwiftUI", "Xcode", "CocoaPods", "REST APIs", "Git", "CoreData", "App Store Guidelines"],
            "domain": "Mobile Development"
        },
        {
            "title": "Android Developer (Kotlin)",
            "min_experience": 3,
            "sector": "Mobile Development",
            "core_skills": ["Kotlin", "Java", "Android SDK", "Android Studio", "Retrofit", "Jetpack Compose", "Git", "MVVM"],
            "domain": "Mobile Development"
        },
        {
            "title": "Data Engineer (Azure)",
            "min_experience": 4,
            "sector": "Data Engineering",
            "core_skills": ["Azure Data Factory", "Databricks", "SQL Server", "Python", "ETL", "Data Pipelines", "Power BI", "PySpark"],
            "domain": "Data Engineering"
        },
        {
            "title": "Machine Learning Engineer",
            "min_experience": 3,
            "sector": "Data Science",
            "core_skills": ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-Learn", "Pandas", "Computer Vision", "NLP"],
            "domain": "Data Science"
        },
        {
            "title": "Java EE Developer – Banking Systems",
            "min_experience": 5,
            "sector": "Software Development",
            "core_skills": ["Java EE", "EJB", "Hibernate", "Oracle DB", "WebLogic", "JSP", "SOAP Web Services", "Banking Domain Knowledge"],
            "domain": "Software Development"
        },
        {
            "title": "PHP Laravel Web Developer",
            "min_experience": 2,
            "sector": "Web Development",
            "core_skills": ["PHP", "Laravel", "MySQL", "JavaScript", "jQuery", "REST APIs", "Git", "HTML", "CSS", "Bootstrap"],
            "domain": "Web Development"
        },
        {
            "title": "Data Analyst (SQL & BI)",
            "min_experience": 2,
            "sector": "Data Science",
            "core_skills": ["SQL", "Power BI", "Tableau", "Excel", "Data Analysis", "Reporting", "Python", "Statistics", "Data Cleaning"],
            "domain": "Data Science"
        },
        {
            "title": "Cloud Solutions Architect (AWS)",
            "min_experience": 5,
            "sector": "Cloud & DevOps",
            "core_skills": ["AWS", "Solution Architecture", "Terraform", "Microservices", "EKS", "Lambda", "DynamoDB", "CloudFormation", "Cost Optimization"],
            "domain": "Cloud & DevOps"
        },
        {
            "title": "Magento / Shopify Developer",
            "min_experience": 2,
            "sector": "Web Development",
            "core_skills": ["Magento 2", "Shopify", "PHP", "MySQL", "JavaScript", "REST APIs", "Theme Development", "Payment Gateways", "HTML", "CSS"],
            "domain": "Web Development"
        },
        {
            "title": "Full Stack Developer (MEAN/MERN)",
            "min_experience": 2,
            "sector": "Web Development",
            "core_skills": ["React.js", "Node.js", "MongoDB", "Express.js", "TypeScript", "REST APIs", "JWT", "Git", "HTML", "CSS"],
            "domain": "Web Development"
        },
        {
            "title": "Cybersecurity Analyst",
            "min_experience": 3,
            "sector": "Cyber Security",
            "core_skills": ["SIEM", "Vulnerability Assessment", "Penetration Testing", "Firewall", "OWASP", "Network Security", "Incident Response", "Python", "Linux"],
            "domain": "Cyber Security"
        }
    ]

    PAKISTANI_NAMES = [
        ("Muhammad Ali", "muhammad.ali"), ("Ahmed Khan", "ahmed.khan"), ("Usman Sheikh", "usman.sheikh"),
        ("Bilal Siddiqui", "bilal.siddiqui"), ("Hamza Malik", "hamza.malik"), ("Zeeshan Abbasi", "zeeshan.abbasi"),
        ("Faisal Shah", "faisal.shah"), ("Omer Farooq", "omer.farooq"), ("Asad Mehmood", "asad.mehmood"),
        ("Saad Rizvi", "saad.rizvi"), ("Haris Iqbal", "haris.iqbal"), ("Zain ul Abideen", "zain.abideen"),
        ("Mustafa Qureshi", "mustafa.quresi"), ("Hassan Jamil", "hassan.jamil"), ("Ali Raza", "ali.raza"),
        ("Daniyal Ahmed", "daniyal.ahmed"), ("Shahzaib Khan", "shahzaib.khan"), ("Talha Bukhari", "talha.bukhari"),
        ("Junaid Mughal", "junaid.mughal"), ("Yasir Arafat", "yasir.arafat"), ("Ayesha Fatima", "ayesha.fatima"),
        ("Sana Ahmed", "sana.ahmed"), ("Mariam Khan", "mariam.khan"), ("Hina Malik", "hina.malik"),
        ("Fatima Noor", "fatima.noor"), ("Zainab Bibi", "zainab.bibi"), ("Sadia Parveen", "sadia.parveen"),
        ("Mahnoor Farooq", "mahnoor.farooq"), ("Rabia Basri", "rabia.basri"), ("Nida Yasir", "nida.yasir"),
        ("Sarah Sheikh", "sarah.sheikh"), ("Iqra Jamil", "iqra.jamil"), ("Alizeh Shah", "alizeh.shah"),
        ("Kiran Abbasi", "kiran.abbasi"), ("Areeba Kamal", "areeba.kamal"), ("Laiba Rehman", "laiba.rehman"),
        ("Fiza Javed", "fiza.javed"), ("Zoya Malik", "zoya.malik"), ("Amna Butt", "amna.butt"),
        ("Bismah Maroof", "bismah.maroof")
    ]

    PAKISTANI_CITIES = [
        "Lahore, Punjab", "Karachi, Sindh", "Islamabad, ICT", "Rawalpindi, Punjab",
        "Peshawar, KPK", "Faisalabad, Punjab", "Multan, Punjab", "Quetta, Balochistan",
        "Sialkot, Punjab", "Gujranwala, Punjab", "Hyderabad, Sindh"
    ]

    UNIVERSITIES = [
        "National University of Sciences and Technology (NUST)", "FAST NUCES",
        "Lahore University of Management Sciences (LUMS)", "COMSATS University Islamabad",
        "NED University of Engineering and Technology", "University of Karachi",
        "Ghulam Ishaq Khan Institute (GIKI)", "Punjab University (PU)",
        "Institute of Business Administration (IBA) Karachi", "UET Lahore",
        "Quaid-e-Azam University"
    ]

    EXTRA_SKILLS = {
        "Software Development": ["Git", "SQL", "Agile", "Linux", "REST APIs", "OOP", "Data Structures", "Algorithms", "GitHub", "Unit Testing"],
        "Web Development": ["HTML", "CSS", "Git", "JavaScript", "SQL", "REST APIs", "Sass", "GitHub", "JSON", "Bootstrap"],
        "Cloud & DevOps": ["Git", "Linux", "Docker", "Shell Scripting", "CI/CD", "GitHub Actions", "YAML", "Networking", "Bash", "Python"],
        "QA & Testing": ["Git", "JIRA", "Manual Testing", "SQL", "Bug Tracking", "API Testing", "Postman", "SDLC", "Agile", "Test Cases"],
        "Data Engineering": ["SQL", "Python", "Git", "ETL", "Data Warehousing", "Linux", "Data Modeling", "Bash", "Apache Spark", "Docker"],
        "Data Science": ["Python", "SQL", "Pandas", "NumPy", "Matplotlib", "Data Analysis", "Git", "Statistics", "Jupyter"],
        "Cyber Security": ["Linux", "Networking", "Python", "Wireshark", "Firewalls", "Information Security", "Cryptography", "Bash", "Git", "CEH"],
        "Management": ["JIRA", "Agile", "Scrum", "Communication", "Project Management", "MS Excel", "Leadership", "Trello", "Requirements", "Visio"]
    }

    def local_manual_ranker(jd_skills, resume_skills):
        vocabulary = list(set(jd_skills + resume_skills))
        if not vocabulary:
            return 0.0
        def build_vector(skills, vocab):
            count = Counter(skills)
            return [count.get(word, 0) for word in vocab]
        v_jd = build_vector(jd_skills, vocabulary)
        v_res = build_vector(resume_skills, vocabulary)
        dot_product = sum(a * b for a, b in zip(v_jd, v_res))
        mag_jd = math.sqrt(sum(a**2 for a in v_jd))
        mag_res = math.sqrt(sum(b**2 for b in v_res))
        if mag_jd == 0 or mag_res == 0:
            return 0.0
        return dot_product / (mag_jd * mag_res)

    def local_calculate_experience_score(candidate_exp, required_years, is_plus=True):
        if required_years == 0:
            return 100.0
        if is_plus:
            if candidate_exp >= required_years:
                return 100.0
            return (candidate_exp / required_years) * 100
        distance = abs(candidate_exp - required_years)
        if distance == 0:
            return 100.0
        elif distance == 1:
            return 70.0
        elif distance == 2:
            return 40.0
        else:
            return 10.0

    candidates_to_insert = []
    names_pool = list(PAKISTANI_NAMES)
    random.shuffle(names_pool)
    
    for i in range(35):
        job = JOBS[i % len(JOBS)]
        name, slug = names_pool[i % len(names_pool)]
        
        if i >= len(names_pool):
            suffix = (i // len(names_pool)) + 1
            name = f"{name} {suffix}"
            email = f"{slug}{suffix}@example.com"
        else:
            email = f"{slug}@example.com"
            
        city = random.choice(PAKISTANI_CITIES)
        phone = f"+92-{random.randint(300, 349)}-{random.randint(1000000, 9999999)}"
        uni = random.choice(UNIVERSITIES)
        
        experience_offset = random.choice([-1, 0, 1, 2, 3, 4])
        exp_val = max(1, job["min_experience"] + experience_offset)
        
        fit_profile = random.choice(["high", "high", "medium", "medium", "low"])
        core_skills_to_include = list(job["core_skills"])
        if fit_profile == "high":
            take_count = random.randint(math.ceil(len(core_skills_to_include) * 0.7), len(core_skills_to_include))
        elif fit_profile == "medium":
            take_count = random.randint(math.ceil(len(core_skills_to_include) * 0.45), math.ceil(len(core_skills_to_include) * 0.7) - 1)
        else:
            take_count = random.randint(1, math.ceil(len(core_skills_to_include) * 0.45) - 1)
            
        random.shuffle(core_skills_to_include)
        cand_skills = core_skills_to_include[:take_count]
        
        extras = list(EXTRA_SKILLS.get(job["domain"], ["Git", "SQL", "Linux"]))
        random.shuffle(extras)
        for skill in extras[:random.randint(2, 4)]:
            if skill.lower() not in [s.lower() for s in cand_skills]:
                cand_skills.append(skill)
                
        skill_match_ratio = local_manual_ranker(job["core_skills"], cand_skills)
        skillMatch = int(round(skill_match_ratio * 100))
        expMatch = int(round(local_calculate_experience_score(exp_val, job["min_experience"], is_plus=True)))
        score = int(round(skillMatch * 0.7 + expMatch * 0.3))
        
        cand_skills = [s.title() for s in cand_skills]
        past_companies = ["Systems Limited", "Arbisoft", "10Pearls", "Folio3", "Tkxel", "Contour Software", "Devsinc", "Venturedive"]
        random.shuffle(past_companies)
        
        experiences = [{
            "role": f"Software Engineer" if exp_val < 4 else f"Senior {job['title'].split('–')[0].strip()}",
            "company": past_companies[0],
            "period": f"2023 - Present",
            "summary": f"Responsible for building and optimization of core features. Developed microservices, APIs, and participated in UI upgrades."
        }]
        
        if exp_val > 2:
            experiences.append({
                "role": "Associate Software Engineer" if exp_val < 5 else "Software Engineer",
                "company": past_companies[1],
                "period": f"2021 - 2023",
                "summary": "Assisted in code deployments, bug hunting, wrote unit tests, and collaborated on cross-functional requirements."
            })
            
        grad_year = 2026 - exp_val
        education = [{
            "degree": "Bachelor of Science in Computer Science",
            "school": uni,
            "year": f"{grad_year-4}-{grad_year}"
        }]
        
        avatar = f"https://api.dicebear.com/9.x/notionists/svg?seed={slug}"
        status = random.choice(["new", "shortlisted", "review"])
        if score >= 80 and random.random() < 0.6:
            status = "shortlisted"
        if score < 50 and random.random() < 0.6:
            status = "rejected"
            
        applied_day = random.randint(1, 28)
        appliedDate = f"2026-05-{applied_day:02d}"
        
        candidate_doc = {
            "name": name,
            "email": email,
            "phone": phone,
            "location": city,
            "title": job["title"],
            "experience": exp_val,
            "score": score,
            "skillMatch": skillMatch,
            "expMatch": expMatch,
            "domain": job["domain"],
            "status": status,
            "skills": cand_skills,
            "education": education,
            "experiences": experiences,
            "appliedFor": job["title"],
            "avatar": avatar,
            "appliedDate": appliedDate,
            "visibility": "public"
        }
        candidates_to_insert.append(candidate_doc)
        
    if candidates_to_insert:
        result = await candidate_profiles_collection.insert_many(candidates_to_insert)
        print(f"Successfully seeded {len(result.inserted_ids)} Pakistani candidates into MongoDB!")
    else:
        print("No candidates generated to seed.")

async def seed_15_mock_candidate_accounts():
    from .database import users_collection, candidate_profiles_collection
    from passlib.context import CryptContext
    
    # Check if they are already present by searching for the first email
    existing = await users_collection.find_one({"email": "muhammad.faisal@example.com"})
    if existing:
        print("15 mock candidate accounts already seeded in database.")
        return
        
    pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
    hashed_password = pwd_context.hash("password123")
    
    MOCK_ACCOUNTS = [
        {
            "name": "Muhammad Faisal",
            "email": "muhammad.faisal@example.com",
            "phone": "+92-300-1234567",
            "location": "Lahore, Punjab",
            "sector": "Software Development",
            "total_experience": 4.5,
            "skills": ["Python", "FastAPI", "Django", "PostgreSQL", "REST APIs", "Docker", "Git", "Agile"],
            "education": [
                {
                    "degree": "Bachelor of Science in Computer Science",
                    "school": "FAST NUCES, Lahore",
                    "year": "2020-2024"
                }
            ],
            "experiences": [
                {
                    "role": "Senior Software Engineer",
                    "company": "Systems Limited",
                    "period": "2024 - Present",
                    "summary": "Designed and optimized high-performance REST APIs using FastAPI and Django. Integrated PostgreSQL databases and automated containerization using Docker."
                },
                {
                    "role": "Software Developer",
                    "company": "Arbisoft",
                    "period": "2022 - 2024",
                    "summary": "Developed web applications and worked closely with backend teams on Python microservices."
                }
            ]
        },
        {
            "name": "Ayesha Siddiqui",
            "email": "ayesha.siddiqui@example.com",
            "phone": "+92-321-7654321",
            "location": "Karachi, Sindh",
            "sector": "Web Development",
            "total_experience": 3.0,
            "skills": ["React.js", "Next.js", "Tailwind CSS", "TypeScript", "JavaScript", "Redux", "HTML", "CSS", "Git"],
            "education": [
                {
                    "degree": "Bachelor of Science in Computer Science",
                    "school": "FAST NUCES, Karachi",
                    "year": "2021-2025"
                }
            ],
            "experiences": [
                {
                    "role": "Frontend Developer",
                    "company": "10Pearls",
                    "period": "2025 - Present",
                    "summary": "Built modern user interfaces using React.js and Next.js. Styled responsive layouts with Tailwind CSS and managed state with Redux."
                },
                {
                    "role": "Junior Web Developer",
                    "company": "Folio3",
                    "period": "2023 - 2025",
                    "summary": "Maintained frontend web pages and converted Figma designs into functional React components."
                }
            ]
        },
        {
            "name": "Zain ul Abideen",
            "email": "zain.abideen@example.com",
            "phone": "+92-333-9876543",
            "location": "Islamabad, ICT",
            "sector": "Web Development",
            "total_experience": 5.0,
            "skills": ["MongoDB", "Express.js", "React.js", "Node.js", "TypeScript", "REST APIs", "JWT", "Docker", "Git"],
            "education": [
                {
                    "degree": "Bachelor of Science in Software Engineering",
                    "school": "FAST NUCES, Islamabad",
                    "year": "2019-2023"
                }
            ],
            "experiences": [
                {
                    "role": "Full Stack Engineer",
                    "company": "Devsinc",
                    "period": "2023 - Present",
                    "summary": "Architected MERN stack applications with high-concurrency Node.js microservices and dynamic React frontends."
                },
                {
                    "role": "Software Engineer",
                    "company": "Tkxel",
                    "period": "2021 - 2023",
                    "summary": "Implemented secure authentication systems using JWT and managed MongoDB queries."
                }
            ]
        },
        {
            "name": "Bilal Ahmed",
            "email": "bilal.ahmed@example.com",
            "phone": "+92-312-3456789",
            "location": "Rawalpindi, Punjab",
            "sector": "Cloud & DevOps",
            "total_experience": 6.0,
            "skills": ["AWS", "Terraform", "Kubernetes", "Docker", "CI/CD", "Jenkins", "Linux", "Bash", "Git"],
            "education": [
                {
                    "degree": "Bachelor of Science in Computer Engineering",
                    "school": "NUST, Islamabad",
                    "year": "2018-2022"
                }
            ],
            "experiences": [
                {
                    "role": "DevOps Lead",
                    "company": "Contour Software",
                    "period": "2022 - Present",
                    "summary": "Automated cloud infrastructure deployment on AWS using Terraform. Managed container orchestration with Kubernetes and Docker."
                },
                {
                    "role": "Systems Administrator",
                    "company": "Netsol",
                    "period": "2020 - 2022",
                    "summary": "Maintained CI/CD pipelines using Jenkins and shell scripting."
                }
            ]
        },
        {
            "name": "Fatima Malik",
            "email": "fatima.malik@example.com",
            "phone": "+92-345-4567890",
            "location": "Lahore, Punjab",
            "sector": "Data Science",
            "total_experience": 4.0,
            "skills": ["Python", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-Learn", "Data Analysis", "Git"],
            "education": [
                {
                    "degree": "Bachelor of Science in Computer Science",
                    "school": "LUMS, Lahore",
                    "year": "2020-2024"
                }
            ],
            "experiences": [
                {
                    "role": "AI Engineer",
                    "company": "VentureDive",
                    "period": "2024 - Present",
                    "summary": "Developed predictive machine learning models using Scikit-Learn and deep learning classification with TensorFlow."
                },
                {
                    "role": "Data Scientist",
                    "company": "Educative",
                    "period": "2022 - 2024",
                    "summary": "Analysed big datasets using Pandas and NumPy. Designed dashboards and reports."
                }
            ]
        },
        {
            "name": "Usman Sheikh",
            "email": "usman.sheikh@example.com",
            "phone": "+92-301-5678901",
            "location": "Faisalabad, Punjab",
            "sector": "QA & Testing",
            "total_experience": 3.5,
            "skills": ["Selenium", "Cypress", "Python", "Automation Testing", "JIRA", "API Testing", "Postman", "Git"],
            "education": [
                {
                    "degree": "Bachelor of Science in Software Engineering",
                    "school": "University of Faisalabad",
                    "year": "2021-2025"
                }
            ],
            "experiences": [
                {
                    "role": "QA Automation Engineer",
                    "company": "Systems Limited",
                    "period": "2025 - Present",
                    "summary": "Developed automated regression testing suites with Selenium and Cypress. Audited backend APIs using Postman."
                },
                {
                    "role": "Manual Tester",
                    "company": "Tkxel",
                    "period": "2023 - 2025",
                    "summary": "Tracked bugs and created test case reports inside JIRA."
                }
            ]
        },
        {
            "name": "Hamza Mughal",
            "email": "hamza.mughal@example.com",
            "phone": "+92-322-6789012",
            "location": "Sialkot, Punjab",
            "sector": "Data Engineering",
            "total_experience": 5.5,
            "skills": ["SQL", "ETL", "Apache Spark", "Hadoop", "Python", "Data Warehousing", "PostgreSQL", "Linux"],
            "education": [
                {
                    "degree": "Bachelor of Science in Computer Science",
                    "school": "FAST NUCES, Lahore",
                    "year": "2019-2023"
                }
            ],
            "experiences": [
                {
                    "role": "Senior Data Engineer",
                    "company": "Arbisoft",
                    "period": "2023 - Present",
                    "summary": "Designed data ingestion pipeline using Apache Spark and ETL processors. Built data warehouses with PostgreSQL."
                },
                {
                    "role": "Database Developer",
                    "company": "Devsinc",
                    "period": "2021 - 2023",
                    "summary": "Optimized complex SQL queries and maintained database health."
                }
            ]
        },
        {
            "name": "Mariam Shah",
            "email": "mariam.shah@example.com",
            "phone": "+92-334-7890123",
            "location": "Karachi, Sindh",
            "sector": "Web Development",
            "total_experience": 2.5,
            "skills": ["Figma", "HTML", "CSS", "JavaScript", "Adobe XD", "Tailwind CSS", "React.js", "Git"],
            "education": [
                {
                    "degree": "Bachelor of Science in Computer Science",
                    "school": "IBA, Karachi",
                    "year": "2022-2026"
                }
            ],
            "experiences": [
                {
                    "role": "UI/UX Designer & Developer",
                    "company": "Folio3",
                    "period": "2026 - Present",
                    "summary": "Created user experience flows in Figma and translated design systems into semantic HTML/Tailwind CSS."
                },
                {
                    "role": "UI Intern",
                    "company": "10Pearls",
                    "period": "2024 - 2026",
                    "summary": "Built landing pages and animated interactive frontend elements."
                }
            ]
        },
        {
            "name": "Zeeshan Abbasi",
            "email": "zeeshan.abbasi@example.com",
            "phone": "+92-302-8901234",
            "location": "Peshawar, KPK",
            "sector": "Cyber Security",
            "total_experience": 4.0,
            "skills": ["Information Security", "Penetration Testing", "OWASP", "Wireshark", "Linux", "Network Security", "Git"],
            "education": [
                {
                    "degree": "Bachelor of Science in Cybersecurity",
                    "school": "UET Peshawar",
                    "year": "2020-2024"
                }
            ],
            "experiences": [
                {
                    "role": "Cybersecurity Analyst",
                    "company": "Systems Limited",
                    "period": "2024 - Present",
                    "summary": "Identified application security flaws using OWASP checklist. Audited network packets using Wireshark."
                },
                {
                    "role": "Security Intern",
                    "company": "Trg Pakistan",
                    "period": "2022 - 2024",
                    "summary": "Implemented firewall access controls and automated security testing."
                }
            ]
        },
        {
            "name": "Sana Farooq",
            "email": "sana.farooq@example.com",
            "phone": "+92-303-9012345",
            "location": "Islamabad, ICT",
            "sector": "Mobile Development",
            "total_experience": 3.0,
            "skills": ["Flutter", "Dart", "Swift", "Firebase", "Mobile Development", "REST APIs", "Git"],
            "education": [
                {
                    "degree": "Bachelor of Science in Computer Science",
                    "school": "FAST NUCES, Islamabad",
                    "year": "2021-2025"
                }
            ],
            "experiences": [
                {
                    "role": "Mobile App Developer",
                    "company": "Arbisoft",
                    "period": "2025 - Present",
                    "summary": "Developed cross-platform mobile apps using Flutter and integrated Firebase authentication and notifications."
                },
                {
                    "role": "iOS Developer",
                    "company": "Contour Software",
                    "period": "2023 - 2025",
                    "summary": "Programmed iOS native applications using Swift."
                }
            ]
        },
        {
            "name": "Haris Iqbal",
            "email": "haris.iqbal@example.com",
            "phone": "+92-304-0123456",
            "location": "Gujranwala, Punjab",
            "sector": "Software Development",
            "total_experience": 5.0,
            "skills": ["C", "C++", "Embedded Systems", "Arduino", "Raspberry Pi", "Microcontrollers", "Git"],
            "education": [
                {
                    "degree": "Bachelor of Science in Electrical Engineering",
                    "school": "GIKI, Swabi",
                    "year": "2019-2023"
                }
            ],
            "experiences": [
                {
                    "role": "Embedded Systems Engineer",
                    "company": "Systems Limited",
                    "period": "2023 - Present",
                    "summary": "Programmed firmware in C and C++ for microcontrollers and Raspberry Pi systems."
                },
                {
                    "role": "Firmware Intern",
                    "company": "Netsol",
                    "period": "2021 - 2023",
                    "summary": "Assisted in testing circuit designs and writing unit firmware."
                }
            ]
        },
        {
            "name": "Sadia Parveen",
            "email": "sadia.parveen@example.com",
            "phone": "+92-305-1234567",
            "location": "Hyderabad, Sindh",
            "sector": "Web Development",
            "total_experience": 3.5,
            "skills": ["PHP", "Laravel", "MySQL", "HTML", "CSS", "JavaScript", "REST APIs", "Git"],
            "education": [
                {
                    "degree": "Bachelor of Science in Computer Science",
                    "school": "Mehran UET, Jamshoro",
                    "year": "2021-2025"
                }
            ],
            "experiences": [
                {
                    "role": "PHP Laravel Developer",
                    "company": "Folio3",
                    "period": "2025 - Present",
                    "summary": "Maintained backends and designed relational database schemas in MySQL using Laravel MVC framework."
                },
                {
                    "role": "Web Intern",
                    "company": "10Pearls",
                    "period": "2023 - 2025",
                    "summary": "Supported testing and development of PHP backend modules."
                }
            ]
        },
        {
            "name": "Omer Bukhari",
            "email": "omer.bukhari@example.com",
            "phone": "+92-306-2345678",
            "location": "Multan, Punjab",
            "sector": "Software Development",
            "total_experience": 4.5,
            "skills": ["Linux", "Shell Scripting", "Ansible", "Network Administration", "Git", "Docker"],
            "education": [
                {
                    "degree": "Bachelor of Science in Information Technology",
                    "school": "Bahauddin Zakariya University",
                    "year": "2020-2024"
                }
            ],
            "experiences": [
                {
                    "role": "Systems Engineer",
                    "company": "Tkxel",
                    "period": "2024 - Present",
                    "summary": "Managed server deployment on Linux systems and configured configuration templates using Ansible."
                },
                {
                    "role": "Network Intern",
                    "company": "Devsinc",
                    "period": "2022 - 2024",
                    "summary": "Monitored local office network routers and handled support issues."
                }
            ]
        },
        {
            "name": "Mahnoor Rizvi",
            "email": "mahnoor.rizvi@example.com",
            "phone": "+92-307-3456789",
            "location": "Lahore, Punjab",
            "sector": "Management",
            "total_experience": 6.5,
            "skills": ["Project Management", "Agile", "Scrum", "JIRA", "Product Strategy", "Leadership"],
            "education": [
                {
                    "degree": "Bachelor of Science in Management Science",
                    "school": "LUMS, Lahore",
                    "year": "2018-2022"
                }
            ],
            "experiences": [
                {
                    "role": "Product Manager",
                    "company": "Systems Limited",
                    "period": "2022 - Present",
                    "summary": "Defined product features and managed agile team sprints. Ran product reviews and stakeholder alignment."
                },
                {
                    "role": "Project Coordinator",
                    "company": "Arbisoft",
                    "period": "2020 - 2022",
                    "summary": "Handled project task tracking and coordinated customer reviews."
                }
            ]
        },
        {
            "name": "Hassan Qureshi",
            "email": "hassan.qureshi@example.com",
            "phone": "+92-308-4567890",
            "location": "Rawalpindi, Punjab",
            "sector": "Web Development",
            "total_experience": 3.0,
            "skills": ["Node.js", "Express.js", "REST APIs", "MongoDB", "Redis", "Git", "Docker"],
            "education": [
                {
                    "degree": "Bachelor of Science in Software Engineering",
                    "school": "COMSATS Islamabad",
                    "year": "2021-2025"
                }
            ],
            "experiences": [
                {
                    "role": "Node.js Developer",
                    "company": "Tkxel",
                    "period": "2025 - Present",
                    "summary": "Developed highly responsive backend servers using Express.js. Implemented database caching with Redis."
                },
                {
                    "role": "Backend Intern",
                    "company": "Devsinc",
                    "period": "2023 - 2025",
                    "summary": "Wrote API integrations and maintained unit tests."
                }
            ]
        }
    ]
    
    for account in MOCK_ACCOUNTS:
        # 1. Upsert into users_collection
        await users_collection.update_one(
            {"email": account["email"], "role": "candidate"},
            {"$set": {
                "email": account["email"],
                "password_hash": hashed_password,
                "role": "candidate",
                "status": "onboarded",
                "name": account["name"],
                "created_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        
        # 2. Upsert into candidate_profiles_collection
        profile_doc = {
            "name": account["name"],
            "email": account["email"],
            "phone": account["phone"],
            "location": account["location"],
            "title": account["experiences"][0]["role"] if account["experiences"] else "Software Engineer",
            "experience": account["total_experience"],
            "score": random.randint(70, 95),
            "skillMatch": random.randint(70, 95),
            "expMatch": random.randint(70, 100),
            "domain": account["sector"],
            "status": "new",
            "skills": account["skills"],
            "education": account["education"],
            "experiences": account["experiences"],
            "appliedFor": account["experiences"][0]["role"] if account["experiences"] else "Software Engineer",
            "avatar": f"https://api.dicebear.com/9.x/notionists/svg?seed={account['email'].split('@')[0]}",
            "appliedDate": f"2026-05-{random.randint(1, 28):02d}",
            "visibility": "public",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await candidate_profiles_collection.update_one(
            {"email": account["email"]},
            {"$set": profile_doc},
            upsert=True
        )
        
    print("Successfully seeded 15 mock candidate accounts and profiles!")
