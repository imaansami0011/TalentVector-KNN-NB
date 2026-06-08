import * as React from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AppShell } from "../components/app-shell"
import { AdPanel } from "../components/ad-panel"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Star,
  Sparkles,
  Loader2,
  Users,
  Filter,
  X,
  ChevronRight,
  TrendingUp,
  Award,
  UserCheck,
  AlertCircle
} from "lucide-react"

export const Route = createFileRoute("/candidates/")({
  validateSearch: (search) => ({
    q: search.q || "",
    domain: search.domain || "",
    status: search.status || "",
    jd_id: search.jd_id || "",
  }),
  component: CandidatesPage,
})

function CandidatesPage() {
  const navigate = useNavigate()
  const { q, domain, status, jd_id } = Route.useSearch()
  const userId = localStorage.getItem("user_id")
  const [localSearch, setLocalSearch] = React.useState(q || "")

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== q) {
        navigate({ search: (prev) => ({ ...prev, q: localSearch }) })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [localSearch])

  // Sync localSearch when URL query changes externally
  React.useEffect(() => {
    setLocalSearch(q || "")
  }, [q])

  // Fetch filter metadata (domains, statuses) from DB
  const { data: filtersData } = useQuery({
    queryKey: ["candidateFilters", userId],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/candidates/filters`, {
        headers: { 
          "x-user-id": userId || "",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
      })
      if (!res.ok) throw new Error("Failed to fetch filters")
      return res.json()
    },
    enabled: !!userId,
    staleTime: 30000, // Cache for 30 seconds
  })

  // Fetch JDs from /recruiter/jds
  const { data: jdsData } = useQuery({
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

  const domainsList = filtersData?.domains || []
  const statusesList = filtersData?.statuses || []
  const totalCount = filtersData?.total || 0

  // Fetch candidates from API
  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ["candidatesList", userId, q, domain, status, jd_id],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (q) params.append("q", q)
      if (domain) params.append("domain", domain)
      if (status) params.append("status", status)
      if (jd_id) params.append("jd_id", jd_id)
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/candidates?${params.toString()}`, {
        headers: { 
          "x-user-id": userId || "",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
      })
      if (!res.ok) throw new Error("Failed to fetch candidates")
      return res.json()
    },
    enabled: !!userId,
  })

  const filteredCandidates = candidatesData || []
  const hasActiveFilters = !!(q || domain || status)

  const selectDomain = (selectedDomain) => {
    navigate({
      search: (prev) => ({ ...prev, domain: selectedDomain === domain ? "" : selectedDomain })
    })
  }

  const selectStatus = (selectedStatus) => {
    navigate({
      search: (prev) => ({ ...prev, status: selectedStatus === status ? "" : selectedStatus })
    })
  }

  const selectJd = (selectedJdId) => {
    navigate({
      search: (prev) => ({ ...prev, jd_id: selectedJdId })
    })
  }

  const clearAllFilters = () => {
    setLocalSearch("")
    navigate({ search: { q: "", domain: "", status: "", jd_id: jd_id || "" } })
  }

  // Score color helper
  const getScoreColor = (score) => {
    if (score >= 85) return "text-emerald-600 bg-emerald-50 border-emerald-200"
    if (score >= 70) return "text-blue-600 bg-blue-50 border-blue-200"
    if (score >= 55) return "text-amber-600 bg-amber-50 border-amber-200"
    return "text-slate-500 bg-slate-50 border-slate-200"
  }

  // Status styling helper
  const getStatusStyle = (s) => {
    switch (s) {
      case "shortlisted": return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "review": return "bg-amber-50 text-amber-700 border-amber-200"
      case "rejected": return "bg-red-50 text-red-600 border-red-200"
      default: return "bg-blue-50 text-blue-700 border-blue-200"
    }
  }

  return (
    <AppShell rightPanel={<AdPanel />}>
      <div className="p-6 md:p-8 space-y-6 w-full animate-fadeIn select-none">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Candidate Database</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none font-display">Talent Pool</h1>
            <p className="text-xs text-slate-500 font-medium">
              Browse, search, and manage candidate profiles across your organization.
            </p>
          </div>
          
          {/* Stats mini bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-black text-primary">{totalCount}</span>
              <span className="text-[9px] font-bold text-primary/60 uppercase tracking-wider">Total</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-black text-emerald-600">{filteredCandidates.length}</span>
              <span className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-wider">Showing</span>
            </div>
          </div>
        </div>

        {/* Job Selection & Matching Score Warning Alert */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-fadeIn">
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Target Job Pipeline</h4>
              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Select a job pipeline to view calculated matching scores</p>
            </div>
            
            <div className="w-full sm:w-64">
              <select
                value={jd_id || ""}
                onChange={(e) => selectJd(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer font-semibold uppercase tracking-wider text-slate-700"
              >
                <option value="">-- Select Job Description --</option>
                {jdsData?.map((jd) => (
                  <option key={jd.id} value={jd.id}>
                    {jd.title} ({jd.min_experience}+ Yrs)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!jd_id && (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 gap-4 animate-fadeIn">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider">Job Description Match Missing</h4>
                  <p className="text-[11px] text-amber-755 font-bold max-w-2xl leading-relaxed">
                    {jdsData && jdsData.length > 0 
                      ? "Candidate matching scores are not active. Please select a Job Description pipeline from the dropdown above to view real computed scores relative to the role's skill and experience requirements."
                      : "You haven't uploaded or created any job descriptions yet. Please create a job pipeline to automatically calculate matching scores for candidates."}
                  </p>
                </div>
              </div>
              
              {(!jdsData || jdsData.length === 0) && (
                <Link to="/hr/jobs/new">
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl shrink-0 h-9 px-4">
                    Create Job Pipeline
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Search & Filters Card */}
        <Card className="border border-slate-200/80 shadow-sm bg-white p-3.5 space-y-3">
          
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by name, job title, or skills..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-10 h-10 text-xs"
              />
              {localSearch && (
                <button 
                  onClick={() => { setLocalSearch(""); navigate({ search: (prev) => ({ ...prev, q: "" }) }) }}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                onClick={clearAllFilters}
                className="h-10 text-xs font-bold text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Status Row */}
          {statusesList.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2.5 border-t border-slate-100/70">
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pipeline Status</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {statusesList.map((s) => {
                  const isActive = s === status
                  return (
                    <button
                      key={s}
                      onClick={() => selectStatus(s)}
                      className={`h-7 px-2.5 text-[9px] font-bold rounded-lg transition-all border capitalize flex items-center gap-1.5 ${
                        isActive 
                          ? "bg-primary text-white border-primary shadow-[0_2px_8px_rgba(59,130,246,0.2)]" 
                          : "bg-slate-50/50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-350 hover:bg-slate-100/50"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        s === "shortlisted" ? "bg-emerald-500" :
                        s === "review" ? "bg-amber-500" :
                        s === "rejected" ? "bg-red-500" :
                        "bg-blue-500"
                      } ${isActive ? "bg-white" : ""}`} />
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Loading */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Loading Candidates...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          /* Empty State */
          <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">No candidates found</h3>
              <p className="text-xs text-slate-400 font-medium max-w-sm">
                {hasActiveFilters 
                  ? "No candidates match your current filter criteria. Try adjusting your search or clearing filters."
                  : "No candidates in the talent pool yet. Screen resumes from a job pipeline to populate this view."
                }
              </p>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="w-3.5 h-3.5 mr-1" />
                Clear All Filters
              </Button>
            )}
          </Card>
        ) : (
          /* Candidates Grid */
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredCandidates.map((cand) => {
              // Normalize fields with safe fallbacks
              const id = cand.id || cand._id || ""
              const name = cand.name || "Unknown Candidate"
              const title = cand.title || cand.designation || "Candidate"
              const avatar = cand.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}`
              const location = cand.location || "Not specified"
              const experience = cand.experience ?? cand.experience_years ?? cand.years_of_experience ?? 0
              const skills = cand.skills || cand.skills_extracted || []
              const candStatus = cand.status || "new"
              const appliedDate = cand.appliedDate || cand.applied_date || (cand.created_at ? new Date(cand.created_at).toLocaleDateString() : "Recently")
              const score = jd_id ? (cand.score ?? (cand.match_score_percentage != null ? Math.round(cand.match_score_percentage) : 0)) : 0
              const candDomain = cand.domain || cand.sector || ""

              return (
                <Link 
                  key={id} 
                  to="/candidates/$id" 
                  params={{ id }}
                  search={{ jd_id: jd_id || undefined }}
                  className="group focus-visible:outline-none"
                >
                  <Card className="hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full flex flex-col bg-white border border-slate-200/80 overflow-hidden">
                    
                    {/* Top accent bar */}
                    <div className={`h-1 w-full transition-all duration-300 ${
                      score != null ? (
                        score >= 85 ? "bg-gradient-to-r from-emerald-450 to-emerald-555" :
                        score >= 70 ? "bg-gradient-to-r from-blue-450 to-blue-555" :
                        score >= 55 ? "bg-gradient-to-r from-amber-450 to-amber-555" :
                        "bg-gradient-to-r from-slate-300 to-slate-400"
                      ) : "bg-slate-200"
                    }`} />

                    <div className="p-5 flex flex-col flex-1">
                      
                      {/* Header: Avatar + Name + Score */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="w-12 h-12 border border-slate-200 bg-slate-50 group-hover:scale-105 transition-transform duration-300 shrink-0">
                            <AvatarImage src={avatar} alt={name} />
                            <AvatarFallback className="text-sm font-bold">{name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h3 className="text-base font-black text-slate-900 leading-tight truncate">
                              {name}
                            </h3>
                            <p className="text-xs text-slate-550 font-semibold mt-0.5 truncate">{title}</p>
                          </div>
                        </div>
                        
                        {/* Score */}
                        {score != null && (
                          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-black shrink-0 transition-all duration-300 ${getScoreColor(score)}`}>
                            <span>{score}%</span>
                          </div>
                        )}
                      </div>

                      {/* Meta info */}
                      <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 font-semibold">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{location}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{experience} yrs exp</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{appliedDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1.5 mt-3.5">
                        {skills.slice(0, 4).map((skill, index) => (
                          <span 
                            key={index} 
                            className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-650 text-[10px] font-black uppercase tracking-wider select-none"
                          >
                            {skill}
                          </span>
                        ))}
                        {skills.length > 4 && (
                          <span className="px-2.5 py-1 rounded-md bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider select-none">
                            +{skills.length - 4}
                          </span>
                        )}
                      </div>

                      {/* Footer: Status + Domain + Arrow */}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-wider ${getStatusStyle(candStatus)}`}>
                            {candStatus}
                          </span>
                          {candDomain && (
                            <span className="px-2.5 py-1 rounded-md bg-violet-50 text-violet-600 border border-violet-100 text-[10px] font-black uppercase tracking-wider">
                              {candDomain}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4.5 h-4.5 text-slate-350 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

      </div>
    </AppShell>
  )
}
