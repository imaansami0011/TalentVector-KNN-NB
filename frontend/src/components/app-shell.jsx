import * as React from "react"
import { createPortal } from "react-dom"
import { Menu, LogOut, UserCircle, AlertCircle } from "lucide-react"
import { AppSidebar } from "./app-sidebar"
import { useIsMobile } from "../hooks/use-mobile"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { Link, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

export function AppShell({ children, rightPanel }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  
  const userPicture = typeof window !== 'undefined' ? localStorage.getItem("user_picture") : null
  const userName = typeof window !== 'undefined' ? localStorage.getItem("user_name") : "Recruiter"
  const userRole = typeof window !== 'undefined' ? localStorage.getItem("user_role") : null

  const currentRole = userRole === "hr" ? "recruiter" : userRole
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem("user_email") : null

  const [userRoles, setUserRoles] = React.useState([])
  const [isSwitching, setIsSwitching] = React.useState(false)
  const [showSwitchErrorModal, setShowSwitchErrorModal] = React.useState(false)

  const handleCancelModal = () => {
    setShowSwitchErrorModal(false)
  }

  const handleConfirmRedirect = async () => {
    setShowSwitchErrorModal(false)
    setIsSwitching(true)
    const targetRole = currentRole === "recruiter" ? "candidate" : "recruiter"
    try {
      const res = await fetch("http://localhost:8000/auth/switch-role", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({
          email: userEmail,
          target_role: targetRole,
          create_missing: true
        })
      })

      if (!res.ok) throw new Error("Failed to create and switch role")
      const data = await res.json()

      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("user_id", data.user_id)
      localStorage.setItem("user_role", data.role)
      
      toast.success(`Switched role session to ${data.role === "recruiter" ? "Recruiter" : "Job Seeker"}!`)
      window.location.href = data.role === "recruiter" ? "/hr/portal" : "/browse"
    } catch (err) {
      console.error(err)
      toast.error("Failed to switch role session. Please try again.")
    } finally {
      setIsSwitching(false)
    }
  }

  React.useEffect(() => {
    if (!userEmail) return
    fetch(`http://localhost:8000/auth/roles?email=${encodeURIComponent(userEmail)}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch roles")
        return res.json()
      })
      .then(data => {
        setUserRoles(data.roles || [])
      })
      .catch(err => {
        console.error("Error fetching user roles:", err)
      })
  }, [userEmail])

  const handleRoleSwitch = async (targetRole) => {
    if (targetRole === currentRole || isSwitching) return

    if (userRoles.includes(targetRole)) {
      setIsSwitching(true)
      try {
        const res = await fetch("http://localhost:8000/auth/switch-role", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`
          },
          body: JSON.stringify({
            email: userEmail,
            target_role: targetRole
          })
        })

        if (!res.ok) throw new Error("Failed to switch role")
        const data = await res.json()

        localStorage.setItem("access_token", data.access_token)
        localStorage.setItem("user_id", data.user_id)
        localStorage.setItem("user_role", data.role)
        
        window.location.href = data.role === "recruiter" ? "/hr/portal" : "/browse"
      } catch (err) {
        console.error(err)
        alert("Failed to switch role session. Please try again.")
      } finally {
        setIsSwitching(false)
      }
    } else {
      setShowSwitchErrorModal(true)
    }
  }

  // Close dropdown when clicking outside
  const dropdownRef = React.useRef(null)
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSignOut = () => {
    localStorage.clear()
    navigate({ to: "/login" })
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Sidebar */}
      <AppSidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Glass Header */}
        <header className="sticky top-0 z-30 h-16 glass border-b border-border dark:border-slate-800 flex items-center justify-between px-6 select-none">
          {/* Mobile hamburger & page context */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-4">
            {/* Role Toggle Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => handleRoleSwitch("recruiter")}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  currentRole === "recruiter"
                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm border border-slate-200/50 font-black"
                    : "text-slate-400 hover:text-slate-650 font-bold"
                }`}
              >
                Recruiter
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch("candidate")}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  currentRole === "candidate"
                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm border border-slate-200/50 font-black"
                    : "text-slate-400 hover:text-slate-650 font-bold"
                }`}
              >
                Job Seeker
              </button>
            </div>
            
            {/* User Profile Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 focus-visible:outline-none cursor-pointer"
              >
                <Avatar className="w-9 h-9 hover:scale-105 transition-transform duration-200 ring-2 ring-primary/10">
                  <AvatarImage src={userPicture || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(userName)}`} alt={userName} />
                  <AvatarFallback>{userName ? userName.slice(0, 2).toUpperCase() : (userRole === "candidate" ? "CN" : "RC")}</AvatarFallback>
                </Avatar>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-border dark:border-slate-800 mb-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{userName}</p>
                  </div>
                  <Link 
                    to={userRole === "candidate" ? "/user-profile" : "/profile"} 
                    search={userRole === "candidate" ? { onboarding: false } : {}}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-colors"
                  >
                    <UserCircle className="w-4 h-4" />
                    My Profile
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-x-hidden flex">
          <main className="flex-1 min-w-0">
            {children}
          </main>
          {rightPanel && (
            <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
              {rightPanel}
            </div>
          )}
        </div>
      </div>

      {/* ROLE SWITCH MISSING ACCOUNT MODAL */}
      {showSwitchErrorModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[100] flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 relative rounded-3xl space-y-5 animate-scaleIn">
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-2xl">
                <AlertCircle className="w-6 h-6 text-amber-500" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-slate-100">Account Missing</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Access Restrained</span>
              </div>
            </div>

            <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-medium">
              you dont have account as other role , do you want ?
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelModal}
                className="flex-grow h-10 font-bold text-xs uppercase tracking-wider border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmRedirect}
                className="flex-grow h-10 font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/10 rounded-xl bg-primary text-white hover:bg-primary/95 transition-all cursor-pointer"
              >
                Yes
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
