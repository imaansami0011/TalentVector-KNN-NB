import * as React from "react"
import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { AppShell } from "../components/app-shell"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar"
import { toast } from "sonner"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  CheckCircle2, 
  XCircle,
  MessageSquare,
  Download,
  Star,
  Sparkles,
  Loader2
} from "lucide-react"

export const Route = createFileRoute("/candidates/$id")({
  component: CandidateDetailPage,
})

function CandidateDetailPage() {
  const { id } = useParams({ from: "/candidates/$id" })
  const userId = localStorage.getItem("user_id")
  const queryClient = useQueryClient()

  // Fetch candidate details
  const { data: cand, isLoading } = useQuery({
    queryKey: ["candidateDetails", id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:8000/recruiter/candidates/${id}`, {
        headers: { "x-user-id": userId ?? "" },
      })
      if (!res.ok) throw new Error("Failed to fetch candidate details")
      return res.json()
    },
    enabled: !!id && !!userId,
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      const res = await fetch(`http://localhost:8000/recruiter/candidates/${id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId ?? "",
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

  const handleShortlist = () => {
    updateStatusMutation.mutate("shortlisted")
  }

  const handleReject = () => {
    updateStatusMutation.mutate("rejected")
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto animate-fadeIn select-none">
        
        {/* Back Link */}
        <Link 
          to="/candidates" 
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to candidates</span>
        </Link>

        {/* Profile Header Card */}
        <Card className="overflow-hidden bg-white border border-border">
          {/* Gradient Banner Top */}
          <div className="h-20 bg-gradient-to-r from-primary/10 via-blue-400/5 to-transparent border-b border-border/20" />
          
          <div className="p-6 md:p-8 pt-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 -mt-10">
            {/* Avatar & Details */}
            <div className="flex flex-col md:flex-row items-start md:items-end gap-5">
              <Avatar className="w-24 h-24 border-4 border-white bg-slate-50 shadow-md">
                <AvatarImage src={cand.avatar} alt={cand.name} />
                <AvatarFallback>{cand.name[0]}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900 leading-none uppercase">{cand.name}</h1>
                  <Badge variant={cand.status}>{cand.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{cand.title}</p>
                
                {/* Contact row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{cand.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{cand.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{cand.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Match Score Display */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-border shrink-0 text-center w-32 shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Match Fit</span>
              <div className="font-display text-4xl font-black text-primary my-1 leading-none">
                {cand.score}
              </div>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Weighted Score</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="bg-slate-50 border-t border-border px-6 md:px-8 py-4 flex flex-wrap gap-3 justify-end">
            <Button variant="outline" size="sm" onClick={() => toast.info("Opening resume PDF...")}>
              <Download className="w-3.5 h-3.5 mr-1" />
              Resume
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info(`Message console loaded for ${cand.name}`)}>
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              Message
            </Button>
            <Button variant="destructive" size="sm" onClick={handleReject} disabled={updateStatusMutation.isPending}>
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Reject
            </Button>
            <Button size="sm" onClick={handleShortlist} disabled={updateStatusMutation.isPending}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
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
              
              {/* Skill Match */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>Skill Match (70%)</span>
                  <span className="text-primary font-bold">{cand.skillMatch || 0}%</span>
                </div>
                <Progress value={cand.skillMatch || 0} className="h-1.5" />
                <p className="text-[9px] text-slate-400 font-medium">TF-IDF cosine similarity of resume skill tokens.</p>
              </div>

              {/* Experience Match */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>Experience Match (30%)</span>
                  <span className="text-primary font-bold">{cand.expMatch || 0}%</span>
                </div>
                <Progress value={cand.expMatch || 0} className="h-1.5" />
                <p className="text-[9px] text-slate-400 font-medium">Parsed duration vs. JD target experience thresholds.</p>
              </div>

              {/* Overall Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Recommendation</span>
                </div>
                <Badge variant={cand.score >= 80 ? "shortlisted" : cand.score >= 70 ? "review" : "rejected"}>
                  {cand.score >= 80 ? "High Fit" : cand.score >= 70 ? "Medium Fit" : "Low Fit"}
                </Badge>
              </div>

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
                {cand.skills?.map((skill, index) => (
                  <span 
                    key={index} 
                    className="px-3.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest"
                  >
                    {skill}
                  </span>
                ))}
              </CardContent>
            </Card>

            {/* Experience timeline */}
            <Card>
              <CardHeader className="border-b border-border pb-4">
                <CardTitle>Professional Experience</CardTitle>
                <CardDescription>Calculated sequence of work history records.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {cand.experiences?.map((exp, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Briefcase className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">{exp.role}</h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{exp.period}</span>
                      </div>
                      <p className="text-[10px] text-primary font-black uppercase tracking-widest">{exp.company}</p>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium pt-1">{exp.summary}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Education history */}
            <Card>
              <CardHeader className="border-b border-border pb-4">
                <CardTitle>Education & Credentials</CardTitle>
                <CardDescription>Verified academic history records.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {cand.education?.map((edu, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                      <GraduationCap className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">{edu.degree}</h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{edu.year}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">{edu.school}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </AppShell>
  )
}
