import * as React from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { 
  Sparkles, 
  Zap, 
  Briefcase, 
  UserRound, 
  ArrowRight, 
  CheckCircle2, 
  Code2, 
  Cpu, 
  Layers, 
  Mail, 
  ShieldCheck, 
  Check, 
  Plus
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
  const navigate = useNavigate()
  const [selectedSkills, setSelectedSkills] = React.useState(["React", "TypeScript", "CSS"])
  const [roleTab, setRoleTab] = React.useState("recruiter") // 'recruiter' | 'seeker'

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
          50% { transform: translate(50px, -30px) scale(1.1); }
        }
        @keyframes float-slow-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-60px, 40px) scale(1.15); }
        }
        .animate-float-1 {
          animation: float-slow-1 20s infinite ease-in-out;
        }
        .animate-float-2 {
          animation: float-slow-2 25s infinite ease-in-out;
        }
        .bg-grid {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
        }
        .glass-card {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .glass-header {
          background: rgba(10, 15, 30, 0.7);
          backdrop-filter: blur(12px);
          border-b: 1px solid rgba(255, 255, 255, 0.06);
        }
        .gradient-text {
          background: linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .gradient-primary {
          background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
        }
      `}</style>

      {/* Background Grid & Noise */}
      <div className="absolute inset-0 bg-grid z-0 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0 pointer-events-none" />

      {/* Animated Glowing Mesh Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[130px] animate-float-1 pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-indigo-500/10 rounded-full blur-[160px] animate-float-2 pointer-events-none z-0" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-header select-none">
        <div className="max-w-[95%] xl:max-w-[1536px] 2xl:max-w-[1720px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="Talent Vector" className="w-10 h-10 object-contain" />
            <span className="font-display font-black text-xl md:text-2xl uppercase tracking-tight text-white">Talent Vector</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm md:text-base font-black uppercase tracking-widest text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#roles" className="hover:text-white transition-colors">Workspaces</a>
          </nav>

          <Link to="/login">
            <button className="h-12 px-8 rounded-2xl text-sm font-black uppercase tracking-widest text-white gradient-primary shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
              Login / Sign Up
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-20 md:pt-32 md:pb-28 max-w-[95%] xl:max-w-[1536px] 2xl:max-w-[1720px] mx-auto px-6 text-center space-y-10">
        {/* Powered Badge */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-300 text-xs md:text-sm font-black uppercase tracking-widest mx-auto select-none animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span>Vector Similarity Matching Engine</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none max-w-[95%] xl:max-w-[1536px] mx-auto font-display">
          <span className="gradient-text">Vector Sourcing. </span>
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-indigo-300 bg-clip-text text-transparent">AI Screening. Seamless Matching.</span>
        </h1>

        <p className="text-base md:text-lg lg:text-xl text-slate-400 max-w-4xl mx-auto leading-relaxed font-medium">
          Say goodbye to keyword-stuffing hacks. Talent Vector extracts and matches professional skills using vector space cosine similarity to find the most accurate matches.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
          <Link to="/login">
            <button className="h-14 px-10 rounded-2xl text-sm md:text-base font-black uppercase tracking-widest text-white gradient-primary shadow-xl shadow-blue-500/25 hover:shadow-blue-500/35 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2 cursor-pointer">
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <a href="#demo">
            <button className="h-14 px-10 rounded-2xl text-sm md:text-base font-black uppercase tracking-widest text-slate-300 border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/50 hover:scale-[1.02] active:scale-[0.97] transition-all cursor-pointer">
              Try Interactive Demo
            </button>
          </a>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="relative z-10 py-24 max-w-[95%] xl:max-w-[1536px] 2xl:max-w-[1720px] mx-auto px-6 space-y-16">
        <div className="text-center space-y-4">
          <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-primary">Core Capabilities</span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight font-display">Engineered for Modern Hiring</h2>
          <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto">High-performance tools to filter out noise and fast-track hiring.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Card 1 */}
          <div className="glass-card p-10 rounded-3xl space-y-7 hover:-translate-y-1 transition-all duration-300 hover:border-primary/30 group">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <Cpu className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <h3 className="font-display font-black text-base md:text-lg uppercase tracking-wider text-white">Neural Skill Matcher</h3>
              <p className="text-sm leading-relaxed font-medium text-slate-400">
                Uses the Vector Space Model to calculate true skill match coefficients, completely ignoring resumes loaded with redundant keywords.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-10 rounded-3xl space-y-7 hover:-translate-y-1 transition-all duration-300 hover:border-primary/30 group">
            <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <Layers className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <h3 className="font-display font-black text-base md:text-lg uppercase tracking-wider text-white">Applicant Tracking</h3>
              <p className="text-sm leading-relaxed font-medium text-slate-400">
                Move applicants seamlessly through custom hiring pipelines from "Applied", "Screened", "Under Review" to "Hired".
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-10 rounded-3xl space-y-7 hover:-translate-y-1 transition-all duration-300 hover:border-primary/30 group">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <Mail className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <h3 className="font-display font-black text-base md:text-lg uppercase tracking-wider text-white">Resend Dispatcher</h3>
              <p className="text-sm leading-relaxed font-medium text-slate-400">
                Reach out to matching candidates with 1-click branded interview invites. Integration with Resend ensures high email deliverability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Cosine Similarity Demo */}
      <section id="demo" className="relative z-10 py-24 max-w-[95%] xl:max-w-[1536px] 2xl:max-w-[1680px] mx-auto px-6 space-y-16">
        <div className="text-center space-y-4">
          <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-primary">Live Playground</span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight font-display">Test the Match Algorithm</h2>
          <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto">Toggle candidate skills below to watch the matching score recalculate in real-time.</p>
        </div>

        <div className="glass-card p-10 rounded-[2rem] grid md:grid-cols-12 gap-10 items-center border border-white/10 shadow-2xl relative overflow-hidden">
          
          {/* Interactive Skills Toggler - Left */}
          <div className="md:col-span-7 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400">Target JD Requirements</span>
                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-md">Fixed Target</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {DEMO_JD_SKILLS.map(skill => (
                  <span key={skill} className="px-4.5 py-2.5 rounded-2xl text-sm md:text-base font-black uppercase tracking-wider bg-slate-900 border border-slate-800 text-indigo-300 select-none">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 block">Extracted Candidate Skills (Click to toggle)</span>
              <div className="flex flex-wrap gap-2.5">
                {DEMO_ALL_SKILLS.map(skill => {
                  const isSelected = selectedSkills.includes(skill)
                  const isJdSkill = DEMO_JD_SKILLS.includes(skill)
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-4.5 py-2.5 rounded-2xl text-sm md:text-base font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? "bg-primary text-white shadow-md shadow-primary/25 border border-primary/20 scale-105"
                          : "bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-slate-400"
                      }`}
                    >
                      {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{skill}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Dynamic Score Indicator - Right */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-[2rem] border border-slate-800 relative min-h-[260px]">
            <span className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Match Strength</span>
            
            {/* Score circle */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Glow background */}
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-95" />
              
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={263.89}
                  strokeDashoffset={263.89 - (263.89 * similarityScore) / 100}
                  className="transition-all duration-500 ease-out"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl font-black font-display text-white transition-all duration-300">{similarityScore}%</span>
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 mt-1">Cosine Sim</span>
              </div>
            </div>

            {/* Formula visualization */}
            <div className="mt-8 text-xs md:text-sm font-mono text-slate-500 select-none">
              cos(θ) = (A · B) / (||A|| × ||B||)
            </div>
          </div>

        </div>
      </section>

      {/* Workspace Comparison Tabs */}
      <section id="roles" className="relative z-10 py-24 max-w-[95%] xl:max-w-[1536px] 2xl:max-w-[1680px] mx-auto px-6 space-y-16">
        <div className="text-center space-y-4">
          <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-primary">Tailored Workspaces</span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight font-display">Specialized Environments</h2>
          <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto">Different dashboards designed explicitly for recruiter pipelines and candidate profile showcases.</p>
        </div>

        {/* Sliding Tab selector */}
        <div className="flex max-w-md mx-auto bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 shadow-inner relative h-14 select-none">
          <div 
            className="absolute top-1 bottom-1 bg-white/5 rounded-xl border border-white/5 transition-all duration-500 ease-out z-0"
            style={{ 
              left: roleTab === "recruiter" ? "6px" : "calc(50% + 2px)", 
              width: "calc(50% - 8px)" 
            }}
          />
          <button
            onClick={() => setRoleTab("recruiter")}
            className={`flex-1 relative z-10 flex items-center justify-center gap-3 font-black text-xs md:text-sm uppercase tracking-widest transition-all duration-300 cursor-pointer ${
              roleTab === "recruiter" ? "text-indigo-300" : "text-slate-500 hover:text-slate-400"
            }`}
          >
            <Briefcase className="w-5 h-5" /> Recruiter
          </button>
          <button
            onClick={() => setRoleTab("seeker")}
            className={`flex-1 relative z-10 flex items-center justify-center gap-3 font-black text-xs md:text-sm uppercase tracking-widest transition-all duration-300 cursor-pointer ${
              roleTab === "seeker" ? "text-indigo-300" : "text-slate-500 hover:text-slate-400"
            }`}
          >
            <UserRound className="w-5 h-5" /> Job Seeker
          </button>
        </div>

        {/* Tab content */}
        <div className="glass-card p-10 rounded-[2rem] min-h-[300px] flex items-center border border-white/5 relative overflow-hidden transition-all duration-500">
          {roleTab === "recruiter" ? (
            <div className="grid md:grid-cols-12 gap-10 items-center w-full animate-fadeIn">
              <div className="md:col-span-7 space-y-8">
                <div className="space-y-3">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Employer Command Center</span>
                  <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight font-display">Recruiter Pipeline</h3>
                  <p className="text-sm md:text-base text-slate-400 font-medium">Manage open job pipelines, bulk parse resumes, and invite candidates directly.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-sm md:text-base text-slate-300 font-semibold">Bulk Resume Parser (supports PDFs, Word Documents, TXT)</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-sm md:text-base text-slate-300 font-semibold">Dynamic NLP parsing maps extracted candidate skills case-insensitively</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-sm md:text-base text-slate-300 font-semibold">1-Click branded interview invites sent via high-reputation email campaigns</p>
                  </div>
                </div>
                <Link to="/login">
                  <Button className="font-bold text-xs md:text-sm uppercase tracking-widest px-8 h-12 rounded-2xl gradient-primary border-0 text-white shadow-md cursor-pointer flex items-center gap-2 mt-4">
                    <span>Access Recruiter Suite</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="md:col-span-5 bg-slate-900/30 p-8 rounded-[2rem] border border-slate-800/60 shadow-inner flex flex-col justify-center min-h-[260px]">
                <div className="space-y-5 font-mono text-xs md:text-sm text-slate-500">
                  <div className="flex justify-between border-b border-slate-800 pb-3">
                    <span className="text-slate-500">Job Pipeline</span>
                    <span className="text-slate-300 font-bold">Node.js Engineer</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-3">
                    <span className="text-slate-500">Target Experience</span>
                    <span className="text-slate-300 font-bold">3+ Years</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-3">
                    <span className="text-slate-505">Required Skills</span>
                    <span className="text-slate-300 font-bold">["Node.js", "Docker"]</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-505">AI Scored Candidates</span>
                    <span className="text-indigo-400 font-bold">15 Screened</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-12 gap-10 items-center w-full animate-fadeIn">
              <div className="md:col-span-7 space-y-8">
                <div className="space-y-3">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Professional Identity</span>
                  <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight font-display">Job Seeker Profiles</h3>
                  <p className="text-sm md:text-base text-slate-400 font-medium">Build your verified candidate identity, parse your CV instantly, and get matched to jobs.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-sm md:text-base text-slate-300 font-semibold">Instant CV parser creates your profile structure in seconds</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-sm md:text-base text-slate-300 font-semibold">Naive Bayes sector classifier predicts and categorizes your career sector</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-sm md:text-base text-slate-300 font-semibold">Auto-match logic fetches top job openings aligned with your skill vectors</p>
                  </div>
                </div>
                <Link to="/login">
                  <Button className="font-bold text-xs md:text-sm uppercase tracking-widest px-8 h-12 rounded-2xl gradient-primary border-0 text-white shadow-md cursor-pointer flex items-center gap-2 mt-4">
                    <span>Create Seeker Profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="md:col-span-5 bg-slate-900/30 p-8 rounded-[2rem] border border-slate-800/60 shadow-inner flex flex-col justify-center min-h-[260px]">
                <div className="space-y-5 font-mono text-xs md:text-sm text-slate-500">
                  <div className="flex justify-between border-b border-slate-800 pb-3">
                    <span className="text-slate-500">Profile Owner</span>
                    <span className="text-slate-300 font-bold">Haris Khan</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-3">
                    <span className="text-slate-500">Predicted Sector</span>
                    <span className="text-indigo-400 font-bold">Technology</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-3">
                    <span className="text-slate-500">Total Experience</span>
                    <span className="text-slate-300 font-bold">4.5 Years</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-505">Active Openings Match</span>
                    <span className="text-slate-300 font-bold">3 Pipelines</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="relative z-10 py-24 max-w-[95%] xl:max-w-[1536px] 2xl:max-w-[1680px] mx-auto px-6 text-center">
        <div className="glass-card p-16 md:p-24 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden space-y-8">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-blue-500/10 pointer-events-none" />
          
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase font-display leading-none">
            Ready to Upgrade Your Hiring?
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Register your profile session, upload open JDs or candidate CVs, and let the vector matching math do the hard work.
          </p>

          <Link to="/login" className="inline-block pt-4">
            <button className="h-14 px-10 rounded-2xl text-sm md:text-base font-black uppercase tracking-widest text-white gradient-primary shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2.5 cursor-pointer mx-auto">
              <span>Start Sourcing Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950 py-16 select-none">
        <div className="max-w-[95%] xl:max-w-[1536px] 2xl:max-w-[1720px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3.5">
            <img src="/favicon.svg" alt="Talent Vector" className="w-9 h-9 object-contain" />
            <span className="font-display font-black text-base md:text-lg uppercase tracking-tight text-white">Talent Vector</span>
          </div>
          <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-500">
            © 2026 Talent Vector. All rights reserved. Vectorized Recruitment System.
          </p>
        </div>
      </footer>
    </div>
  )
}

function Button({ children, className, ...props }) {
  return (
    <button
      className={`h-11 px-6 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
