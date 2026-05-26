import * as React from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AppShell } from "../components/app-shell"
import { useQuery } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Textarea } from "../components/ui/textarea"
import { Badge } from "../components/ui/badge"
import { cn } from "../lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar"
import { Progress } from "../components/ui/progress"
import { toast } from "sonner"
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  Star,
  ChevronRight,
  Sparkles,
  Paperclip,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  Download,
  Building,
  UserCheck,
  Send,
  Award
} from "lucide-react"

export const Route = createFileRoute("/screening")({
  validateSearch: (search) => ({
    jd: search.jd || "",
    jdId: search.jdId || "",
  }),
  component: ScreeningPage,
})

// Helper to normalize backend candidates from different routes to UI schema
const normalizeCandidates = (candidatesList) => {
  return candidatesList.map((c, index) => {
    const name = c.name || "Unknown Candidate"
    const scoreVal = c.match_score_percentage !== undefined 
      ? Math.round(c.match_score_percentage)
      : (c.score !== undefined ? (c.score <= 1.0 ? Math.round(c.score * 100) : Math.round(c.score)) : 75)
    
    const skills = c.skills_extracted || (c.entities?.Skills) || c.skills || []
    const skillMatchVal = c.skillMatch !== undefined
      ? c.skillMatch
      : (c.score_breakdown?.skills !== undefined ? Math.round(c.score_breakdown.skills * 100) : scoreVal)

    const experience = c.experience_years !== undefined 
      ? c.experience_years 
      : (c.years_of_experience !== undefined ? c.years_of_experience : (c.experience || 0))
      
    const avatar = c.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}`
    
    return {
      id: c.id || c._id || `cand-${index}`,
      name,
      email: c.email || "",
      phone: c.phone || "",
      avatar,
      score: scoreVal,
      skillMatch: skillMatchVal,
      skills,
      experience,
      title: c.title || c.designation || "Candidate Profile",
      location: c.location || "Bengaluru, India",
      status: c.status || "new",
      education: c.education || [],
      experiences: c.experiences || [],
      cv_file_path: c.cv_file_path || c.original_cv_path || ""
    }
  })
}

function ScreeningPage() {
  const navigate = useNavigate()
  const { jd: searchJd, jdId: searchJdId } = Route.useSearch()
  const userId = localStorage.getItem("user_id")

  const [jd, setJd] = React.useState("")
  const [jdFile, setJdFile] = React.useState(null)
  const [isJdFocused, setIsJdFocused] = React.useState(false)
  const [sourcingMode, setSourcingMode] = React.useState("private")
  const [selectedJdId, setSelectedJdId] = React.useState("")
  const [files, setFiles] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState(null)
  const fileInputRef = React.useRef(null)
  const jdFileInputRef = React.useRef(null)

  const [expandedRowId, setExpandedRowId] = React.useState(null)
  const [invitedIds, setInvitedIds] = React.useState(new Set())
  const [invitingId, setInvitingId] = React.useState(null)

  const handleInviteCandidate = async (candidateId, email) => {
    if (!selectedJdId) {
      toast.error("Please select an active Job Description to invite candidates.")
      return
    }
    setInvitingId(candidateId)
    try {
      const [inviteRes, statusRes] = await Promise.all([
        fetch(`http://localhost:8000/recruiter/candidates/${candidateId}/invite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId || ""
          },
          body: JSON.stringify({ jd_id: selectedJdId })
        }),
        fetch(`http://localhost:8000/recruiter/candidates/${candidateId}/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId || ""
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

      setInvitedIds(prev => {
        const next = new Set(prev)
        next.add(candidateId)
        return next
      })

      if (results) {
        setResults(prev => prev.map(c => c.id === candidateId ? { ...c, status: "shortlisted" } : c))
      }

      toast.success("Branded interview invitation sent and status updated to Shortlisted!")
    } catch (err) {
      toast.error(`Invitation failed: ${err.message}`)
    } finally {
      setInvitingId(null)
    }
  }

  const handleJdFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.txt')) {
        setJdFile(file)
        setJd("") // Clear manual text if file is uploaded
        setSelectedJdId("") // Unlink any selected JD
        navigate({ search: {} })
      } else {
        toast.error("Unsupported file type. Please upload PDF, DOCX, or TXT.")
      }
    }
  }

  // Sync from URL search params on mount or param update
  React.useEffect(() => {
    if (searchJd) {
      setJd(searchJd)
    }
    if (searchJdId) {
      setSelectedJdId(searchJdId)
    }
  }, [searchJd, searchJdId])

  // Fetch recruiter job descriptions for requirements select dropdown
  const { data: jdsData } = useQuery({
    queryKey: ["recruiterJds", userId],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/recruiter/jds", {
        headers: { "x-user-id": userId || "" },
      })
      if (!res.ok) throw new Error("Failed to fetch jobs")
      return res.json()
    },
    enabled: !!userId,
  })

  const jds = jdsData || []

  // Character Counter
  const charCount = jd.length

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    addFiles(selectedFiles)
  }

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter(f => 
      f.name.endsWith('.pdf') || 
      f.name.endsWith('.docx') || 
      f.name.endsWith('.txt')
    )

    if (validFiles.length < newFiles.length) {
      toast.warning("Some files were skipped. Only PDF, DOCX, and TXT are supported.")
    }

    // Keep the actual File objects in state!
    setFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleJdSelect = (jdId) => {
    if (!jdId) {
      setSelectedJdId("")
      setJd("")
      setSourcingMode("private")
      navigate({ search: {} })
      return
    }

    const selected = jds.find(j => j.id === jdId)
    if (selected) {
      setSelectedJdId(selected.id)
      const skillsStr = selected.core_skills && selected.core_skills.length > 0 
        ? `\nCore Skills: ${selected.core_skills.join(", ")}` 
        : ""
      setJd(`Job Title: ${selected.title}\nMin Experience: ${selected.min_experience} years\nLocation: ${selected.location_type || selected.mode || "Remote"}${skillsStr}`)
      navigate({ search: { jd: selected.title, jdId: selected.id } })
    }
  }

  const runScreening = async () => {
    if (sourcingMode === "private") {
      if (!jd.trim() && !jdFile) {
        toast.error("Job description or JD file is required.")
        return
      }
      if (files.length === 0) {
        toast.error("Please upload at least one candidate resume.")
        return
      }
    } else {
      if (!selectedJdId) {
        toast.error("Please select a saved Job Description to run global search.")
        return
      }
    }

    setLoading(true)
    setResults(null)

    try {
      let data
      if (sourcingMode === "global") {
        const res = await fetch(`http://localhost:8000/recruiter/screen/global?jd_id=${selectedJdId}`, {
          method: "GET",
          headers: {
            "x-user-id": userId || ""
          }
        })
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.detail || "Global search failed")
        }
        data = await res.json()
      } else {
        const formData = new FormData()
        
        // Append files
        files.forEach((file) => {
          formData.append("files", file)
        })

        let url = ""
        if (selectedJdId) {
          // Track 1: Private screening using existing JD ID
          url = "http://localhost:8000/recruiter/screen/private"
          formData.append("jd_id", selectedJdId)
        } else {
          // Standard screening against arbitrary JD text or file
          url = "http://localhost:8000/screen"
          formData.append("recruiter_id", userId || "default_recruiter")
          if (jdFile) {
            formData.append("jd_file", jdFile)
          } else {
            formData.append("job_description", jd)
          }
        }

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "x-user-id": userId || ""
          },
          body: formData
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.detail || "Screening failed")
        }
        data = await res.json()
      }

      const rawCandidates = data.candidates || data.top_candidates || []
      const normalized = normalizeCandidates(rawCandidates)
      setResults(normalized)
      toast.success(sourcingMode === "global" ? "Global database search completed!" : "AI Screening completed! Ranked list generated.")
    } catch (err) {
      toast.error(`${sourcingMode === "global" ? "Global search" : "Screening"} failed: ${err.message}`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-fadeIn select-none">
        
        {/* Header */}
        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Screening Console</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none font-display">Run a new screening</h1>
          <p className="text-xs text-slate-500 font-medium">Define your position details and batch-process candidate resumes using our NLP extraction pipeline.</p>
        </div>

        {/* Requirements Selection Dropdown */}
        {jds.length > 0 && (
          <Card className="p-4 bg-slate-50/50 border-border space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Job Description Source</h4>
                <p className="text-[10px] text-slate-400 font-medium">Choose an active position to pre-populate parameters or screen candidates privately.</p>
              </div>
              <div className="w-full sm:w-72">
                <select
                  value={selectedJdId}
                  onChange={(e) => handleJdSelect(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">-- Create with arbitrary text --</option>
                  {jds.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sourcing Track Selector */}
            {selectedJdId && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-slate-200/60">
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Sourcing Mode</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Upload local files or search the global candidate directory.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-80">
                  <button
                    type="button"
                    onClick={() => setSourcingMode("private")}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                      sourcingMode === "private" 
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Track A: Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourcingMode("global")}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                      sourcingMode === "global" 
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Track B: Global DB
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Configurations Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Job Description Card */}
          <Card className="flex flex-col justify-between border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <div className="space-y-1">
                <CardTitle className="font-display font-black text-slate-900">1. Job Description</CardTitle>
                <CardDescription className="text-xs">Paste text or upload a JD document.</CardDescription>
              </div>
              <div className="flex gap-3 items-center">
                <Badge variant={selectedJdId || jdFile ? "new" : "secondary"} className="h-8 px-3 shadow-none text-xs">
                  {selectedJdId ? "Locked to Pipeline" : (jdFile ? "File Attached" : "Required")}
                </Badge>
              </div>
              <input 
                type="file" 
                ref={jdFileInputRef} 
                onChange={handleJdFileChange}
                accept=".pdf,.docx,.txt" 
                className="hidden" 
              />
            </CardHeader>
            <CardContent className="p-5 flex-grow">
              {jdFile ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[240px] bg-primary/5 border border-primary/20 border-dashed rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-sm mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800">{jdFile.name}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">{Math.round(jdFile.size / 1024)} KB Attached</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setJdFile(null)}
                    className="mt-6 text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="relative h-full flex flex-col gap-4">
                  <div className="relative flex-grow">
                    <Textarea 
                      placeholder="Paste job description, skills, and target years of experience here..."
                      value={jd}
                      onFocus={() => setIsJdFocused(true)}
                      onBlur={() => setIsJdFocused(false)}
                      onChange={(e) => {
                        setJd(e.target.value)
                        if (selectedJdId) {
                          setSelectedJdId("") // unlink if user manually edits the text
                          navigate({ search: {} })
                        }
                      }}
                      className={cn(
                        "transition-all duration-300 h-full resize-none font-mono text-xs leading-relaxed bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20 rounded-xl p-4 w-full",
                        (jd || isJdFocused) ? "min-h-[360px]" : "min-h-[180px]"
                      )}
                    />
                    <span className="absolute bottom-3 right-4 text-[10px] text-slate-400 font-black tracking-widest uppercase bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">
                      {charCount} Characters
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      onClick={() => jdFileInputRef.current?.click()}
                      className="w-full h-11 text-xs font-bold tracking-widest uppercase border-primary/40 text-primary hover:bg-primary/5 hover:border-primary shadow-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <Paperclip className="w-4 h-4 text-primary" />
                      Upload JD Document (PDF, Word, or Text)
                    </Button>
                    <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-wider">
                      Or copy and paste the job description text above
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumes Upload Card */}
          <Card className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <div className="space-y-1">
                <CardTitle className="font-display font-black text-slate-900">2. Candidate Source</CardTitle>
                <CardDescription className="text-xs">
                  {sourcingMode === "global" ? "Search the global database." : "Upload files to parse and rank."}
                </CardDescription>
              </div>
              {sourcingMode === "private" ? (
                <Badge variant="secondary" className="h-7 shadow-none border-slate-200">PDF · DOCX · TXT</Badge>
              ) : (
                <Badge variant="new" className="h-7 gap-1 border-primary/20 bg-primary/10 text-primary">Global Pool</Badge>
              )}
            </CardHeader>
            <CardContent className="p-5 flex-grow flex flex-col justify-between">
              {sourcingMode === "global" ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[220px] bg-primary/5 border border-primary/20 border-dashed rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-primary shadow-sm mb-4">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Global Candidate Database</h4>
                  <p className="text-[10px] text-slate-500 font-medium max-w-xs mt-2">
                    Our AI semantic matching engine will scan all public profiles registered in the Talent Vector database and rank them against this Job Description.
                  </p>
                  <div className="mt-4 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 text-[10px] text-slate-400 font-medium">
                    No resume uploads required
                  </div>
                </div>
              ) : (
                <div className="flex flex-col justify-between h-full">
                  {/* Drag and Drop Zone */}
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-primary hover:bg-primary/5 cursor-pointer transition-all flex flex-col items-center justify-center gap-4 flex-grow min-h-[140px]"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange}
                      multiple 
                      accept=".pdf,.docx,.txt" 
                      className="hidden" 
                    />
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-800">Drag resumes here or browse</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1.5">Batch upload up to 20 files at once</p>
                    </div>
                  </div>

                  {/* Uploaded File List */}
                  {files.length > 0 && (
                    <div className="space-y-2 mt-4 max-h-[130px] overflow-y-auto custom-scrollbar border border-border p-3 rounded-xl bg-slate-50/50">
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white border border-border">
                          <div className="flex items-center gap-2 truncate max-w-[80%]">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="truncate text-slate-800 font-medium">{file.name}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase shrink-0">({Math.round(file.size / 1024)} KB)</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(idx)
                            }}
                            className="text-slate-400 hover:text-red-500 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Panel */}
        <Card className="p-4 bg-slate-50 border-border">
          <CardContent className="p-0 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Ranking Algorithm Configuration</h4>
                <p className="text-[10px] text-slate-400 font-medium">Weighted matching: 70% skill profile similarity + 30% years of experience criteria (TF-IDF model)</p>
              </div>
            </div>
            
            <Button 
              disabled={loading || (sourcingMode === "private" && (!jd.trim() && !jdFile)) || (sourcingMode === "private" && files.length === 0)} 
              onClick={runScreening}
              className="w-full sm:w-auto h-11 px-8 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  {sourcingMode === "global" ? "Searching DB..." : "Screening..."}
                </>
              ) : (
                sourcingMode === "global" ? "Run Global DB Search" : "Run Screening"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        {results && (
          <Card className="overflow-hidden animate-fadeIn border-slate-200 shadow-lg">
            <CardHeader className="border-b border-border pb-4 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="font-display font-black text-slate-900 uppercase tracking-tight">
                    AI Sourcing Results (Top Matches)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Ranked matches matching the job description semantic profile.
                  </CardDescription>
                </div>
                {selectedJdId && (
                  <Badge variant="new" className="h-6">
                    Active JD Sector: {jds.find(j => j.id === selectedJdId)?.sector || "General"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {results.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                  No valid parsed candidates found.
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/30 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        <th className="py-4 px-6 text-center w-16">Rank</th>
                        <th className="py-4 px-6">Candidate Details</th>
                        <th className="py-4 px-6 text-center w-32">Match Score</th>
                        <th className="py-4 px-6">Skill Alignment</th>
                        <th className="py-4 px-6 text-right w-44">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.map((cand, index) => {
                        const isExpanded = expandedRowId === cand.id;
                        const isInvited = invitedIds.has(cand.id) || cand.status === "shortlisted";
                        const isInviting = invitingId === cand.id;
                        
                        // Parse matching skills
                        const activeJd = jds.find(j => j.id === selectedJdId);
                        const targetSkills = activeJd?.core_skills || [];
                        const candSkillsLower = (cand.skills || []).map(s => s.toLowerCase());
                        
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
                          (cand.skills || []).forEach(cs => {
                            if (!targetSkills.map(ts => ts.toLowerCase()).includes(cs.toLowerCase())) {
                              otherSkills.push(cs);
                            }
                          });
                        } else {
                          otherSkills.push(...(cand.skills || []));
                        }

                        // Determine score color badge
                        const getScoreColor = (score) => {
                          if (score >= 80) return "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400";
                          if (score >= 60) return "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400";
                          return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400";
                        };

                        return (
                          <React.Fragment key={cand.id}>
                            <tr className={cn(
                              "group transition-all hover:bg-slate-50/40 border-l-2 border-transparent",
                              isExpanded && "bg-slate-50/50 border-l-primary"
                            )}>
                              {/* Rank */}
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center">
                                  {index === 0 ? (
                                    <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-black flex items-center justify-center shadow-sm">
                                      1
                                    </div>
                                  ) : index === 1 ? (
                                    <div className="w-6 h-6 rounded-full bg-slate-200 border border-slate-350 text-slate-800 text-[10px] font-black flex items-center justify-center shadow-sm">
                                      2
                                    </div>
                                  ) : index === 2 ? (
                                    <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black flex items-center justify-center shadow-sm">
                                      3
                                    </div>
                                  ) : (
                                    <span className="text-[11px] font-bold text-slate-400">#{index + 1}</span>
                                  )}
                                </div>
                              </td>

                              {/* Candidate Info */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10 border border-slate-150 bg-slate-50 shadow-sm shrink-0">
                                    <AvatarImage src={cand.avatar} alt={cand.name} />
                                    <AvatarFallback className="font-bold text-xs uppercase bg-primary/10 text-primary">{cand.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-150 truncate leading-snug">
                                      {cand.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                      {cand.title} · <span className="font-bold text-slate-500">{cand.experience} yrs exp</span>
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Match Score */}
                              <td className="py-4 px-6 text-center">
                                <div className="inline-flex flex-col items-center justify-center">
                                  <Badge className={cn("h-6 text-[10px] font-black px-2 shadow-none border", getScoreColor(cand.score))}>
                                    {cand.score}% Fit
                                  </Badge>
                                </div>
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
                                  {/* Plus indicator if there are too many skills */}
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
                                  {/* Circular Invite to Interview Button */}
                                  {selectedJdId && (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleInviteCandidate(cand.id, cand.email);
                                      }}
                                      disabled={isInvited || isInviting}
                                      size="icon"
                                      className={cn(
                                        "w-8 h-8 rounded-full border shadow-sm transition-all cursor-pointer",
                                        isInvited 
                                          ? "bg-emerald-50 border-emerald-250 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700" 
                                          : "bg-primary border-transparent text-white hover:bg-primary/95"
                                      )}
                                      title={isInvited ? "Branded invitation sent" : "Invite Candidate to Interview"}
                                    >
                                      {isInviting ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : isInvited ? (
                                        <UserCheck className="w-3.5 h-3.5" />
                                      ) : (
                                        <Send className="w-3.5 h-3.5" />
                                      )}
                                    </Button>
                                  )}

                                  {/* Expand/Collapse Toggle */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setExpandedRowId(isExpanded ? null : cand.id)}
                                    className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </td>
                            </tr>

                            {/* Row Expanded Panel */}
                            {isExpanded && (
                              <tr>
                                <td colSpan="5" className="bg-slate-50/30 p-6 border-t border-slate-100 animate-fadeIn">
                                  <div className="grid gap-6 md:grid-cols-3">
                                    {/* Left: Contact Info & Action Buttons */}
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                                          Contact Information
                                        </h4>
                                        <div className="space-y-2 text-xs font-bold text-slate-700">
                                          <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                            <a href={`mailto:${cand.email}`} className="text-primary hover:underline truncate">
                                              {cand.email || "Not Found"}
                                            </a>
                                          </div>
                                          {cand.phone && (
                                            <div className="flex items-center gap-2">
                                              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                              <span>{cand.phone}</span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="text-slate-500 font-medium">{cand.location}</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex flex-col gap-2 pt-2">
                                        {cand.cv_file_path ? (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(`http://localhost:8000/${cand.cv_file_path}`, '_blank')}
                                            className="w-full h-9 text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center gap-1.5"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                            Download Resume
                                          </Button>
                                        ) : (
                                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">
                                            No original CV attached
                                          </div>
                                        )}
                                        
                                        {!selectedJdId && (
                                          <p className="text-[9px] text-slate-400 font-medium italic mt-1 leading-normal">
                                            Attach a saved JD from the top menu to enable automated recruiter invite emails.
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Middle: Work Experiences Timeline */}
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
                                                    {exp.title || exp.designation || "Job Title"}
                                                  </span>
                                                  {exp.duration && (
                                                    <Badge variant="outline" className="text-[8px] px-1 py-0 bg-white font-bold">
                                                      {exp.duration}
                                                    </Badge>
                                                  )}
                                                </div>
                                                <p className="text-slate-500 font-medium mt-0.5">
                                                  {exp.company || "Company"}
                                                </p>
                                                {exp.description && (
                                                  <p className="text-slate-400 font-medium text-[11px] mt-1 leading-relaxed">
                                                    {exp.description}
                                                  </p>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider italic">
                                            No detailed experiences parsed in the profile.
                                          </p>
                                        )}
                                      </div>

                                      {/* Education section if available */}
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
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </AppShell>
  )
}
