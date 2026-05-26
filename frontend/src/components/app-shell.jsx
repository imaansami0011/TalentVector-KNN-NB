import * as React from "react"
import { Menu, Bell, Search, LogOut, UserCircle } from "lucide-react"
import { AppSidebar } from "./app-sidebar"
import { useIsMobile } from "../hooks/use-mobile"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { Link, useNavigate } from "@tanstack/react-router"

export function AppShell({ children }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  
  const userPicture = typeof window !== 'undefined' ? localStorage.getItem("user_picture") : null
  const userName = typeof window !== 'undefined' ? localStorage.getItem("user_name") : "Recruiter"
  const userRole = typeof window !== 'undefined' ? localStorage.getItem("user_role") : null

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
            
            {/* Decorative Search bar */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-transparent focus-within:border-primary/20 transition-all w-64">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={userRole === "candidate" ? "Search jobs, skills..." : "Search candidates, JDs..."}
                className="bg-transparent border-none outline-none text-xs w-full text-foreground placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-4">
            {/* Decorative Notification Icon */}
            <button className="relative w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
            </button>
            
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
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
