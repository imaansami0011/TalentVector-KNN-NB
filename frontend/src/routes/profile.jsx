import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "../components/app-shell"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Switch } from "../components/ui/switch"
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar"
import { Badge } from "../components/ui/badge"
import { toast } from "sonner"
import { 
  Camera, 
  Save, 
  Shield, 
  Sparkles,
  Bell,
  Building2,
  Loader2
} from "lucide-react"

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
})

function ProfilePage() {
  const userId = localStorage.getItem("user_id")
  const userPicture = localStorage.getItem("user_picture")
  const [isSaving, setIsSaving] = React.useState(false)

  // Personal Info State
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState("")
  const [bio, setBio] = React.useState("")

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

  // Company State
  const [company, setCompany] = React.useState("")
  const [selectedPakCompany, setSelectedPakCompany] = React.useState("Systems Limited")
  const [customCompanyName, setCustomCompanyName] = React.useState("")
  const [website, setWebsite] = React.useState("")
  const [hq, setHq] = React.useState("")
  const [workplaceType, setWorkplaceType] = React.useState("Remote")
  const [address, setAddress] = React.useState("")
  const [timezone, setTimezone] = React.useState("PST (UTC-8)")

  // Notification Toggles
  const [notifyScreening, setNotifyScreening] = React.useState(true)
  const [notifyTopMatch, setNotifyTopMatch] = React.useState(true)
  const [notifyWeekly, setNotifyWeekly] = React.useState(false)
  const [notifyProduct, setNotifyProduct] = React.useState(true)

  // Security Toggles
  const [twoFA, setTwoFA] = React.useState(false)
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")

  // Fetch Profile Info
  const { data: profileData, isLoading: profileLoading } = useQuery({
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

  // Pre-fill states from profileData once loaded
  React.useEffect(() => {
    if (profileData) {
      if (profileData.full_name) setFullName(profileData.full_name)
      if (profileData.email) setEmail(profileData.email)
      if (profileData.role_title) setRole(profileData.role_title)
      if (profileData.bio) setBio(profileData.bio)
      if (profileData.company) {
        const cName = profileData.company.company_name || ""
        if (cName) {
          setCompany(cName)
          if (pakTopCompanies.includes(cName)) {
            setSelectedPakCompany(cName)
          } else {
            setSelectedPakCompany("Other")
            setCustomCompanyName(cName)
          }
        }
        if (profileData.company.website) setWebsite(profileData.company.website)
        if (profileData.company.hq_location) setHq(profileData.company.hq_location)
        if (profileData.company.address) setAddress(profileData.company.address)
        if (profileData.company.workplace_type) setWorkplaceType(profileData.company.workplace_type)
      }
    }
  }, [profileData, pakTopCompanies])

  const handleSave = async () => {
    if (!fullName) {
      toast.warning("Full name is required.")
      return
    }
    if (!company) {
      toast.warning("Company name is required.")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("http://localhost:8000/recruiter/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          full_name: fullName,
          role_title: role,
          bio: bio,
          company_name: company,
          website: website,
          hq_location: hq === '__other__' ? '' : hq,
          workplace_type: workplaceType,
          address: address,
        }),
      })
      if (!res.ok) {
        throw new Error("Failed to update profile settings.")
      }
      toast.success("Profile and workspace configurations updated successfully!")
    } catch (error) {
      toast.error(error.message || "Failed to update profile settings.")
    } finally {
      setIsSaving(false)
    }
  }

  if (profileLoading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 space-y-4 select-none animate-fadeIn">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Loading Profile Details...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto animate-fadeIn select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Workspace configurations</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">My profile</h1>
            <p className="text-xs text-slate-500 font-medium">Manage your personal settings, company info, alerts, and security options.</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="h-11">
            <Save className="w-4 h-4 mr-1.5" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Profile Card Header */}
        <Card className="bg-white border border-border overflow-hidden">
          <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              {/* Profile Avatar with Camera Button */}
              <div className="relative group select-none">
                <Avatar className="w-20 h-20 border border-border shadow bg-slate-100">
                  <AvatarImage src={userPicture || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(fullName || email || "Alex")}`} alt="Recruiter profile" />
                  <AvatarFallback>{fullName ? fullName.split(" ").map(n => n[0]).join("") : "AM"}</AvatarFallback>
                </Avatar>
                <button 
                  onClick={() => toast.info("Avatar image upload triggered.")}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-slate-900 text-white border-2 border-white flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <h2 className="text-lg font-black text-slate-900 uppercase leading-none">{fullName || "Recruiter Profile"}</h2>
                  <Badge variant="new" className="h-5 text-[8px] bg-primary/10 border-primary/20 text-primary">Pro Plan</Badge>
                </div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{role || "Sourcing Specialist"} @ {company || "Talent Vector Partner"}</p>
              </div>
            </div>

            <Badge variant="secondary" className="border-none bg-slate-100 text-slate-500 text-[9px] select-none font-bold uppercase tracking-wider py-1 px-3">
              Team Space: Recruiting Org
            </Badge>
          </div>
        </Card>

        {/* Settings Form Grid (2x2) */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Card 1: Personal Info */}
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4.5 h-4.5 text-primary" />
                <span>Personal Information</span>
              </CardTitle>
              <CardDescription>Update your name, email, and bio.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Full Name</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Work Email</label>
                <Input type="email" value={email} disabled className="bg-slate-50 text-slate-400 cursor-not-allowed" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Bio / Summary</label>
                <Input value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Company Details */}
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="w-4.5 h-4.5 text-primary" />
                <span>Company Details</span>
              </CardTitle>
              <CardDescription>Setup company metadata for screening JDs.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Company Name</label>
                  <select
                    value={selectedPakCompany}
                    onChange={(e) => {
                      const val = e.target.value
                      setSelectedPakCompany(val)
                      if (val !== "Other") {
                        setCompany(val)
                      } else {
                        setCompany(customCompanyName)
                      }
                    }}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-primary outline-none text-xs font-bold text-slate-800 bg-white"
                  >
                    {pakTopCompanies.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Website URL</label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
              </div>

              {selectedPakCompany === "Other" && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Enter Custom Company Name</label>
                  <Input 
                    placeholder="My Software House"
                    value={customCompanyName}
                    onChange={(e) => {
                      const val = e.target.value
                      setCustomCompanyName(val)
                      setCompany(val)
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">HQ Location (City)</label>
                  {(() => {
                    const PK_CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Sialkot','Hyderabad'];
                    const isStandard = PK_CITIES.includes(hq);
                    const isCustom = hq && !isStandard;
                    return (
                      <>
                        <select
                          value={isStandard ? hq : (isCustom ? 'Other' : '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'Other') {
                              setHq('__other__');
                            } else {
                              setHq(val);
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
                        {(isCustom || hq === '__other__') && (
                          <Input
                            placeholder="Enter city name"
                            value={hq === '__other__' ? '' : hq}
                            onChange={(e) => setHq(e.target.value || '__other__')}
                            className="mt-1.5"
                          />
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="space-y-1">
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

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Office Address</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Notification Alerts */}
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bell className="w-4.5 h-4.5 text-primary" />
                <span>Email Notifications</span>
              </CardTitle>
              <CardDescription>Control alerts sent to your work inbox.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              
              {/* Item 1 */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Screening Completed</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Receive an email when candidate resume matching completes.</p>
                </div>
                <Switch checked={notifyScreening} onCheckedChange={setNotifyScreening} />
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">New Top-Match</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Alert me when a candidate matches a JD profile above 85%.</p>
                </div>
                <Switch checked={notifyTopMatch} onCheckedChange={setNotifyTopMatch} />
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Weekly Pipeline Digest</h4>
                  <p className="text-[10px] text-slate-400 font-medium">A summary report of active openings and candidates screened.</p>
                </div>
                <Switch checked={notifyWeekly} onCheckedChange={setNotifyWeekly} />
              </div>

              {/* Item 4 */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Product Updates</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Updates about new ranking algorithm releases and UI enhancements.</p>
                </div>
                <Switch checked={notifyProduct} onCheckedChange={setNotifyProduct} />
              </div>

            </CardContent>
          </Card>

          {/* Card 4: Security */}
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="w-4.5 h-4.5 text-primary" />
                <span>Security & Access</span>
              </CardTitle>
              <CardDescription>Configure authentication and credential options.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              
              <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-50">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Two-Factor Authentication</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Require an OTP code to login using email credentials.</p>
                </div>
                <Switch checked={twoFA} onCheckedChange={setTwoFA} />
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Current Password</label>
                  <Input type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">New Password</label>
                  <Input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>
    </AppShell>
  )
}
