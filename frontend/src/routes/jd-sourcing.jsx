import * as React from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AppShell } from "../components/app-shell"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { toast } from "sonner"
import { 
  Plus, 
  FileSearch, 
  MapPin, 
  Briefcase, 
  Calendar,
  Sparkles,
  TrendingUp,
  X,
  Loader2
} from "lucide-react"

export const Route = createFileRoute("/jd-sourcing")({
  component: JDSourcingPage,
})

function JDSourcingPage() {
  const navigate = useNavigate()
  const userId = localStorage.getItem("user_id")
  const queryClient = useQueryClient()
  
  const [showAddModal, setShowAddModal] = React.useState(false)
  
  // New JD form state matching backend JobDescriptionUpdate
  const [title, setTitle] = React.useState("")
  const [minExperience, setMinExperience] = React.useState(3)
  const [locationType, setLocationType] = React.useState("Remote")
  const [coreSkills, setCoreSkills] = React.useState("")

  // Fetch job descriptions from backend
  const { data: jdsData, isLoading: jdsLoading } = useQuery({
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

  // Compute stats
  const totalOpenings = React.useMemo(() => {
    // Fallback to 1 opening per JD if not defined
    return jds.reduce((sum, jd) => sum + (jd.openings || 1), 0)
  }, [jds])

  // Mutation to save newly created job description
  const createJDMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("http://localhost:8000/recruiter/jd/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId || ""
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Failed to create Job Description")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiterJds", userId] })
      queryClient.invalidateQueries({ queryKey: ["recruiterStats", userId] })
      toast.success("Job Description created successfully!")
      setShowAddModal(false)
      
      // Reset form fields
      setTitle("")
      setMinExperience(3)
      setLocationType("Remote")
      setCoreSkills("")
    },
    onError: (err) => {
      toast.error(`Failed to create position: ${err.message}`)
    }
  })

  const handleCreateJD = (e) => {
    e.preventDefault()
    if (!title.trim() || !coreSkills.trim()) {
      toast.warning("Please fill in Job Title and Core Skills.")
      return
    }

    const payload = {
      title: title.trim(),
      min_experience: parseInt(minExperience, 10) || 3,
      location_type: locationType,
      core_skills: coreSkills.split(",").map(s => s.trim()).filter(Boolean),
      company_email: localStorage.getItem("user_email") || "recruiter@example.com",
      mode: locationType
    }

    createJDMutation.mutate(payload)
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-fadeIn select-none relative">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Position Management</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none font-display">Open positions</h1>
            <p className="text-xs text-slate-500 font-medium">Manage job descriptions, track openings, and trigger candidate matching queries.</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="h-11">
            <Plus className="w-4 h-4 mr-1" />
            New JD
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Card 1 */}
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Openings</span>
                <p className="font-display text-3xl font-black text-slate-900 leading-none">{jdsLoading ? "..." : totalOpenings}</p>
                <span className="text-[9px] font-bold text-slate-400 block mt-1">Across all active JDs</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Briefcase className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Active JDs</span>
                <p className="font-display text-3xl font-black text-slate-900 leading-none">{jdsLoading ? "..." : jds.length}</p>
                <span className="text-[9px] font-bold text-emerald-600 block mt-1">100% indexed in pool</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FileSearch className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Avg. Time-To-Fill</span>
                <p className="font-display text-3xl font-black text-primary leading-none">21d</p>
                <span className="text-[9px] font-bold text-emerald-600 block mt-1">-4d vs last quarter</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* JD Table Card */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle>Active Position Listings</CardTitle>
            <CardDescription>Select a position to source candidate matches or upload resumes.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {jdsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Loading active JDs...</p>
              </div>
            ) : jds.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                No positions found. Create one to start sourcing!
              </div>
            ) : (
              jds.map((jd) => (
                <div key={jd.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                      <FileSearch className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white uppercase leading-none">{jd.title}</h3>
                        <Badge variant="secondary" className="h-5 text-[8px] bg-secondary border-none">{jd.department || "Engineering"}</Badge>
                      </div>
                      
                      {/* Metadata tags */}
                      <div className="flex gap-4 text-[10px] text-slate-400 font-medium pt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{jd.location_type || jd.location || "Remote"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>{jd.openings || 1} openings</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Created {jd.created || (jd.created_at ? new Date(jd.created_at).toLocaleDateString() : "Today")}</span>
                        </div>
                      </div>

                      {/* Core skills badges */}
                      {jd.core_skills && jd.core_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {jd.core_skills.map((skill, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="text-[8px] px-2 py-0.5 border-slate-200 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 uppercase font-bold"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        toast.info(`Configuring screening console for ${jd.title}`)
                        navigate({ to: "/screening", search: { jd: jd.title, jdId: jd.id } })
                      }}
                    >
                      Source Candidates
                    </Button>
                    <Link 
                      to="/candidates"
                      search={{ q: jd.title }}
                      className="h-9 px-4 inline-flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors border border-border"
                    >
                      View Pool
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Create JD Modal (Dialog Overlay) */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div 
              className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>Create Position</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Define requirements to source candidates from the pool.</p>
                </div>

                <form onSubmit={handleCreateJD} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Job Title</label>
                    <Input 
                      placeholder="e.g. Senior Frontend Engineer" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Core Skills (comma separated)</label>
                    <Input 
                      placeholder="e.g. React, TypeScript, Tailwind CSS" 
                      value={coreSkills} 
                      onChange={(e) => setCoreSkills(e.target.value)} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Location Type</label>
                      <select
                        value={locationType}
                        onChange={(e) => setLocationType(e.target.value)}
                        className="flex h-9 w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="Remote">Remote</option>
                        <option value="Onsite">Onsite</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Min Exp (Years)</label>
                      <Input 
                        type="number" 
                        min={0} 
                        value={minExperience} 
                        onChange={(e) => setMinExperience(e.target.value)} 
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={createJDMutation.isPending} className="w-full h-12 mt-2">
                    {createJDMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Add Position"
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
