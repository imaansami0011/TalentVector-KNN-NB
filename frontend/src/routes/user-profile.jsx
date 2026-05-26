import React, { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { predefinedSkills } from '../skillsData'
import { toast } from 'sonner'
import { 
  Sparkles, 
  ArrowLeft, 
  Eye, 
  Save, 
  Upload, 
  Check, 
  Loader2, 
  Search, 
  X, 
  AlertCircle,
  Briefcase,
  History,
  BrainCircuit,
  Phone,
  Mail,
  User,
  Plus
} from 'lucide-react'

import { Progress } from '../components/ui/progress'
import { Button } from '../components/ui/button'
import { AppShell } from '../components/app-shell'

export const Route = createFileRoute('/user-profile')({
  validateSearch: (search) => ({
    onboarding: search.onboarding === 'true' || search.onboarding === true || false,
  }),
  component: UserProfilePage,
})

function UserProfilePage() {
  const navigate = useNavigate()
  const { onboarding } = Route.useSearch()
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  
  const userEmail = localStorage.getItem('user_email') || localStorage.getItem('user_id') || ''
  const userPicture = localStorage.getItem('user_picture')
  const userName = localStorage.getItem('user_name') || 'User'

  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    sector: 'Technology',
    raw_category: '',
    total_experience: 0,
    skills: [],
    original_cv_path: ''
  })

  const [newSkill, setNewSkill] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      // First check if there is a pending profile from onboarding extraction
      const pendingStr = localStorage.getItem("pending_extracted_profile")
      if (pendingStr) {
        const pendingData = JSON.parse(pendingStr)
        const newProfile = {
          name: userName, // Always use the Gmail name
          email: userEmail, // Always use the Gmail email
          phone: pendingData.contact_phone || pendingData.phone || "",
          sector: pendingData.detected_sector || "Technology",
          raw_category: pendingData.detected_raw_category || "",
          total_experience: pendingData.detected_experience || 0,
          skills: pendingData.detected_skills || [],
          original_cv_path: pendingData.original_cv_path || ""
        }
        setProfile(newProfile)
        
        // Save to backend immediately so the profile is created
        await fetch('http://localhost:8000/candidate/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProfile)
        })
        
        // Remove from localStorage so we don't overwrite it again next time
        localStorage.removeItem("pending_extracted_profile")
        toast.success("Profile initialized from extracted resume!")
      } else {
        // Fetch from backend
        const response = await fetch(`http://localhost:8000/candidate/profile?email=${userEmail}`)
        if (response.ok) {
          const data = await response.json()
          setProfile({
            ...data,
            name: userName, // Always enforce Gmail name
            email: data.email || userEmail // Always enforce real email
          })
          if (data.email) {
            localStorage.setItem("user_email", data.email)
          }
        } else {
          // If not found, pre-fill with defaults
          setProfile({
            name: userName,
            email: userEmail,
            phone: '',
            sector: 'Technology',
            raw_category: '',
            total_experience: 0,
            skills: [],
            original_cv_path: ''
          })
        }
      }
    } catch (error) {
      console.error("Fetch profile error:", error)
      toast.error("Failed to load profile details from server.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsExtracting(true)
    const formData = new FormData()
    formData.append('cv_file', file)

    try {
      const response = await fetch('http://localhost:8000/candidate/extract', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        setProfile(prev => ({
          ...prev,
          sector: data.detected_sector || 'General',
          raw_category: data.detected_raw_category || '',
          total_experience: data.detected_experience || prev.total_experience,
          skills: data.detected_skills || [],
          original_cv_path: data.original_cv_path
        }))
        toast.success("Resume updated and re-parsed successfully!")
      } else {
        throw new Error("Failed to parse resume.")
      }
    } catch (error) {
      console.error("Extraction error:", error)
      toast.error("Failed to extract data from CV. Ensure backend is running.")
    } finally {
      setIsExtracting(false)
    }
  }

  const removeSkill = (skillToRemove) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }))
  }

  const handleSkillSelect = (skill) => {
    if (!profile.skills.includes(skill)) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
      toast.success(`Added ${skill}`)
    }
    setNewSkill('')
    setIsDropdownOpen(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setShowSuccess(false)
    
    try {
      const response = await fetch('http://localhost:8000/candidate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      
      if (response.ok) {
        setIsSaving(false)
        setShowSuccess(true)
        toast.success("Changes saved successfully!")
        if (onboarding) {
          localStorage.setItem("onboarded", "true")
          setTimeout(() => {
            setShowSuccess(false)
            navigate({ to: "/browse" })
          }, 1500)
        } else {
          setTimeout(() => setShowSuccess(false), 1200)
        }
      } else {
        throw new Error("Backend save failed.")
      }
    } catch (error) {
      console.error("Save error:", error)
      setIsSaving(false)
      toast.error("Failed to save changes. Please try again.")
    }
  }

  const filteredPredefinedSkills = predefinedSkills.filter(s => 
    s.toLowerCase().includes(newSkill.toLowerCase()) && !profile.skills.includes(s)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-display">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  const formContent = (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Sidebar: Profile Card & CV Upload */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-2xl border-4 border-slate-50 shadow-xl overflow-hidden mb-4 bg-slate-100 flex items-center justify-center">
            {userPicture ? (
              <img src={userPicture} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-slate-400" />
            )}
          </div>
          <h2 className="font-display text-base font-extrabold text-slate-900 uppercase leading-tight">{profile.name || userName}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{profile.email}</p>
          
          <div className="w-full h-px bg-slate-100 my-4" />
          
          <div className="flex flex-col gap-2 w-full text-left">
            <div className="flex items-center gap-2.5 text-slate-500 font-medium text-xs">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>{profile.sector} Expert</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-500 font-medium text-xs">
              <History className="w-4 h-4 text-slate-400" />
              <span>{profile.total_experience} Years Experience</span>
            </div>
            {profile.raw_category && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5 items-center w-full">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">ML Classification</span>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl text-primary font-black text-[9px] uppercase tracking-wider shadow-sm select-none animate-pulse-slow">
                  <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                  <span>{profile.raw_category}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col gap-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Upload className="text-primary w-4 h-4" />
            Update Resume
          </h3>
          
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 hover:border-primary/50 rounded-2xl cursor-pointer hover:bg-primary/5 transition-all duration-300 group relative overflow-hidden bg-slate-50/50">
            {isExtracting ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-[9px] font-black text-primary animate-pulse tracking-widest">EXTRACTING DATA...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center px-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-slate-100 shadow-sm">
                  <Plus className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Upload New CV</p>
                <p className="text-[9px] text-slate-400 font-medium mt-1">PDF, DOCX, or TXT (Max 10MB)</p>
              </div>
            )}
            <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} disabled={isExtracting} />
          </label>
        </div>
      </div>

      {/* Main Content: Edit Form */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="font-display text-base font-extrabold text-slate-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Core Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5 opacity-60">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Full Name (Read Only)</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                disabled
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed outline-none text-xs font-bold"
              />
            </div>
            <div className="flex flex-col gap-1.5 opacity-60">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Email (Read Only)</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed outline-none text-xs font-bold"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone === "Not Found" ? "" : profile.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 000-0000"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-primary outline-none transition-all text-xs font-bold text-slate-800"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Experience (Years)</label>
              <input
                type="number"
                name="total_experience"
                value={profile.total_experience}
                onChange={handleInputChange}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-primary outline-none transition-all text-xs font-bold text-slate-800"
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Professional Sector</label>
              <select
                name="sector"
                value={profile.sector}
                onChange={handleInputChange}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-primary outline-none transition-all text-xs font-bold text-slate-800 bg-white"
              >
                {['Technology', 'Healthcare', 'Finance', 'Education', 'Sales', 'Management', 'Legal', 'General'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="font-display text-base font-extrabold text-slate-900 mb-6 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" />
            Expertise & Skills
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-6 min-h-[100px] p-4 bg-slate-50 border border-slate-200/50 rounded-xl shadow-inner">
            {profile.skills.map((skill, index) => (
              <div key={index} className="bg-white text-slate-800 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-slate-200 shadow-sm hover:border-primary transition-all">
                {skill}
                <button onClick={() => removeSkill(skill)} className="text-slate-400 hover:text-red-500 transition-colors flex items-center p-0 cursor-pointer">
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            ))}
            {profile.skills.length === 0 && <p className="text-slate-400 text-xs italic opacity-60">No skills added yet. Upload a CV or search below.</p>}
          </div>

          <div className="relative">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Search & Add Skills</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={newSkill}
                onChange={(e) => { setNewSkill(e.target.value); setIsDropdownOpen(true); }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search standard skills..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white outline-none focus:border-primary transition-all text-xs font-bold text-slate-800"
              />
              {isDropdownOpen && filteredPredefinedSkills.length > 0 && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setIsDropdownOpen(false)}></div>
                  <div className="absolute z-[100] w-full bottom-full mb-2 bg-white border border-slate-200 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-2 border-b border-slate-100 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 px-4">
                      Suggested Skills
                    </div>
                    {filteredPredefinedSkills.map((skill, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSkillSelect(skill)}
                        className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-wider hover:bg-primary/5 hover:text-primary transition-colors border-b border-slate-100 last:border-0 cursor-pointer"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="h-11 shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )

  const successModal = showSuccess && (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300"></div>
      <div className="relative bg-white rounded-3xl p-8 shadow-[0_20px_70px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col items-center gap-4 animate-in zoom-in-95 fade-in duration-300">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
          <Check className="w-8 h-8 stroke-[3px]" />
        </div>
        <div className="text-center">
          <h3 className="font-display text-base font-extrabold text-slate-900 uppercase">Changes Saved</h3>
          <p className="text-slate-500 text-xs font-medium">Your profile is now synchronized</p>
        </div>
      </div>
    </div>
  )

  if (onboarding) {
    return (
      <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-32">
        {/* Header */}
        <header className="sticky top-0 z-50 h-16 glass border-b border-border flex items-center justify-between px-6 md:px-12 select-none">
          <div className="flex items-center gap-4">
            <span className="font-extrabold text-slate-900 leading-none tracking-tight font-display text-base">Talent Vector</span>
          </div>
        </header>

        <main className="max-w-[1024px] mx-auto px-6 py-8 animate-fadeIn">
          <div className="space-y-3 mb-8 w-full">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Step 4 of 4</span>
              <span className="text-primary font-bold">90% Completed</span>
            </div>
            <Progress value={90} className="h-1.5" />
            <div className="grid grid-cols-4 gap-2 mt-2 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">
              <div className="text-primary">Account</div>
              <div className="text-primary">Upload CV</div>
              <div className="text-primary">Processing</div>
              <div className="text-primary font-bold">Review</div>
            </div>
          </div>

          {formContent}
        </main>

        {successModal}
      </div>
    )
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto animate-fadeIn select-none">
        {/* Settings Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Candidate Configurations</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">My Profile</h1>
            <p className="text-xs text-slate-500 font-medium">Manage your personal details, professional experience, and technical skills.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              to="/profile-showcase"
              className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              View Showcase
            </Link>
          </div>
        </div>

        {formContent}
      </div>

      {successModal}
    </AppShell>
  )
}
