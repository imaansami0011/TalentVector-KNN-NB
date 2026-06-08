import * as React from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
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

const DEMO_JD_SKILLS = ["React", "TypeScript", "Node.js", "Docker", "TailwindCSS"]
const DEMO_ALL_SKILLS = ["React", "TypeScript", "Node.js", "Docker", "TailwindCSS", "Python", "GraphQL", "AWS", "SQL"]

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
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden selection:bg-primary/25">
      <style>{`
        @keyframes float-slow-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, -20px) scale(1.08); }
        }
        @keyframes float-slow-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-40px, 30px) scale(1.1); }
        }
        .animate-float-1 { animation: float-slow-1 22s infinite ease-in-out; }
        .animate-float-2 { animation: float-slow-2 28s infinite ease-in-out; }
        .lp-bg-grid {
          background-size: 48px 48px;
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px);
        }
        .lp-glass-card {
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.07);
        }
        .lp-glass-header {
          background: rgba(8, 12, 24, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .lp-gradient-text {
          background: linear-gradient(135deg, #ffffff 20%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-gradient-primary {
          background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
        }
        .lp-section-divider {
          border-top: 1px solid rgba(255,255,255,0.04);
        }
      `}</style>

      {/* Background */}
      <div className="absolute inset-0 lp-bg-grid z-0 pointer-events-none" />
      <div className="absolute top-[-15%] left-[-8%] w-[700px] h-[700px] bg-indigo-600/8 rounded-full blur-[140px] animate-float-1 pointer-events-none z-0" />
      <div className="absolute bottom-[-15%] right-[-8%] w-[700px] h-[700px] bg-blue-500/8 rounded-full blur-[160px] animate-float-2 pointer-events-none z-0" />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 lp-glass-header select-none">
        <div className="w-full px-6 md:px-12 lg:px-20 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <img src="/favicon.svg" alt="Talent Vector" className="w-4.5 h-4.5 object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-sm uppercase tracking-widest text-white">
                Talent Vector
              </span>
              <span className="text-[8px] font-bold text-indigo-400/80 uppercase tracking-[0.18em] mt-1">
                Vectorized Recruitment
              </span>
            </div>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              v2.0
            </span>
          </div>

          {/* Live status — center */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[9px] font-bold uppercase tracking-widest">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            AI Matching Engine · Active
          </div>

          {/* CTA */}
          <Link to="/login">
            <button className="h-9 px-5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white lp-gradient-primary shadow-md hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-indigo-400/10">
              Login / Sign Up
            </button>
          </Link>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative z-10 pt-24 pb-20 px-6 md:px-12 lg:px-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/5 text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-8 select-none">
          <Sparkles className="w-3 h-3" />
          <span>Vector Similarity Matching Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] max-w-3xl mx-auto font-display mb-6">
          <span className="lp-gradient-text">Vector Sourcing.</span>{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-indigo-200 bg-clip-text text-transparent">
            AI Screening.
          </span>
          <br />
          <span className="text-white">Seamless Matching.</span>
        </h1>

        <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed font-normal mb-10">
          Say goodbye to keyword-stuffing hacks. Talent Vector extracts and matches professional skills using vector space cosine similarity to find the most accurate candidates.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/login">
            <button className="h-11 px-6 rounded-xl text-sm font-semibold text-white lp-gradient-primary hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/25">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <a href="#demo">
            <button className="h-11 px-6 rounded-xl text-sm font-medium text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-300 bg-slate-900/20 hover:bg-slate-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
              Try Interactive Demo
            </button>
          </a>
        </div>

        {/* Stat strip */}
        <div className="flex items-center justify-center gap-8 mt-14 pt-10 border-t border-white/5 text-center">
          {[
            { val: "98%", label: "Match Precision" },
            { val: "<2s", label: "Screening Time" },
            { val: "10×", label: "Faster Hiring" },
          ].map(({ val, label }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-2xl font-extrabold text-white font-display">{val}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-20 px-6 md:px-12 lg:px-20 lp-section-divider">
        <div className="text-center mb-12">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 block">Core Capabilities</span>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-3">Engineered for Modern Hiring</h2>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">High-performance tools to filter out noise and fast-track hiring.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-[1400px] mx-auto">
          {[
            {
              icon: <Cpu className="w-5 h-5" />,
              color: "indigo",
              title: "Neural Skill Matcher",
              desc: "Uses the Vector Space Model to calculate true skill match coefficients, completely ignoring resumes loaded with redundant keywords.",
            },
            {
              icon: <Layers className="w-5 h-5" />,
              color: "blue",
              title: "Applicant Tracking",
              desc: `Move applicants seamlessly through custom hiring pipelines from "Applied", "Screened", "Under Review" to "Hired".`,
            },
            {
              icon: <Mail className="w-5 h-5" />,
              color: "emerald",
              title: "Resend Dispatcher",
              desc: "Reach out to matching candidates with 1-click branded interview invites via high-reputation email campaigns.",
            },
          ].map(({ icon, color, title, desc }) => (
            <div
              key={title}
              className="lp-glass-card p-7 rounded-2xl space-y-4 hover:-translate-y-1 transition-all duration-300 group cursor-default"
              style={{ "--hover-border": `rgba(99,102,241,0.3)` }}
            >
              <div className={`w-11 h-11 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center text-${color}-400 group-hover:bg-${color === "indigo" ? "primary" : color+"-600"} group-hover:text-white group-hover:border-transparent transition-all duration-300`}>
                {icon}
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-bold text-base text-white">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── INTERACTIVE DEMO ───────────────────────────────────── */}
      <section id="demo" className="relative z-10 py-20 px-6 md:px-12 lg:px-20 lp-section-divider">
        <div className="text-center mb-12">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 block">Live Playground</span>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-3">Test the Match Algorithm</h2>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">Toggle candidate skills to watch the matching score recalculate in real-time.</p>
        </div>

        <div className="lp-glass-card rounded-2xl grid md:grid-cols-12 gap-0 border border-white/8 shadow-2xl overflow-hidden max-w-[1400px] mx-auto">
          {/* Left — Skills toggler */}
          <div className="md:col-span-7 p-8 space-y-7 border-r border-white/5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200">Target JD Requirements</span>
                <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest bg-indigo-500/15 px-2.5 py-1 rounded-md border border-indigo-500/20">Fixed Target</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DEMO_JD_SKILLS.map(skill => (
                  <span key={skill} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-sm font-semibold text-slate-200 block">Candidate Skills <span className="text-slate-500 font-normal">(click to toggle)</span></span>
              <div className="flex flex-wrap gap-2">
                {DEMO_ALL_SKILLS.map(skill => {
                  const isSelected = selectedSkills.includes(skill)
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-primary/90 text-white shadow-md shadow-primary/20 border border-primary/30"
                          : "bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      {skill}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right — Score display */}
          <div className="md:col-span-5 p-8 flex flex-col items-center justify-center bg-slate-900/30 gap-6">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Match Strength</span>
            
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/8 rounded-full blur-2xl" />
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.04)" strokeWidth="7" fill="transparent" />
                <circle
                  cx="50" cy="50" r="42"
                  stroke="url(#progressGrad)"
                  strokeWidth="7"
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
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold font-display text-white">{similarityScore}%</span>
                <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase mt-1">Cosine Sim</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500 select-none text-center">
              cos(θ) = (A · B) / (||A|| × ||B||)
            </div>
          </div>
        </div>
      </section>

      {/* ── WORKSPACE TABS ─────────────────────────────────────── */}
      <section id="roles" className="relative z-10 py-20 px-6 md:px-12 lg:px-20 lp-section-divider">
        <div className="text-center mb-12">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 block">Tailored Workspaces</span>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-3">Specialized Environments</h2>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">Different dashboards designed explicitly for recruiter pipelines and candidate showcases.</p>
        </div>

        {/* Tab selector */}
        <div className="flex max-w-[260px] mx-auto bg-slate-900/60 p-1 rounded-xl border border-slate-800 relative h-11 select-none mb-8">
          <div
            className="absolute top-1 bottom-1 bg-indigo-500/15 border border-indigo-500/20 rounded-lg transition-all duration-400 ease-out z-0"
            style={{ left: roleTab === "recruiter" ? "4px" : "calc(50% + 2px)", width: "calc(50% - 6px)" }}
          />
          <button
            onClick={() => setRoleTab("recruiter")}
            className={`flex-1 relative z-10 flex items-center justify-center gap-2 font-semibold text-xs tracking-wider transition-all duration-300 cursor-pointer rounded-lg ${
              roleTab === "recruiter" ? "text-indigo-300" : "text-slate-500 hover:text-slate-400"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Recruiter
          </button>
          <button
            onClick={() => setRoleTab("seeker")}
            className={`flex-1 relative z-10 flex items-center justify-center gap-2 font-semibold text-xs tracking-wider transition-all duration-300 cursor-pointer rounded-lg ${
              roleTab === "seeker" ? "text-indigo-300" : "text-slate-500 hover:text-slate-400"
            }`}
          >
            <UserRound className="w-3.5 h-3.5" /> Job Seeker
          </button>
        </div>

        {/* Tab content */}
        <div className="lp-glass-card rounded-2xl border border-white/6 shadow-xl overflow-hidden max-w-[1400px] mx-auto">
          {roleTab === "recruiter" ? (
            <div className="grid md:grid-cols-12 gap-0 items-stretch animate-fadeIn">
              <div className="md:col-span-7 p-8 space-y-6">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Employer Command Center</span>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Recruiter Pipeline</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">Manage open job pipelines, bulk parse resumes, and invite candidates directly.</p>
                </div>
                <div className="space-y-3">
                  {[
                    "Bulk Resume Parser (supports PDFs, Word Documents, TXT)",
                    "Dynamic NLP parsing maps extracted candidate skills case-insensitively",
                    "1-Click branded interview invites via high-reputation email campaigns",
                  ].map(item => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
                <Link to="/login">
                  <button className="mt-2 h-10 px-5 rounded-xl text-xs font-bold uppercase tracking-wider text-white lp-gradient-primary shadow-md cursor-pointer flex items-center gap-2 hover:opacity-90 hover:scale-[1.02] transition-all">
                    Access Recruiter Suite <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
              <div className="md:col-span-5 border-l border-white/5 p-8 bg-slate-900/30 flex flex-col justify-center">
                <div className="space-y-3 font-mono text-xs">
                  {[
                    ["Job Pipeline", "Node.js Engineer"],
                    ["Target Experience", "3+ Years"],
                    ["Required Skills", `["Node.js", "Docker"]`],
                    ["AI Scored Candidates", "15 Screened"],
                  ].map(([k, v], i) => (
                    <div key={k} className={`flex justify-between py-2.5 ${i < 3 ? "border-b border-slate-800/60" : ""}`}>
                      <span className="text-slate-500">{k}</span>
                      <span className={i === 3 ? "text-indigo-400 font-bold" : "text-slate-200 font-medium"}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-12 gap-0 items-stretch animate-fadeIn">
              <div className="md:col-span-7 p-8 space-y-6">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Professional Identity</span>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Job Seeker Profiles</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">Build your verified candidate identity, parse your CV instantly, and get matched to jobs.</p>
                </div>
                <div className="space-y-3">
                  {[
                    "Instant CV parser creates your profile structure in seconds",
                    "Naive Bayes sector classifier predicts and categorizes your career sector",
                    "Auto-match logic fetches top job openings aligned with your skill vectors",
                  ].map(item => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
                <Link to="/login">
                  <button className="mt-2 h-10 px-5 rounded-xl text-xs font-bold uppercase tracking-wider text-white lp-gradient-primary shadow-md cursor-pointer flex items-center gap-2 hover:opacity-90 hover:scale-[1.02] transition-all">
                    Create Seeker Profile <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
              <div className="md:col-span-5 border-l border-white/5 p-8 bg-slate-900/30 flex flex-col justify-center">
                <div className="space-y-3 font-mono text-xs">
                  {[
                    ["Profile Owner", "Haris Khan"],
                    ["Predicted Sector", "Technology"],
                    ["Total Experience", "4.5 Years"],
                    ["Active Openings Match", "3 Pipelines"],
                  ].map(([k, v], i) => (
                    <div key={k} className={`flex justify-between py-2.5 ${i < 3 ? "border-b border-slate-800/60" : ""}`}>
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

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 md:px-12 lg:px-20 lp-section-divider">
        <div className="max-w-[1400px] mx-auto lp-glass-card rounded-2xl p-12 md:p-16 border border-white/8 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/12 via-transparent to-blue-500/8 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

          <div className="relative z-10 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-[9px] font-bold uppercase tracking-widest mb-2">
              <Zap className="w-3 h-3" /> Ready to start?
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-display">
              Ready to Upgrade Your Hiring?
            </h2>
            <p className="text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
              Register your profile, upload open JDs or candidate CVs, and let the vector matching math do the hard work.
            </p>
            <div className="pt-2">
              <Link to="/login">
                <button className="h-12 px-8 rounded-xl text-sm font-bold uppercase tracking-wider text-white lp-gradient-primary shadow-xl shadow-blue-500/20 hover:opacity-90 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2 cursor-pointer mx-auto">
                  Start Sourcing Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 bg-slate-950 select-none">
        <div className="w-full px-6 md:px-12 lg:px-20 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Talent Vector" className="w-4.5 h-4.5 object-contain opacity-60" />
            <span className="font-display font-extrabold text-xs uppercase tracking-widest text-white/60">Talent Vector</span>
          </div>
          <p className="text-[10px] text-slate-600 tracking-wide">
            © 2026 Talent Vector · All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
