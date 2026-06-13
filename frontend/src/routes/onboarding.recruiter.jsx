import * as React from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Sparkles, Check, ArrowRight, Loader2, ChevronDown, Building2, ImagePlus, Upload, X } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Progress } from "../components/ui/progress"
import { toast } from "sonner"
import { cn } from "../lib/utils"

function OnboardingInput({ className, ...props }) {
  return (
    <Input
      className={cn(
        "bg-white border-slate-200 text-slate-900 shadow-sm placeholder:text-slate-400/70 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 dark:bg-white dark:text-slate-900 dark:border-slate-200 dark:focus:bg-white",
        className
      )}
      {...props}
    />
  )
}

function OnboardingTextarea({ className, ...props }) {
  return (
    <Textarea
      className={cn(
        "bg-white border-slate-200 text-slate-900 shadow-sm placeholder:text-slate-400/70 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 dark:bg-white dark:text-slate-900 dark:border-slate-200 dark:focus:bg-white",
        className
      )}
      {...props}
    />
  )
}

function formatUrlForIFrame(url) {
  if (!url) return ""
  let cleanUrl = url.trim()
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = "https://" + cleanUrl
  }
  return cleanUrl
}

function cleanUrlForDisplay(url) {
  if (!url) return ""
  return url.replace(/^https?:\/\//, "").trim()
}

export const Route = createFileRoute("/onboarding/recruiter")({
  component: RecruiterOnboardingPage,
})

// Seeded company metadata for auto-prefilling during onboarding
const COMPANY_METADATA = {
  "Systems Limited": {
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Systems_Limited_logo.png/200px-Systems_Limited_logo.png",
    website: "https://www.systemsltd.com",
    hq_location: "Lahore",
    workplace_type: "Hybrid",
    address: "Software Technology Park, Lahore, Pakistan",
  },
  "Arbisoft": {
    logo: "https://arbisoft.com/wp-content/uploads/2022/02/arbisoft-logo-dark.svg",
    website: "https://arbisoft.com",
    hq_location: "Lahore",
    workplace_type: "Remote",
    address: "Johar Town, Lahore, Pakistan",
  },
  "Netsol Technologies": {
    logo: "https://www.netsoltech.com/wp-content/uploads/2023/01/netsol-logo.png",
    website: "https://www.netsoltech.com",
    hq_location: "Lahore",
    workplace_type: "Onsite",
    address: "Software Technology Park, Lahore, Pakistan",
  },
  "NetSol Technologies": {
    logo: "https://www.netsoltech.com/wp-content/uploads/2023/01/netsol-logo.png",
    website: "https://www.netsoltech.com",
    hq_location: "Lahore",
    workplace_type: "Onsite",
    address: "Software Technology Park, Lahore, Pakistan",
  },
  "Folio3 Software": {
    logo: "https://www.folio3.com/wp-content/themes/folio3/images/logo/folio3-logo.svg",
    website: "https://www.folio3.com",
    hq_location: "Karachi",
    workplace_type: "Hybrid",
    address: "Shahrah-e-Faisal, Karachi, Pakistan",
  },
  "10Pearls": {
    logo: "https://10pearls.com/wp-content/uploads/2022/07/10pearls-logo-v2.png",
    website: "https://10pearls.com",
    hq_location: "Karachi",
    workplace_type: "Remote",
    address: "Clifton, Karachi, Pakistan",
  },
  "TPS (Transaction Processing Systems)": {
    logo: "https://www.tpsonline.com/assets/images/logo.png",
    website: "https://www.tpsonline.com",
    hq_location: "Karachi",
    workplace_type: "Onsite",
    address: "PECHS, Karachi, Pakistan",
  },
  "Tkxel": {
    logo: "https://tkxel.com/wp-content/uploads/2022/04/tkxel-logo.svg",
    website: "https://tkxel.com",
    hq_location: "Lahore",
    workplace_type: "Hybrid",
    address: "DHA Phase 6, Lahore, Pakistan",
  },
  "i2c Inc.": {
    logo: "https://i2cinc.com/wp-content/uploads/2021/07/i2c-logo.svg",
    website: "https://i2cinc.com",
    hq_location: "Lahore",
    workplace_type: "Onsite",
    address: "Gulberg III, Lahore, Pakistan",
  },
  "Confiz": {
    logo: "https://confiz.com/wp-content/uploads/2022/04/Confiz-logo.png",
    website: "https://confiz.com",
    hq_location: "Lahore",
    workplace_type: "Hybrid",
    address: "Township, Lahore, Pakistan",
  },
  "Ignite (National Technology Fund)": {
    logo: "https://ignite.org.pk/wp-content/uploads/2022/03/ignite-logo.png",
    website: "https://ignite.org.pk",
    hq_location: "Islamabad",
    workplace_type: "Onsite",
    address: "F-7, Islamabad, Pakistan",
  },
}

function RecruiterOnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = React.useState(1) // 1 to 4
  const [isSaving, setIsSaving] = React.useState(false)
  
  // Top Pakistan IT Companies
  const pakTopCompanies = React.useMemo(() => [
    "Systems Limited",
    "NetSol Technologies",
    "VentureDive",
    "Devsinc",
    "10Pearls",
    "Arbisoft",
    "Tkxel",
    "Contour Software",
    "TRG Pakistan",
    "Educative",
    "Motive (formerly KeepTruckin)",
    "Tintash",
    "Rolustech",
    "Nextbridge",
    "Afiniti",
    "Codup",
    "Arpatech",
    "Confiz",
    "Other"
  ], [])

  // Form State
  const [fullName, setFullName] = React.useState(() => localStorage.getItem("user_name") || "")
  const [workEmail, setWorkEmail] = React.useState(() => localStorage.getItem("user_email") || localStorage.getItem("user_id") || "")
  const [role, setRole] = React.useState("")
  
  const [companyName, setCompanyName] = React.useState("")
  const [selectedPakCompany, setSelectedPakCompany] = React.useState("")
  const [customCompanyName, setCustomCompanyName] = React.useState("")
  const [website, setWebsite] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [workplaceType, setWorkplaceType] = React.useState("Remote")
  const [address, setAddress] = React.useState("")
  const [logo, setLogo] = React.useState("")
  const [logoUrlInput, setLogoUrlInput] = React.useState("")
  const logoFileRef = React.useRef(null)

  const [invites, setInvites] = React.useState(["", "", ""])

  const userId = localStorage.getItem("user_id")

  const [showDropdown, setShowDropdown] = React.useState(false)
  const dropdownRef = React.useRef(null)

  const isValidUrl = React.useMemo(() => {
    if (!website) return false
    const str = website.trim()
    return str.length > 3 && (str.includes(".") || str.includes("localhost"))
  }, [website])

  const [logoError, setLogoError] = React.useState(false)

  React.useEffect(() => {
    setLogoError(false)
  }, [website])

  // Filter companies based on search query (case-insensitive)
  const filteredCompanies = React.useMemo(() => {
    const search = companyName.toLowerCase().trim()
    const list = pakTopCompanies.filter(c => c !== "Other")
    if (!search) return list
    return list.filter(c => c.toLowerCase().includes(search))
  }, [companyName, pakTopCompanies])

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch Onboarding Status
  const { data: onboardingData, isLoading: onboardingLoading } = useQuery({
    queryKey: ["checkOnboarding", userId],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/check-onboarding`, {
        headers: { 
          "x-user-id": userId,
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
      })
      if (!res.ok) throw new Error("Failed to check onboarding status")
      return res.json()
    },
    enabled: !!userId,
  })

  // Fetch Current Profile Info
  const { data: profileData } = useQuery({
    queryKey: ["recruiterProfile", userId],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/profile`, {
        headers: { 
          "x-user-id": userId,
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
      })
      if (!res.ok) throw new Error("Failed to fetch profile")
      return res.json()
    },
    enabled: !!userId,
  })

  // If already fully onboarded, redirect to dashboard
  React.useEffect(() => {
    if (onboardingData?.onboarded) {
      localStorage.setItem("onboarded", "true")
      navigate({ to: "/hr/portal" })
    }
  }, [onboardingData, navigate])

  // Pre-fill states from profileData once loaded
  React.useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name || localStorage.getItem("user_name") || "")
      setWorkEmail(profileData.email || localStorage.getItem("user_email") || localStorage.getItem("user_id") || "")
      if (profileData.role_title) setRole(profileData.role_title)
      if (profileData.company) {
        const cName = profileData.company.company_name || ""
        if (cName) {
          setCompanyName(cName)
          if (pakTopCompanies.includes(cName)) {
            setSelectedPakCompany(cName)
          } else {
            setSelectedPakCompany("Other")
            setCustomCompanyName(cName)
          }
        }
        if (profileData.company.website) setWebsite(profileData.company.website)
        if (profileData.company.hq_location) setLocation(profileData.company.hq_location)
        if (profileData.company.address) setAddress(profileData.company.address)
        if (profileData.company.workplace_type) setWorkplaceType(profileData.company.workplace_type)
        if (profileData.company.logo) {
          setLogo(profileData.company.logo)
          localStorage.setItem("company_logo", profileData.company.logo)
        }
      }
    }
  }, [profileData, pakTopCompanies])

  const progressPercent = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100

  const handleNext = async () => {
    if (step === 1) {
      if (!fullName || !workEmail || !role) {
        toast.warning("Please fill in all account fields.")
        return
      }
      setStep(2)
      return
    }
    
    if (step === 2) {
      if (!companyName) {
        toast.warning("Company name is required.")
        return
      }
      
      setIsSaving(true)
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recruiter/company`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
          },
          body: JSON.stringify({
            company_name: companyName,
            website: website,
            address: address,
            hq_location: location === '__other__' ? '' : location,
            workplace_type: workplaceType,
            full_name: fullName,
            role_title: role,
            logo: logo,
          }),
        })
        if (!res.ok) {
          throw new Error("Failed to save company profile.")
        }
        toast.success("Company profile saved successfully!")
        if (logo) localStorage.setItem("company_logo", logo)
        setStep(3)
      } catch (error) {
        toast.error(error.message || "Failed to save company details.")
      } finally {
        setIsSaving(false)
      }
      return
    }

    if (step === 3) {
      localStorage.setItem("onboarded", "true")
      setStep(4)
      return
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleInviteChange = (index, value) => {
    const updated = [...invites]
    updated[index] = value
    setInvites(updated)
  }

  if (onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background select-none">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Checking status...</p>
        </div>
      </div>
    )
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
          Recruiter Portal Setup
        </div>
      </header>

      {/* Main Form Area */}
      <main className="relative flex-grow flex flex-col justify-center py-10 md:py-12 px-4 md:px-8 mx-auto w-full transition-all duration-500 ease-in-out max-w-[96%] md:max-w-[92%] lg:max-w-[88%] xl:max-w-[82%] 2xl:max-w-[76%]">
        <div className="w-full flex flex-col gap-6 md:gap-8">
          {/* Progress Tracker */}
          <div className="space-y-4 bg-white/40 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm select-none">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Recruiter Onboarding</span>
                <h3 className="text-sm md:text-base font-black text-slate-950 uppercase tracking-tight mt-1">
                  Step {step}: <span className="text-primary">{step === 1 ? "Personal Profile" : step === 2 ? "Company Details" : step === 3 ? "Invite Teammates" : "Ready to Launch"}</span>
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 block">Completion</span>
                <span className="text-sm font-black text-primary mt-1 block">{progressPercent}%</span>
              </div>
            </div>
            
            <Progress value={progressPercent} className="h-3 bg-slate-100" />
            
            <div className="grid grid-cols-4 gap-4 mt-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
              <div className={cn(
                "pb-2 border-b-2 transition-all duration-300",
                step >= 1 ? "text-primary border-primary font-bold" : "border-transparent text-slate-500/30"
              )}>
                1. Account
              </div>
              <div className={cn(
                "pb-2 border-b-2 transition-all duration-300",
                step >= 2 ? "text-primary border-primary font-bold" : "border-transparent text-slate-500/30"
              )}>
                2. Company
              </div>
              <div className={cn(
                "pb-2 border-b-2 transition-all duration-300",
                step >= 3 ? "text-primary border-primary font-bold" : "border-transparent text-slate-500/30"
              )}>
                3. Invites
              </div>
              <div className={cn(
                "pb-2 border-b-2 transition-all duration-300",
                step >= 4 ? "text-primary border-primary font-bold" : "border-transparent text-slate-500/30"
              )}>
                4. Launch
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            <div className="lg:col-span-12 w-full flex flex-col">
              {/* Form Card */}
              <Card className="bg-white border border-border p-6 md:p-8 shadow-md rounded-2xl w-full flex flex-col h-auto">
                <CardContent className="p-0 flex flex-col">
                  <div className={cn(
                    "w-full transition-all duration-300 flex flex-col justify-start",
                    step === 3 ? "max-w-5xl mx-auto" : "max-w-4xl mx-auto"
                  )}>
              
              {/* STEP 1: Account info */}
              {step === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">Personal Profile</h2>
                    <p className="text-xs text-slate-600 mt-1 font-medium">Introduce yourself to start building your recruiting workspace.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 block">Full Name</label>
                        <OnboardingInput 
                          placeholder="Alex Mercer"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 block">Work Email</label>
                        <OnboardingInput 
                          type="email"
                          placeholder="alex@company.com"
                          value={workEmail}
                          onChange={(e) => setWorkEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 block">Your Role / Job Title</label>
                      <OnboardingInput 
                        placeholder="Talent Acquisition Lead"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Company Profile */}
              {step === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">Company Details</h2>
                    <p className="text-xs text-slate-600 mt-1 font-medium">Add information about your company for employer branding.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 relative" ref={dropdownRef}>
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 block">Company Name</label>
                        <div className="relative">
                          <OnboardingInput 
                            placeholder="e.g. Systems Limited"
                            value={companyName}
                            onChange={(e) => {
                              setCompanyName(e.target.value)
                              setShowDropdown(true)
                            }}
                            onFocus={() => setShowDropdown(true)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowDropdown(prev => !prev)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                          >
                            <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showDropdown && "rotate-180")} />
                          </button>
                        </div>
                        
                        {/* Custom Dropdown list */}
                        {showDropdown && (
                          <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 animate-fadeIn custom-scrollbar">
                            {filteredCompanies.length > 0 ? (
                              filteredCompanies.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    setCompanyName(c)
                                    setShowDropdown(false)
                                    // Auto-fill metadata from seeded companies
                                    const meta = COMPANY_METADATA[c]
                                    if (meta) {
                                      if (meta.website) setWebsite(meta.website)
                                      if (meta.hq_location) setLocation(meta.hq_location)
                                      if (meta.workplace_type) setWorkplaceType(meta.workplace_type)
                                      if (meta.address) setAddress(meta.address)
                                      if (meta.logo) setLogo(meta.logo)
                                    }
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors focus:outline-none",
                                    companyName === c && "bg-primary/5 text-primary"
                                  )}
                                >
                                  {c}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2.5 text-slate-400 text-xs font-medium italic">
                                Press Enter to use "{companyName}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 block">Website URL</label>
                        <OnboardingInput 
                          placeholder="https://company.co"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 block">HQ Location (City)</label>
                        {(() => {
                          const PK_CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Sialkot','Hyderabad'];
                          const isStandard = PK_CITIES.includes(location);
                          const isCustom = location && !isStandard;
                          return (
                            <>
                              <select
                                value={isStandard ? location : (isCustom ? 'Other' : '')}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'Other') {
                                    setLocation('__other__');
                                  } else {
                                    setLocation(val);
                                  }
                                }}
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-primary outline-none text-xs font-bold text-slate-800 bg-white"
                              >
                                <option value="">Select City</option>
                                {PK_CITIES.map(city => (
                                  <option key={city} value={city}>{city}</option>
                                ))}
                                <option value="Other">Other</option>
                              </select>
                              {(isCustom || location === '__other__') && (
                                <OnboardingInput
                                  placeholder="Enter city name"
                                  value={location === '__other__' ? '' : location}
                                  onChange={(e) => setLocation(e.target.value || '__other__')}
                                  className="mt-1.5"
                                />
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 block">Workplace Type</label>
                        <select
                          value={workplaceType}
                          onChange={(e) => setWorkplaceType(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-primary outline-none text-xs font-bold text-slate-800 bg-white"
                        >
                          <option value="Remote">Remote</option>
                          <option value="Onsite">Onsite</option>
                          <option value="Hybrid">Hybrid</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 block">Office Address</label>
                      <OnboardingTextarea 
                        placeholder="100 Pine Street, Suite 1200"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={2}
                      />
                    </div>

                    {/* Company Logo Section */}
                    <div className="space-y-3 pt-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 block">Company Logo</label>
                      <div className="flex items-start gap-5">
                        {/* Logo Preview */}
                        <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center overflow-hidden shrink-0 transition-all duration-300 hover:border-primary/30">
                          {logo ? (
                            <img
                              src={logo}
                              alt="Company logo"
                              className="w-full h-full object-contain p-1.5"
                              onError={(e) => {
                                if (logo && !logo.startsWith("data:")) {
                                  setLogo("")
                                }
                              }}
                            />
                          ) : (
                            <Building2 className="w-7 h-7 text-slate-300" />
                          )}
                        </div>

                        <div className="flex-1 space-y-2.5">
                          {/* File Upload Button */}
                          <input
                            ref={logoFileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              if (file.size > 2 * 1024 * 1024) {
                                toast.warning("Logo file must be under 2 MB.")
                                return
                              }
                              const reader = new FileReader()
                              reader.onload = (ev) => {
                                setLogo(ev.target.result)
                                setLogoUrlInput("")
                                toast.success("Logo uploaded successfully!")
                              }
                              reader.readAsDataURL(file)
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => logoFileRef.current?.click()}
                            className="h-8 text-[9px] font-black uppercase tracking-widest border-slate-200 hover:border-primary hover:bg-primary/5 transition-all rounded-lg"
                          >
                            <Upload className="w-3 h-3 mr-1.5" />
                            Upload Image
                          </Button>

                          {/* OR paste URL */}
                          <div className="flex items-center gap-2">
                            <OnboardingInput
                              placeholder="Or paste logo URL…"
                              value={logoUrlInput}
                              onChange={(e) => setLogoUrlInput(e.target.value)}
                              onBlur={() => {
                                if (logoUrlInput.trim()) {
                                  setLogo(logoUrlInput.trim())
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  if (logoUrlInput.trim()) setLogo(logoUrlInput.trim())
                                }
                              }}
                              className="text-[11px] h-8"
                            />
                            {logo && (
                              <button
                                type="button"
                                onClick={() => { setLogo(""); setLogoUrlInput("") }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <p className="text-[9px] text-slate-400 font-medium">PNG, JPG, or SVG. Max 2 MB. Selecting a known company auto-fills the logo.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Team invites */}
              {step === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">Invite Teammates</h2>
                    <p className="text-xs text-slate-600 mt-1 font-medium">Invite colleagues to review shortlists and collaborate on screenings.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {invites.map((email, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 block">Teammate {idx + 1} Email</label>
                        <OnboardingInput 
                          type="email"
                          placeholder="colleague@company.com"
                          value={email}
                          onChange={(e) => handleInviteChange(idx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Success Launch */}
              {step === 4 && (
                <div className="space-y-8 text-center py-12 animate-fadeIn flex-grow flex flex-col justify-center items-center w-full">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                    <Check className="w-8 h-8 stroke-[3px]" />
                  </div>
                  
                  <div className="space-y-2 max-w-sm mx-auto">
                    <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">Launch Ready</h2>
                    <p className="text-xs text-slate-600 font-medium">
                      Your hiring pipeline dashboard is ready. You can now define open job roles and start screening resumes.
                    </p>
                  </div>

                  <Button 
                    onClick={() => {
                      queryClient.setQueryData(["checkOnboarding", userId], (old) => ({
                        ...old,
                        onboarded: true
                      }))
                      toast.success("Welcome to your dashboard!")
                      navigate({ to: "/hr/portal" })
                    }} 
                    className="w-full max-w-sm h-12 text-xs uppercase font-bold"
                  >
                    Enter Dashboard
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              )}

              {/* Footer buttons */}
              {step < 4 && (
                <div className="mt-8 pt-6 border-t border-border flex justify-between gap-4">
                  <Button 
                    variant="outline" 
                    onClick={handleBack}
                    disabled={step === 1 || isSaving}
                    className="flex-1 h-12 text-xs uppercase font-bold"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext}
                    disabled={isSaving}
                    className="flex-grow h-12 text-xs uppercase font-bold"
                  >
                    {isSaving ? "Saving..." : step === 3 ? "Complete Setup" : "Continue"}
                  </Button>
                </div>
              )}

            </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-t border-slate-100 bg-white select-none">
        SOC 2 Type II Compliant · EU-US Data Privacy Framework
      </footer>
    </div>
  )
}
