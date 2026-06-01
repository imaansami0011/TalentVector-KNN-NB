import * as React from "react"
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { Mail, KeyRound, ArrowRight, ArrowLeft, Briefcase, UserRound, Sparkles } from "lucide-react"
import { useGoogleLogin } from "@react-oauth/google"
import { toast } from "sonner"

export const Route = createFileRoute("/")({
  component: IdentityGateway,
})

function IdentityGateway() {
  const [role, setRole] = React.useState("candidate") // 'candidate' | 'hr'
  const [email, setEmail] = React.useState("")
  const [otp, setOtp] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [step, setStep] = React.useState("email") // 'email' | 'otp' | 'password' | 'google-signin'
  const [googleStep, setGoogleStep] = React.useState("select") // 'select' | 'custom'
  const [googleEmail, setGoogleEmail] = React.useState("")
  const [googleLoading, setGoogleLoading] = React.useState(false)
  const [missingRoleInfo, setMissingRoleInfo] = React.useState(null)

  const navigate = useNavigate()

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("http://localhost:8000/auth/register-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: role === "hr" ? "recruiter" : "candidate" })
      })
      if (response.ok) {
        setStep("otp")
        toast.info("A 6-digit OTP code has been sent to your email.")
      } else {
        const errorData = await response.json()
        if (errorData.detail === "User already exists") {
          setStep("login")
          toast.info("Welcome back! Please enter your password.")
        } else {
          toast.error(errorData.detail || "Failed to initialize registration.")
        }
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to connect to authentication server. Is the backend running?")
    }
  }

  const handleOtpSubmit = (e) => {
    e.preventDefault()
    setStep("password")
    toast.success("OTP verified.")
  }

  const performLogin = async (loginEmail, loginPassword, createMissing = false) => {
    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          role: role === "hr" ? "recruiter" : "candidate",
          create_missing: createMissing
        })
      })

      if (response.status === 409) {
        const errorData = await response.json()
        if (errorData.detail && errorData.detail.startsWith("role_missing:")) {
          const existingRole = errorData.detail.split(":")[1]
          setMissingRoleInfo({
            email: loginEmail,
            password: loginPassword,
            targetRole: role === "hr" ? "recruiter" : "candidate",
            existingRole: existingRole,
            type: "password"
          })
          return
        }
      }

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.detail || "Login failed. Please check your credentials.")
        return
      }

      const data = await response.json()
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("user_id", data.user_id || loginEmail)
      localStorage.setItem("user_email", loginEmail)
      localStorage.setItem("user_role", data.role || (role === "hr" ? "recruiter" : "candidate"))
      localStorage.setItem("user_name", loginEmail.split("@")[0])

      toast.success("Logged in successfully!")
      navigate({ to: "/onboarding" })
    } catch (err) {
      console.error(err)
      toast.error("Failed to log in. Make sure backend is running.")
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("http://localhost:8000/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          password,
          role: role === "hr" ? "recruiter" : "candidate"
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.detail || "Verification failed. Please check your OTP.")
        return
      }

      await performLogin(email, password)
    } catch (err) {
      console.error(err)
      toast.error("Failed to register. Make sure backend is running.")
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    await performLogin(email, password)
  }

  const performGoogleLogin = async (googleEmail, googleName, googleToken, createMissing = false) => {
    setGoogleLoading(true)
    setStep("google-signin")
    try {
      const backendRes = await fetch("http://localhost:8000/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: googleEmail,
          name: googleName || "Google User",
          role: role === "hr" ? "recruiter" : "candidate",
          create_missing: createMissing
        }),
      })

      if (backendRes.status === 409) {
        const errorData = await backendRes.json()
        if (errorData.detail && errorData.detail.startsWith("role_missing:")) {
          const existingRole = errorData.detail.split(":")[1]
          setMissingRoleInfo({
            email: googleEmail,
            name: googleName,
            targetRole: role === "hr" ? "recruiter" : "candidate",
            existingRole: existingRole,
            googleToken: googleToken,
            type: "google"
          })
          setStep("email")
          return
        }
      }

      if (!backendRes.ok) {
        throw new Error("Backend authentication failed")
      }

      const authData = await backendRes.json()

      localStorage.setItem("access_token", authData.access_token)
      localStorage.setItem("user_name", googleName || "Google User")
      localStorage.setItem("user_id", authData.user_id || googleEmail)
      localStorage.setItem("user_email", googleEmail)
      localStorage.setItem("user_picture", `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(googleEmail)}`)
      localStorage.setItem("user_role", authData.role || (role === "hr" ? "recruiter" : "candidate"))

      toast.success(`Google Signed in: ${googleEmail}`)
      
      navigate({ to: "/onboarding" })
    } catch (error) {
      console.error(error)
      toast.error(error.message || "Google Sign-In failed.")
      setStep("email")
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleGoogleLoginSuccess = async (googleToken) => {
    setGoogleLoading(true)
    setStep("google-signin")
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${googleToken.access_token}` },
      })
      if (!res.ok) {
        throw new Error("Failed to fetch Google profile info")
      }
      const profile = await res.json()
      await performGoogleLogin(profile.email, profile.name || profile.given_name, googleToken, false)
    } catch (error) {
      console.error(error)
      toast.error(error.message || "Google Sign-In failed.")
      setStep("email")
      setGoogleLoading(false)
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => handleGoogleLoginSuccess(tokenResponse),
    onError: (error) => {
      console.error("Login Failed:", error)
      toast.error("Google Sign-in was cancelled or failed.")
    }
  })

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-slate-950">
      <style>{`
        @keyframes float-slow-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(60px, -40px) scale(1.15); }
        }
        @keyframes float-slow-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-80px, 50px) scale(1.2); }
        }
        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 20px rgba(255,255,255,0.1), 0 0 10px rgba(99,102,241,0.1); }
          50% { text-shadow: 0 0 35px rgba(99,102,241,0.8), 0 0 55px rgba(59,130,246,0.5), 0 0 15px rgba(255,255,255,0.6); }
        }
        .animate-float-1 {
          animation: float-slow-1 18s infinite ease-in-out;
        }
        .animate-float-2 {
          animation: float-slow-2 24s infinite ease-in-out;
        }
        .animate-text-glow {
          animation: text-glow 4s infinite ease-in-out;
        }
      `}</style>

      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 flex flex-col md:flex-row overflow-hidden select-none pointer-events-auto z-10">
        {/* Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-20 pointer-events-none"></div>

        {/* Dynamic Animated Mesh Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[130px] animate-float-1 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-indigo-500/15 rounded-full blur-[160px] animate-float-2 pointer-events-none"></div>

        {/* Recruiter Side - Left */}
        <div 
          onClick={() => {
            setRole("hr")
          }}
          className={`flex-1 flex flex-col items-center justify-center p-12 transition-all duration-700 cursor-pointer ${
            role === "hr" 
              ? "bg-slate-900/40" 
              : "bg-slate-950/80 hover:bg-slate-950/60"
          }`}
        >
          <div className={`max-w-xs text-center transition-all duration-700 ${
            role === "hr" 
              ? "opacity-100 translate-y-0 scale-105" 
              : "opacity-45 scale-95 translate-x-[-20px] hover:opacity-75"
          }`}>
            <div className="relative group">
              <div className={`absolute -inset-4 bg-blue-500/30 rounded-[2.5rem] blur-xl transition-opacity duration-500 ${
                role === "hr" ? "opacity-100" : "opacity-0 group-hover:opacity-40"
              }`}></div>
              <div className={`relative w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 mx-auto border transition-all duration-500 ${
                role === "hr" 
                  ? "bg-white/10 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)] scale-110" 
                  : "bg-white/5 border-white/10"
              }`}>
                <Briefcase className={`w-10 h-10 transition-colors duration-500 ${
                  role === "hr" ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.6)]" : "text-slate-400"
                }`} />
              </div>
            </div>
            <h2 className="text-5xl font-black mb-6 tracking-tighter leading-none">
              <span className={`block uppercase text-xs tracking-[0.3em] font-extrabold mb-2 transition-colors ${
                role === "hr" ? "text-blue-400" : "text-slate-400"
              }`}>Platform</span>
              <span className={`uppercase font-display transition-all duration-500 ${
                role === "hr"
                  ? "text-white animate-text-glow font-black"
                  : "text-slate-300 font-extrabold"
              }`}>RECRUITERS</span>
            </h2>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-transparent mx-auto mb-4 rounded-full"></div>
            <p className={`font-bold uppercase tracking-[0.2em] text-[9px] leading-relaxed max-w-[200px] mx-auto transition-colors ${
              role === "hr" ? "text-slate-200" : "text-slate-500"
            }`}>
              Precision sourcing powered by neural matching
            </p>
          </div>
        </div>

        {/* Job Seeker Side - Right */}
        <div 
          onClick={() => {
            setRole("candidate")
          }}
          className={`flex-1 flex flex-col items-center justify-center p-12 transition-all duration-700 cursor-pointer ${
            role === "candidate" 
              ? "bg-gradient-to-br from-indigo-950/30 via-blue-900/20 to-indigo-950/30" 
              : "bg-blue-950/80 hover:bg-blue-950/60"
          }`}
        >
          <div className={`max-w-xs text-center transition-all duration-700 ${
            role === "candidate" 
              ? "opacity-100 translate-y-0 scale-105" 
              : "opacity-45 scale-95 translate-x-[20px] hover:opacity-75"
          }`}>
            <div className="relative group">
              <div className={`absolute -inset-4 bg-white/10 rounded-[2.5rem] blur-xl transition-opacity duration-500 ${
                role === "candidate" ? "opacity-100" : "opacity-0 group-hover:opacity-40"
              }`}></div>
              <div className={`relative w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 mx-auto border transition-all duration-500 ${
                role === "candidate" 
                  ? "bg-white/20 border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] scale-110" 
                  : "bg-white/10 border-white/20"
              }`}>
                <UserRound className={`w-10 h-10 transition-colors duration-500 ${
                  role === "candidate" ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]" : "text-slate-400"
                }`} />
              </div>
            </div>
            <h2 className="text-5xl font-black mb-6 tracking-tighter leading-none">
              <span className={`block uppercase text-xs tracking-[0.3em] font-extrabold mb-2 transition-colors ${
                role === "candidate" ? "text-indigo-300" : "text-slate-400"
              }`}>Connect</span>
              <span className={`uppercase font-display transition-all duration-500 ${
                role === "candidate"
                  ? "text-white animate-text-glow font-black"
                  : "text-slate-300 font-extrabold"
              }`}>SEEKERS</span>
            </h2>
            <div className="w-12 h-1 bg-gradient-to-r from-white to-transparent mx-auto mb-4 rounded-full"></div>
            <p className={`font-bold uppercase tracking-[0.2em] text-[9px] leading-relaxed max-w-[200px] mx-auto transition-colors ${
              role === "candidate" ? "text-indigo-100" : "text-slate-500"
            }`}>
              Auto-fetch your path to global engineering roles
            </p>
          </div>
        </div>
      </div>

      {/* Floating Login Card */}
      <div className="relative z-30 max-w-[400px] w-full bg-white/95 backdrop-blur-[30px] rounded-[2rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5)] border border-white/60 overflow-hidden animate-fadeIn m-4 group">
        {/* Card Rim Light Effect */}
        <div className="absolute inset-0 border-[1px] border-white/80 rounded-[2rem] pointer-events-none"></div>
        
        {/* Header */}
        <div className="relative p-8 text-center bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 overflow-hidden">
          <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-30deg] animate-sweep"></div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase drop-shadow-md font-display">Talent Vector</h1>
          <p className="text-white/80 font-black text-[9px] uppercase tracking-[0.4em] mt-2 drop-shadow-sm">Next-Generation Talent Acquisition</p>
        </div>

        <div className="p-8 space-y-6">
          {/* Sliding Role Toggle */}
          <div className="relative flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-md h-12">
            {/* Sliding Background */}
            <div 
              className="absolute top-1 bottom-1 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-slate-200/40 transition-all duration-500 ease-out z-0"
              style={{ 
                left: role === "hr" ? "4px" : "calc(50% + 2px)", 
                width: "calc(50% - 6px)" 
              }}
            ></div>
            
            <button
              onClick={() => {
                setRole("hr")
              }}
              className={`flex-1 relative z-10 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                role === "hr" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Briefcase className={`w-4 h-4 transition-transform duration-300 ${role === "hr" ? "scale-105" : "scale-100"}`} /> Recruiter
            </button>
            <button
              onClick={() => {
                setRole("candidate")
              }}
              className={`flex-1 relative z-10 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                role === "candidate" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <UserRound className={`w-4 h-4 transition-transform duration-300 ${role === "candidate" ? "scale-105" : "scale-100"}`} /> Job Seeker
            </button>
          </div>

          {/* Form step handling */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5 animate-fadeIn">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 block">Email Access</label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-transparent rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-4 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-sm font-semibold text-slate-800 placeholder:text-slate-300 shadow-inner"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="group relative w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 overflow-hidden rounded-2xl transition-all duration-500 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <span className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Continue with Email</span>
                  <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              <div className="relative flex items-center justify-center py-1">
                <div className="absolute inset-0 flex items-center px-1">
                  <div className="w-full border-t border-slate-200/80"></div>
                </div>
                <span className="relative px-4 bg-white text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Identity Protocol</span>
              </div>

              {/* Google Button */}
              <button 
                type="button"
                onClick={() => googleLogin()}
                className="group relative w-full py-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl flex items-center justify-center gap-3.5 transition-all duration-500 hover:bg-slate-50 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
              >
                <svg className="w-5 h-5 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-slate-700 font-black uppercase tracking-[0.2em] text-[10px]">Continue with Google</span>
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-5 animate-fadeIn">
              <div className="text-center mb-4">
                <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Check your email</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">We simulated a code sent to {email}</p>
              </div>
              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-center text-xl font-black tracking-[0.5em] font-display shadow-inner bg-slate-50/50"
                  placeholder="------"
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                Verify Code
              </button>
              <button type="button" onClick={() => setStep("email")} className="w-full py-1 text-slate-400 font-black uppercase tracking-widest text-[9px] hover:text-slate-700 transition-colors">
                Back to email
              </button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5 animate-fadeIn">
              <div className="text-center mb-4">
                <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Create Password</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Secure your mock profile session</p>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 block">New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200/80 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-sm font-semibold text-slate-800 bg-slate-50/50 shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Create Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-5 animate-fadeIn">
              <div className="text-center mb-4">
                <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Welcome Back</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Enter your password to sign in</p>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 block">Password</label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-transparent rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-4 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-sm font-semibold text-slate-800 placeholder:text-slate-300 shadow-inner"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="group relative w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 overflow-hidden rounded-2xl transition-all duration-500 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <span className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Log In</span>
                  <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-1" />
                </div>
              </button>
              
              <button 
                type="button" 
                onClick={() => setStep("email")} 
                className="w-full py-1 text-slate-400 font-black uppercase tracking-widest text-[9px] hover:text-slate-700 transition-colors"
              >
                Back to email
              </button>
            </form>
          )}

          {step === "google-signin" && (
            <div className="space-y-6 animate-fadeIn">
              <style>{`
                @keyframes googleBar {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
                .animate-google-bar {
                  animation: googleBar 1.5s infinite linear;
                }
              `}</style>
              <div className="flex flex-col items-center justify-center py-8 space-y-5">
                <div className="relative flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full border-4 border-slate-100 flex items-center justify-center">
                    <svg className="w-7 h-7 animate-spin" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Connecting to Google</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Verifying secure OAuth credentials...</p>
                </div>
                <div className="w-40 h-1 bg-slate-100 rounded-full overflow-hidden relative mx-auto">
                  <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-blue-500 via-red-500 via-yellow-500 to-green-500 rounded-full animate-google-bar"></div>
                </div>
              </div>
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors font-black text-[9px] uppercase tracking-widest cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to platform login
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CONFIRMATION POPUP FOR MULTI-ROLE AUTO-PROVISIONING */}
      {missingRoleInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-white border border-slate-200 shadow-2xl max-w-sm w-full p-6 relative rounded-3xl space-y-5 animate-scaleIn">
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-2xl">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                  {missingRoleInfo.targetRole === "recruiter" ? "Recruiter Account" : "Job Seeker Account"}
                </h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Create Profile</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {missingRoleInfo.targetRole === "recruiter" 
                ? "Do you want to be a recruiter and post jobs?" 
                : "Do you want to be a job seeker and search for jobs?"}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMissingRoleInfo(null)}
                className="flex-grow h-10 font-bold text-xs uppercase tracking-wider border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={async () => {
                  const info = missingRoleInfo
                  setMissingRoleInfo(null)
                  if (info.type === "password") {
                    await performLogin(info.email, info.password, true)
                  } else {
                    await performGoogleLogin(info.email, info.name, info.googleToken, true)
                  }
                }}
                className="flex-grow h-10 font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/10 rounded-xl bg-primary text-white hover:bg-primary/95 transition-all cursor-pointer"
              >
                Yes
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
