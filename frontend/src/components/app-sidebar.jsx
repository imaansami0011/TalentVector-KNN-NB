import * as React from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { 
  LayoutDashboard, 
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
    { label: "Jobs", to: "/hr/jobs", icon: Briefcase },
    { label: "Candidates", to: "/candidates", icon: Users },
  ]

  const accountItems = userRole === "candidate" ? [
    { label: "My Profile", to: "/user-profile", icon: UserCircle2, search: { onboarding: false } },
  ] : [
    { label: "My Profile", to: "/profile", icon: UserCircle2 },
  ]

  const NavItem = ({ item }) => {
    const Icon = item.icon
    const isActive = routerState.location.pathname.startsWith(item.to)
    return (
      <Link
        to={item.to}
        search={item.search}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex items-center py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 w-full",
          collapsed
            ? "justify-center"
            : "gap-3 px-3",
          isActive
            ? "bg-primary text-white shadow-[0_4px_12px_rgba(59,130,246,0.15)]"
            : "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
        )}
      >
        <Icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-white" : "text-slate-400 dark:text-slate-500")} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    )
  }

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full bg-white border-r border-border text-slate-700">
      {/* Brand Header */}
      <div className={cn(
        "h-16 flex items-center border-b border-border shrink-0",
        collapsed && !isMobile ? "justify-between px-3" : "justify-between px-5"
      )}>
        <Link
          to="/"
          className={cn(
            "flex items-center font-display text-base font-bold text-foreground focus-visible:outline-none",
            collapsed && !isMobile ? "gap-0" : "gap-2.5"
          )}
        >
          <div className="w-8 h-8 flex items-center justify-center overflow-hidden shrink-0">
            <img src="/favicon.svg" alt="Talent Vector" className="w-8 h-8 object-contain" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">
                Talent Vector
              </span>
              <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">
                {userRole === "candidate" ? "Candidate OS" : "Recruiter OS"}
              </span>
            </div>
          )}
        </Link>

        {/* Collapse / Expand toggle */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft className="w-4 h-4" />
            }
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className={cn(
        "flex-1 py-6 space-y-7 overflow-y-auto custom-scrollbar",
        collapsed && !isMobile ? "px-2" : "px-4"
      )}>
        {/* Workspace Group */}
        <div className="space-y-1">
          {(!collapsed || isMobile) && (
            <h4 className="px-3 mb-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Workspace
            </h4>
          )}
          <nav className="space-y-1">
            {workspaceItems.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </nav>
        </div>

        {/* Account Group */}
        <div className="space-y-1">
          {(!collapsed || isMobile) && (
            <h4 className="px-3 mb-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Account
            </h4>
          )}
          <nav className="space-y-1">
            {accountItems.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </nav>
        </div>
      </div>

      {/* Pro Tip Card Footer */}
      {(!collapsed || isMobile) && (
        <div className="p-4 border-t border-border dark:border-slate-800 shrink-0">
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
        collapsed ? "w-[60px]" : "w-64"
      )}>
        <SidebarContent isMobile={false} />
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
        <SidebarContent isMobile={true} />
      </aside>
    </>
  )
}
