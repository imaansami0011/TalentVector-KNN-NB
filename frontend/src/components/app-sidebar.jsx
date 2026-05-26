import * as React from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { 
  LayoutDashboard, 
  ScanLine, 
  FileSearch, 
  Users, 
  Briefcase, 
  UserCircle2, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { cn } from "../lib/utils"

export function AppSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const routerState = useRouterState()
  const userRole = typeof window !== 'undefined' ? localStorage.getItem("user_role") : null
  
  const workspaceItems = userRole === "candidate" ? [
    { label: "Browse Jobs", to: "/browse", icon: Briefcase },
  ] : [
    { label: "Dashboard", to: "/hr/portal", icon: LayoutDashboard },
    { label: "Screening", to: "/screening", icon: ScanLine },
    { label: "JD Sourcing", to: "/jd-sourcing", icon: FileSearch },
    { label: "Candidates", to: "/candidates", icon: Users },
  ]

  const accountItems = userRole === "candidate" ? [
    { label: "My Profile", to: "/user-profile", icon: UserCircle2, search: { onboarding: false } },
  ] : [
    { label: "My Profile", to: "/profile", icon: UserCircle2 },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-border text-slate-700">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2.5 font-display text-base font-bold text-foreground focus-visible:outline-none">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">Talent Vector</span>
              <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">
                {userRole === "candidate" ? "Candidate OS" : "Recruiter OS"}
              </span>
            </div>
          )}
        </Link>
        
        {/* Toggle Button for Desktop */}
        {!mobileOpen && (
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-6 px-4 space-y-7 overflow-y-auto custom-scrollbar">
        {/* Workspace Group */}
        <div className="space-y-2">
          {!collapsed && (
            <h4 className="px-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Workspace
            </h4>
          )}
          <nav className="space-y-1">
            {workspaceItems.map((item) => {
              const Icon = item.icon
              const isActive = routerState.location.pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  search={item.search}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200",
                    isActive 
                      ? "bg-primary text-white shadow-[0_4px_12px_rgba(59,130,246,0.15)]" 
                      : "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                  )}
                >
                  <Icon className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-white" : "text-slate-400 dark:text-slate-500")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Account Group */}
        <div className="space-y-2">
          {!collapsed && (
            <h4 className="px-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Account
            </h4>
          )}
          <nav className="space-y-1">
            {accountItems.map((item) => {
              const Icon = item.icon
              const isActive = routerState.location.pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  search={item.search}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200",
                    isActive 
                      ? "bg-primary text-white shadow-[0_4px_12px_rgba(59,130,246,0.15)]" 
                      : "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                  )}
                >
                  <Icon className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-white" : "text-slate-400 dark:text-slate-500")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Pro Tip Card Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border dark:border-slate-800">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pro Tip</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {userRole === "candidate" 
                ? "Keep your profile skills up to date to see match scores on discoverable jobs."
                : "Upload a JD + 20 resumes to get a ranked shortlist in seconds."}
            </p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:block shrink-0 h-screen transition-all duration-300 ease-in-out sticky top-0",
        collapsed ? "w-20" : "w-64"
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside className={cn(
        "md:hidden fixed top-0 bottom-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out transform",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>
    </>
  )
}
