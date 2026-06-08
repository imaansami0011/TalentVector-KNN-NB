import * as React from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AppShell } from "../components/app-shell"
import { AdPanel } from "../components/ad-panel"
import { SkillsInput } from "../components/skills-input"
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
  Loader2,
  Check,
  ChevronRight,
  Mail,
  Users,
  X
} from "lucide-react"

export const Route = createFileRoute("/hr/jobs/new")({
  component: UnifiedJobIngestion,
})

function UnifiedJobIngestion() {
  const navigate = useNavigate()
  const userId = localStorage.getItem("user_id")

  // --- Step Tracking ---
  const [step, setStep] = React.useState("upload") // 'upload' | 'verify'

  // --- Left Column: Define the Job States ---
  const [jdText, setJdText] = React.useState("")
  const [jdFile, setJdFile] = React.useState(null)
  const [isParsing, setIsParsing] = React.useState(false)
  const [originalText, setOriginalText] = React.useState("")

  // Form fields for parsed metadata (HITL)
  const [title, setTitle] = React.useState("")
  const [minExperience, setMinExperience] = React.useState(3)
  const [locationType, setLocationType] = React.useState("Remote")
  const [coreSkills, setCoreSkills] = React.useState([])
  const [companyEmail, setCompanyEmail] = React.useState("")
  const [sector, setSector] = React.useState("")

  const [isSaving, setIsSaving] = React.useState(false)

  // --- Auto-Invite Modal States ---
  const [showInviteModal, setShowInviteModal] = React.useState(false)
  const [invitePreset, setInvitePreset] = React.useState(3) // 0 | 3 | 5 | 10 | 'custom'
  const [customCount, setCustomCount] = React.useState(7)

  // JD File Change Handler
  const handleJdFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setJdFile(file)
      toast.success("Job description uploaded! Now press Parse Job.")
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/jd/parse`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: formData,
      })

      if (!res.ok) throw new Error("Failed to parse Job Description")

      const data = await res.json()
      setTitle(data.title || "")
      setMinExperience(data.min_experience || 3)
      setLocationType(data.location_type || "Remote")
      setCoreSkills(data.core_skills || [])
      setCompanyEmail(data.company_email || "")
      setSector(data.sector || "General")
      setOriginalText(data.original_text || jdText || "")

      toast.success("Job Description parsed successfully! Correct any mistakes below.")
      setStep("verify")
    } catch (err) {
      console.error(err)
      toast.error("Failed to parse Job Description. Please verify server connection.")
    } finally {
      setIsParsing(false)
    }
  }

  // JD Save Handler - Intercepts submission to prompt auto-invite modal
  const handleSaveJD = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.warning("Please provide a Job Title.")
      return
    }
    setShowInviteModal(true)
  }

  // Actual API execution handler
  const executeSaveJD = async (count) => {
    setIsSaving(true)
    const payload = {
      title: title.trim(),
      min_experience: parseInt(minExperience, 10) || 0,
      location_type: locationType,
      core_skills: coreSkills,
      company_email: companyEmail.trim() || localStorage.getItem("user_email") || "recruiter@example.com",
      mode: locationType,
      company_details: null,
      sector: sector || "General",
      is_hidden: false,
      auto_invite_count: count
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/jd/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId || "",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Failed to save Job Description")

      toast.success("Job Pipeline created successfully!")
      setShowInviteModal(false)
      navigate({ to: "/hr/jobs" })
    } catch (err) {
      console.error(err)
      toast.error(`Failed to save job pipeline: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const wrapperClass = step === "verify"
    ? "p-6 flex flex-col lg:h-[calc(100vh-4rem)] lg:overflow-hidden w-full animate-fadeIn select-none space-y-6"
    : "p-6 md:p-8 space-y-6 w-full animate-fadeIn select-none"

  return (
    <AppShell rightPanel={<AdPanel />}>
      <div className={wrapperClass}>

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

        {/* STEP 1: Upload / Paste Ingestion */}
        {step === "upload" && (
          <div className="w-full space-y-6 animate-fadeIn">
            <Card className="border border-slate-200">
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
                    <div className="relative border border-dashed border-slate-300 rounded-xl hover:bg-slate-50 hover:border-primary/50 transition-all flex flex-col items-center justify-center py-8 px-6 text-center gap-2.5 cursor-pointer bg-white">
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleJdFileChange}
                      />
                      <Upload className="w-7 h-7 text-primary" />
                      <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">
                        {jdFile ? jdFile.name : "Select PDF / Word / Text"}
                      </span>
                      {jdFile && (
                        <span className="text-[30px] text-emerald-600 font-black uppercase tracking-wider animate-pulse">
                          uploaded now press parse job
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">Supports PDF, DOCX, DOC, TXT (Max 10MB)</span>
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
                    className="min-h-[260px] focus:min-h-[420px] text-sm md:text-base font-medium leading-relaxed transition-all duration-300 border-slate-200 p-4"
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                  />
                </div>

                {/* Parse Trigger */}
                <Button
                  onClick={handleParseJD}
                  disabled={isParsing}
                  className="w-full h-12 text-xs font-black uppercase tracking-widest bg-primary hover:bg-primary/95 text-white shadow-md hover:shadow-lg transition-all rounded-xl mt-3 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Parsing Requirements...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Parse Job Description (AI)</span>
                    </>
                  )}
                </Button>

              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 2: Side-by-Side Verification */}
        {step === "verify" && (
          <div className="grid gap-6 lg:grid-cols-2 items-stretch animate-fadeIn w-full lg:flex-1 lg:min-h-0">

            {/* Left Column: Form Editor */}
            <Card className="border border-slate-200 shadow-sm flex flex-col h-full lg:min-h-0">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle>Verify Requirements</CardTitle>
                <CardDescription>Correct any extraction mistakes. These values calculate candidates' match scores.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col min-h-0">
                <form onSubmit={handleSaveJD} className="flex-1 flex flex-col justify-between min-h-0">
                  <div className="space-y-4 lg:overflow-y-auto lg:pr-1 custom-scrollbar pb-32">

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Job Title</label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Senior Backend Engineer"
                        className="text-xs font-bold border-slate-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Core Skills</label>
                      <SkillsInput
                        value={coreSkills}
                        onChange={setCoreSkills}
                        placeholder="Type or select skills (e.g. Python, React)..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Location Type</label>
                        <select
                          value={locationType}
                          onChange={(e) => setLocationType(e.target.value)}
                          className="flex h-9 w-full rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                          className="text-xs font-medium border-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Company Email</label>
                        <Input
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                          placeholder="hiring@company.com"
                          className="text-xs font-medium border-slate-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Sector / Domain</label>
                        <Input
                          value={sector}
                          onChange={(e) => setSector(e.target.value)}
                          placeholder="e.g. Technology"
                          className="text-xs font-medium border-slate-200"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-3 pt-6 mt-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("upload")}
                      className="flex-1 h-11 font-bold text-xs uppercase tracking-wider border-slate-200 rounded-xl"
                    >
                      Re-upload / Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 h-11 font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/10 rounded-xl bg-primary text-white"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Confirm & Save Job"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Right Column: Original Job Description Text */}
            <Card className="border border-slate-200 shadow-sm flex flex-col h-full lg:min-h-0">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">Original Job Description</CardTitle>
                <CardDescription>Parsed text contents for side-by-side verification.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar font-sans text-xs text-slate-650 bg-slate-50 border border-slate-100 rounded-xl p-4 leading-relaxed whitespace-pre-wrap select-text">
                  {originalText || jdText}
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* AUTO-INVITE MODAL */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
            <Card className="bg-white border border-slate-200 shadow-2xl max-w-md w-full overflow-visible p-6 relative rounded-3xl animate-fadeIn space-y-5">

              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-2xl">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-black uppercase tracking-tight text-slate-900">Outreach Campaign</CardTitle>
                  <CardDescription className="text-[11px]">Automatically invite matching candidates upon saving.</CardDescription>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-650 leading-relaxed font-medium">
                  Would you like to send branded interview invitation emails to top candidates matching this role? Match scores are evaluated dynamically.
                </p>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Select invitation volume</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInvitePreset(0)}
                      className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${invitePreset === 0
                        ? 'border-slate-950 bg-slate-50 shadow-sm ring-1 ring-slate-950'
                        : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
                        }`}
                    >
                      <span className="text-xs font-black text-slate-950">Save Only</span>
                      <span className="text-[10px] text-slate-400 font-medium">No auto-emails</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvitePreset(3)}
                      className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${invitePreset === 3
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                        : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
                        }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-black text-slate-950">Top 3 Candidates</span>
                        <span className="text-[8px] bg-primary/10 text-primary font-black uppercase px-1.5 py-0.5 rounded-full tracking-wide">Best</span>
                      </div>
                      <span className="text-[10px] text-slate-450 font-medium">Auto-send 3 invites</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvitePreset(5)}
                      className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${invitePreset === 5
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                        : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
                        }`}
                    >
                      <span className="text-xs font-black text-slate-950">Top 5 Candidates</span>
                      <span className="text-[10px] text-slate-400 font-medium">Auto-send 5 invites</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvitePreset('custom')}
                      className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${invitePreset === 'custom'
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                        : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
                        }`}
                    >
                      <span className="text-xs font-black text-slate-950">Custom Volume</span>
                      <span className="text-[10px] text-slate-400 font-medium">Specify invite count</span>
                    </button>
                  </div>
                </div>

                {invitePreset === 'custom' && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Number of Candidates to invite</label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={customCount}
                      onChange={(e) => setCustomCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="text-xs font-bold border-slate-200 h-9"
                    />
                  </div>
                )}

                {/* Status Indicator Tip Box */}
                {(() => {
                  const finalCount = invitePreset === 'custom' ? customCount : invitePreset;
                  if (finalCount > 0) {
                    return (
                      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3.5 space-y-1 animate-fadeIn">
                        <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                          <Users className="w-3.5 h-3.5" />
                          <span>Outreach Campaign Active</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-normal">
                          Upon saving, candidates matching the criteria will be ranked. The top <strong>{finalCount}</strong> candidate{finalCount > 1 ? 's' : ''} scoring above <strong>45%</strong> will receive branded success invitation emails.
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1 animate-fadeIn">
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                          <Check className="w-3.5 h-3.5" />
                          <span>Database Save Only</span>
                        </div>
                        <p className="text-[10px] text-slate-450 font-medium leading-normal">
                          The job details and parsed requirements will be saved. Matching candidates will be ranked and displayed in your dashboard, but no automated outreach will be triggered.
                        </p>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 h-11 font-bold text-xs uppercase tracking-wider border-slate-200 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const finalCount = invitePreset === 'custom' ? customCount : invitePreset;
                    executeSaveJD(finalCount);
                  }}
                  disabled={isSaving}
                  className="flex-1 h-11 font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/10 rounded-xl bg-primary text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    invitePreset === 0 ? "Save Job" : "Send & Save"
                  )}
                </Button>
              </div>

            </Card>
          </div>
        )}

      </div>
    </AppShell>
  )
}
