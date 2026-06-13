
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

# ─────────────────────────────────────────────────────────────────────────────
# CANONICAL DOMAIN LIST
# ─────────────────────────────────────────────────────────────────────────────
ALL_DOMAINS = [
    # ── Technology ──────────────────────────────────────────────────────────
    "Software Development",
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Data Engineering",
    "Database Administration",
    "Cloud & DevOps",
    "Cyber Security",
    "QA & Testing",
    "Enterprise Systems",
    "Blockchain",
    "Embedded Systems",
    # ── Engineering (non-IT) ────────────────────────────────────────────────
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Chemical Engineering",
    # ── Business & Management ───────────────────────────────────────────────
    "Management",
    "Human Resources",
    "Finance & Accounting",
    "Sales & Business Development",
    "Supply Chain & Logistics",
    # ── Creative & Communication ─────────────────────────────────────────────
    "Marketing & Digital Media",
    "Architecture & Design",
    "Media & Journalism",
    # ── Specialist Professions ──────────────────────────────────────────────
    "Healthcare & Medicine",
    "Legal & Compliance",
    "Education & Training",
    # ── Catch-all ───────────────────────────────────────────────────────────
    "General",
]

# ─────────────────────────────────────────────────────────────────────────────
# DOMAIN → REPRESENTATIVE KEYWORDS / SKILLS
# Used for keyword-based domain detection when skills.json categorization
# ─────────────────────────────────────────────────────────────────────────────
DOMAIN_SKILLS_MAP = {
    # ── Technology ──────────────────────────────────────────────────────────
    "Software Development": [
        "Python", "Java", "C++", "C#", "Go", "Rust", "Kotlin", "Spring Boot",
        "Microservices", "REST APIs", "OOP", "Design Patterns", "Git", "Agile",
        "Data Structures", "Algorithms", "Unit Testing", "CI/CD"
    ],
    "Web Development": [
        "React.js", "Node.js", "Angular", "Vue.js", "Next.js", "HTML", "CSS",
        "JavaScript", "TypeScript", "Express.js", "MongoDB", "REST APIs",
        "GraphQL", "Tailwind CSS", "Redux", "Bootstrap", "MERN", "MEAN"
    ],
    "Mobile Development": [
        "Flutter", "Dart", "Swift", "Kotlin", "React Native", "iOS", "Android",
        "Xcode", "Android Studio", "Firebase", "Jetpack Compose", "SwiftUI",
        "App Store", "Play Store", "CocoaPods", "MVVM"
    ],
    "Data Science": [
        "Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
        "Scikit-Learn", "Pandas", "NumPy", "NLP", "Computer Vision", "Statistics",
        "Jupyter", "Data Analysis", "Power BI", "Tableau", "Matplotlib", "R"
    ],
    "Data Engineering": [
        "SQL", "Apache Spark", "Hadoop", "ETL", "Data Warehousing", "Python",
        "Azure Data Factory", "Databricks", "PySpark", "Kafka", "Airflow",
        "Data Pipelines", "Data Modeling", "PostgreSQL", "BigQuery"
    ],
    "Database Administration": [
        "SQL", "MySQL", "PostgreSQL", "Oracle DB", "SQL Server", "MongoDB",
        "Redis", "Cassandra", "Database Design", "Query Optimization",
        "Backup & Recovery", "Replication", "DBA", "PL/SQL"
    ],
    "Cloud & DevOps": [
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD",
        "Jenkins", "GitHub Actions", "Linux", "Bash", "Ansible", "Nginx",
        "CloudFormation", "EKS", "Lambda", "Serverless", "Helm"
    ],
    "Cyber Security": [
        "Penetration Testing", "OWASP", "Wireshark", "Network Security",
        "SIEM", "Incident Response", "Firewall", "Vulnerability Assessment",
        "Ethical Hacking", "Cryptography", "CEH", "CISSP", "SOC", "Linux"
    ],
    "QA & Testing": [
        "Selenium", "Cypress", "Playwright", "JIRA", "Manual Testing",
        "API Testing", "Postman", "Test Automation", "QA Automation",
        "Load Testing", "Bug Tracking", "Regression Testing", "SDLC", "Agile"
    ],
    "Enterprise Systems": [
        "SAP", "ERP", "SAP FICO", "SAP MM", "SAP SD", "Oracle ERP",
        "Business Process", "ABAP", "Dynamics 365", "ServiceNow", "Salesforce"
    ],
    "Blockchain": [
        "Solidity", "Ethereum", "Web3.js", "Smart Contracts", "Truffle",
        "Hyperledger", "NFT", "DeFi", "Crypto", "Blockchain", "MetaMask"
    ],
    "Embedded Systems": [
        "C", "C++", "Arduino", "Raspberry Pi", "Microcontrollers", "RTOS",
        "Firmware", "FPGA", "Embedded C", "PCB Design", "IoT", "Sensors"
    ],

    # ── Engineering (non-IT) ────────────────────────────────────────────────
    "Mechanical Engineering": [
        "AutoCAD", "SolidWorks", "CATIA", "ANSYS", "Thermodynamics", "Fluid Mechanics",
        "Manufacturing", "CNC", "Mechanical Design", "FEA", "GD&T", "Prototyping"
    ],
    "Civil Engineering": [
        "AutoCAD", "Revit", "STAAD Pro", "Structural Analysis", "Construction Management",
        "Surveying", "Concrete Design", "Project Management", "Site Management", "BIM"
    ],
    "Electrical Engineering": [
        "Circuit Design", "MATLAB", "Simulink", "PLC", "SCADA", "Power Systems",
        "Electrical Design", "AutoCAD Electrical", "Transformers", "HV/LV", "PCB"
    ],
    "Chemical Engineering": [
        "Process Engineering", "Aspen Plus", "HYSYS", "Process Simulation",
        "Thermodynamics", "Reaction Engineering", "HSE", "Plant Design", "P&ID"
    ],

    # ── Business & Management ───────────────────────────────────────────────
    "Management": [
        "Project Management", "Agile", "Scrum", "JIRA", "Product Strategy",
        "Leadership", "Stakeholder Management", "PMP", "Trello", "KPIs",
        "Budgeting", "Risk Management", "Change Management", "OKRs"
    ],
    "Human Resources": [
        "Recruitment", "Talent Acquisition", "Onboarding", "HRIS", "Payroll",
        "Performance Management", "Employee Relations", "HR Analytics",
        "Compensation & Benefits", "Labor Law", "Training & Development",
        "Succession Planning", "ATS", "HR Business Partner"
    ],
    "Finance & Accounting": [
        "Financial Reporting", "IFRS", "GAAP", "Accounting", "Auditing",
        "Taxation", "SAP FICO", "QuickBooks", "Financial Analysis",
        "Budgeting", "Forecasting", "Accounts Payable", "Accounts Receivable",
        "Cost Accounting", "Treasury", "Investment Analysis", "CPA", "ACCA", "CFA"
    ],
    "Sales & Business Development": [
        "B2B Sales", "B2C Sales", "CRM", "Salesforce", "Lead Generation",
        "Account Management", "Business Development", "Negotiation",
        "Sales Strategy", "Pipeline Management", "Revenue Growth",
        "Cold Calling", "Client Relationship", "Market Expansion"
    ],
    "Supply Chain & Logistics": [
        "Supply Chain Management", "Procurement", "Inventory Management",
        "Logistics", "Warehouse Management", "SAP MM", "Demand Planning",
        "Vendor Management", "ERP", "Import/Export", "Freight", "3PL",
        "Distribution", "Last-Mile Delivery", "Six Sigma"
    ],

    # ── Creative & Communication ─────────────────────────────────────────────
    "Marketing & Digital Media": [
        "SEO", "SEM", "Google Ads", "Facebook Ads", "Content Marketing",
        "Social Media Marketing", "Email Marketing", "HubSpot", "Mailchimp",
        "Google Analytics", "Copywriting", "Brand Strategy", "Digital Marketing",
        "Influencer Marketing", "Market Research", "Campaign Management"
    ],
    "Architecture & Design": [
        "AutoCAD", "Revit", "SketchUp", "Adobe Illustrator", "Photoshop",
        "Figma", "UI/UX", "Interior Design", "3D Rendering", "Building Design",
        "Space Planning", "InDesign", "Typography", "Branding", "Visual Design"
    ],
    "Media & Journalism": [
        "Journalism", "Reporting", "Content Writing", "Editing", "Proofreading",
        "Broadcast Media", "Video Production", "Adobe Premiere", "Final Cut Pro",
        "Scriptwriting", "Investigative Journalism", "News Writing", "Publishing",
        "Social Media", "Podcasting", "Photography", "Videography"
    ],

    # ── Specialist Professions ──────────────────────────────────────────────
    "Healthcare & Medicine": [
        "Clinical Research", "Patient Care", "EMR/EHR", "Medical Coding",
        "Pharmacology", "Healthcare Management", "HIPAA", "Nursing",
        "Diagnosis", "Surgery", "Radiology", "Pathology", "Public Health",
        "Medical Writing", "Telemedicine", "Laboratory", "ICD-10"
    ],
    "Legal & Compliance": [
        "Corporate Law", "Contract Drafting", "Litigation", "Legal Research",
        "Compliance", "Regulatory Affairs", "GDPR", "Anti-Money Laundering",
        "Intellectual Property", "Labour Law", "Due Diligence",
        "Company Secretary", "Risk & Compliance", "Legal Advisory"
    ],
    "Education & Training": [
        "Curriculum Development", "eLearning", "LMS", "Instructional Design",
        "Training Delivery", "Moodle", "Articulate 360", "Coaching",
        "Academic Writing", "Research", "Pedagogy", "Assessment Design",
        "TEFL", "Corporate Training", "Bloom's Taxonomy"
    ],

    # ── Catch-all ───────────────────────────────────────────────────────────
    "General": [
        "Communication", "Teamwork", "Problem Solving", "Time Management",
        "MS Office", "Excel", "PowerPoint", "Customer Service", "Research"
    ],
}

# ─────────────────────────────────────────────────────────────────────────────
# Mapping of skills.json categories to broader professional Domains
# ─────────────────────────────────────────────────────────────────────────────
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
    "Mechanical & Civil Engineering": "Mechanical Engineering",
    "Electrical & Electronics Engineering": "Electrical Engineering",
    "Business, Management & HR": "Management",
    "Soft Skills": "General",
    # Non-tech additions
    "Finance & Accounting": "Finance & Accounting",
    "Marketing & Digital Media": "Marketing & Digital Media",
    "Human Resources": "Human Resources",
    "Healthcare & Medicine": "Healthcare & Medicine",
    "Legal & Compliance": "Legal & Compliance",
    "Supply Chain & Logistics": "Supply Chain & Logistics",
    "Sales & Business Development": "Sales & Business Development",
    "Education & Training": "Education & Training",
}

# ─────────────────────────────────────────────────────────────────────────────
# Legacy Domain Map — kept for backward compatibility with older code paths
# ─────────────────────────────────────────────────────────────────────────────
DOMAIN_MAP = {
    "IT": ["Python", "Fastapi", "React", "Javascript", "Java", "Sql", "Aws", "Docker", "Kubernetes", "C++", "C#"],
    "Data Science": ["Machine Learning", "Nlp", "Pandas", "Scikit-Learn", "Tensorflow", "Pytorch", "Data Analysis"],
    "Cyber Security": ["Penetration Testing", "Ethical Hacking", "Firewall", "Network Security", "Siem", "Threat Hunting"],
    "Finance": ["Accounting", "Financial Analysis", "Auditing", "Banking", "Investment", "Ifrs", "Gaap", "Acca", "Cpa"],
    "Marketing": ["Seo", "Sem", "Content Strategy", "Digital Marketing", "Social Media", "Google Ads", "Hubspot"],
    "HR": ["Recruitment", "Talent Acquisition", "Payroll", "Onboarding", "Hris", "Performance Management"],
    "Legal": ["Corporate Law", "Compliance", "Contract Drafting", "Litigation", "Gdpr", "Due Diligence"],
    "Healthcare": ["Clinical Research", "Patient Care", "Nursing", "Pharmacology", "Emr", "Medical Coding"],
    "Logistics": ["Supply Chain", "Procurement", "Inventory Management", "Logistics", "Warehouse"],
    "Sales": ["B2B Sales", "Crm", "Lead Generation", "Account Management", "Business Development"],
    "Education": ["Curriculum Development", "Elearning", "Instructional Design", "Coaching", "Training"],
    "Media": ["Journalism", "Content Writing", "Video Production", "Broadcasting", "Photography"],
}

# Common Job Titles / Designations for extraction
COMMON_TITLES = [
    "Engineer", "Developer", "Manager", "Analyst", "Lead",
    "Consultant", "Specialist", "Administrator", "Architect", "Designer",
    "Scientist", "Architect", "Lead", "Principal", "Associate",
    "Officer", "Executive", "Director", "Coordinator", "Advisor",
    "Recruiter", "Accountant", "Attorney", "Lawyer", "Physician",
    "Nurse", "Journalist", "Lecturer", "Trainer", "Therapist"
]
