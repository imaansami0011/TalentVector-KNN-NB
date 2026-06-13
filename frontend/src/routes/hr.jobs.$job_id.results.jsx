import * as React from "react"
import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { AppShell } from "../components/app-shell"
import { AdPanel } from "../components/ad-panel"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { toast } from "sonner"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar,
  Sparkles,
  Loader2,
  FileText,
  User,
  CheckCircle,
  Download,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Building,
  UserCheck,
  Send,
  Award,
  RefreshCw
} from "lucide-react"

export const Route = createFileRoute("/hr/jobs/$job_id/results")({
  component: PredictiveRankingDashboard,
})

function PredictiveRankingDashboard() {
  const { job_id } = useParams({ from: "/hr/jobs/$job_id/results" })
  const userId = localStorage.getItem("user_id")

  // Fetch results from /recruiter/jobs/{job_id}/results
  const { data: resultsData, isLoading, refetch } = useQuery({
    queryKey: ["jobResults", job_id, userId],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/jobs/${job_id}/results`, {
        headers: { 
          "x-user-id": userId || "",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
      })
      if (!res.ok) throw new Error("Failed to fetch job results")
      return res.json()
    },
    enabled: !!job_id && !!userId,
  })

  const [invitedIds, setInvitedIds] = React.useState(new Set())
  const [expandedRowId, setExpandedRowId] = React.useState(null)

  // Bulk selection and sending states
  const [selectedCandIds, setSelectedCandIds] = React.useState(new Set())
  const [isBulkSending, setIsBulkSending] = React.useState(false)

  // Bulk send invitations helper
  const handleBulkSend = async () => {
    if (selectedCandIds.size === 0) return
    setIsBulkSending(true)
    
    const selectedList = candidates.filter(c => selectedCandIds.has(c.id || c._id))
    let successCount = 0
    let failCount = 0

    toast.loading(`Sending ${selectedList.length} branded invitations...`, { id: "bulk-invite" })

    const promises = selectedList.map(async (cand) => {
      const candId = cand.id || cand._id
      try {
        const [inviteRes, statusRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/candidates/${candId}/invite`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": userId || "",
              "Authorization": `Bearer ${localStorage.getItem("access_token")}`
            },
            body: JSON.stringify({ jd_id: job_id })
          }),
          fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/candidates/${candId}/status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": userId || "",
              "Authorization": `Bearer ${localStorage.getItem("access_token")}`
            },
            body: JSON.stringify({ status: "shortlisted" })
          })
        ])
        
        if (inviteRes.ok && statusRes.ok) {
          successCount++
          setInvitedIds(prev => {
            const next = new Set(prev)
            next.add(candId)
            return next
          })
        } else {
          failCount++
        }
      } catch (err) {
        failCount++
      }
    })

    await Promise.all(promises)
    setIsBulkSending(false)
    
    toast.dismiss("bulk-invite")
    if (failCount === 0) {
      toast.success(`Successfully sent branded invitations to all ${successCount} selected candidates!`)
    } else {
      toast.warning(`Sent ${successCount} invitations, but failed for ${failCount} candidates. Check server credentials.`)
    }
    
    setSelectedCandIds(new Set())
    refetch()
  }

  // Mutation for sending interview invite
  const inviteMutation = useMutation({
    mutationFn: async ({ candidateId, email }) => {
      const [inviteRes, statusRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/candidates/${candidateId}/invite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId || "",
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
          },
          body: JSON.stringify({ jd_id: job_id })
        }),
        fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/candidates/${candidateId}/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId || "",
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
          },
          body: JSON.stringify({ status: "shortlisted" })
        })
      ])

      if (!inviteRes.ok) {
        const errorData = await inviteRes.json().catch(() => ({}))
        throw new Error(errorData.detail || "Failed to send branded invitation email")
      }
      if (!statusRes.ok) {
        const errorData = await statusRes.json().catch(() => ({}))
        throw new Error(errorData.detail || "Failed to update pipeline status")
      }

      return { candidateId, email }
    },
    onSuccess: (data) => {
      setInvitedIds(prev => {
        const next = new Set(prev)
        next.add(data.candidateId)
        return next
      })
      toast.success(`Branded interview invitation sent successfully to ${data.email}!`)
    },
    onError: (err) => {
      toast.error(`Failed to send invitation: ${err.message}`)
    }
  })

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Calculating Predictive Rankings...</p>
        </div>
      </AppShell>
    )
  }

  if (!resultsData) {
    return (
      <AppShell>
        <div className="p-8 text-center space-y-4 max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Results Not Found</h2>
          <p className="text-xs text-slate-500">The requested job pipeline or matching sessions could not be resolved.</p>
          <Link to="/hr/portal">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  const { job, mode, candidates } = resultsData
  const hasCandidates = candidates && candidates.length > 0

  // Fit score & Invitation Column helper function
  const handleInvite = (email) => {
    // Legacy helper replaced with inline mutate
  }

  // Get color styles for match score percentages
  const getScoreBadgeStyles = (score) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-600 border border-emerald-200"
    if (score >= 60) return "bg-amber-50 text-amber-600 border border-amber-200"
    return "bg-slate-50 text-slate-500 border border-slate-200"
  }

  return (
    <AppShell rightPanel={<AdPanel />}>
      <div className="p-6 md:p-8 space-y-6 w-full animate-fadeIn select-none">
        
        <Link 
          to="/hr/portal" 
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs md:text-sm font-extrabold uppercase tracking-wider text-slate-700 hover:text-slate-900 transition-all border border-slate-200/50 w-fit hover:shadow-sm group"
        >
          <ArrowLeft className="w-4.5 h-4.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to dashboard</span>
        </Link>

        {/* Header Title with mode badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">NLP Ranking Engine</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none font-display uppercase">Match Results</h1>
            <p className="text-xs text-slate-500 font-medium">Predictive scoring based on experience threshold and skills parsing.</p>
          </div>
          
          <Badge className={`h-6 font-bold text-[9px] uppercase tracking-widest border border-primary/20 ${mode === 'private' ? 'bg-secondary text-primary' : 'bg-primary/10 text-primary'}`}>
            {mode === 'private' ? 'Private CV Screening' : 'Global Pool Search'}
          </Badge>
        </div>

        {/* Job Requirement Card */}
        <Card className="bg-white border border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base uppercase font-extrabold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <span>Target Role: {job?.title}</span>
            </CardTitle>
            <CardDescription>Required parameters confirmed during ingestion.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3 pt-0">
            <div className="space-y-1 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Experience Threshold</span>
              <p className="text-xs font-bold text-slate-700">{job?.min_experience} years minimum</p>
            </div>
            <div className="space-y-1 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Location Settings</span>
              <p className="text-xs font-bold text-slate-700">{job?.location_type || "Remote"}</p>
            </div>
            <div className="space-y-1 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Core Skills Filter</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {job?.core_skills?.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-[8px] px-1.5 border-slate-200 text-slate-500 uppercase font-bold">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ranked Candidate List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span>Ranked Matches ({candidates?.length || 0})</span>
            </h2>
            <span className="text-[9px] text-slate-400 font-bold uppercase">Sorted by Match Fit %</span>
          </div>

          {/* Bulk Action Bar */}
          {hasCandidates && selectedCandIds.size > 0 && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10 animate-fadeIn">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold text-slate-700">
                  Selected <strong className="text-primary">{selectedCandIds.size}</strong> candidate{selectedCandIds.size > 1 ? 's' : ''} for bulk outreach
                </span>
              </div>
              <Button
                onClick={handleBulkSend}
                disabled={isBulkSending}
                className="h-8 px-4 font-bold text-[10px] uppercase tracking-wider shadow-md shadow-primary/10 rounded-xl bg-primary text-white flex items-center gap-1.5 cursor-pointer"
              >
                {isBulkSending ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Sending Invitations...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3 h-3" />
                    <span>Send Bulk Invites</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {!hasCandidates ? (
            <Card className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No matching candidates</p>
                <p className="text-[10px] text-slate-400">Go back and run a screening session to see results.</p>
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden border border-border bg-white shadow-lg rounded-2xl">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-4 px-6 text-center w-12">
                        <input 
                          type="checkbox" 
                          checked={hasCandidates && selectedCandIds.size === candidates.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCandIds(new Set(candidates.map(c => c.id || c._id)))
                            } else {
                              setSelectedCandIds(new Set())
                            }
                          }}
                          className="rounded border-slate-350 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="py-4 px-6 text-center w-16">Rank</th>
                      <th className="py-4 px-6">Candidate Details</th>
                      <th className="py-4 px-6 text-center w-32">Match Score</th>
                      <th className="py-4 px-6">Skill Alignment</th>
                      <th className="py-4 px-6 text-right w-44">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {candidates.map((cand, idx) => {
                      const candId = cand.id || cand._id || `cand-${idx}`;
                      const isExpanded = expandedRowId === candId;
                      const isInvited = invitedIds.has(candId) || cand.status === "shortlisted";
                      const isInviting = inviteMutation.isPending && inviteMutation.variables?.candidateId === candId;
                      
                      // Match calculation
                      const targetSkills = job?.core_skills || [];
                      const candSkills = cand.skills_extracted || cand.skills || [];
                      const candSkillsLower = candSkills.map(s => s.toLowerCase());
                      
                      const matchedSkills = [];
                      const missingSkills = [];
                      const otherSkills = [];
                      
                      if (targetSkills.length > 0) {
                        targetSkills.forEach(ts => {
                          if (candSkillsLower.includes(ts.toLowerCase())) {
                            matchedSkills.push(ts);
                          } else {
                            missingSkills.push(ts);
                          }
                        });
                        candSkills.forEach(cs => {
                          if (!targetSkills.map(ts => ts.toLowerCase()).includes(cs.toLowerCase())) {
                            otherSkills.push(cs);
                          }
                        });
                      } else {
                        otherSkills.push(...candSkills);
                      }

                      return (
                        <React.Fragment key={candId}>
                          <tr className={`group transition-all hover:bg-slate-50/40 border-l-2 border-transparent ${isExpanded ? "bg-slate-50/50 border-l-primary" : ""}`}>
                            {/* Checkbox */}
                            <td className="py-4 px-6 text-center">
                              <input 
                                type="checkbox" 
                                checked={selectedCandIds.has(candId)}
                                onChange={(e) => {
                                  setSelectedCandIds(prev => {
                                    const next = new Set(prev)
                                    if (e.target.checked) {
                                      next.add(candId)
                                    } else {
                                      next.delete(candId)
                                    }
                                    return next
                                  })
                                }}
                                className="rounded border-slate-350 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>

                            {/* Rank */}
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center">
                                {idx === 0 ? (
                                  <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-black flex items-center justify-center shadow-sm">1</div>
                                ) : idx === 1 ? (
                                  <div className="w-6 h-6 rounded-full bg-slate-200 border border-slate-350 text-slate-800 text-[10px] font-black flex items-center justify-center shadow-sm">2</div>
                                ) : idx === 2 ? (
                                  <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black flex items-center justify-center shadow-sm">3</div>
                                ) : (
                                  <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                                )}
                              </div>
                            </td>

                            {/* Candidate Info */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-display text-xs font-black shrink-0 uppercase">
                                  {cand.name ? cand.name[0] : "C"}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 truncate leading-snug">{cand.name}</h4>
                                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                    {cand.title || "Candidate Profile"} · <span className="font-bold text-slate-500">{cand.experience_years || cand.experience || 0} yrs exp</span>
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Match Score */}
                            <td className="py-4 px-6 text-center">
                              <Badge className={`h-6 text-[10px] font-black px-2 shadow-none border ${getScoreBadgeStyles(cand.match_score_percentage)}`}>
                                {cand.match_score_percentage}% Fit
                              </Badge>
                            </td>

                            {/* Skill Badges */}
                            <td className="py-4 px-6">
                              <div className="flex flex-wrap gap-1 max-w-sm">
                                {matchedSkills.slice(0, 4).map((s, idx) => (
                                  <Badge key={`m-${idx}`} variant="shortlisted" className="text-[8px] px-1.5 py-0 border-emerald-500/20">
                                    {s}
                                  </Badge>
                                ))}
                                {missingSkills.slice(0, 3).map((s, idx) => (
                                  <Badge key={`ms-${idx}`} variant="rejected" className="text-[8px] px-1.5 py-0 border-red-500/20">
                                    {s} (Lacks)
                                  </Badge>
                                ))}
                                {matchedSkills.length === 0 && missingSkills.length === 0 && otherSkills.slice(0, 5).map((s, idx) => (
                                  <Badge key={`o-${idx}`} variant="outline" className="text-[8px] px-1.5 py-0 text-slate-500 bg-slate-50/50">
                                    {s}
                                  </Badge>
                                ))}
                                {(matchedSkills.length + missingSkills.length > 7) && (
                                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider self-center px-1">
                                    +{matchedSkills.length + missingSkills.length - 7} more
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Invite / Resend Button */}
                                {isInvited ? (
                                  <Button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      inviteMutation.mutate({ candidateId: candId, email: cand.email });
                                    }}
                                    disabled={isInviting}
                                    className="h-8 font-extrabold text-[10px] uppercase tracking-wider rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5 shadow-none transition-all cursor-pointer"
                                    title="Resend branded invitation email"
                                  >
                                    {isInviting ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <RefreshCw className="w-3 h-3" />
                                    )}
                                    <span>Resend Invite</span>
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      inviteMutation.mutate({ candidateId: candId, email: cand.email });
                                    }}
                                    disabled={isInviting}
                                    className="h-8 font-extrabold text-[10px] uppercase tracking-wider rounded-xl bg-primary border-transparent text-white hover:bg-primary/95 flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
                                    title="Invite Candidate to Interview"
                                  >
                                    {isInviting ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Send className="w-3 h-3" />
                                    )}
                                    <span>Send Invite</span>
                                  </Button>
                                )}

                                {/* View Profile Link */}
                                <Link
                                  to="/candidates/$id"
                                  params={{ id: candId }}
                                  search={{ jd_id: job_id || undefined, from: `/hr/jobs/${job_id}/results` }}
                                >
                                  <Button
                                    type="button"
                                    className="h-8 font-extrabold text-[10px] uppercase tracking-wider rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5 shadow-none transition-all cursor-pointer"
                                    title="View Candidate Details"
                                  >
                                    <User className="w-3.5 h-3.5 text-slate-500" />
                                    <span>View Profile</span>
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>

                          {/* Row Expanded Details */}
                          {isExpanded && (
                            <tr>
                              <td colSpan="6" className="bg-slate-50/30 p-6 border-t border-slate-100 animate-fadeIn">
                                <div className="grid gap-6 md:grid-cols-3">
                                  
                                  {/* Contact Details */}
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Contact Information</h4>
                                      <div className="space-y-2 text-xs font-bold text-slate-700">
                                        <div className="flex items-center gap-2">
                                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                          <a href={`mailto:${cand.email}`} className="text-primary hover:underline truncate">
                                            {cand.email || "Not Found"}
                                          </a>
                                        </div>
                                        {cand.phone && cand.phone !== "Not Found" && (
                                          <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span>{cand.phone}</span>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                          <span className="text-slate-500 font-medium">{cand.location || "Bengaluru, India"}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* CV Download */}
                                    <div className="pt-2">
                                      {cand.cv_file_path ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/${cand.cv_file_path}`, '_blank')}
                                          className="w-full h-9 text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center gap-1.5"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          Download Resume
                                        </Button>
                                      ) : (
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">No original CV attached</div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Work History */}
                                  <div className="md:col-span-2 space-y-4">
                                    <div>
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1">
                                        <Building className="w-3.5 h-3.5" />
                                        <span>Professional Experience</span>
                                      </h4>
                                      {cand.experiences && cand.experiences.length > 0 ? (
                                        <div className="space-y-3 relative before:absolute before:inset-y-1 before:left-[11px] before:w-[1px] before:bg-slate-200">
                                          {cand.experiences.map((exp, expIdx) => (
                                            <div key={expIdx} className="relative pl-7 text-xs">
                                              <div className="absolute left-[8px] top-1 w-2.5 h-2.5 rounded-full border-2 border-primary bg-white shadow-sm" />
                                              <div className="flex justify-between items-start flex-wrap gap-2">
                                                <span className="font-extrabold text-slate-800 uppercase tracking-tight">
                                                  {exp.title || exp.designation || "Job Role"}
                                                </span>
                                                {exp.duration && (
                                                  <Badge variant="outline" className="text-[8px] px-1 py-0 bg-white font-bold">
                                                    {exp.duration}
                                                  </Badge>
                                                )}
                                              </div>
                                              <p className="text-slate-500 font-medium mt-0.5">{exp.company || "Company"}</p>
                                              {exp.description && (
                                                <p className="text-slate-400 font-medium text-[11px] mt-1 leading-relaxed">{exp.description}</p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider italic">No detailed experiences parsed in the profile.</p>
                                      )}
                                    </div>

                                    {/* Education */}
                                    {cand.education && cand.education.length > 0 && (
                                      <div className="pt-2 border-t border-slate-100">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
                                          <Award className="w-3.5 h-3.5" />
                                          <span>Education</span>
                                        </h4>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                          {cand.education.map((edu, eduIdx) => (
                                            <div key={eduIdx} className="text-xs">
                                              <p className="font-extrabold text-slate-800 uppercase tracking-tight">
                                                {edu.degree || edu.qualification || "Degree"}
                                              </p>
                                              <p className="text-slate-500 font-medium text-[11px] mt-0.5">
                                                {edu.school || edu.institution || "Institution"}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}
