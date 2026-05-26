import * as React from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AppShell } from "../components/app-shell"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { toast } from "sonner"
import { 
  ArrowLeft,
  Sparkles, 
  Upload, 
  FileText, 
  Search, 
  Check, 
  Loader2, 
  Briefcase, 
  Globe, 
  Lock,
  Layers,
  ListPlus,
  Trash2
} from "lucide-react"

export const Route = createFileRoute("/hr/jobs/new")({
  component: UnifiedJobIngestion,
})

function UnifiedJobIngestion() {
  const navigate = useNavigate()
  const userId = localStorage.getItem("user_id")

  // --- Left Column: Define the Job States ---
  const [jdText, setJdText] = React.useState("")
  const [jdFile, setJdFile] = React.useState(null)
  const [isParsing, setIsParsing] = React.useState(false)
  const [originalText, setOriginalText] = React.useState("")

  // Form fields for parsed metadata (HITL)
  const [title, setTitle] = React.useState("")
  const [minExperience, setMinExperience] = React.useState(3)
  const [locationType, setLocationType] = React.useState("Remote")
  const [coreSkills, setCoreSkills] = React.useState("")
  const [companyEmail, setCompanyEmail] = React.useState("")
  const [sector, setSector] = React.useState("")

  const [isSaving, setIsSaving] = React.useState(false)
  const [savedJobId, setSavedJobId] = React.useState(null)
  const [isJdSaved, setIsJdSaved] = React.useState(false)

  // --- Right Column: Candidate Sourcing States ---
  const [privateFiles, setPrivateFiles] = React.useState([])
  const [isScreening, setIsScreening] = React.useState(false)
  const [isGlobalSearching, setIsGlobalSearching] = React.useState(false)

  // JD File Change Handler
  const handleJdFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setJdFile(file)
      toast.success(`Selected file: ${file.name}`)
    }
  }

  // JD Parse Handler
  const handleParseJD = async () => {
    if (!jdText.trim() && !jdFile) {
      toast.warning("Please enter JD text or upload a file to parse.")
      return
    }

    setIsParsing(true)
    const formData = new FormData()
    if (jdFile) {
      formData.append("jd_file", jdFile)
    } else {
      formData.append("jd_text", jdText)
    }

    try {
      const res = await fetch("http://localhost:8000/jd/parse", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Failed to parse Job Description")

      const data = await res.json()
      setTitle(data.title || "")
      setMinExperience(data.min_experience || 3)
      setLocationType(data.location_type || "Remote")
      setCoreSkills(data.core_skills ? data.core_skills.join(", ") : "")
      setCompanyEmail(data.company_email || "")
      setSector(data.sector || "General")
      setOriginalText(data.original_text || "")
      
      toast.success("Job Description parsed successfully! Verify details below.")
    } catch (err) {
      console.error(err)
      toast.error("Failed to parse Job Description. Please verify server connection.")
    } finally {
      setIsParsing(false)
    }
  }

  // JD Save Handler
  const handleSaveJD = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.warning("Please provide a Job Title.")
      return
    }

    setIsSaving(true)
    const payload = {
      title: title.trim(),
      min_experience: parseInt(minExperience, 10) || 0,
      location_type: locationType,
      core_skills: coreSkills.split(",").map(s => s.trim()).filter(Boolean),
      company_email: companyEmail.trim() || localStorage.getItem("user_id") || "recruiter@example.com",
      mode: locationType, // Matching backend requirements
      company_details: null,
      sector: sector || "General"
    }

    try {
      const res = await fetch("http://localhost:8000/recruiter/jd/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId || ""
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Failed to save Job Description")

      const data = await res.json()
      setSavedJobId(data.id)
      setIsJdSaved(true)
      toast.success("Job Pipeline created! You can now source candidates.")
    } catch (err) {
      console.error(err)
      toast.error(`Failed to save job pipeline: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Candidates Files Upload Handler
  const handlePrivateFilesChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      setPrivateFiles(prev => [...prev, ...selected])
      toast.success(`Added ${selected.length} resume(s) to pipeline.`)
    }
  }

  const removePrivateFile = (index) => {
    setPrivateFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Sourcing A: Private CV Screening
  const handlePrivateSourcing = async () => {
    if (privateFiles.length === 0) {
      toast.warning("Please upload at least one resume file.")
      return
    }

    setIsScreening(true)
    const formData = new FormData()
    formData.append("jd_id", savedJobId)
    privateFiles.forEach(file => {
      formData.append("files", file)
    })

    try {
      const res = await fetch("http://localhost:8000/screen/bulk", {
        method: "POST",
        headers: {
          "x-user-id": userId || ""
        },
        body: formData
      })

      if (!res.ok) throw new Error("Bulk screening failed")

      const data = await res.json()
      toast.success(`Screened ${data.candidates?.length || 0} candidates successfully!`)
      navigate({ to: `/hr/jobs/${savedJobId}/results` })
    } catch (err) {
      console.error(err)
      toast.error(`Screening failed: ${err.message}`)
    } finally {
      setIsScreening(false)
    }
  }

  // Sourcing B: Global Pool Matching
  const handleGlobalSourcing = async () => {
    setIsGlobalSearching(true)
    try {
      const res = await fetch(`http://localhost:8000/recruiter/screen/global?jd_id=${savedJobId}`, {
        headers: {
          "x-user-id": userId || ""
        }
      })

      if (!res.ok) throw new Error("Global matching failed")

      const data = await res.json()
      toast.success(`Matched ${data.candidates?.length || 0} global candidates!`)
      navigate({ to: `/hr/jobs/${savedJobId}/results` })
    } catch (err) {
      console.error(err)
      toast.error(`Global pool matching failed: ${err.message}`)
    } finally {
      setIsGlobalSearching(false)
    }
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fadeIn select-none">
        
        {/* Back Link */}
        <Link 
          to="/hr/portal" 
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to dashboard</span>
        </Link>

        {/* Title */}
        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Pipeline Builder</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none font-display">New Job Sourcing</h1>
          <p className="text-xs text-slate-500 font-medium">Define your requirements and matches will unlock instantly.</p>
        </div>

        {/* 2-Column Grid Workspace */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* LEFT COLUMN: Define & Verify */}
          <div className="space-y-6">
            
            {/* Ingestion interface card */}
            <Card className={isJdSaved ? "opacity-60 transition-opacity duration-300" : ""}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>Define the Job</span>
                </CardTitle>
                <CardDescription>Paste raw description text or drop a file to automatically parse properties.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Upload Zone */}
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Upload JD File</label>
                    <div className="relative border border-dashed border-slate-200 rounded-xl hover:bg-slate-50 hover:border-primary/30 transition-all flex flex-col items-center justify-center p-4 text-center gap-2 cursor-pointer bg-white">
                      <input 
                        type="file" 
                        accept=".pdf,.docx,.doc,.txt"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleJdFileChange}
                        disabled={isJdSaved}
                      />
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {jdFile ? jdFile.name : "Select PDF / Word / Text"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-black uppercase tracking-widest">Or paste text</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>

                {/* Text Paste */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Raw Job Description Text</label>
                  <Textarea 
                    placeholder="Paste job details, core responsibilities, qualifications, and requirements here..."
                    className="min-h-[140px] text-xs font-medium leading-relaxed resize-none"
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    disabled={isJdSaved}
                  />
                </div>

                {/* Parse Trigger */}
                <Button 
                  onClick={handleParseJD} 
                  disabled={isParsing || isJdSaved}
                  className="w-full h-11 text-xs font-bold bg-secondary hover:bg-secondary/90 text-primary border border-primary/20 shadow-sm"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 mr-1.5 animate-spin" />
                      Parsing Requirements...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4.5 h-4.5 mr-1.5" />
                      Parse Job Description (AI)
                    </>
                  )}
                </Button>

              </CardContent>
            </Card>

            {/* Human-in-the-Loop review form */}
            {(title || isJdSaved) && (
              <Card className="animate-fadeIn">
                <CardHeader className="border-b border-border pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Verify Requirements</CardTitle>
                      <CardDescription>Confirm parsed parameters. This information indexes matches.</CardDescription>
                    </div>
                    {isJdSaved && (
                      <Badge variant="new" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                        <Check className="w-3 h-3 mr-1" />
                        Saved
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSaveJD} className="space-y-4">
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Job Title</label>
                      <Input 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        disabled={isJdSaved}
                        placeholder="e.g. Senior Backend Engineer"
                        className="text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Core Skills (comma separated)</label>
                      <Input 
                        value={coreSkills} 
                        onChange={(e) => setCoreSkills(e.target.value)} 
                        disabled={isJdSaved}
                        placeholder="e.g. Python, Django, AWS, SQL"
                        className="text-xs font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Location Type</label>
                        <select
                          value={locationType}
                          onChange={(e) => setLocationType(e.target.value)}
                          disabled={isJdSaved}
                          className="flex h-9 w-full rounded-xl border border-border bg-white px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="Remote">Remote</option>
                          <option value="Onsite">Onsite</option>
                          <option value="Hybrid">Hybrid</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Min Exp (Years)</label>
                        <Input 
                          type="number" 
                          min={0}
                          value={minExperience} 
                          onChange={(e) => setMinExperience(parseInt(e.target.value, 10) || 0)} 
                          disabled={isJdSaved}
                          className="text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Company Email</label>
                        <Input 
                          value={companyEmail} 
                          onChange={(e) => setCompanyEmail(e.target.value)} 
                          disabled={isJdSaved}
                          placeholder="hiring@company.com"
                          className="text-xs font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Sector / Domain</label>
                        <Input 
                          value={sector} 
                          disabled
                          placeholder="e.g. Technology"
                          className="text-xs font-medium bg-slate-50 cursor-not-allowed border-dashed"
                        />
                      </div>
                    </div>

                    {!isJdSaved && (
                      <Button type="submit" disabled={isSaving} className="w-full h-12 mt-2 font-bold shadow-md shadow-primary/10">
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            Saving Position...
                          </>
                        ) : (
                          "Confirm & Create Job Pipeline"
                        )}
                      </Button>
                    )}
                  </form>
                </CardContent>
              </Card>
            )}

          </div>

          {/* RIGHT COLUMN: Source Candidates (Locked by default) */}
          <div className="space-y-6">
            
            <div className={`space-y-6 relative transition-all duration-500 ${!isJdSaved ? 'opacity-40 pointer-events-none' : ''}`}>
              
              {!isJdSaved && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-3xl select-none">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm mb-3">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h4 className="font-display text-sm font-black text-slate-800 uppercase tracking-tight">Sourcing Console Locked</h4>
                  <p className="text-[10px] text-slate-400 max-w-[240px] leading-relaxed pt-1">
                    First complete and save the job definition parameters on the left to activate candidate sourcing options.
                  </p>
                </div>
              )}

              {/* Sourcing Area */}
              <div className="space-y-6">
                
                {/* Option A: Private Upload */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <ListPlus className="w-5 h-5 text-primary" />
                      <span>Option A: Private CV Screener</span>
                    </CardTitle>
                    <CardDescription>Upload candidate resumes from your disk to screen against this job description.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {/* Drag and Drop */}
                    <div className="relative border border-dashed border-slate-200 rounded-xl hover:bg-slate-50 hover:border-primary/30 transition-all flex flex-col items-center justify-center p-6 text-center gap-2 cursor-pointer bg-white">
                      <input 
                        type="file" 
                        multiple
                        accept=".pdf,.docx,.doc,.txt"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handlePrivateFilesChange}
                      />
                      <Upload className="w-6 h-6 text-primary" />
                      <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">Upload Resumes from Computer</span>
                      <span className="text-[9px] text-slate-400">Select single or multiple CV files (PDF, DOCX)</span>
                    </div>

                    {/* File List */}
                    {privateFiles.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1 mb-2">
                          <span>Queued Resumes ({privateFiles.length})</span>
                          <button onClick={() => setPrivateFiles([])} className="text-destructive hover:underline font-bold">Clear All</button>
                        </div>
                        {privateFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-primary shrink-0" />
                              <span className="font-medium text-slate-700 truncate">{file.name}</span>
                              <span className="text-[8px] text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button 
                              onClick={() => removePrivateFile(idx)} 
                              className="text-slate-400 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button 
                      onClick={handlePrivateSourcing}
                      disabled={privateFiles.length === 0 || isScreening}
                      className="w-full h-11 font-bold text-xs shadow-sm bg-primary text-white"
                    >
                      {isScreening ? (
                        <>
                          <Loader2 className="w-4.5 h-4.5 mr-1.5 animate-spin" />
                          Screening Private Resumes...
                        </>
                      ) : (
                        "Screen Uploaded Resumes"
                      )}
                    </Button>

                  </CardContent>
                </Card>

                {/* Option B: Search Global Pool */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      <span>Option B: Search Global Pool</span>
                    </CardTitle>
                    <CardDescription>Instantly search the Talent Vector marketplace for candidate matches matching this JD's requirements.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                      <Search className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Semantic Match Queries</h4>
                        <p className="text-[9px] text-slate-400 leading-relaxed font-medium">
                          Our matching engine calculates candidate experience alignment (weighted 30%) and core skills semantic cosine similarity (weighted 70%) to discover top fits.
                        </p>
                      </div>
                    </div>

                    <Button 
                      onClick={handleGlobalSourcing}
                      disabled={isGlobalSearching}
                      className="w-full h-11 font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-sm border border-slate-800"
                    >
                      {isGlobalSearching ? (
                        <>
                          <Loader2 className="w-4.5 h-4.5 mr-1.5 animate-spin" />
                          Querying Global Pool...
                        </>
                      ) : (
                        "Search Global Database"
                      )}
                    </Button>

                  </CardContent>
                </Card>

              </div>

            </div>

          </div>

        </div>

      </div>
    </AppShell>
  )
}
