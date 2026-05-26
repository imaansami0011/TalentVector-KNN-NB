// Mock data layer for Talent Vector matching the design specification

export const stats = {
  activeJobs: 14,
  resumesScreened: 1284,
  avgMatch: 78,
  shortlisted: 96,
};

export const recentScreenings = [
  {
    id: "scr-1",
    jd: "Senior Frontend Engineer",
    date: "2026-05-20",
    candidates: 15,
    shortlisted: 3,
  },
  {
    id: "scr-2",
    jd: "Data Scientist",
    date: "2026-05-18",
    candidates: 24,
    shortlisted: 5,
  },
  {
    id: "scr-3",
    jd: "Devops Engineer",
    date: "2026-05-15",
    candidates: 10,
    shortlisted: 2,
  },
  {
    id: "scr-4",
    jd: "Product Manager",
    date: "2026-05-12",
    candidates: 18,
    shortlisted: 4,
  },
];

export const jobDescriptions = [
  {
    id: "jd-1",
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "Remote",
    openings: 2,
    created: "May 12",
  },
  {
    id: "jd-2",
    title: "Data Scientist",
    department: "Data Science",
    location: "Hybrid (Berlin, DE)",
    openings: 1,
    created: "Apr 28",
  },
  {
    id: "jd-3",
    title: "Devops Engineer",
    department: "Cloud Infrastructure",
    location: "Onsite (Munich, DE)",
    openings: 1,
    created: "May 05",
  },
  {
    id: "jd-4",
    title: "Product Manager",
    department: "Product Management",
    location: "Remote",
    openings: 1,
    created: "May 10",
  },
  {
    id: "jd-5",
    title: "Full Stack Developer",
    department: "Web Development",
    location: "Remote",
    openings: 3,
    created: "May 15",
  },
  {
    id: "jd-6",
    title: "Machine Learning Engineer",
    department: "Machine Learning",
    location: "Hybrid (Tokyo, JP)",
    openings: 2,
    created: "May 17",
  },
];

const firstNames = [
  "Sofia", "Arjun", "Chloe", "Yuki", "Elena", "Kwame", "Marcus", "Isabella", "Liam", "Mei",
  "Omar", "Fatima", "Alex", "Sarah", "Carlos", "David", "Amara", "Jack", "Alice", "Bob"
];

const lastNames = [
  "Martinez", "Patel", "Dupont", "Tanaka", "Rostova", "Osei", "Vance", "Silva", "O'Connor", "Ling",
  "Farooq", "Al-Sayed", "Jenkins", "Kim", "Santana", "Park", "Okafor", "Shepherd", "Johnson", "Smith"
];

const domains = [
  "Web Development", "Data Science", "Cloud Infrastructure", "Product Management", "Web Development", "Machine Learning"
];

const titles = [
  "Senior Frontend Engineer", "Data Scientist", "Devops Engineer", "Product Manager", "Full Stack Developer", "Machine Learning Engineer"
];

const schools = ["TU Munich", "Stanford University", "IIT Bombay", "ETH Zurich", "University of Tokyo"];

const companies = ["Stripe", "Linear", "Figma", "Vercel", "Anthropic", "Databricks", "Acme Corp", "Globex", "Initech", "Umbrella Corp"];

const statuses = ["shortlisted", "review", "rejected", "new"];

const skillsPool = {
  "Web Development": ["React", "TypeScript", "Next.js", "Tailwind CSS", "Vite", "Node.js", "GraphQL", "HTML5/CSS3", "JavaScript", "Redux", "Webpack"],
  "Data Science": ["Python", "Pandas", "NumPy", "SQL", "Scikit-Learn", "R", "Tableau", "PowerBI", "Jupyter", "TensorFlow", "Spark"],
  "Cloud Infrastructure": ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "GitHub Actions", "Linux", "Nginx", "Bash", "Prometheus", "Ansible"],
  "Product Management": ["Agile", "Scrum", "Product Strategy", "User Research", "Jira", "A/B Testing", "Figma", "Roadmapping", "Product Analytics", "SQL"],
  "Machine Learning": ["PyTorch", "TensorFlow", "NLP", "Computer Vision", "Scikit-Learn", "Python", "Keras", "MLOps", "Transformers", "LLMs", "CUDA"]
};

// Deterministic Seeded PRNG for mock generator
function createRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const random = createRandom(7);

function getRandomElement(arr) {
  return arr[Math.floor(random() * arr.length)];
}

function getRandomSubarray(arr, min, max) {
  const size = Math.floor(random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - random());
  return shuffled.slice(0, size);
}

// Generate the 20 candidates deterministically
export const candidates = Array.from({ length: 20 }, (_, idx) => {
  const firstName = firstNames[idx % firstNames.length];
  const lastName = lastNames[idx % lastNames.length];
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
  const phone = `+1 (${Math.floor(200 + random() * 800)}) 555-${Math.floor(1000 + random() * 9000)}`;
  
  const titleIdx = idx % titles.length;
  const title = titles[titleIdx];
  const domain = domains[titleIdx];
  
  const experience = Math.floor(random() * 8) + 2; // 2-9 years
  
  // Calculate match scores
  const skillMatch = Math.floor(random() * 35) + 60; // 60-95%
  const expMatch = Math.floor(random() * 30) + 70; // 70-100%
  const score = Math.round(skillMatch * 0.7 + expMatch * 0.3);
  
  const status = statuses[idx % statuses.length];
  
  const domainSkills = skillsPool[domain] || skillsPool["Web Development"];
  const skills = getRandomSubarray(domainSkills, 6, 9);
  
  const location = getRandomElement([
    "San Francisco, US", "Berlin, DE", "London, UK", "Tokyo, JP", "Mumbai, IN", 
    "Paris, FR", "New York, US", "Zurich, CH", "Singapore, SG", "Toronto, CA"
  ]);
  
  const appliedFor = title;
  const avatar = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}`;
  
  const yearOffset = Math.floor(random() * 5) + 2021;
  const appliedDate = `2026-05-${String(Math.floor(random() * 20) + 1).padStart(2, '0')}`;

  const educations = [
    {
      degree: random() > 0.4 ? "B.S. in Computer Science" : "M.S. in Information Systems",
      school: getRandomElement(schools),
      year: `${yearOffset - 4}-${yearOffset}`,
    }
  ];

  const c1 = getRandomElement(companies);
  const c2 = getRandomElement(companies.filter(c => c !== c1));

  const experiences = [
    {
      role: `Senior ${title}`,
      company: c1,
      period: `2024 - Present`,
      summary: `Lead developer and architect for core platform services. Engineered scalable web application workflows and collaborated with cross-functional teams to improve load times by 40%.`,
    },
    {
      role: title,
      company: c2,
      period: `${yearOffset} - 2024`,
      summary: `Developed and optimized core pipelines, introduced automated unit test coverage up to 85%, and maintained robust APIs for internal cloud infrastructure tools.`,
    }
  ];

  return {
    id: `cand-${idx + 1}`,
    name,
    email,
    phone,
    location,
    title,
    experience,
    score,
    skillMatch,
    expMatch,
    domain,
    status,
    skills,
    education: educations,
    experiences,
    appliedFor,
    avatar,
    appliedDate,
  };
});
