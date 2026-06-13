import * as React from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  Sparkles,
  Briefcase,
  UserRound,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Mail,
  Check,
  Plus,
  Zap
} from "lucide-react"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

// Helper client-side Cosine Similarity logic matching backend exactly
function calculateCosineSimilarity(jdSkills, candidateSkills) {
  const vocabulary = Array.from(new Set([...jdSkills, ...candidateSkills]))
  if (vocabulary.length === 0) return 0

  const v_jd = vocabulary.map(skill => jdSkills.includes(skill) ? 1 : 0)
  const v_cand = vocabulary.map(skill => candidateSkills.includes(skill) ? 1 : 0)

  const dotProduct = v_jd.reduce((sum, val, idx) => sum + val * v_cand[idx], 0)
  const magJd = Math.sqrt(v_jd.reduce((sum, val) => sum + val * val, 0))
  const magCand = Math.sqrt(v_cand.reduce((sum, val) => sum + val * val, 0))

  if (magJd === 0 || magCand === 0) return 0
  return dotProduct / (magJd * magCand)
}

// Explicit color mapper maps string identities to compile-safe Tailwind classes
const getCardColorClasses = (color) => {
  switch (color) {
    case "blue":
      return {
        badge: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        hover: "group-hover:bg-blue-600"
      }
    case "emerald":
      return {
        badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        hover: "group-hover:bg-emerald-600"
      }
    case "indigo":
    default:
      return {
        badge: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
        hover: "group-hover:bg-indigo-600"
      }
  }
}

// Demo data for the interactive skill-matching playground
const DEMO_JD_SKILLS = [
  "React", "TypeScript", "Node.js", "MongoDB", "REST APIs", "Git", "Docker", "CSS"
]

const DEMO_ALL_SKILLS = [
  "React", "TypeScript", "Node.js", "MongoDB", "REST APIs", "Git", "Docker", "CSS",
  "Python", "Vue.js", "Angular", "GraphQL", "PostgreSQL", "Redis", "Kubernetes", "AWS"
]

function LandingPage() {
  const [selectedSkills, setSelectedSkills] = React.useState(["React", "TypeScript", "CSS"])
  const [roleTab, setRoleTab] = React.useState("recruiter")

  const similarityScore = React.useMemo(() => {
    const score = calculateCosineSimilarity(DEMO_JD_SKILLS, selectedSkills)
    return Math.round(score * 100)
  }, [selectedSkills])

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden selection:bg-indigo-500/30">
      <style>{`
        @keyframes float-slow-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, -20px) scale(1.08); }
        }
        @keyframes float-slow-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-40px, 30px) scale(1.1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float-1 { animation: float-slow-1 22s infinite ease-in-out; }
        .animate-float-2 { animation: float-slow-2 28s infinite ease-in-out; }
        .animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .lp-bg-grid {
          background-size: 64px 64px;
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.015) 1px, transparent 1px);
        }
        .lp-glass-card {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .lp-glass-header {
          background: rgba(8, 12, 24, 0.75);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .lp-gradient-text {
          background: linear-gradient(135deg, #ffffff 30%, #c7d2fe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-gradient-primary {
          background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
        }
        .lp-section-divider {
          border-top: 1px solid rgba(255,255,255,0.05);
        }
      `}</style>

      {/* Ambient background blur elements */}
      <div className="absolute inset-0 lp-bg-grid z-0 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[140px] animate-float-1 pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[160px] animate-float-2 pointer-events-none z-0" />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 lp-glass-header select-none transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          {/* Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shadow-inner">
              <img src="/favicon.svg" alt="Talent Vector" className="w-5 h-5 object-contain" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-sans font-black text-sm uppercase tracking-wider text-white">
                Talent Vector
              </span>
              <span className="text-[10px] font-bold text-indigo-400/90 uppercase tracking-widest">
                Vectorized Recruitment
              </span>
            </div>
            <span className="ml-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              v2.0
            </span>
          </div>

          {/* Core Matching Status Engine */}
          <div className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            AI Matching Engine Active
          </div>

          {/* Authentication Gateway */}
          <Link to="/login">
            <button className="h-10 px-6 rounded-xl text-xs font-bold uppercase tracking-wider text-white lp-gradient-primary shadow-md hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-indigo-400/20">
              Sign In
            </button>
          </Link>
        </div>
      </header>

      {/* ── HERO SECTION ───────────────────────────────────────── */}
      <section className="relative z-10 pt-28 pb-24 px-6 sm:px-8 lg:px-12 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-xs font-semibold tracking-wider mb-8 select-none">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Vector Similarity Matching Framework</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] mb-8">
          <span className="lp-gradient-text">Vector Sourcing.</span>{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-indigo-200 bg-clip-text text-transparent">
            AI Screening.
          </span>
          <br />
          <span className="text-white">Seamless Shortlisting.</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
          Say goodbye to keyword-stuffing workarounds. Talent Vector extracts, cross-references, and ranks professional candidates matching real job parameters via multidimensional mathematical cosine alignment metrics.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login">
            <button className="w-full sm:w-auto h-12 px-8 rounded-xl text-sm font-bold text-white lp-gradient-primary hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-indigo-600/25">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <a href="#demo" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto h-12 px-8 rounded-xl text-sm font-semibold text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white bg-slate-900/40 hover:bg-slate-900/80 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
              Try Interactive Demo
            </button>
          </a>
        </div>

        {/* System Metric Counters */}
        <div className="grid grid-cols-3 max-w-xl mx-auto gap-6 sm:gap-12 mt-20 pt-12 border-t border-slate-900 text-center">
          {[
            { val: "98%", label: "Match Precision" },
            { val: "< 2s", label: "Screening Time" },
            { val: "10×", label: "Velocity Scaling" },
          ].map(({ val, label }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{val}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CORE CAPABILITIES ───────────────────────────────────── */}
      <section id="features" className="relative z-10 py-24 px-6 sm:px-8 lg:px-12 lp-section-divider">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3 block">System Stack Capabilities</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Engineered for Data-Driven HR</h2>
          <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed">High-performance processing engines that remove matching noise to extract qualified professional profiles.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {[
            {
              icon: <Cpu className="w-5 h-5" />,
              color: "indigo",
              title: "Neural Skill Space Alignment",
              desc: "Maps text values onto sparse coordinate frameworks to evaluate matching similarities, bypassing repetitive keyword loading strategies completely.",
            },
            {
              icon: <Layers className="w-5 h-5" />,
              color: "blue",
              title: "Structured Pipeline Tracking",
              desc: "Isolate and route application data steps securely through custom stages from ingestion and screening to validation and onboarding status checks.",
            },
            {
              icon: <Mail className="w-5 h-5" />,
              color: "emerald",
              title: "Automated Resend Routing",
              desc: "Dispatch customized interview invitation emails to matching target candidates instantly using robust, transactional server connection integrations.",
            },
          ].map(({ icon, color, title, desc }) => {
            const classes = getCardColorClasses(color);
            return (
              <div
                key={title}
                className="lp-glass-card p-8 sm:p-10 rounded-2xl flex flex-col gap-5 hover:-translate-y-1.5 transition-all duration-300 group cursor-default shadow-md"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border ${classes.badge} ${classes.hover} group-hover:text-white group-hover:border-transparent group-hover:shadow-md`}>
                  {icon}
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className="font-bold text-lg text-white tracking-tight">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── INTERACTIVE PLAYGROUND ──────────────────────────────── */}
      <section id="demo" className="relative z-10 py-24 px-6 sm:px-8 lg:px-12 lp-section-divider">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3 block">Live Testing Sandbox</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Evaluate the Vector Evaluation</h2>
          <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed">Toggle different applicant skill identifiers to watch the mathematical match rating update dynamically.</p>
        </div>

        <div className="lp-glass-card rounded-2xl grid lg:grid-cols-12 gap-0 border border-white/10 shadow-2xl overflow-hidden max-w-6xl mx-auto">
          {/* Skill configuration workspace */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col gap-8 border-b lg:border-b-0 lg:border-r border-white/5">
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold tracking-wide text-slate-200">Target JD Requirements</span>
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider bg-indigo-500/15 px-3 py-1 rounded-md border border-indigo-500/20">Evaluation Vector</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DEMO_JD_SKILLS.map(skill => (
                  <span key={skill} className="px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <span className="text-sm font-bold tracking-wide text-slate-200">
                Candidate Asset Index <span className="text-slate-500 font-normal ml-1">(Click items to toggle values)</span>
              </span>
              <div className="flex flex-wrap gap-2.5">
                {DEMO_ALL_SKILLS.map(skill => {
                  const isSelected = selectedSkills.includes(skill)
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 ${isSelected
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 border border-indigo-500/20"
                        : "bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      {skill}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Mathematical score display */}
          <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col items-center justify-center bg-slate-900/10 gap-8">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Match Metric Vector Strength</span>

            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-2xl" />
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="url(#progressGrad)"
                  strokeWidth="6"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={263.89}
                  strokeDashoffset={263.89 - (263.89 * similarityScore) / 100}
                  className="transition-all duration-500 ease-out"
                />
                <defs>
                  <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center justify-center gap-0.5">
                <span className="text-4xl font-black text-white tracking-tight">{similarityScore}%</span>
                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Cosine Similarity</span>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-500 select-none tracking-wider bg-slate-950/50 px-4 py-2 rounded-lg border border-white/5">
              cos(θ) = (A · B) / (||A|| × ||B||)
            </div>
          </div>
        </div>
      </section>

      {/* ── WORKSPACE DASHBOARDS ───────────────────────────────── */}
      <section id="roles" className="relative z-10 py-24 px-6 sm:px-8 lg:px-12 lp-section-divider">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3 block">Tailored Multi-Tenant Access</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Dedicated Management Terminals</h2>
          <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed">Switch workspace environments to visualize distinct recruiter pipelines and individual candidate identity cards.</p>
        </div>

        {/* Tab workspace controller toggle */}
        <div className="flex max-w-[280px] mx-auto bg-slate-900/60 p-1.5 h-12 rounded-xl border border-slate-800 relative select-none mb-12 items-center">
          <div
            className="absolute top-1.5 bottom-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg transition-all duration-300 ease-out z-0"
            style={{ left: roleTab === "recruiter" ? "6px" : "calc(50% + 2px)", width: "calc(50% - 8px)" }}
          />
          <button
            onClick={() => setRoleTab("recruiter")}
            className={`flex-1 relative z-10 flex items-center justify-center gap-2.5 font-bold text-xs tracking-wider transition-all duration-200 cursor-pointer h-full rounded-lg ${roleTab === "recruiter" ? "text-indigo-400" : "text-slate-500 hover:text-slate-400"
              }`}
          >
            <Briefcase className="w-4 h-4" /> Recruiter
          </button>
          <button
            onClick={() => setRoleTab("seeker")}
            className={`flex-1 relative z-10 flex items-center justify-center gap-2.5 font-bold text-xs tracking-wider transition-all duration-200 cursor-pointer h-full rounded-lg ${roleTab === "seeker" ? "text-indigo-400" : "text-slate-500 hover:text-slate-400"
              }`}
          >
            <UserRound className="w-4 h-4" /> Job Seeker
          </button>
        </div>

        {/* Dynamic Context Dashboard Canvas */}
        <div className="lp-glass-card rounded-2xl border border-white/6 shadow-xl overflow-hidden max-w-5xl mx-auto">
          {roleTab === "recruiter" ? (
            <div key="recruiter" className="grid md:grid-cols-12 gap-0 items-stretch animate-fadeIn">
              <div className="md:col-span-7 p-8 sm:p-12 flex flex-col gap-6 justify-center">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Employer Command Interface</span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Recruiter Command Console</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">Coordinate open workforce targets, upload candidate documentation in batches, and dispatch screening tasks effortlessly.</p>
                </div>
                <div className="flex flex-col gap-3.5">
                  {[
                    "Bulk document parsing extraction support (PDF, DOCX, TXT formats)",
                    "Case-insensitive custom token categorization filters",
                    "Automated integration queues supporting background email dispatch templates",
                  ].map(item => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <Link to="/login">
                    <button className="h-11 px-6 rounded-xl text-xs font-bold uppercase tracking-wider text-white lp-gradient-primary shadow-md cursor-pointer flex items-center gap-2 hover:opacity-95 hover:scale-[1.02] transition-all">
                      Access Recruiter Suite <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
              <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-white/5 p-8 sm:p-12 bg-slate-900/20 flex flex-col justify-center">
                <div className="flex flex-col gap-3 font-mono text-xs bg-slate-950/40 p-6 rounded-xl border border-white/5">
                  {[
                    ["Target Pipeline", "Node.js System Architect"],
                    ["Experience Limit", "3+ Float Years"],
                    ["Required Matrices", `["Node.js", "Docker", "Git"]`],
                    ["Inference Count", "15 Profiles Checked"],
                  ].map(([k, v], i) => (
                    <div key={k} className={`flex justify-between py-2.5 ${i < 3 ? "border-b border-slate-900" : ""}`}>
                      <span className="text-slate-500">{k}</span>
                      <span className={i === 3 ? "text-indigo-400 font-bold" : "text-slate-200 font-medium"}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div key="seeker" className="grid md:grid-cols-12 gap-0 items-stretch animate-fadeIn">
              <div className="md:col-span-7 p-8 sm:p-12 flex flex-col gap-6 justify-center">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Verified Professional Profiling</span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Applicant Pipeline Profile</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">Establish an authenticated resume object signature, evaluate sector bounds instantly, and query aligned job pipelines.</p>
                </div>
                <div className="flex flex-col gap-3.5">
                  {[
                    "Instant content conversion string indexing parsing tools",
                    "Naive Bayes statistical pipeline sector prediction parameters",
                    "Automated dashboard filters loading open matching options dynamically",
                  ].map(item => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <Link to="/login">
                    <button className="h-11 px-6 rounded-xl text-xs font-bold uppercase tracking-wider text-white lp-gradient-primary shadow-md cursor-pointer flex items-center gap-2 hover:opacity-95 hover:scale-[1.02] transition-all">
                      Create Seeker Profile <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
              <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-white/5 p-8 sm:p-12 bg-slate-900/20 flex flex-col justify-center">
                <div className="flex flex-col gap-3 font-mono text-xs bg-slate-950/40 p-6 rounded-xl border border-white/5">
                  {[
                    ["Profile Owner", "Haris Khan"],
                    ["Predicted Sector", "Technology / Software"],
                    ["Calculated Term", "4.5 Calendar Years"],
                    ["Matched Pipelines", "3 Active Targets"],
                  ].map(([k, v], i) => (
                    <div key={k} className={`flex justify-between py-2.5 ${i < 3 ? "border-b border-slate-900" : ""}`}>
                      <span className="text-slate-500">{k}</span>
                      <span className={i === 1 ? "text-indigo-400 font-bold" : "text-slate-200 font-medium"}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── CONVERTING ACTION CTA ──────────────────────────────── */}
      <section className="relative z-10 py-24 px-6 sm:px-8 lg:px-12 lp-section-divider">
        <div className="max-w-5xl mx-auto lp-glass-card rounded-2xl py-16 px-8 sm:p-20 border border-white/10 shadow-2xl relative overflow-hidden text-center flex flex-col items-center gap-6">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-blue-500/5 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-bold tracking-wider select-none">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Ready to scale processing?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight max-w-2xl leading-[1.15]">
            Ready to Accelerate Your Selection Pipeline?
          </h2>

          <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Register your environment profile, load open job description requirements or applicant document vectors, and let automated matrix matching execute the heavy calculation work.
          </p>

          <div className="pt-4 w-full sm:w-auto">
            <Link to="/login">
              <button className="w-full sm:w-auto h-12 px-10 rounded-xl text-xs font-bold uppercase tracking-wider text-white lp-gradient-primary shadow-xl shadow-indigo-500/25 hover:opacity-95 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-2.5 cursor-pointer">
                Start Sourcing Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER TERMINAL ────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 bg-slate-950 select-none">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="Talent Vector" className="w-4 h-4 opacity-50 object-contain" />
            <span className="font-sans font-black text-xs uppercase tracking-wider text-white/50">Talent Vector</span>
          </div>
          <p className="text-xs text-slate-600 tracking-wide">
            © 2026 Talent Vector · All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}