import os
import json
import re
import random
from datetime import datetime
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
    count = await candidate_profiles_collection.count_documents({"visibility": "public"})
    print(f"Current public candidate count in DB: {count}")
    if count > 0:
        print("Candidates collection already seeded. Skipping.")
        return

    json_path = os.path.join(os.getcwd(), "Entity Recognition in Resumes.json")
    if not os.path.exists(json_path):
        print(f"Dataset path not found at {json_path}. Cannot seed database.")
        return

    print("Seeding candidates collection from Entity Recognition in Resumes.json...")
    candidates_to_insert = []
    emails_seen = set()
    
    with open(json_path, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f):
            if len(candidates_to_insert) >= 30:
                break
            cand = parse_resume_json_line(line)
            if cand and cand["email"] not in emails_seen:
                candidates_to_insert.append(cand)
                emails_seen.add(cand["email"])
                
    if candidates_to_insert:
        result = await candidate_profiles_collection.insert_many(candidates_to_insert)
        print(f"Successfully seeded {len(result.inserted_ids)} candidates into MongoDB!")
    else:
        print("No candidates parsed successfully to seed.")
