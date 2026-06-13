import * as React from "react"
import { createPortal } from "react-dom"
import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { AppShell } from "../components/app-shell"
import { AdPanel } from "../components/ad-panel"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar"
import { toast } from "sonner"
import { cn } from "../lib/utils"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  CheckCircle2, 
  XCircle,
  Download,
  Star,
  Sparkles,
  Loader2,
  Copy,
  X,
  ChevronRight,
  AlertCircle
} from "lucide-react"

export const Route = createFileRoute("/candidates/$id")({
  validateSearch: (search) => ({
    jd_id: search.jd_id || undefined,
    from: search.from || undefined,
  }),
  component: CandidateDetailPage,
})

function CandidateDetailPage() {
  const { id } = Route.useParams()
  const { jd_id, from } = Route.useSearch()
  const userId = localStorage.getItem("user_id")
  const queryClient = useQueryClient()

  const [showContactModal, setShowContactModal] = React.useState(false)
  const [showInviteModal, setShowInviteModal] = React.useState(false)
  const [selectedJdId, setSelectedJdId] = React.useState(jd_id || "")

  React.useEffect(() => {
    if (jd_id) {
      setSelectedJdId(jd_id)
    }
  }, [jd_id])

  // Fetch recruiter's JDs for the dropdown selection
  const { data: jds, isLoading: isLoadingJds } = useQuery({
    queryKey: ["recruiterJds"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/jds`, {
        headers: {
          "x-user-id": userId ?? "",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
      })
      if (!res.ok) throw new Error("Failed to fetch jobs")
      return res.json()
    },
    enabled: !!userId,
  })

  // Invite candidate mutation
  const inviteMutation = useMutation({
    mutationFn: async (targetJdId) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/candidates/${id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId ?? "",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({ jd_id: targetJdId }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || "Failed to send invitation")
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candidateDetails", id] })
      queryClient.invalidateQueries({ queryKey: ["candidatesList"] })
      queryClient.invalidateQueries({ queryKey: ["recruiterStats"] })
      toast.success(data.message || "Invitation email sent successfully!")
      setShowInviteModal(false)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invitation")
    }
  })

  // Fetch candidate details
  const { data: cand, isLoading } = useQuery({
    queryKey: ["candidateDetails", id, jd_id],
    queryFn: async () => {
      const url = jd_id 
        ? `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/candidates/${id}?jd_id=${jd_id}`
        : `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/candidates/${id}`
      const res = await fetch(url, {
        headers: { 
          "x-user-id": userId ?? "",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
      })
      if (!res.ok) throw new Error("Failed to fetch candidate details")
      return res.json()
    },
    enabled: !!id && !!userId,
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/candidates/${id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId ?? "",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candidateDetails", id] })
      queryClient.invalidateQueries({ queryKey: ["candidatesList"] })
      queryClient.invalidateQueries({ queryKey: ["recruiterStats"] })
      toast.success(`Candidate status updated to ${data.status}!`)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status")
    }
  })

  const name = cand?.name || "Unknown Candidate"
  const skills = cand?.skills || cand?.skills_extracted || []

  const emailSubject = React.useMemo(() => {
    if (!cand) return ""
    const sector = cand.domain || cand.sector || 'Technology'
    return `Exciting Opportunity – ${sector} Role`
  }, [cand])

  const emailBody = React.useMemo(() => {
    if (!cand) return ""
    const candidateName = name || 'there'
    const sector = cand.domain || cand.sector || 'Technology'
    const topSkills = skills.slice(0, 3).join(', ')
    return `Hi ${candidateName},

I came across your profile on Talent Vector and was really impressed by your background in ${sector}${topSkills ? ` and your expertise in ${topSkills}` : ''}.

We have an exciting opportunity that I believe aligns well with your experience and skill set. I'd love to schedule a quick call to discuss this further.

Would you be available for a brief conversation this week?

Looking forward to hearing from you.

Best regards,
[Your Name]
[Your Title]
[Company Name]`
  }, [cand, name, skills])

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Loading Candidate Details...</p>
        </div>
      </AppShell>
    )
  }

  if (!cand) {
    return (
      <AppShell>
        <div className="p-8 text-center space-y-4">
          <h2 className="text-xl font-black text-slate-800">Candidate not found</h2>
          <Link to="/candidates">
            <Button>Back to Candidates</Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  // Normalize fields with safe fallbacks
  const title = cand.title || cand.designation || "Candidate"
  const email = cand.email || "Not Found"
  const phone = cand.phone || "Not Found"
  const location = cand.location || "Not specified"
  const avatar = cand.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}`
  const status = cand.status || "new"
  const score = cand.score ?? (cand.match_score_percentage != null ? Math.round(cand.match_score_percentage) : null)
  const skillMatch = cand.skillMatch ?? cand.skill_match ?? (score != null ? Math.round(score * 0.85) : null)
  const expMatch = cand.expMatch ?? cand.exp_match ?? (score != null ? Math.round(score * 1.1) : null)
  const experiences = cand.experiences || []
  const education = cand.education || []

  // Derived state for status updates
  const isPending = updateStatusMutation.isPending
  const pendingStatus = updateStatusMutation.variables
  const activeStatus = isPending ? pendingStatus : status

  const isShortlisting = isPending && pendingStatus === "shortlisted"
  const isRejecting = isPending && pendingStatus === "rejected"

  const handleShortlist = () => {
    const nextStatus = status === "shortlisted" ? "new" : "shortlisted"
    updateStatusMutation.mutate(nextStatus)
  }

  const handleReject = () => {
    const nextStatus = status === "rejected" ? "new" : "rejected"
    updateStatusMutation.mutate(nextStatus)
  }

  const handleCopyDraft = () => {
    const textToCopy = `To: ${email}\nSubject: ${emailSubject}\n\n${emailBody}`
    navigator.clipboard.writeText(textToCopy)
    toast.success("Draft email details copied to clipboard!")
  }

  return (
    <AppShell rightPanel={<AdPanel />}>
      <div className="p-6 md:p-8 space-y-6 w-full animate-fadeIn select-none">
        
        {/* Back Link */}
        <Link 
          to={from || "/candidates"} 
          search={from ? undefined : { jd_id: jd_id || undefined }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs md:text-sm font-extrabold uppercase tracking-wider text-slate-700 hover:text-slate-900 transition-all border border-slate-200/50 w-fit hover:shadow-sm group"
        >
          <ArrowLeft className="w-4.5 h-4.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>{from ? "Back to Match Results" : "Back to candidates"}</span>
        </Link>

        {/* Profile Header Card */}
        <Card className={cn(
          "overflow-hidden bg-white border transition-all duration-500 ease-in-out shadow-sm",
          activeStatus === "shortlisted" && "border-emerald-300 shadow-md shadow-emerald-500/5 bg-emerald-50/5",
          activeStatus === "rejected" && "border-red-300 shadow-md shadow-red-500/5 bg-red-50/5"
        )}>
          {/* Gradient Banner Top */}
          <div className={cn(
            "h-20 bg-gradient-to-r transition-all duration-500 ease-in-out border-b border-border/20",
            activeStatus === "shortlisted"
              ? "from-emerald-500/10 via-emerald-400/5 to-transparent"
              : activeStatus === "rejected"
              ? "from-red-500/10 via-red-400/5 to-transparent"
              : "from-primary/10 via-blue-400/5 to-transparent"
          )} />
          
          <div className="p-6 md:p-8 pt-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 -mt-10">
            {/* Avatar & Details */}
            <div className="flex flex-col md:flex-row items-start md:items-end gap-5">
              <Avatar className="w-24 h-24 border-4 border-white bg-slate-50 shadow-md">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback>{name[0]}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900 leading-none uppercase">{name}</h1>
                  <Badge 
                    variant={activeStatus}
                    className={cn(
                      "transition-all duration-300 flex items-center gap-1",
                      isPending && "animate-pulse opacity-70"
                    )}
                  >
                    {isPending && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                    {activeStatus}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{title}</p>
                
                {/* Contact row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Match Score Display */}
            {score != null && (
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-border shrink-0 text-center w-32 shadow-sm animate-fadeIn">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Match Fit</span>
                <div className="font-display text-4xl font-black text-primary my-1 leading-none">
                  {score}
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Weighted Score</span>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="bg-slate-50 border-t border-border px-6 md:px-8 py-4 flex flex-wrap gap-3 justify-end">
            <Button variant="outline" size="sm" onClick={() => toast.info("Opening resume PDF...")} disabled={isPending}>
              <Download className="w-3.5 h-3.5 mr-1" />
              Resume
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowContactModal(true)} disabled={isPending}>
              <Mail className="w-3.5 h-3.5 mr-1" />
              Contact
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (jd_id) setSelectedJdId(jd_id)
                setShowInviteModal(true)
              }} 
              disabled={isPending}
              className="border-violet-300 hover:border-violet-400 text-violet-600 hover:bg-violet-50 hover:text-violet-700 transition-all font-bold duration-300"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-violet-500 animate-pulse" />
              Send Email for Interview
            </Button>
            <Button 
              variant={activeStatus === "rejected" ? "destructive" : "outline"} 
              size="sm" 
              onClick={handleReject} 
              disabled={isPending}
              className={cn(
                "transition-all duration-350 ease-in-out",
                activeStatus === "rejected" 
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/10 border-red-600" 
                  : "text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-250 border-slate-200"
              )}
            >
              {isRejecting ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5 mr-1" />
              )}
              Reject
            </Button>
            <Button 
              variant={activeStatus === "shortlisted" ? "default" : "outline"} 
              size="sm" 
              onClick={handleShortlist} 
              disabled={isPending}
              className={cn(
                "transition-all duration-350 ease-in-out",
                activeStatus === "shortlisted" 
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/10 border-emerald-600" 
                  : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-250 border-slate-200"
              )}
            >
              {isShortlisting ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              )}
              Shortlist
            </Button>
          </div>
        </Card>

        {/* 2-Column Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Score Breakdown Column (Left) */}
          <Card className="h-fit">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle>Score Breakdown</CardTitle>
              <CardDescription>NLP model evaluation matches vs. JD target.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              
              {score != null ? (
                <>
                  {/* Skill Match */}
                  <div className="space-y-1.5 animate-fadeIn">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <span>Skill Match (70%)</span>
                      <span className="text-primary font-bold">{skillMatch}%</span>
                    </div>
                    <Progress value={skillMatch} className="h-1.5" />
                    <p className="text-[9px] text-slate-400 font-medium">TF-IDF cosine similarity of resume skill tokens.</p>
                  </div>

                  {/* Experience Match */}
                  <div className="space-y-1.5 animate-fadeIn">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <span>Experience Match (30%)</span>
                      <span className="text-primary font-bold">{expMatch}%</span>
                    </div>
                    <Progress value={expMatch} className="h-1.5" />
                    <p className="text-[9px] text-slate-400 font-medium">Parsed duration vs. JD target experience thresholds.</p>
                  </div>

                  {/* Overall Summary */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between mt-4 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4.5 h-4.5 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Recommendation</span>
                    </div>
                    <Badge variant={score >= 80 ? "shortlisted" : score >= 70 ? "review" : "rejected"}>
                      {score >= 80 ? "High Fit" : score >= 70 ? "Medium Fit" : "Low Fit"}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center space-y-4 animate-fadeIn">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700">No Job Selected</h4>
                    <p className="text-[10px] text-slate-450 font-bold leading-relaxed">
                      Please select a job description pipeline from the Talent Pool to view real calculated match scores and evaluation details.
                    </p>
                  </div>
                  <Link 
                    to="/candidates"
                    search={{ jd_id: undefined }}
                    className="inline-block"
                  >
                    <Button variant="outline" size="sm" className="h-8 text-[9px] uppercase tracking-widest font-black rounded-xl">
                      Back to Talent Pool
                    </Button>
                  </Link>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Details Column (Right) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Skills chip list */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Identified Core Skills</CardTitle>
                <CardDescription>Extracted key competencies from CV text block.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="px-3.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest"
                  >
                    {skill}
                  </span>
                ))}
                {skills.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No skills data extracted for this candidate.</p>
                )}
              </CardContent>
            </Card>

            {/* Experience timeline */}
            <Card>
              <CardHeader className="border-b border-border pb-4">
                <CardTitle>Professional Experience</CardTitle>
                <CardDescription>Calculated sequence of work history records.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {experiences.length > 0 ? experiences.map((exp, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Briefcase className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">{exp.role || exp.title || exp.designation || "Role"}</h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{exp.period || exp.duration || ""}</span>
                      </div>
                      <p className="text-[10px] text-primary font-black uppercase tracking-widest">{exp.company || "Company"}</p>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium pt-1">{exp.summary || exp.description || ""}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-400 italic">No experience records available.</p>
                )}
              </CardContent>
            </Card>

            {/* Education history */}
            <Card>
              <CardHeader className="border-b border-border pb-4">
                <CardTitle>Education & Credentials</CardTitle>
                <CardDescription>Verified academic history records.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {education.length > 0 ? education.map((edu, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                      <GraduationCap className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">{edu.degree || edu.qualification || "Degree"}</h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{edu.year || ""}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">{edu.school || edu.institution || "Institution"}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-400 italic">No education records available.</p>
                )}
              </CardContent>
            </Card>

          </div>

        </div>

      </div>

      {/* Contact Platform Selector Modal */}
      {showContactModal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowContactModal(false)}
          />
          
          {/* Modal Container */}
          <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-[0_20px_70px_rgba(15,23,42,0.15)] border border-slate-200/80 w-full max-w-md animate-in zoom-in-95 fade-in duration-300 flex flex-col gap-6 text-left">
            
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 uppercase tracking-tight">
                    Contact Candidate
                  </h3>
                  <p className="text-[11px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">
                    {name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowContactModal(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Details Mini Panel */}
            <div className="bg-slate-50/80 border border-slate-200/50 rounded-2xl p-4 space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider w-16">To:</span>
                <span className="text-slate-800 font-bold select-all truncate">{email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider w-16">Subject:</span>
                <span className="text-slate-800 font-bold truncate">{emailSubject}</span>
              </div>
            </div>

            {/* Choose Platform Option list */}
            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Choose platform</span>

              {/* Automated Send Invite */}
              <button 
                onClick={() => {
                  setShowContactModal(false)
                  setShowInviteModal(true)
                }}
                className="flex items-center justify-between p-4 bg-violet-50/40 hover:bg-violet-50/80 border border-violet-100 hover:border-violet-200 rounded-2xl transition-all duration-300 group cursor-pointer text-left w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Send Email for Interview</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Automated & branded invitation email</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              
              {/* Gmail Web */}
              <a 
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowContactModal(false)}
                className="flex items-center justify-between p-4 bg-red-50/30 hover:bg-red-50/60 border border-red-100 hover:border-red-200 rounded-2xl transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform font-bold text-xs uppercase">
                    G
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Open in Gmail</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Opens in new browser tab</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Copy Draft & Copy Email */}
              <button 
                onClick={() => {
                  handleCopyDraft()
                  setShowContactModal(false)
                }}
                className="flex items-center justify-between p-4 bg-emerald-50/30 hover:bg-emerald-50/60 border border-emerald-100 hover:border-emerald-200 rounded-2xl transition-all duration-300 group cursor-pointer text-left w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform">
                    <Copy className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Copy Template Info</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Copies address & draft to clipboard</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Automated Invite Modal */}
      {showInviteModal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => {
              if (!inviteMutation.isPending) setShowInviteModal(false)
            }}
          />
          
          {/* Modal Container */}
          <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-[0_20px_70px_rgba(15,23,42,0.15)] border border-slate-200/80 w-full max-w-lg animate-in zoom-in-95 fade-in duration-300 flex flex-col gap-6 text-left">
            
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 uppercase tracking-tight">
                    Send Email for Interview
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Automated & Branded Invitation
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (!inviteMutation.isPending) setShowInviteModal(false)
                }}
                disabled={inviteMutation.isPending}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Details Mini Panel */}
            <div className="bg-slate-50/80 border border-slate-200/50 rounded-2xl p-4 space-y-3 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider w-20">Candidate:</span>
                <span className="text-slate-800 font-bold">{name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider w-20">Email:</span>
                <span className="text-slate-800 font-bold select-all truncate">{email}</span>
              </div>
            </div>

            {/* Job Selection Dropdown */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                Select Job Description Pipeline
              </label>
              
              {isLoadingJds ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Loading job pipelines...</span>
                </div>
              ) : jds && jds.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedJdId}
                    onChange={(e) => setSelectedJdId(e.target.value)}
                    disabled={inviteMutation.isPending}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>-- Choose a Pipeline --</option>
                    {jds.map((jd) => (
                      <option key={jd.id} value={jd.id}>
                        {jd.title} ({jd.company_details?.company_name || "Company"})
                      </option>
                    ))}
                  </select>
                  {/* Custom Arrow Icon */}
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">No Job Descriptions Found</p>
                    <p className="text-[10px] text-amber-500 mt-0.5">You must create a Job Description first to invite candidates to a pipeline.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Theme & Preview Info */}
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100/50 rounded-2xl p-4 space-y-2">
              <h4 className="text-[10px] font-black text-violet-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Enhanced Premium Template Included
              </h4>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                We will send an elegantly formatted email featuring your company's profile theme (violet-to-rose header gradients, custom scheduling portal link, and styled signature) to invite {name} for an interview.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 justify-end mt-2">
              <Button
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                disabled={inviteMutation.isPending}
                className="rounded-2xl h-11 px-5 text-xs font-bold uppercase tracking-wider border-slate-250 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => inviteMutation.mutate(selectedJdId)}
                disabled={!selectedJdId || inviteMutation.isPending}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-md shadow-violet-500/10 rounded-2xl h-11 px-6 text-xs font-black uppercase tracking-wider flex items-center gap-2"
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Automated Invite</span>
                  </>
                )}
              </Button>
            </div>
            
          </div>
        </div>,
        document.body
      )}
    </AppShell>
  )
}
