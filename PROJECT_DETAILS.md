# TALENT VECTOR (Resume Screening) - Project Details

## 🚀 Project Overview
**TALENT VECTOR** is a comprehensive AI-powered resume screening and ranking platform designed to streamline the recruitment process. It leverages Natural Language Processing (NLP) and Machine Learning (ML) to automatically parse resumes, extract key information, and rank candidates against specific job descriptions.

## 🏗️ Architecture
The application follows a modern full-stack architecture:
- **Frontend**: Built with **React** and **Vite**, featuring a premium design system (Talent Vector branding).
- **Backend**: Powered by **FastAPI** (Python), providing high-performance asynchronous endpoints.
- **Database**: **MongoDB** is used for storing screening results, candidate profiles, and recruiter data.
- **NLP Engine**: A custom extraction and ranking pipeline utilizing **Regex**, **TF-IDF**, and **Vector Space Modeling**.

---

## 📂 Directory Structure

### 1. Backend (`/app`)
| File | Description |
| :--- | :--- |
| `main.py` | The main FastAPI entry point. Handles the core `/screen` endpoint and CORS configuration. |
| `recruiter.py` | Router for recruiter-specific operations and portal logic. |
| `candidate.py` | Router for candidate actions, such as resume uploads. |
| `extractor.py` | Core NLP module for extracting Names, Emails, Phones, Skills, and Years of Experience. |
| `ranker.py` | Implements the ranking algorithm (Skill Match vs. Experience). |
| `auth.py` | Authentication logic (Login/Signup) using JWT-like patterns. |
| `database.py` | MongoDB connection setup and collection handles. |
| `mailer.py` | Utility for sending automated email notifications to candidates and HR. |
| `skills.json` | A centralized, cleaned dictionary of technical skills across various domains. |
| `constants.py` | Global constants used throughout the backend. |

### 2. Frontend (`/frontend/src`)
| Directory/File | Description |
| :--- | :--- |
| `pages/IdentityGateway.jsx` | Authentication portal (Login/Register). |
| `pages/RecruiterPortal.jsx` | The main dashboard for recruiters to view recent screenings and stats. |
| `pages/DataIngestion.jsx` | The "Screening" page where JDs and Resumes are uploaded and processed. |
| `pages/MarketDiscovery.jsx` | A search interface to discover and filter through processed candidates. |
| `pages/ProfileVerification.jsx`| Detailed view of a candidate's extracted profile and score breakdown. |
| `skillsData.js` | Frontend version of the skills dictionary for UI components. |

### 3. Other Resources
- `Resume_Screening.ipynb`: Jupyter Notebook containing initial exploratory data analysis and model training code.
- `Generated_DOCX/`: A collection of synthetic resumes used for system validation and testing.
- `requirements.txt`: List of Python dependencies (FastAPI, Spacy, PyMongo, etc.).
- `package.json`: Node.js dependencies for the frontend.

---

## 🛠️ Key Features

### 1. Intelligent Extraction
- **Name & Contact Info**: Extracts basic candidate details using advanced regex patterns.
- **Skill Identification**: Matches resume text against a curated list of thousands of technical skills.
- **Experience Extraction**: Heuristically calculates years of experience from text blocks.

### 2. Advanced Ranking Engine
The system uses a **70/30 weighted scoring model**:
- **70% Skill Match**: Calculated using TF-IDF and Cosine Similarity between the Job Description and the Resume.
- **30% Experience Match**: Compares the candidate's total experience against the JD requirements (supporting both "3+ years" threshold logic and "exactly 3 years" precision logic).

### 3. Automated Workflow
- **Domain Detection**: Automatically identifies the job domain (e.g., Data Science, Web Dev, Cyber Security) based on the JD.
- **Batch Processing**: Allows uploading multiple resumes simultaneously for rapid screening.
- **Reporting**: Stores all results in MongoDB for historical tracking and recruiter review.

---

## 🔧 Setup & Installation

### Backend
1. Navigate to the root directory.
2. Install dependencies: `pip install -r requirements.txt`
3. Set up `.env` with MongoDB URI.
4. Run server: `python -m app.main` (or `uvicorn app.main:app --reload`)

### Frontend
1. Navigate to `/frontend`.
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

---
**Maintained by**: Anukalp Mishra / Antigravity AI
