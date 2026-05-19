
# Blocklist of words that are NEVER candidate names
# Includes common job titles and technical section headers to prevent misidentification
NAME_BLOCKLIST = [
    "mern", "java", "resume", "cv", "summary", "experience", "email", 
    "frontend", "backend", "developer", "engineer", "profile", "contact",
    "skills", "education", "projects", "certification", "objective",
    "architect", "consultant", "specialist", "administrator", "lead", "manager", "analyst",
    "programming", "languages", "technologies", "frameworks", "cloud", "devops",
    "databases", "testing", "automation", "systems", "engineering", "blockchain"
]

# NLP Cleaning Synonyms for TF-IDF consistency
SYNONYMS = {
    r'\bjs\b': 'javascript',
    r'\baws\b': 'amazon web services',
    r'\bml\b': 'machine learning',
    r'\bnlp\b': 'natural language processing',
    r'\bai\b': 'artificial intelligence',
    r'\bgcp\b': 'google cloud platform',
    r'\bpython3\b': 'python',
    r'\bnode\.js\b': 'nodejs',
    r'\breactjs\b': 'react',
    r'\bgolang\b': 'go',
    r'\bpowerbi\b': 'power bi',
    r'\bpostgre\b': 'postgresql'
}

# Mapping of skills.json categories to broader professional Domains
SKILLS_CATEGORIES_TO_DOMAINS = {
    "Programming Languages": "Software Development",
    "Web Technologies & Frameworks": "Web Development",
    "Data Science & Artificial Intelligence": "Data Science",
    "Big Data Technologies": "Data Engineering",
    "ETL & Data Warehousing": "Data Engineering",
    "Databases": "Database Administration",
    "Cloud & DevOps": "Cloud & DevOps",
    "Networking & Cyber Security": "Cyber Security",
    "Software Testing & Automation": "QA & Testing",
    "SAP & ERP Systems": "Enterprise Systems",
    "Blockchain Technologies": "Blockchain",
    "Mechanical & Civil Engineering": "Engineering",
    "Electrical & Electronics Engineering": "Engineering",
    "Business, Management & HR": "Management",
    "Soft Skills": "General"
}

# Legacy Domain Map for backward compatibility if needed
DOMAIN_MAP = {
    "IT": ["Python", "Fastapi", "React", "Javascript", "Java", "Sql", "Aws", "Docker", "Kubernetes", "C++", "C#"],
    "Data Science": ["Machine Learning", "Nlp", "Pandas", "Scikit-Learn", "Tensorflow", "Pytorch", "Data Analysis"],
    "Cyber Security": ["Penetration Testing", "Ethical Hacking", "Firewall", "Network Security", "Siem", "Threat Hunting"],
    "Finance": ["Accounting", "Financial Analysis", "Auditing", "Banking", "Investment"],
    "Marketing": ["Seo", "Sem", "Content Strategy", "Digital Marketing", "Social Media"],
}

# Common Job Titles / Designations for extraction
COMMON_TITLES = [
    "Engineer", "Developer", "Manager", "Analyst", "Lead", 
    "Consultant", "Specialist", "Administrator", "Architect", "Designer",
    "Scientist", "Architect", "Lead", "Principal", "Associate"
]
