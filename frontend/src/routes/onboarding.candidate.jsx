import * as React from "react"
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { Sparkles, Check, ArrowRight, Loader2, Upload, FileText, X, AlertCircle } from "lucide-react"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Progress } from "../components/ui/progress"
import { toast } from "sonner"
import { cn } from "../lib/utils"

export const Route = createFileRoute("/onboarding/candidate")({
  component: CandidateOnboardingPage,
})

function CandidateOnboardingPage() {
  const navigate = useNavigate()
  const userPicture = localStorage.getItem("user_picture")
  const userName = localStorage.getItem("user_name") || ""
  const userEmail = localStorage.getItem("user_id") || ""
  const userInitials = (userName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  const [cvText, setCvText] = React.useState("")
  const [file, setFile] = React.useState(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [checkingProfile, setCheckingProfile] = React.useState(true)

  React.useEffect(() => {
    if (!userEmail) {
      setCheckingProfile(false)
      return
    }
    
    // Check if candidate profile already exists in the database
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/candidate/profile?email=${encodeURIComponent(userEmail)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("access_token")}`
      }
    })
      .then(res => {
        if (res.ok) {
          // Profile exists, set onboarded flag and navigate to browse page
          localStorage.setItem("onboarded", "true")
          toast.success("Welcome back! Redirecting to jobs...")
          navigate({ to: "/browse" })
        } else {
          setCheckingProfile(false)
        }
      })
      .catch(err => {
        console.error("Error checking candidate profile:", err)
        setCheckingProfile(false)
      })
  }, [userEmail, navigate])

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background select-none">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Checking status...</p>
        </div>
      </div>
    )
  }

  const handleFileDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith('.pdf') || droppedFile.name.endsWith('.docx') || droppedFile.name.endsWith('.txt')) {
        setFile(droppedFile)
      } else {
        toast.error("Unsupported file type. Please upload PDF, DOCX, or TXT.")
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.name.endsWith('.pdf') || selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.txt')) {
        setFile(selectedFile)
      } else {
        toast.error("Unsupported file type. Please upload PDF, DOCX, or TXT.")
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!cvText.trim() && !file) {
      toast.warning("Please provide either a CV file or copy-paste resume text.")
      return
    }

    setIsProcessing(true)

    const formData = new FormData()
    if (cvText.trim()) formData.append('cv_text', cvText)
    if (file) formData.append('cv_file', file)
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/candidate/extract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("access_token")}`
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to extract data from resume')
      }

      const data = await response.json()
      
      // Store the extracted details in localStorage for the user-profile route to save
      localStorage.setItem("pending_extracted_profile", JSON.stringify(data))
      
      toast.success("Resume parsed successfully! Loading your profile card...")
      
      // Redirect to Candidate Profile editor
      navigate({ to: "/user-profile", search: { onboarding: true } })
    } catch (error) {
      console.error("Extraction error:", error)
      toast.error("Failed to extract data from CV. Ensure backend is running.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col justify-between selection:bg-primary/10">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_75%)] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 h-16 glass border-b border-border flex items-center justify-between px-6 md:px-12 select-none">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 font-display text-base font-bold text-slate-900 focus-visible:outline-none">
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden shrink-0">
              <img src="/favicon.svg" alt="Talent Vector" className="w-8 h-8 object-contain" />
            </div>
            <span className="font-extrabold text-slate-900 leading-none tracking-tight">Talent Vector</span>
          </Link>
        </div>
        <div className="text-xs font-black uppercase text-primary border border-primary/20 bg-primary/5 px-3 py-1 rounded-full select-none">
          Job Seeker Profile Setup
        </div>
      </header>

      {/* Main Form Area */}
      <main className="relative flex-grow flex items-center justify-center py-12 px-6 max-w-5xl mx-auto w-full">
        <div className="w-full flex flex-col gap-8">
          
          {/* Progress Tracker */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Step 2 of 4</span>
              <span className="text-primary font-bold">50% Completed</span>
            </div>
            <Progress value={50} className="h-1.5" />
            <div className="grid grid-cols-4 gap-2 mt-2 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">
              <div className="text-primary">Account</div>
              <div className="text-primary font-bold">Upload CV</div>
              <div>Processing</div>
              <div>Review</div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none font-display">Complete Your Profile</h2>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Help us match you with the right opportunities by providing your professional details or uploading your latest resume.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form Textarea */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <Card className="bg-white border border-border p-6 shadow-md rounded-2xl">
                <CardContent className="p-0 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block" htmlFor="cvText">Paste Raw Resume Text</label>
                    <Textarea 
                      id="cvText"
                      placeholder="Paste your professional summary, skills, or full resume content here..."
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      rows={10}
                      className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-xs font-mono resize-none leading-relaxed"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Drag and Drop Upload */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-white border border-border p-6 shadow-md rounded-2xl">
                <CardContent className="p-0 space-y-6">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Document Ingestion</h3>
                  
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={() => document.getElementById("resumeFile").click()}
                    className={cn(
                      "group relative flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-primary rounded-xl p-8 transition-all cursor-pointer text-center hover:bg-primary/5",
                      file && "border-primary bg-primary/5"
                    )}
                  >
                    <input 
                      type="file" 
                      id="resumeFile"
                      className="hidden" 
                      accept=".pdf,.docx,.txt" 
                      onChange={handleFileChange}
                    />
                    
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm",
                      file ? "bg-primary text-white" : "bg-slate-50 border border-slate-100 text-slate-400"
                    )}>
                      {file ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Upload className="w-5 h-5" />}
                    </div>
                    
                    {file ? (
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider">{file.name}</p>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">File Attached ({Math.round(file.size / 1024)} KB)</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Upload CV Document</p>
                        <p className="text-[9px] text-slate-400 font-medium max-w-xs mt-1.5 px-4 leading-normal">
                          Drag & drop files or click to browse. PDF, Word DOCX, or TXT (Max 10MB)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Parsing Architecture</p>
                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-border rounded-xl">
                      <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-700 uppercase leading-none">Automated ML Parser</p>
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed mt-1">
                          Our pipeline runs a BERT-CRF model for named entities and Naïve Bayes to classify your professional category.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Submit Actions */}
              <div className="flex flex-col gap-3">
                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate({ to: "/" })}
                    className="flex-1 h-12 text-xs uppercase font-bold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isProcessing || (!cvText.trim() && !file)}
                    className="flex-[2] h-12 text-xs uppercase font-bold"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                        Extracting Profiles...
                      </>
                    ) : (
                      <>
                        Analyze & Continue
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </>
                    )}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/user-profile", search: { onboarding: true } })}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all text-center mt-2 cursor-pointer focus-visible:outline-none"
                >
                  Skip & setup profile manually
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-t border-slate-100 bg-white select-none">
        SOC 2 Type II Compliant · EU-US Data Privacy Framework
      </footer>
    </div>
  )
}
