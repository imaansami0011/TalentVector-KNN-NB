import * as React from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Sparkles, Check, ArrowRight, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
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

export const Route = createFileRoute("/onboarding/recruiter")({
  component: RecruiterOnboardingPage,
})

function RecruiterOnboardingPage() {
  const navigate = useNavigate()
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
  const [fullName, setFullName] = React.useState("")
  const [workEmail, setWorkEmail] = React.useState("")
  const [role, setRole] = React.useState("")
  
  const [companyName, setCompanyName] = React.useState("Systems Limited")
  const [selectedPakCompany, setSelectedPakCompany] = React.useState("Systems Limited")
  const [customCompanyName, setCustomCompanyName] = React.useState("")
  const [website, setWebsite] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [workplaceType, setWorkplaceType] = React.useState("Remote")
  const [address, setAddress] = React.useState("")

  const [invites, setInvites] = React.useState(["", "", ""])

  const userId = localStorage.getItem("user_id")

  // Fetch Onboarding Status
  const { data: onboardingData, isLoading: onboardingLoading } = useQuery({
    queryKey: ["checkOnboarding", userId],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/recruiter/check-onboarding", {
        headers: { "x-user-id": userId },
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
      const res = await fetch("http://localhost:8000/recruiter/profile", {
        headers: { "x-user-id": userId },
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
      if (profileData.full_name) setFullName(profileData.full_name)
      if (profileData.email) setWorkEmail(profileData.email)
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
        const res = await fetch("http://localhost:8000/recruiter/company", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            company_name: companyName,
            website: website,
            address: address,
            hq_location: location === '__other__' ? '' : location,
            workplace_type: workplaceType,
            full_name: fullName,
            role_title: role,
          }),
        })
        if (!res.ok) {
          throw new Error("Failed to save company profile.")
        }
        toast.success("Company profile saved successfully!")
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
        <div className="flex items-center gap-2.5 font-display text-base font-bold text-slate-900">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <span className="font-extrabold text-slate-900 leading-none tracking-tight">Talent Vector</span>
        </div>
        <div className="text-xs font-black uppercase text-primary border border-primary/20 bg-primary/5 px-3 py-1 rounded-full select-none">
          Recruiter Portal Setup
        </div>
      </header>

      {/* Main Form Area */}
      <main className="relative flex-grow flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-xl flex flex-col gap-8">
          {/* Progress Tracker */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Step {step} of 4</span>
              <span className="text-primary font-bold">{progressPercent}% Completed</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>

          {/* Form Card */}
          <Card className="shadow-xl p-8 bg-white border border-border">
            <CardContent className="p-0">
              
              {/* STEP 1: Account info */}
              {step === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Personal Profile</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Introduce yourself to start building your recruiting workspace.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Full Name</label>
                      <OnboardingInput 
                        placeholder="Alex Mercer"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Work Email</label>
                      <OnboardingInput 
                        type="email"
                        placeholder="alex@company.com"
                        value={workEmail}
                        onChange={(e) => setWorkEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Your Role / Job Title</label>
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
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Company Details</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Add information about your company for employer branding.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Company Name</label>
                        <select
                          value={selectedPakCompany}
                          onChange={(e) => {
                            const val = e.target.value
                            setSelectedPakCompany(val)
                            if (val !== "Other") {
                              setCompanyName(val)
                            } else {
                              setCompanyName(customCompanyName)
                            }
                          }}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-primary outline-none text-xs font-bold text-slate-800 bg-white"
                        >
                          {pakTopCompanies.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Website URL</label>
                        <OnboardingInput 
                          placeholder="https://company.co"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                        />
                      </div>
                    </div>

                    {selectedPakCompany === "Other" && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Enter Custom Company Name</label>
                        <OnboardingInput 
                          placeholder="My Software House"
                          value={customCompanyName}
                          onChange={(e) => {
                            const val = e.target.value
                            setCustomCompanyName(val)
                            setCompanyName(val)
                          }}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">HQ Location (City)</label>
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
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Workplace Type</label>
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
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Office Address</label>
                      <OnboardingTextarea 
                        placeholder="100 Pine Street, Suite 1200"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Team invites */}
              {step === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Invite Teammates</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Invite colleagues to review shortlists and collaborate on screenings.</p>
                  </div>

                  <div className="space-y-4">
                    {invites.map((email, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Teammate {idx + 1} Email</label>
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
                <div className="space-y-8 text-center py-6 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                    <Check className="w-8 h-8 stroke-[3px]" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Launch Ready</h2>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                      Your hiring pipeline dashboard is ready. You can now define open job roles and start screening resumes.
                    </p>
                  </div>

                  <Button 
                    onClick={() => {
                      toast.success("Welcome to your dashboard!")
                      navigate({ to: "/hr/portal" })
                    }} 
                    className="w-full h-13"
                  >
                    Enter Dashboard
                    <ArrowRight className="w-4 h-4 ml-1" />
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
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext}
                    disabled={isSaving}
                    className="flex-grow"
                  >
                    {isSaving ? "Saving..." : step === 3 ? "Complete Setup" : "Continue"}
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
        SOC 2 Type II Compliant · EU-US Data Privacy Framework
      </footer>
    </div>
  )
}
