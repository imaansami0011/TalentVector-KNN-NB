import os
import json
import re
import random
from datetime import datetime, timezone
from bson import ObjectId
import pdfplumber
from docx import Document
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

    status = "new"
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
        "recruiter_statuses": {},
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

def extract_text_from_local_file(filepath: str) -> str:
    filename = filepath.lower()
    text = ""
    try:
        if filename.endswith('.pdf'):
            with pdfplumber.open(filepath) as pdf:
                text = "\n".join([page.extract_text() or "" for page in pdf.pages])
        elif filename.endswith('.docx'):
            doc = Document(filepath)
            text = "\n".join([p.text for p in doc.paragraphs])
        else:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
    except Exception as e:
        print(f"Error extracting text from {filepath}: {e}")
    return text.strip()

async def seed_candidates_if_empty():
    count = await candidate_profiles_collection.count_documents({"visibility": "public"})
    print(f"Current public candidate count in DB: {count}")
    if count > 0:
        print("Candidates collection already seeded. Skipping.")
        return
        
    await seed_15_mock_candidate_accounts()

    print("Seeding candidates collection by parsing local CVs...")
    
    cv_dir = "A:\\DESKTOP\\CV DATA FOR TESTING"
    if not os.path.exists(cv_dir):
        print(f"Local CV directory {cv_dir} does not exist. Seeding skipped.")
        return

    import shutil
    import uuid
    from .models.classifier import predict_sector_nb

    # Locate files in the root folder of A:\DESKTOP\CV DATA FOR TESTING
    root_files = []
    for f in os.listdir(cv_dir):
        full_path = os.path.join(cv_dir, f)
        if os.path.isfile(full_path):
            name_lower = f.lower()
            # Skip job descriptions or JDs
            if "job description" in name_lower or "job title" in name_lower or "jd " in name_lower:
                continue
            if name_lower.endswith('.pdf') or name_lower.endswith('.docx'):
                root_files.append(full_path)

    print(f"Found {len(root_files)} CV files at the root of {cv_dir}")

    # Now let's search for docx files in Generated_DOCX grouped by domain directory
    sub_dir = os.path.join(cv_dir, "Generated_DOCX")
    sampled_sub_files = []
    if os.path.exists(sub_dir):
        for domain_folder in os.listdir(sub_dir):
            domain_path = os.path.join(sub_dir, domain_folder)
            if os.path.isdir(domain_path):
                domain_files = [
                    os.path.join(domain_path, f)
                    for f in os.listdir(domain_path)
                    if f.lower().endswith('.docx')
                ]
                if domain_files:
                    # Seed exactly 1-2 files per domain
                    take_count = min(len(domain_files), 2)
                    sampled_sub_files.extend(random.sample(domain_files, take_count))
                    
    print(f"Sampled {len(sampled_sub_files)} CV files from Generated_DOCX (representing all domains)")

    all_cv_files = root_files + sampled_sub_files
    print(f"Total files selected for parsing and seeding: {len(all_cv_files)}")

    candidates_to_insert = []
    os.makedirs(os.path.join("data", "cvs"), exist_ok=True)

    for filepath in all_cv_files:
        try:
            filename = os.path.basename(filepath)
            print(f"Parsing: {filename}")
            
            # Extract text
            text = extract_text_from_local_file(filepath)
            if not text:
                print(f"  ! Skipped empty text file: {filename}")
                continue

            # Copy file to data/cvs project folder so it can be served
            dest_folder = os.path.join("data", "cvs", str(uuid.uuid4()))
            os.makedirs(dest_folder, exist_ok=True)
            dest_filepath = os.path.join(dest_folder, filename)
            shutil.copy2(filepath, dest_filepath)
            
            # Standardize path for frontend
            cv_web_path = dest_filepath.replace("\\", "/")

            # Extract entities
            entities = extract_entities(text)
            
            # Naive Bayes classification
            nb_res = predict_sector_nb(text)
            sector = nb_res["mapped_sector"]
            raw_category = nb_res["raw_category"]

            name = entities.get("Name")
            if not name or name == "Unknown Name" or name == "Unknown":
                name = os.path.splitext(filename)[0]
                if " Email " in name:
                    name = name.split(" Email ")[0]
                name = name.strip()

            email = entities.get("Email")
            if not email or email == "Not Found":
                email_slug = re.sub(r'[^a-zA-Z0-9]', '.', name.lower())
                email = f"{email_slug}@example.com"

            phone = entities.get("Phone")
            if not phone or phone == "Not Found":
                phone = f"+92-{random.randint(300, 349)}-{random.randint(1000000, 9999999)}"

            exp_val = entities.get("Years_of_Experience", 0)
            if not exp_val or exp_val == 0:
                exp_val = random.randint(1, 5)

            skills = entities.get("Skills", [])
            if not skills:
                skills = ["Software Engineering", "Management", "Communication"]

            title = entities.get("Designation")
            if not title or title == "Not Found":
                title = raw_category or "Professional Candidate"

            # Create mock experiences and education based on parsed data
            experiences = [{
                "role": title,
                "company": "Previous Company",
                "period": f"2023 - Present",
                "summary": "Worked on key projects and software development matching the skillsets."
            }]
            education = [{
                "degree": "Bachelor of Science",
                "school": "University of Lahore",
                "year": "2018-2022"
            }]

            avatar = f"https://api.dicebear.com/9.x/notionists/svg?seed={re.sub(r'[^a-zA-Z0-9]', '', name)}"
            appliedDate = f"2026-05-{random.randint(1, 28):02d}"

            candidate_doc = {
                "name": name,
                "email": email,
                "phone": phone,
                "location": "Lahore, Pakistan",
                "title": title,
                "experience": exp_val,
                "score": 75,
                "skillMatch": 75,
                "expMatch": 75,
                "domain": sector,
                "status": "new",
                "recruiter_statuses": {},
                "skills": skills,
                "education": education,
                "experiences": experiences,
                "appliedFor": title,
                "avatar": avatar,
                "appliedDate": appliedDate,
                "visibility": "public",
                "original_cv_path": cv_web_path,
                "raw_category": raw_category,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            candidates_to_insert.append(candidate_doc)
            
        except Exception as e:
            print(f"Error parsing local CV {filepath}: {e}")

    if candidates_to_insert:
        result = await candidate_profiles_collection.insert_many(candidates_to_insert)
        print(f"Successfully seeded {len(result.inserted_ids)} candidates from local directory into MongoDB!")
    else:
        print("No candidates found or parsed from local directory.")

async def seed_15_mock_candidate_accounts():
    from .database import users_collection, candidate_profiles_collection
    from passlib.context import CryptContext
    
    # Check if the latest batch of mock accounts (including Lahore MERN candidates) is already seeded
    existing = await users_collection.find_one({"email": "usman.butt@example.com"})
    if existing:
        print("Mock candidate accounts already seeded (latest batch present). Skipping.")
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
            "name": "Shahzaib Raza",
            "email": "shahzaib.raza@example.com",
            "phone": "+92-311-5647382",
            "location": "Lahore, Punjab",
            "sector": "Web Development",
            "total_experience": 3.5,
            "skills": ["React.js", "Node.js", "MongoDB", "Express.js", "JavaScript", "TypeScript", "REST APIs", "JWT", "Redux", "Git", "Docker", "HTML", "CSS"],
            "education": [
                {
                    "degree": "Bachelor of Science in Computer Science",
                    "school": "FAST NUCES, Lahore",
                    "year": "2021-2025"
                }
            ],
            "experiences": [
                {
                    "role": "Full Stack MERN Developer",
                    "company": "Arbisoft",
                    "period": "2025 - Present",
                    "summary": "Developed end-to-end web applications using the MERN stack. Implemented REST APIs with Node.js/Express.js and built dynamic React.js frontends with Redux state management. Containerized services using Docker."
                },
                {
                    "role": "Junior MERN Developer",
                    "company": "Devsinc",
                    "period": "2023 - 2025",
                    "summary": "Built scalable Node.js backend APIs and integrated MongoDB for data persistence. Collaborated on React component libraries and implemented JWT-based authentication."
                }
            ]
        },
        {
            "name": "Nida Chaudhry",
            "email": "nida.chaudhry@example.com",
            "phone": "+92-315-8291047",
            "location": "Lahore, Punjab",
            "sector": "Web Development",
            "total_experience": 4.0,
            "skills": ["React.js", "Node.js", "MongoDB", "Express.js", "Next.js", "TypeScript", "GraphQL", "REST APIs", "Tailwind CSS", "Git", "AWS S3", "Socket.io"],
            "education": [
                {
                    "degree": "Bachelor of Science in Software Engineering",
                    "school": "UET Lahore",
                    "year": "2020-2024"
                }
            ],
            "experiences": [
                {
                    "role": "Senior MERN Stack Engineer",
                    "company": "10Pearls",
                    "period": "2024 - Present",
                    "summary": "Architected real-time web platforms using Socket.io and MERN stack. Led frontend development with Next.js and React.js, integrated GraphQL APIs, and deployed file storage pipelines on AWS S3."
                },
                {
                    "role": "Full Stack Developer",
                    "company": "Folio3",
                    "period": "2022 - 2024",
                    "summary": "Developed full-stack features across SaaS platforms using React.js and Express.js. Managed MongoDB schema design and built reusable UI components with Tailwind CSS."
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
        },

        # ── Finance & Accounting ─────────────────────────────────────────────
        {
            "name": "Kamran Mirza",
            "email": "kamran.mirza@example.com",
            "phone": "+92-321-4056789",
            "location": "Karachi, Sindh",
            "sector": "Finance & Accounting",
            "total_experience": 6.0,
            "skills": ["Financial Reporting", "IFRS", "GAAP", "SAP FICO", "Auditing", "Taxation", "Budgeting", "Forecasting", "Accounts Payable", "ACCA"],
            "education": [
                {
                    "degree": "ACCA (Association of Chartered Certified Accountants)",
                    "school": "ACCA Pakistan",
                    "year": "2018-2022"
                }
            ],
            "experiences": [
                {
                    "role": "Senior Financial Analyst",
                    "company": "EY Pakistan",
                    "period": "2022 - Present",
                    "summary": "Prepared consolidated financial statements under IFRS. Led external audit engagements across manufacturing and banking sectors. Managed taxation and compliance advisory for corporate clients."
                },
                {
                    "role": "Audit Associate",
                    "company": "KPMG Pakistan",
                    "period": "2020 - 2022",
                    "summary": "Conducted risk-based audits and prepared management letters. Assisted in financial due diligence for M&A transactions."
                }
            ]
        },
        {
            "name": "Rabia Mirza",
            "email": "rabia.mirza@example.com",
            "phone": "+92-303-7821034",
            "location": "Lahore, Punjab",
            "sector": "Finance & Accounting",
            "total_experience": 4.0,
            "skills": ["Cost Accounting", "QuickBooks", "Budgeting", "Financial Analysis", "Investment Analysis", "Treasury", "CPA", "MS Excel", "Power BI", "Accounts Receivable"],
            "education": [
                {
                    "degree": "Bachelor of Commerce (B.Com Honors)",
                    "school": "Hailey College of Commerce, PU Lahore",
                    "year": "2019-2023"
                }
            ],
            "experiences": [
                {
                    "role": "Finance Manager",
                    "company": "Engro Corporation",
                    "period": "2023 - Present",
                    "summary": "Oversaw monthly cost accounting cycles, prepared variance analysis reports, and maintained treasury positions. Developed Power BI dashboards for executive financial reporting."
                },
                {
                    "role": "Accounts Executive",
                    "company": "Packages Limited",
                    "period": "2021 - 2023",
                    "summary": "Managed accounts receivable, reconciled bank statements, and assisted in annual budget preparation."
                }
            ]
        },

        # ── Marketing & Digital Media ─────────────────────────────────────────
        {
            "name": "Areeba Hassan",
            "email": "areeba.hassan@example.com",
            "phone": "+92-333-9012547",
            "location": "Lahore, Punjab",
            "sector": "Marketing & Digital Media",
            "total_experience": 4.5,
            "skills": ["SEO", "SEM", "Google Ads", "Facebook Ads", "Content Marketing", "HubSpot", "Google Analytics", "Brand Strategy", "Copywriting", "Email Marketing"],
            "education": [
                {
                    "degree": "Bachelor of Science in Marketing",
                    "school": "LUMS, Lahore",
                    "year": "2019-2023"
                }
            ],
            "experiences": [
                {
                    "role": "Digital Marketing Manager",
                    "company": "Zameen.com",
                    "period": "2023 - Present",
                    "summary": "Led performance marketing campaigns on Google and Meta platforms with monthly budgets exceeding PKR 5M. Improved organic SEO rankings by 40% through structured content strategy."
                },
                {
                    "role": "SEO & Content Specialist",
                    "company": "Markhor",
                    "period": "2021 - 2023",
                    "summary": "Created and optimized long-form content, managed social media calendars, and ran email campaigns using HubSpot."
                }
            ]
        },
        {
            "name": "Talha Siddiqui",
            "email": "talha.siddiqui@example.com",
            "phone": "+92-312-6634501",
            "location": "Karachi, Sindh",
            "sector": "Marketing & Digital Media",
            "total_experience": 3.0,
            "skills": ["Social Media Marketing", "Influencer Marketing", "Market Research", "Campaign Management", "Canva", "Adobe Premiere", "Content Writing", "TikTok Ads", "Instagram Marketing"],
            "education": [
                {
                    "degree": "Bachelor of Business Administration (Marketing)",
                    "school": "IBA Karachi",
                    "year": "2021-2025"
                }
            ],
            "experiences": [
                {
                    "role": "Brand Marketing Executive",
                    "company": "Daraz Pakistan",
                    "period": "2025 - Present",
                    "summary": "Planned and executed influencer campaigns with 200+ creators. Managed TikTok and Instagram paid ad campaigns generating 5M+ impressions monthly."
                },
                {
                    "role": "Social Media Intern",
                    "company": "Jazz Pakistan",
                    "period": "2023 - 2025",
                    "summary": "Created engaging content calendars, monitored analytics, and assisted in campaign briefs for digital channels."
                }
            ]
        },

        # ── Human Resources ───────────────────────────────────────────────────
        {
            "name": "Sumbul Tariq",
            "email": "sumbul.tariq@example.com",
            "phone": "+92-301-2039871",
            "location": "Islamabad, ICT",
            "sector": "Human Resources",
            "total_experience": 5.0,
            "skills": ["Talent Acquisition", "Recruitment", "HRIS", "Performance Management", "Onboarding", "Employee Relations", "Compensation & Benefits", "ATS", "HR Analytics", "Labor Law"],
            "education": [
                {
                    "degree": "Master of Business Administration (HR)",
                    "school": "Quaid-e-Azam University",
                    "year": "2019-2023"
                }
            ],
            "experiences": [
                {
                    "role": "Senior HR Business Partner",
                    "company": "Systems Limited",
                    "period": "2023 - Present",
                    "summary": "Partnered with engineering and product teams to drive talent acquisition. Designed compensation structures and managed performance review cycles for 500+ employees."
                },
                {
                    "role": "HR Executive",
                    "company": "Netsol Technologies",
                    "period": "2021 - 2023",
                    "summary": "Handled end-to-end recruitment for technical roles, maintained HRIS data, and onboarded 60+ new hires annually."
                }
            ]
        },
        {
            "name": "Fahad Mehmood",
            "email": "fahad.mehmood@example.com",
            "phone": "+92-345-7712293",
            "location": "Lahore, Punjab",
            "sector": "Human Resources",
            "total_experience": 3.5,
            "skills": ["Recruitment", "Talent Acquisition", "HR Business Partner", "Training & Development", "Succession Planning", "Payroll", "Zoho People", "SAP HR", "Organizational Development"],
            "education": [
                {
                    "degree": "Bachelor of Business Administration (HRM)",
                    "school": "University of Central Punjab",
                    "year": "2020-2024"
                }
            ],
            "experiences": [
                {
                    "role": "HR Manager",
                    "company": "TCS Pakistan",
                    "period": "2024 - Present",
                    "summary": "Managed full-cycle recruitment for corporate and operations roles. Designed training programs and quarterly succession reviews. Processed monthly payroll for 250+ staff."
                },
                {
                    "role": "HR Officer",
                    "company": "Servis Industries",
                    "period": "2022 - 2024",
                    "summary": "Coordinated hiring drives, maintained employee records, and delivered induction training."
                }
            ]
        },

        # ── Healthcare & Medicine ─────────────────────────────────────────────
        {
            "name": "Dr. Sara Baig",
            "email": "sara.baig@example.com",
            "phone": "+92-322-5519834",
            "location": "Lahore, Punjab",
            "sector": "Healthcare & Medicine",
            "total_experience": 5.0,
            "skills": ["Clinical Research", "Patient Care", "EMR/EHR", "Medical Writing", "Pharmacology", "ICD-10", "Healthcare Management", "HIPAA", "Public Health", "Telemedicine"],
            "education": [
                {
                    "degree": "MBBS (Bachelor of Medicine and Surgery)",
                    "school": "King Edward Medical University, Lahore",
                    "year": "2017-2023"
                }
            ],
            "experiences": [
                {
                    "role": "Medical Officer",
                    "company": "Mayo Hospital, Lahore",
                    "period": "2023 - Present",
                    "summary": "Managed patient consultations and rounds across internal medicine department. Maintained electronic health records and coordinated with specialist teams for complex cases."
                },
                {
                    "role": "House Officer",
                    "company": "Services Hospital, Lahore",
                    "period": "2022 - 2023",
                    "summary": "Completed rotations in Surgery, Medicine, Paediatrics, and Gynaecology. Assisted in over 300 clinical procedures."
                }
            ]
        },
        {
            "name": "Noman Javed",
            "email": "noman.javed@example.com",
            "phone": "+92-311-8804422",
            "location": "Karachi, Sindh",
            "sector": "Healthcare & Medicine",
            "total_experience": 4.0,
            "skills": ["Medical Coding", "ICD-10", "CPT Coding", "Healthcare Administration", "Medical Billing", "Revenue Cycle Management", "EMR", "HIPAA", "Hospital Information Systems", "Excel"],
            "education": [
                {
                    "degree": "Bachelor of Science in Health Information Management",
                    "school": "Dow University of Health Sciences",
                    "year": "2020-2024"
                }
            ],
            "experiences": [
                {
                    "role": "Medical Billing & Coding Specialist",
                    "company": "Agha Khan University Hospital",
                    "period": "2024 - Present",
                    "summary": "Assigned ICD-10 and CPT codes for outpatient and inpatient encounters. Managed insurance claims, resolved denials, and reduced claims rejection rate by 25%."
                },
                {
                    "role": "Health Records Technician",
                    "company": "National Medical Center",
                    "period": "2022 - 2024",
                    "summary": "Maintained patient health records, managed EHR data entry, and assisted in compliance audits."
                }
            ]
        },

        # ── Legal & Compliance ────────────────────────────────────────────────
        {
            "name": "Zara Qureshi",
            "email": "zara.qureshi@example.com",
            "phone": "+92-302-3347812",
            "location": "Islamabad, ICT",
            "sector": "Legal & Compliance",
            "total_experience": 5.0,
            "skills": ["Corporate Law", "Contract Drafting", "Legal Research", "Compliance", "GDPR", "Company Secretary", "Due Diligence", "Intellectual Property", "Litigation", "Legal Advisory"],
            "education": [
                {
                    "degree": "LLB (Bachelor of Laws)",
                    "school": "International Islamic University, Islamabad",
                    "year": "2019-2023"
                }
            ],
            "experiences": [
                {
                    "role": "Corporate Legal Counsel",
                    "company": "Jazz Pakistan",
                    "period": "2023 - Present",
                    "summary": "Drafted and reviewed commercial contracts, NDAs, and vendor agreements. Advised on regulatory compliance with PTA and SECP. Led GDPR implementation for international partnerships."
                },
                {
                    "role": "Legal Associate",
                    "company": "Orr Dignam & Co. Advocates",
                    "period": "2021 - 2023",
                    "summary": "Conducted legal research, prepared court briefs, and assisted in corporate advisory and M&A due diligence."
                }
            ]
        },
        {
            "name": "Ali Hassan Zaidi",
            "email": "ali.zaidi@example.com",
            "phone": "+92-315-6621044",
            "location": "Karachi, Sindh",
            "sector": "Legal & Compliance",
            "total_experience": 4.0,
            "skills": ["Anti-Money Laundering", "Risk & Compliance", "Regulatory Affairs", "Labour Law", "Contract Review", "SECP Regulations", "KYC", "AML", "Internal Audit", "Policy Development"],
            "education": [
                {
                    "degree": "LLB (Bachelor of Laws)",
                    "school": "University of Karachi",
                    "year": "2020-2024"
                }
            ],
            "experiences": [
                {
                    "role": "Compliance Officer",
                    "company": "HBL (Habib Bank Limited)",
                    "period": "2024 - Present",
                    "summary": "Monitored AML/CFT compliance for corporate banking division. Conducted KYC reviews, prepared regulatory reports for SBP, and trained branch staff on compliance protocols."
                },
                {
                    "role": "Legal Intern",
                    "company": "Engro Corporation",
                    "period": "2022 - 2024",
                    "summary": "Reviewed internal policies, drafted employment contracts, and supported legal team in regulatory filings."
                }
            ]
        },

        # ── Sales & Business Development ──────────────────────────────────────
        {
            "name": "Iqra Shafqat",
            "email": "iqra.shafqat@example.com",
            "phone": "+92-300-9981127",
            "location": "Lahore, Punjab",
            "sector": "Sales & Business Development",
            "total_experience": 4.0,
            "skills": ["B2B Sales", "Business Development", "Salesforce CRM", "Account Management", "Lead Generation", "Negotiation", "Sales Strategy", "Market Expansion", "Pipeline Management", "Client Relationship"],
            "education": [
                {
                    "degree": "Bachelor of Business Administration (Marketing & Sales)",
                    "school": "FAST NUCES, Lahore",
                    "year": "2020-2024"
                }
            ],
            "experiences": [
                {
                    "role": "Senior Business Development Executive",
                    "company": "Zones Pakistan",
                    "period": "2024 - Present",
                    "summary": "Developed and closed enterprise IT procurement deals worth PKR 50M+. Managed key accounts including banks and telecom operators. Consistently exceeded quarterly revenue targets by 120%."
                },
                {
                    "role": "Sales Executive",
                    "company": "Inbox Business Technologies",
                    "period": "2022 - 2024",
                    "summary": "Generated B2B leads, delivered product demos, and managed SME client relationships across Punjab region."
                }
            ]
        },
        {
            "name": "Osama Nawaz",
            "email": "osama.nawaz@example.com",
            "phone": "+92-333-1236540",
            "location": "Karachi, Sindh",
            "sector": "Sales & Business Development",
            "total_experience": 3.0,
            "skills": ["B2C Sales", "CRM", "Cold Calling", "Revenue Growth", "Lead Generation", "Product Demonstrations", "Retail Sales", "Customer Acquisition", "Territory Management", "MS Excel"],
            "education": [
                {
                    "degree": "Bachelor of Commerce",
                    "school": "University of Karachi",
                    "year": "2021-2025"
                }
            ],
            "experiences": [
                {
                    "role": "Territory Sales Manager",
                    "company": "Unilever Pakistan",
                    "period": "2025 - Present",
                    "summary": "Managed distribution network across 3 territories in Karachi with 200+ retail outlets. Achieved 110% target attainment in first quarter. Analysed sales data and adjusted territory routing."
                },
                {
                    "role": "Sales Officer",
                    "company": "P&G Pakistan",
                    "period": "2023 - 2025",
                    "summary": "Drove product availability and visibility in modern and general trade. Handled distributor coordination and monthly stock replenishment."
                }
            ]
        },

        # ── Supply Chain & Logistics ──────────────────────────────────────────
        {
            "name": "Adeel Ansari",
            "email": "adeel.ansari@example.com",
            "phone": "+92-321-7732091",
            "location": "Karachi, Sindh",
            "sector": "Supply Chain & Logistics",
            "total_experience": 6.0,
            "skills": ["Supply Chain Management", "Procurement", "SAP MM", "Vendor Management", "Demand Planning", "Inventory Management", "ERP", "Import/Export", "Six Sigma", "Logistics"],
            "education": [
                {
                    "degree": "Bachelor of Engineering in Industrial Engineering",
                    "school": "NED University, Karachi",
                    "year": "2018-2022"
                }
            ],
            "experiences": [
                {
                    "role": "Supply Chain Manager",
                    "company": "Nestlé Pakistan",
                    "period": "2022 - Present",
                    "summary": "Managed end-to-end supply chain for the dairy & beverages category. Led procurement negotiations saving 8% in annual COGS. Implemented SAP MM module for vendor onboarding."
                },
                {
                    "role": "Supply Chain Analyst",
                    "company": "Engro Polymer",
                    "period": "2020 - 2022",
                    "summary": "Analysed demand data, optimised inventory levels, and co-ordinated import shipments with freight forwarders."
                }
            ]
        },
        {
            "name": "Maryam Lodhi",
            "email": "maryam.lodhi@example.com",
            "phone": "+92-311-4420819",
            "location": "Lahore, Punjab",
            "sector": "Supply Chain & Logistics",
            "total_experience": 3.5,
            "skills": ["Logistics", "Warehouse Management", "Last-Mile Delivery", "3PL Management", "Distribution", "Freight", "Fleet Management", "MS Excel", "TMS", "Procurement"],
            "education": [
                {
                    "degree": "Bachelor of Business Administration (Supply Chain)",
                    "school": "COMSATS University, Lahore",
                    "year": "2020-2024"
                }
            ],
            "experiences": [
                {
                    "role": "Logistics Operations Executive",
                    "company": "TCS Pakistan",
                    "period": "2024 - Present",
                    "summary": "Oversaw last-mile delivery operations for central Punjab region with 5,000+ daily shipments. Negotiated 3PL contracts and reduced delivery costs by 12% through route optimisation."
                },
                {
                    "role": "Warehouse Supervisor",
                    "company": "Daraz Pakistan",
                    "period": "2022 - 2024",
                    "summary": "Managed inbound/outbound operations in 80,000 sq ft fulfilment centre. Maintained inventory accuracy above 99%."
                }
            ]
        },

        # ── Education & Training ──────────────────────────────────────────────
        {
            "name": "Huma Ashraf",
            "email": "huma.ashraf@example.com",
            "phone": "+92-303-5510987",
            "location": "Islamabad, ICT",
            "sector": "Education & Training",
            "total_experience": 7.0,
            "skills": ["Curriculum Development", "Instructional Design", "eLearning", "LMS", "Moodle", "Articulate 360", "Corporate Training", "Assessment Design", "Coaching", "Bloom's Taxonomy"],
            "education": [
                {
                    "degree": "Master of Education (M.Ed)",
                    "school": "Allama Iqbal Open University",
                    "year": "2017-2021"
                }
            ],
            "experiences": [
                {
                    "role": "Head of Learning & Development",
                    "company": "British Council Pakistan",
                    "period": "2021 - Present",
                    "summary": "Designed and deployed blended learning programs for 1,000+ learners across Pakistan. Built eLearning modules on Articulate 360, managed LMS on Moodle, and trained 40+ facilitators."
                },
                {
                    "role": "Senior Instructional Designer",
                    "company": "Sabaq Foundation",
                    "period": "2019 - 2021",
                    "summary": "Developed K-12 curriculum content and video lecture scripts aligned with Pakistani national curriculum."
                }
            ]
        },
        {
            "name": "Tariq Rehman",
            "email": "tariq.rehman@example.com",
            "phone": "+92-345-2219043",
            "location": "Lahore, Punjab",
            "sector": "Education & Training",
            "total_experience": 5.0,
            "skills": ["Academic Teaching", "Research", "Pedagogy", "TEFL", "Academic Writing", "Curriculum Design", "Mentoring", "Student Assessment", "EdTech", "Public Speaking"],
            "education": [
                {
                    "degree": "Master of Arts in English Literature",
                    "school": "Government College University, Lahore",
                    "year": "2018-2022"
                }
            ],
            "experiences": [
                {
                    "role": "Assistant Professor",
                    "company": "University of Central Punjab",
                    "period": "2022 - Present",
                    "summary": "Taught undergraduate courses in English Language and Communication Skills. Supervised thesis projects and published two peer-reviewed research papers in linguistics."
                },
                {
                    "role": "English Language Trainer",
                    "company": "Beaconhouse School System",
                    "period": "2020 - 2022",
                    "summary": "Delivered TEFL-certified English language instruction to secondary level students and prepared students for O/A Level Cambridge exams."
                }
            ]
        },

        # ── Architecture & Design ─────────────────────────────────────────────
        {
            "name": "Layla Amin",
            "email": "layla.amin@example.com",
            "phone": "+92-311-8803471",
            "location": "Lahore, Punjab",
            "sector": "Architecture & Design",
            "total_experience": 4.0,
            "skills": ["AutoCAD", "Revit", "SketchUp", "3D Rendering", "Building Design", "Interior Design", "Space Planning", "BIM", "Adobe Photoshop", "InDesign"],
            "education": [
                {
                    "degree": "Bachelor of Architecture (B.Arch)",
                    "school": "University of Engineering & Technology, Lahore",
                    "year": "2019-2024"
                }
            ],
            "experiences": [
                {
                    "role": "Architect",
                    "company": "NESPAK",
                    "period": "2024 - Present",
                    "summary": "Designed residential and commercial building blueprints using Revit and AutoCAD. Produced 3D rendered walkthroughs for client presentations. Reviewed contractor shop drawings for compliance."
                },
                {
                    "role": "Junior Architect",
                    "company": "Creative Unit Architecture",
                    "period": "2022 - 2024",
                    "summary": "Drafted architectural layouts for mixed-use developments and prepared construction documentation packages."
                }
            ]
        },
        {
            "name": "Bilal Zafar",
            "email": "bilal.zafar@example.com",
            "phone": "+92-322-4413659",
            "location": "Karachi, Sindh",
            "sector": "Architecture & Design",
            "total_experience": 3.0,
            "skills": ["UI/UX Design", "Figma", "Adobe Illustrator", "Adobe Photoshop", "Visual Design", "Branding", "Typography", "Wireframing", "Prototyping", "User Research"],
            "education": [
                {
                    "degree": "Bachelor of Design (Visual Communication)",
                    "school": "Indus Valley School of Art & Architecture",
                    "year": "2021-2025"
                }
            ],
            "experiences": [
                {
                    "role": "UI/UX Designer",
                    "company": "Foodpanda Pakistan",
                    "period": "2025 - Present",
                    "summary": "Designed mobile app and web experiences for consumer-facing features. Conducted user research, built wireframes in Figma, and collaborated closely with engineering on design system components."
                },
                {
                    "role": "Graphic Design Intern",
                    "company": "Leo Burnett Pakistan",
                    "period": "2023 - 2025",
                    "summary": "Created brand identity assets, advertising layouts, and social media creatives for FMCG clients."
                }
            ]
        },

        # ── Media & Journalism ────────────────────────────────────────────────
        {
            "name": "Shazia Naeem",
            "email": "shazia.naeem@example.com",
            "phone": "+92-333-6601287",
            "location": "Islamabad, ICT",
            "sector": "Media & Journalism",
            "total_experience": 6.0,
            "skills": ["Journalism", "News Writing", "Investigative Journalism", "Editing", "Proofreading", "Broadcast Media", "Reporting", "Publishing", "Content Writing", "Social Media"],
            "education": [
                {
                    "degree": "Bachelor of Science in Mass Communication",
                    "school": "Quaid-e-Azam University",
                    "year": "2018-2022"
                }
            ],
            "experiences": [
                {
                    "role": "Senior Correspondent",
                    "company": "Dawn News",
                    "period": "2022 - Present",
                    "summary": "Covered political and economic beat for one of Pakistan's leading English newspapers. Broke investigative stories on public sector governance. Managed a team of two junior reporters."
                },
                {
                    "role": "Staff Reporter",
                    "company": "The News International",
                    "period": "2020 - 2022",
                    "summary": "Filed daily news stories, conducted interviews with government officials, and contributed to weekend magazine supplements."
                }
            ]
        },
        {
            "name": "Usman Butt",
            "email": "usman.butt@example.com",
            "phone": "+92-305-2278104",
            "location": "Lahore, Punjab",
            "sector": "Media & Journalism",
            "total_experience": 3.5,
            "skills": ["Video Production", "Adobe Premiere Pro", "Final Cut Pro", "Scriptwriting", "Videography", "Photography", "Podcasting", "YouTube Content", "Social Media", "Storytelling"],
            "education": [
                {
                    "degree": "Bachelor of Arts in Media Studies",
                    "school": "Beaconhouse National University, Lahore",
                    "year": "2021-2025"
                }
            ],
            "experiences": [
                {
                    "role": "Video Content Producer",
                    "company": "Geo News",
                    "period": "2025 - Present",
                    "summary": "Produced and edited short-form and long-form video content for digital platforms. Managed YouTube channel growing it from 50K to 200K subscribers through data-driven content strategy."
                },
                {
                    "role": "Multimedia Journalist",
                    "company": "Samaa TV",
                    "period": "2023 - 2025",
                    "summary": "Shot, scripted, and edited feature stories and news packages for on-air and digital broadcast."
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
            "recruiter_statuses": {},
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
