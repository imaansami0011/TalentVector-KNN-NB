import * as React from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AppShell } from "../components/app-shell"
import { useQuery } from "@tanstack/react-query"
import { Card, CardHeader, CardContent } from "../components/ui/card"
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
  SlidersHorizontal,
  Sparkles,
  Loader2
} from "lucide-react"

export const Route = createFileRoute("/candidates/")({
  validateSearch: (search) => ({
    q: search.q || "",
    domain: search.domain || "",
    status: search.status || "",
  }),
  component: CandidatesPage,
})

function CandidatesPage() {
  const navigate = useNavigate()
  const { q, domain, status } = Route.useSearch()
  const userId = localStorage.getItem("user_id")

  const domainsList = ["All", "Web Development", "Data Science", "Cloud Infrastructure", "Product Management", "Machine Learning"]
  const statusesList = ["Any", "new", "shortlisted", "review", "rejected"]

  // Fetch candidates from API
  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ["candidatesList", userId, q, domain, status],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (q) params.append("q", q)
      if (domain) params.append("domain", domain)
      if (status) params.append("status", status)
      
      const res = await fetch(`http://localhost:8000/recruiter/candidates?${params.toString()}`, {
        headers: { "x-user-id": userId }
      })
      if (!res.ok) throw new Error("Failed to fetch candidates")
      return res.json()
    },
    enabled: !!userId,
  })

  const filteredCandidates = candidatesData || []

  const handleSearchChange = (e) => {
    navigate({
      search: (prev) => ({ ...prev, q: e.target.value })
    })
  }

  const selectDomain = (selectedDomain) => {
    navigate({
      search: (prev) => ({ ...prev, domain: selectedDomain === "All" ? "" : selectedDomain })
    })
  }

  const selectStatus = (selectedStatus) => {
    navigate({
      search: (prev) => ({ ...prev, status: selectedStatus === "Any" ? "" : selectedStatus })
    })
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-fadeIn select-none">
        
        {/* Header */}
        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Candidate Database</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none font-display">Talent pool</h1>
          <p className="text-xs text-slate-500 font-medium">Browse, search, and manage candidate matching profiles across your organization.</p>
        </div>

        {/* Filter Bar Card */}
        <Card className="p-6 bg-white border border-border shadow-sm space-y-6">
          
          {/* Top row: search & filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search name, job title, or skills..."
                value={q || ""}
                onChange={handleSearchChange}
                className="pl-10 h-11"
              />
            </div>
            <Button variant="outline" className="h-11 w-full sm:w-auto">
              <SlidersHorizontal className="w-4 h-4 mr-1.5" />
              More Filters
            </Button>
          </div>

          {/* Bottom row: domain and status chips */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            {/* Domain chips */}
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Technical Domain</span>
              <div className="flex flex-wrap gap-2">
                {domainsList.map((d) => {
                  const isActive = (d === "All" && !domain) || d === domain
                  return (
                    <button
                      key={d}
                      onClick={() => selectDomain(d)}
                      className={`h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${
                        isActive 
                          ? "bg-primary text-white border-primary shadow-[0_4px_10px_rgba(59,130,246,0.15)]" 
                          : "bg-white border-border text-slate-500 hover:text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Status chips */}
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Hiring Status</span>
              <div className="flex flex-wrap gap-2">
                {statusesList.map((s) => {
                  const isActive = (s === "Any" && !status) || s === status
                  return (
                    <button
                      key={s}
                      onClick={() => selectStatus(s)}
                      className={`h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${
                        isActive 
                          ? "bg-primary text-white border-primary shadow-[0_4px_10px_rgba(59,130,246,0.15)]" 
                          : "bg-white border-border text-slate-500 hover:text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

        </Card>

        {/* Results Info */}
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
          <span>Displaying {filteredCandidates.length} Candidates</span>
          {!isLoading && filteredCandidates.length === 0 && <span className="text-red-500">No candidates match search queries</span>}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Loading Candidates...</p>
          </div>
        ) : (
          /* Candidates Grid */
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredCandidates.map((cand) => (
              <Link 
                key={cand.id} 
                to="/candidates/$id" 
                params={{ id: cand.id }}
                className="group focus-visible:outline-none"
              >
                <Card className="hover:border-primary/40 hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between p-5 bg-white border border-border">
                  
                  {/* Header section */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-border bg-slate-100 group-hover:scale-105 transition-transform duration-300">
                        <AvatarImage src={cand.avatar} alt={cand.name} />
                        <AvatarFallback>{cand.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white uppercase leading-none truncate max-w-[140px]">
                          {cand.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 truncate max-w-[140px]">{cand.title}</p>
                      </div>
                    </div>
                    
                    {/* Score badge */}
                    <Badge variant="new" className="h-6 gap-1 border-primary/20 bg-primary/10 text-primary shrink-0 select-none">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      <span>{cand.score}</span>
                    </Badge>
                  </div>

                  {/* Info block */}
                  <div className="flex flex-col gap-2 pt-4 border-t border-slate-50 my-4 text-[10px] text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{cand.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{cand.experience} Years Experience</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Applied {cand.appliedDate}</span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {cand.skills.slice(0, 4).map((skill, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[8px] font-black uppercase tracking-widest border border-slate-200/40 select-none"
                        >
                          {skill}
                        </span>
                      ))}
                      {cand.skills.length > 4 && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest select-none">
                          +{cand.skills.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-between items-center pt-2">
                      <Badge variant={cand.status}>{cand.status}</Badge>
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-0.5">
                        <span>Detail</span>
                        <Sparkles className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                </Card>
              </Link>
            ))}
          </div>
        )}

      </div>
    </AppShell>
  )
}

