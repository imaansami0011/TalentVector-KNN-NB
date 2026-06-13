# TalentVector Frontend Documentation

Welcome to the **TalentVector** (HR-Helper) frontend documentation. This document provides a comprehensive overview of the frontend client application, its architecture, key modules, user flows, and integrations.

---

## 🚀 1. Technology Stack

The TalentVector frontend is built as a modern, high-performance Single Page Application (SPA) with a focus on type-safety, rapid rendering, and developer experience.

*   **Core Library**: **React 19** (leveraging hooks and concurrent rendering capabilities).
*   **Build Tool & Dev Server**: **Vite 8** (extremely fast compilation, hot module reloading, and optimized Rollup production builds).
*   **Routing**: **TanStack Router** (fully type-safe, declaration-based, file-based nested routing).
*   **Data Fetching & State Synchronization**: **TanStack Query (React Query) v5** (used to cache, synchronize, and update server state asynchronously, eliminating the need for complex global state libraries like Redux).
*   **Styling**: **Tailwind CSS v4** combined with **Autoprefixer** and **PostCSS** (for rapid utility-first utility classes, fluid spacing, and custom glassmorphic panels).
*   **Iconography**: **Lucide React** (clean, modern SVG icons).
*   **UI Primitives**: **Radix UI Slot** (accessible, composeable primitive patterns).
*   **Toast Notifications**: **Sonner** (elegant, non-blocking stackable toasts).
*   **Authentication Integration**: **@react-oauth/google** (seamless Google login integration).

---

## 📁 2. Directory Structure & Architecture

The frontend client resides within the `frontend/` directory. Below is the layout of the source files:

```
frontend/
├── dist/                      # Compiled production assets
├── public/                    # Static assets (favicons, manifest, etc.)
├── src/
│   ├── assets/                # Images, brand logos, etc.
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # Core design components (buttons, cards, badges, inputs, etc.)
│   │   ├── ad-panel.jsx       # Context-aware promotional sidebar for candidate profiles
│   │   ├── app-shell.jsx      # Overall dashboard frame with responsive mobile drawer
│   │   ├── app-sidebar.jsx    # Collapsible sidebar containing role-based navigation links
│   │   └── skills-input.jsx   # Interactive tagging input for adding/removing skills
│   ├── hooks/                 # Custom React Hooks
│   │   └── use-mobile.js      # Media query hook to detect mobile viewport size
│   ├── lib/                   # Utility scripts and helper functions
│   ├── routes/                # File-based routing files (TanStack Router)
│   │   ├── __root.jsx         # Root layout context (provides AppShell, Sidebar, Toasts)
│   │   ├── index.jsx          # Landing page (hero headers, product features)
│   │   ├── login.jsx          # Authentication page (Google Login & Email OTP login)
│   │   ├── onboarding.jsx     # Onboarding route frame
│   │   ├── onboarding.index.jsx # Onboarding dispatcher (routes based on user role)
│   │   ├── onboarding.candidate.jsx # Onboarding flow for Candidates (CV Upload + Parsing)
│   │   ├── onboarding.recruiter.jsx # Onboarding flow for Recruiters (Company Profile setup)
│   │   ├── hr.portal.jsx      # Recruiter Dashboard home (analytics, screening summaries)
│   │   ├── hr.jobs.index.jsx  # Recruiter active job list
│   │   ├── hr.jobs.new.jsx    # Recruiter Job Posting creator (supports JD text parsing)
│   │   ├── hr.jobs.$job_id.results.jsx # Screening results list per job (ranking, match breakdowns)
│   │   ├── screening.jsx      # Global bulk screening workspace
│   │   ├── browse.jsx         # Candidate job listings search
│   │   ├── candidates.index.jsx # Recruiter candidate database view (filter, sort, search)
│   │   ├── candidates.$id.jsx # Detailed candidate profile showcase (CV viewer, skills, info)
│   │   ├── profile.jsx        # Candidate edit-profile details
│   │   ├── profile-showcase.jsx # Public/recruiter-facing profile view with custom styling
│   │   └── user-profile.jsx   # Profile management endpoint
│   ├── index.css              # Global styles, variables, Tailwind configurations
│   ├── main.jsx               # Application bootstrap entry point
│   ├── routeTree.gen.ts       # Automatically generated TanStack Router types
│   └── skillsData.js          # Shared list of raw skills and categories
├── .env                       # Environment configurations (API URL, Google Client ID)
├── postcss.config.js          # PostCSS configuration file
├── tailwind.config.js         # Tailwind configuration overrides
└── vite.config.js             # Vite compiler configuration
```

---

## 💻 3. Key Pages & User Workflows

### A. Authentication & Onboarding
1.  **Authentication (`login.jsx`)**: Supports Google OAuth single-sign-on or standard email verification via a 6-digit one-time password (OTP). It determines whether the email exists in the system or prompt-routes a role selector for new sign-ups.
2.  **Role Dispatch (`onboarding.index.jsx`)**: Automatically detects the user's role (`candidate` vs. `recruiter`) and forwards them to the appropriate profile builder.
3.  **Candidate Onboarding (`onboarding.candidate.jsx`)**: Prompts the user to upload a resume file (PDF/DOCX). It uploads the file to the backend `/candidate/extract` endpoint, parses their name, contact details, estimated experience, list of skills, and outputs an automated sector classification using the backend Machine Learning classifier.
4.  **Recruiter Onboarding (`onboarding.recruiter.jsx`)**: Collects organization details such as company name, HQ location, description, website, and industry focus.

### B. Recruiter Workflows
1.  **Dashboard (`hr.portal.jsx`)**: Renders high-level metrics (active job posts, screened candidates, average match percentage, and recent candidate match distributions).
2.  **Create Job Post (`hr.jobs.new.jsx`)**: Standard form for posting jobs. It includes a text area for pasting a raw Job Description (JD). Recruiters can click **"Auto-Fill JD"** which calls the backend `/jd/parse` API. The backend returns parsed role title, minimum experience requirements, remote/hybrid status, and core skills, instantly populating the form.
3.  **Active Jobs (`hr.jobs.index.jsx`)**: Displays listed roles with details on minimum experience, skills requested, and quick links to review screened applicants.
4.  **Screening Results (`hr.jobs.$job_id.results.jsx`)**: Shows the ranked list of candidates who applied or were screened. Results are sorted by their **hybrid weighted score**. Recruiters can click a candidate row to expand it, showing a breakdown of skills they matched, skills they lacked, and their experience difference score. It also supports sending an invitation email directly.
5.  **Candidate Database (`candidates.index.jsx`) & Details (`candidates.$id.jsx`)**: A complete repository of parsed candidates. Recruiters can search by name, filter by specific industries/sectors, filter by experience ranges, and open detailed profiles.

### C. Candidate Workflows
1.  **Profile Management (`profile.jsx`, `user-profile.jsx`)**: Allows candidates to manually edit their experience, phone numbers, and fine-tune their extracted skills list using a customized dynamic autocomplete component.
2.  **Job Search (`browse.jsx`)**: Allows candidates to search for jobs, filter by location type, and view job details.
3.  **Matching Engine recommendation**: Displays the calculated match score percentage directly in the candidate's list view, showing them how well they align with each job.

---

## 🎨 4. Design & Aesthetics

The UI utilizes a **modern glassmorphic, responsive design system** engineered with:
*   **Palette**: Harmonious slate and cool-gray backgrounds, slate-900 typography, sapphire-blue primary accents, and emerald/rose badges for status indicators.
*   **Transitions**: Smooth hover states (shadow transitions, subtle scales) and slide-out drawers for mobile viewports.
*   **Interactive Controls (`skills-input.jsx`)**: Includes a custom search-and-select multiselect pill list that handles key presses, prevents duplicate tags, and synchronizes with form state.
*   **Sidebars (`ad-panel.jsx`)**: Renders contextual side-cards to enrich candidate details screen (e.g. showcasing related job openings or certifications).

---

## 🔍 5. Verification & ESLint Analysis

During our code quality check, we ran ESLint across the codebase:

```bash
npm run lint
```

### Key Observations:
*   **ESLint Rules Checked**: The configuration flags warnings and errors for `no-unused-vars` (variables or imports declared but never read) and `react-hooks/exhaustive-deps` (missing variables in `useEffect` or `useMemo` dependency arrays), as well as warnings against creating components during other renders (static helper sub-components defined within another component render function).
*   **Vite Compilation**: Despite strict rules raising lint notices, the **Vite production compiler runs and builds successfully** (outputting highly optimized bundle chunks: `dist/assets/index-CPG9R47g.js` ~711kB, `dist/assets/index-YoiNZc-V.css` ~141kB). The application runs perfectly in the browser. 

---

## 🔌 6. API Integration Contract

The frontend connects to the backend through a helper query wrapper. The key endpoints integrated include:

| Method | Endpoint | Description | Payload / Response |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register-init` | Triggers OTP validation mail | `{ email, role }` |
| `POST` | `/auth/verify-otp` | Validates OTP and registers | `{ email, otp, password, role }` |
| `POST` | `/auth/login` | Email/password sign-in | `{ email, password, role }` |
| `POST` | `/auth/google` | Google OAuth token login | `{ email, name, role, picture }` |
| `POST` | `/candidate/extract` | Autoparses uploaded CV files | Form data (file) $\rightarrow$ `{ detected_skills, experience... }` |
| `GET` | `/candidate/profile` | Fetches active candidate record | Query email $\rightarrow$ Profile Doc |
| `POST` | `/jd/parse` | Autoparses raw Job Description | `{ jd_text }` $\rightarrow$ `{ title, min_experience, core_skills }` |
| `POST` | `/screen` | Ranks list of uploaded resumes | Form data (resumes + JD text) $\rightarrow$ List of ranked scores |
