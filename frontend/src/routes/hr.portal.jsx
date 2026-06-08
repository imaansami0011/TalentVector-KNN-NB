import * as React from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AppShell } from "../components/app-shell"
import { AdPanel } from "../components/ad-panel"
import { useQuery } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
import { 
  Plus, 
  Briefcase, 
  Users, 
  TrendingUp, 
  Star,
  ChevronRight,
  Sparkles,
  Loader2,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Upload
} from "lucide-react"

export const Route = createFileRoute("/hr/portal")({
  component: RecruiterPortalDashboard,
})

// Top-level utility function for logo color generation
const getCompanyLogoStyle = (name) => {
  if (!name) return { bg: 'from-slate-500 to-slate-700', text: 'text-white' }
  const trimmed = name.trim()
  let charCode = 0
  for (let i = 0; i < trimmed.length; i++) {
    charCode += trimmed.charCodeAt(i)
  }
  const gradients = [
    { bg: 'from-indigo-500 to-indigo-600', text: 'text-indigo-50' },
    { bg: 'from-violet-500 to-violet-600', text: 'text-violet-50' },
    { bg: 'from-fuchsia-500 to-fuchsia-600', text: 'text-fuchsia-50' },
    { bg: 'from-emerald-500 to-emerald-600', text: 'text-emerald-50' },
    { bg: 'from-blue-500 to-blue-600', text: 'text-blue-50' },
    { bg: 'from-amber-500 to-amber-600', text: 'text-amber-50' },
    { bg: 'from-rose-500 to-rose-600', text: 'text-rose-50' },
    { bg: 'from-indigo-600 to-blue-500', text: 'text-indigo-50' },
    { bg: 'from-emerald-600 to-teal-500', text: 'text-emerald-50' },
  ]
  const index = charCode % gradients.length
  return gradients[index]
}

function RecruiterPortalDashboard() {
  const navigate = useNavigate()
  const userId = localStorage.getItem("user_id")
  const userName = localStorage.getItem("user_name") || "Recruiter"

  // Fetch stats from /recruiter/stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["recruiterStats", userId],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/stats`, {
        headers: { 
          "x-user-id": userId || "",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
      })
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
    enabled: !!userId,
  })

  // Fetch JDs from /recruiter/jds
  const { data: jdsData, isLoading: jdsLoading } = useQuery({
    queryKey: ["recruiterJds", userId],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/jds`, {
        headers: { 
          "x-user-id": userId || "",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
      })
      if (!res.ok) throw new Error("Failed to fetch JDs")
      return res.json()
    },
    enabled: !!userId,
  })

  const jds = jdsData || []
  const stats = statsData || {
    activeJobs: 0,
    resumesScreened: 0,
    avgMatch: 75,
    shortlisted: 0,
    pipeline: { new: 0, review: 0, rejected: 0, shortlisted: 0, hired: 0 }
  }

  const isPageLoading = statsLoading || jdsLoading

  return (
    <AppShell rightPanel={<AdPanel />}>
      <div className="p-6 md:p-8 space-y-8 w-full animate-fadeIn select-none">
        
        {/* Header section with Premium typography */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">HR Command Center</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none font-display">Recruiter Dashboard</h1>
            <p className="text-xs text-slate-500 font-medium">Manage job descriptions, track screenings, and source matches.</p>
          </div>
          
          <Link to="/hr/jobs/new">
            <Button className="h-11 shadow-lg shadow-primary/25 hover:shadow-primary/30 transition-all font-bold">
              <Plus className="w-4 h-4 mr-1.5" />
              Create Job Pipeline
            </Button>
          </Link>
        </div>

        {isPageLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Loading Recruiter Portal...</p>
          </div>
        ) : (
          <>
            {/* Workflow Overview */}
            <div className="space-y-8">
              <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display">How it works</h2>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Follow this seamless three-step pipeline to discover and connect with top-tier talent effortlessly.</p>
              </div>

              <div className="relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-slate-200 to-transparent -translate-y-1/2 z-0" />

                <div className="grid md:grid-cols-3 gap-8 relative z-10">
                  
                  {/* Step 1: Upload Job Description Card */}
                  <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group rounded-3xl">
                    <CardContent className="p-8 text-center flex flex-col items-center h-full">
                      <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm mb-6 relative">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h3 className="font-display font-black text-base uppercase tracking-wider text-slate-900">Upload JD</h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Ingest a new job description to define requirements and start matching candidates.</p>
                      </div>
                      <Link to="/hr/jobs/new" className="w-full mt-6 block">
                        <Button variant="outline" className="w-full font-bold uppercase tracking-widest text-[10px] border-slate-200 hover:border-primary hover:bg-primary hover:text-white transition-all rounded-xl h-10">
                          Upload JD
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Step 2: Match Candidates Card */}
                  <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group rounded-3xl">
                    <CardContent className="p-8 text-center flex flex-col items-center h-full">
                      <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-sm mb-6 relative">
                        <Sparkles className="w-7 h-7" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h3 className="font-display font-black text-base uppercase tracking-wider text-slate-900">Match Candidates</h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Rank the candidate profiles dynamically using NLP semantic similarity against the JD.</p>
                      </div>
                      <Link to="/candidates" className="w-full mt-6 block">
                        <Button variant="outline" className="w-full font-bold uppercase tracking-widest text-[10px] border-slate-200 hover:border-blue-500 hover:bg-blue-500 hover:text-white transition-all rounded-xl h-10">
                          Match Candidates
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Step 3: View Talent Pool Card */}
                  <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group rounded-3xl">
                    <CardContent className="p-8 text-center flex flex-col items-center h-full">
                      <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm mb-6 relative">
                        <Users className="w-7 h-7" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h3 className="font-display font-black text-base uppercase tracking-wider text-slate-900">View Talent Pool</h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Browse through candidate cards, view detailed matches, and toggle shortlisted pipeline status.</p>
                      </div>
                      <Link to="/candidates" className="w-full mt-6 block">
                        <Button variant="outline" className="w-full font-bold uppercase tracking-widest text-[10px] border-slate-200 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white transition-all rounded-xl h-10">
                          View Talent Pool
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                </div>
              </div>
            </div>

            {/* Job Descriptions Grid */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between space-y-0 gap-4">
                <div>
                  <CardTitle>Active Pipelines</CardTitle>
                  <CardDescription>Select any previously defined job requirement to view candidate matching lists.</CardDescription>
                </div>
                <Link to="/hr/jobs">
                  <Button variant="outline" size="sm" className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 rounded-xl">
                    Manage Jobs
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border">
                {jds.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No job pipelines yet</p>
                      <p className="text-[10px] text-slate-400">Click the button above to start your first job pipeline.</p>
                    </div>
                  </div>
                ) : (
                  jds.map((jd) => {
                    const logoStyle = getCompanyLogoStyle(jd.title)
                    const initial = jd.title ? jd.title.trim().charAt(0).toUpperCase() : 'J'
                    return (
                      <div key={jd.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/5 transition-all gap-4 border-b border-slate-100 last:border-0 group select-none">
                        <div className="flex items-start gap-4">
                          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${logoStyle.bg} flex items-center justify-center font-display font-black text-base ${logoStyle.text} shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 select-none`}>
                            {initial}
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-display text-sm font-extrabold text-slate-900 uppercase leading-none tracking-tight group-hover:text-primary transition-colors">{jd.title}</h3>
                              <Badge className={`h-5 text-[8px] font-black uppercase tracking-wider ${
                                (jd.location_type || "Remote").toLowerCase() === 'remote'
                                  ? 'bg-blue-500/10 text-blue-600 border border-blue-200/50 hover:bg-blue-500/15'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-150'
                              }`}>
                                {jd.location_type || "Remote"}
                              </Badge>
                              {/* Prominent experience required badge in the job tile */}
                              <Badge className="h-5 text-[8px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 border border-indigo-200/55 flex items-center gap-1 hover:bg-indigo-500/15">
                                <Sparkles className="w-2 h-2 text-indigo-500" />
                                <span>{jd.min_experience}+ Years Exp Required</span>
                              </Badge>
                            </div>
                            
                            {/* Metadata row */}
                            <div className="flex gap-4 text-[10px] text-slate-400 font-semibold pt-1">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-500 font-medium">{jd.mode || jd.location_type || "Remote"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-500 font-medium">Min {jd.min_experience} years exp</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-500 font-medium">Created {jd.created_at ? new Date(jd.created_at).toLocaleDateString() : "Recently"}</span>
                              </div>
                            </div>

                            {/* Core skills badges */}
                            {jd.core_skills && jd.core_skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1.5">
                                {jd.core_skills.map((skill, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="outline" 
                                    className="text-[8px] px-2 py-1 border-slate-200 bg-slate-50/50 text-slate-400 uppercase font-black tracking-wider rounded-lg hover:text-slate-650 hover:bg-slate-100/50 transition-all duration-300"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Button 
                            size="sm"
                            onClick={() => navigate({ to: `/hr/jobs/${jd.id}/results` })}
                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest bg-primary text-white shadow-md hover:bg-primary/95 transition-all rounded-xl"
                          >
                            View Match Results
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* Pipeline Distribution Map */}
            <Card className="overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-primary via-blue-400 to-emerald-400" />
              <CardHeader className="pb-4">
                <CardTitle>Pipeline Breakdown</CardTitle>
                <CardDescription>Overall distribution across hiring states.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  
                  {/* Applied */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span>Applied</span>
                      <span className="font-bold text-slate-700">
                        {(stats.pipeline?.new || 0) + (stats.pipeline?.review || 0)}
                      </span>
                    </div>
                    <Progress value={100} className="h-1.5 bg-slate-100" />
                  </div>

                  {/* Screened */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span>Screened</span>
                      <span className="font-bold text-slate-700">
                        {stats.resumesScreened}
                      </span>
                    </div>
                    <Progress value={80} className="h-1.5 bg-slate-100" />
                  </div>

                  {/* Under Review */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span>Under Review</span>
                      <span className="font-bold text-slate-700">
                        {stats.pipeline?.review || 0}
                      </span>
                    </div>
                    <Progress value={50} className="h-1.5 bg-slate-100" />
                  </div>

                  {/* Shortlisted */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span>Shortlisted</span>
                      <span className="font-bold text-primary">
                        {stats.pipeline?.shortlisted || stats.shortlisted || 0}
                      </span>
                    </div>
                    <Progress value={30} className="h-1.5 bg-slate-100" />
                  </div>

                  {/* Hired */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span>Hired</span>
                      <span className="font-bold text-emerald-600">
                        {stats.pipeline?.hired || 0}
                      </span>
                    </div>
                    <Progress value={10} className="h-1.5 bg-slate-100" />
                  </div>

                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
