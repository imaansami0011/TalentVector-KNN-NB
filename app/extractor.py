
import re
from datetime import datetime
import spacy
import json
import os
from spacy.matcher import PhraseMatcher

from .constants import NAME_BLOCKLIST, SYNONYMS, DOMAIN_MAP, COMMON_TITLES, SKILLS_CATEGORIES_TO_DOMAINS

# Skills dictionary will be loaded during the request or once at startup
SKILLS_FILE = os.path.join(os.path.dirname(__file__), "skills.json")
skills_data = {}
if os.path.exists(SKILLS_FILE):
    with open(SKILLS_FILE, "r") as f:
        skills_data = json.load(f)

def levenshtein(s1, s2):
    if len(s1) < len(s2):
        return levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    
    return previous_row[-1]

def manual_extract_categorized_skills(text):
    """
    Manual Extraction Engine: Scans text using word-boundary Regex and Levenshtein fuzzy matching.
    Replaces spaCy PhraseMatcher for extreme speed and control.
    """
    categorized = {}
    all_skills = set()
    clean_text = text.lower()
    
    # Extract unique alphanumeric/punctuation words to run fuzzy distance checks on
    tokens = list(set(re.findall(r'\b[a-zA-Z0-9#+.-]+\b', clean_text)))
    
    for category, skills in skills_data.items():
        for skill in skills:
            skill_lower = skill.lower()
            matched = False
            
            # 1. Fast Path: Word-boundary exact match
            pattern = rf'\b{re.escape(skill_lower)}\b'
            if re.search(pattern, clean_text):
                matched = True
            else:
                # 2. Fuzzy Path: Evaluate token edit distance or suffix variations
                len_s = len(skill_lower)
                if len_s >= 3: # Ignore short terms to prevent high false-positive rates
                    clean_skill = skill_lower.replace(".", "").replace("-", "").replace(" ", "")
                    for token in tokens:
                        clean_token = token.replace(".", "").replace("-", "").replace(" ", "")
                        
                        # Check direct punctuation-insensitive or JS suffix match (e.g. reactjs -> react)
                        if clean_token == clean_skill or clean_token == clean_skill + "js" or clean_skill == clean_token + "js":
                            matched = True
                            break
                        
                        # Apply Levenshtein distance check with first-character alignment constraint
                        if token[0] == skill_lower[0]:
                            if abs(len(token) - len_s) > 2:
                                continue
                            max_distance = 1 if len_s < 8 else 2
                            if levenshtein(token, skill_lower) <= max_distance:
                                matched = True
                                break
            
            if matched:
                if category not in categorized:
                    categorized[category] = set()
                categorized[category].add(skill.title())
                all_skills.add(skill.title())
                
    return categorized, all_skills

def clean_text(text):
    """
    Strips HTML tags, removes URLs, handles synonyms (case-insensitive), and standardizes whitespace.
    """
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    
    # Apply synonyms with case-insensitivity
    for pattern, replacement in SYNONYMS.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_name(text):
    # Split into lines and remove empty ones
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    for line in lines[:5]:
        # Skip if the line contains a blocklisted word or a number
        if any(word in line.lower() for word in NAME_BLOCKLIST) or any(char.isdigit() for char in line):
            continue
        
        # If it's 2-3 words, it's likely the name
        if 1 <= len(line.split()) <= 3:
            return line
            
    return "Unknown Name"

def calculate_experience_robust(text, is_jd=False):
    # 1. Direct Mention Regex (Highest priority for JDs)
    # Handles: "3+ years", "Minimum 5 years", "5 yrs of exp"
    direct_pattern = r'(?:minimum|at least|required|total|of)?\s*(\d+)(\+?)\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)?'
    
    if is_jd:
        match = re.search(direct_pattern, text, re.IGNORECASE)
        if match:
            years = int(match.group(1))
            is_plus = match.group(2) == "+" or "minimum" in text.lower() or "at least" in text.lower()
            return years, is_plus
        return 0, False

    # 2. Work History Date Ranges (Best for Resumes)
    date_range_pattern = r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?[a-z]*[\s./]*\d{4})\s*[\-–—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?[a-z]*[\s./]*\d{4}|Present|Current|Now)'
    
    total_months = 0
    current_year = datetime.now().year

    matches = re.findall(date_range_pattern, text, re.IGNORECASE)
    
    if matches:
        for start_str, end_str in matches:
            start_year_match = re.search(r'\d{4}', start_str)
            if not start_year_match: continue
            start_year = int(start_year_match.group())

            if any(word in end_str.lower() for word in ['present', 'current', 'now']):
                end_year = current_year
            else:
                end_year_match = re.search(r'\d{4}', end_str)
                end_year = int(end_year_match.group()) if end_year_match else current_year
            
            total_months += (end_year - start_year) * 12
    else:
        # Fallback for resumes with no date ranges but a direct mention
        direct_match = re.search(direct_pattern, text, re.IGNORECASE)
        if direct_match:
            return int(direct_match.group(1)), False

    years = round(total_months / 12)
    return (years if years > 0 else 1), False

def extract_entities(text, is_jd=False):
    """
    Extracts Name, Email, Categorized Skills, and Experience.
    """
    cleaned_text = clean_text(text)
    
    entities = {
        "Name": "Unknown",
        "Email": "Not Found",
        "Phone": "Not Found",
        "Skills": [],
        "Categorized_Skills": {},
        "Designation": "Not Found",
        "Years_of_Experience": 0,
        "Is_Plus_Requirement": False
    }

    # 1. Email & Phone RegEx
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(email_pattern, text)
    if emails:
        entities["Email"] = emails[0].lower()

    phone_pattern = r'(\+\d{1,3}[-.\s]??\d{1,4}[-.\s]??\d{1,4}[-.\s]??\d{1,9}|\d{10})'
    phones = re.findall(phone_pattern, text)
    if phones:
        entities["Phone"] = phones[0]

    # 2. Name Extraction
    entities["Name"] = extract_name(text)

    # 3. Experience Calculation (JD-aware)
    exp_val, is_plus = calculate_experience_robust(text, is_jd=is_jd)
    entities["Years_of_Experience"] = exp_val
    entities["Is_Plus_Requirement"] = is_plus

    # 4. Manual Categorized Skill Extraction
    categorized, all_skills = manual_extract_categorized_skills(cleaned_text)
    
    # Convert sets to sorted lists
    entities["Categorized_Skills"] = {cat: sorted(list(skills)) for cat, skills in categorized.items()}
    entities["Skills"] = sorted(list(all_skills))

    # 5. Designation heuristic
    lines = text.split('\n')[:15]
    for line in lines:
        for title in COMMON_TITLES:
            if title.lower() in line.lower() and len(line.split()) < 6:
                entities["Designation"] = line.strip()
                break
        if entities["Designation"] != "Not Found":
            break

    return entities

def detect_domain(categorized_skills):
    """
    Refined heuristic to detect domain based on category density in skills.json.
    """
    if not categorized_skills:
        return "General"

    domain_scores = {}
    
    for category, skills in categorized_skills.items():
        domain = SKILLS_CATEGORIES_TO_DOMAINS.get(category, "Other")
        if domain != "Other":
            domain_scores[domain] = domain_scores.get(domain, 0) + len(skills)
                
    if not domain_scores:
        return "General"
        
    return max(domain_scores, key=domain_scores.get)
