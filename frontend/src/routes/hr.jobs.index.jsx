import * as React from "react"
import { createPortal } from "react-dom"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AppShell } from "../components/app-shell"
import { AdPanel } from "../components/ad-panel"
import { SkillsInput } from "../components/skills-input"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { toast } from "sonner"
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  Layers, 
  Loader2, 
  Eye, 
  EyeOff, 
  Edit, 
  ArrowRight, 
  Sparkles, 
  X, 
  Plus 
} from "lucide-react"

export const Route = createFileRoute("/hr/jobs/")({
  component: RecruiterJobsManager,
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

function RecruiterJobsManager() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = localStorage.getItem("user_id")

  // --- Local states for Edit Modal ---
  const [editingJob, setEditingJob] = React.useState(null) // Holds job object if editing
  const [editTitle, setEditTitle] = React.useState("")
  const [editSkills, setEditSkills] = React.useState([])
  const [editLocationType, setEditLocationType] = React.useState("Remote")
  const [editMinExperience, setEditMinExperience] = React.useState(3)
  const [editCompanyEmail, setEditCompanyEmail] = React.useState("")
  const [editSector, setEditSector] = React.useState("")

  // Fetch JDs from /recruiter/jds
  const { data: jds = [], isLoading, refetch } = useQuery({
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

  // --- MUTATION: Toggle Visibility (Hide/Unhide) ---
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ job_id, is_hidden }) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/jd/${job_id}/visibility?is_hidden=${is_hidden}`, {
        method: "POST",
        headers: {
          "x-user-id": userId || "",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
      })
      if (!res.ok) throw new Error("Failed to update visibility")
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || "Job visibility updated!")
      queryClient.invalidateQueries(["recruiterJds"])
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`)
    }
  })

  // --- MUTATION: Update Job Details ---
  const updateJobMutation = useMutation({
    mutationFn: async (updatedData) => {
      const { id, ...payload } = updatedData
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/jd/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId || "",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Failed to update job details")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Job requirements updated successfully!")
      setEditingJob(null)
      queryClient.invalidateQueries(["recruiterJds"])
    },
    onError: (err) => {
      toast.error(`Failed to update job: ${err.message}`)
    }
  })

  const handleOpenEdit = (job) => {
    setEditingJob(job)
    setEditTitle(job.title || "")
    setEditSkills(job.core_skills || [])
    setEditLocationType(job.location_type || "Remote")
    setEditMinExperience(job.min_experience || 0)
    setEditCompanyEmail(job.company_email || "")
    setEditSector(job.sector || "General")
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editTitle.trim()) {
      toast.warning("Job Title cannot be empty.")
      return
    }

    updateJobMutation.mutate({
      id: editingJob.id,
      title: editTitle.trim(),
      min_experience: parseInt(editMinExperience, 10) || 0,
      location_type: editLocationType,
      core_skills: editSkills,
      company_email: editCompanyEmail.trim(),
      mode: editLocationType,
      sector: editSector.trim() || "General",
      is_hidden: editingJob.is_hidden
    })
  }

  return (
    <AppShell rightPanel={<AdPanel />}>
      <div className="p-6 md:p-8 space-y-8 w-full animate-fadeIn select-none">
        
        {/* Header section with Premium typography */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Position Management</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none font-display">Active Job Pipelnies</h1>
            <p className="text-xs text-slate-500 font-medium">Manage open job roles, update parameters, or toggle candidate-facing visibility.</p>
          </div>
          
          <Link to="/hr/jobs/new">
            <Button className="h-11 shadow-lg shadow-primary/25 hover:shadow-primary/30 transition-all font-bold rounded-xl">
              <Plus className="w-4 h-4 mr-1.5" />
              Create Job Pipeline
            </Button>
          </Link>
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Loading job listings...</p>
          </div>
        ) : jds.length === 0 ? (
          <Card className="border border-slate-200 p-16 text-center flex flex-col items-center justify-center gap-4 rounded-3xl">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
              <Briefcase className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="font-display font-black text-lg uppercase tracking-wider text-slate-800">No pipelines created</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Create your first job pipeline by uploading a job description file or pasting job requirements.
              </p>
            </div>
            <Link to="/hr/jobs/new" className="mt-2">
              <Button className="font-bold rounded-xl h-10 shadow-md">Create Pipeline Now</Button>
            </Link>
          </Card>
        ) : (
          /* JOB TILES GRID */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jds.map((jd) => {
              const logoStyle = getCompanyLogoStyle(jd.title)
              const initial = jd.title ? jd.title.trim().charAt(0).toUpperCase() : 'J'
              const isHidden = jd.is_hidden === true

              return (
                <Card 
                  key={jd.id} 
                  className={`group relative overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-3xl flex flex-col justify-between ${
                    isHidden ? "bg-slate-50/50 opacity-90 border-dashed" : ""
                  }`}
                >
                  <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    
                    {/* Top Section: Icon, Title & Visibility Badge */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${logoStyle.bg} flex items-center justify-center font-display font-black text-sm ${logoStyle.text} shrink-0 shadow-sm select-none`}>
                          {initial}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {isHidden ? (
                            <Badge className="bg-slate-100 text-slate-600 border border-slate-200/60 uppercase tracking-widest text-[8px] font-black h-5">
                              <EyeOff className="w-2.5 h-2.5 mr-1" />
                              Hidden
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-250/60 uppercase tracking-widest text-[8px] font-black h-5">
                              <Eye className="w-2.5 h-2.5 mr-1" />
                              Visible
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-display text-sm font-black text-slate-900 group-hover:text-primary transition-colors leading-snug uppercase tracking-tight line-clamp-1">
                          {jd.title}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{jd.sector || "General"}</p>
                      </div>
                    </div>

                    {/* Middle Section: Metadata details */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold bg-slate-50/60 rounded-2xl p-3 border border-slate-100/50">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{jd.location_type || "Remote"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>Min {jd.min_experience} yrs exp</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2 mt-1 pt-1 border-t border-slate-200/40">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Created {jd.created_at ? new Date(jd.created_at).toLocaleDateString() : "Recently"}</span>
                      </div>
                    </div>

                    {/* Skill Tags */}
                    {jd.core_skills && jd.core_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {jd.core_skills.slice(0, 4).map((skill, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="text-[8px] px-2 py-0.5 border-slate-200 bg-white text-slate-500 uppercase font-bold rounded-lg"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {jd.core_skills.length > 4 && (
                          <Badge 
                            variant="outline" 
                            className="text-[8px] px-2 py-0.5 border-slate-200 bg-slate-50 text-slate-400 uppercase font-black"
                          >
                            +{jd.core_skills.length - 4} More
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(jd)}
                        className="h-9 px-3 text-[10px] font-bold uppercase tracking-wider border-slate-250 hover:bg-slate-50 rounded-xl"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => toggleVisibilityMutation.mutate({ job_id: jd.id, is_hidden: !isHidden })}
                        disabled={toggleVisibilityMutation.isPending}
                        className={`h-9 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl ${
                          isHidden 
                            ? "border-emerald-250 text-emerald-600 hover:bg-emerald-50" 
                            : "border-slate-250 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {toggleVisibilityMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isHidden ? (
                          <>
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Unhide
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 mr-1" />
                            Hide
                          </>
                        )}
                      </Button>

                      <Button 
                        size="sm"
                        onClick={() => navigate({ to: `/hr/jobs/${jd.id}/results` })}
                        className="flex-1 h-9 px-3 text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/95 text-white shadow-sm rounded-xl flex items-center justify-center gap-1"
                      >
                        <span>Rank Matches</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* EDIT DIALOG MODAL */}
        {editingJob && createPortal(
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
            <Card className="bg-white border border-slate-200 shadow-2xl max-w-lg w-full overflow-visible p-6 relative rounded-3xl animate-scaleIn space-y-4">
              
              <button 
                onClick={() => setEditingJob(null)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900">Edit Job Requirements</CardTitle>
                <CardDescription>Update job criteria to re-calculate matching metrics instantly.</CardDescription>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Job Title</label>
                  <Input 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)} 
                    placeholder="e.g. Senior Frontend Engineer"
                    className="text-xs font-bold border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Core Skills</label>
                  <SkillsInput 
                    value={editSkills} 
                    onChange={setEditSkills} 
                    placeholder="Type or select skills (e.g. Python, React)..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Location Type</label>
                    <select
                      value={editLocationType}
                      onChange={(e) => setEditLocationType(e.target.value)}
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
                      value={editMinExperience} 
                      onChange={(e) => setEditMinExperience(parseInt(e.target.value, 10) || 0)} 
                      className="text-xs font-medium border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Company Email</label>
                    <Input 
                      value={editCompanyEmail} 
                      onChange={(e) => setEditCompanyEmail(e.target.value)} 
                      placeholder="hiring@company.com"
                      className="text-xs font-medium border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Sector / Domain</label>
                    <Input 
                      value={editSector} 
                      onChange={(e) => setEditSector(e.target.value)} 
                      placeholder="e.g. Technology"
                      className="text-xs font-medium border-slate-200"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingJob(null)}
                    className="flex-1 h-11 font-bold text-xs uppercase tracking-wider border-slate-200 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateJobMutation.isPending} 
                    className="flex-1 h-11 font-bold text-xs uppercase tracking-wider rounded-xl bg-primary text-white"
                  >
                    {updateJobMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>,
          document.body
        )}

      </div>
    </AppShell>
  )
}
