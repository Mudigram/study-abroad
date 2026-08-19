"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Compass,
  FolderOpen,
  GanttChart,
  GraduationCap,
  HelpCircle,
  Home,
  Layers,
  LayoutList,
  LogOut,
  Sparkles,
  User,
  Settings,
} from "lucide-react";

import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", Icon: Home, badge: null },
  { href: "/pipeline", label: "Pipeline", Icon: GanttChart, badge: "Kanban" },
  { href: "/requirements", label: "Requirements", Icon: LayoutList, badge: null },
  { href: "/profile", label: "Profile & Settings", Icon: User, badge: "Settings" },
] as const;

const toolsNavItems = [
  { href: "/ledger", label: "Capital Ledger", Icon: Layers, badge: "FX Live" },
  { href: "/vault", label: "Document Vault", Icon: FolderOpen, badge: null },
  { href: "/deadlines", label: "Deadlines", Icon: CalendarDays, badge: "7 days" },
] as const;

const guideNavItems = [
  { href: "/how-it-works", label: "How It Works", Icon: HelpCircle, badge: "Guide" },
] as const;

interface AppSidebarProps {
  userName: string | null;
}

export function AppSidebar({ userName }: AppSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("app-sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("app-sidebar-collapsed", String(nextState));
  };

  const userInitials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "OS";

  return (
    <aside
      className={cn(
        "relative flex h-screen shrink-0 flex-col border-r border-slate-200/80 bg-white text-slate-800 shadow-md shadow-slate-900/5 transition-all duration-300 ease-in-out z-30 select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={toggleCollapse}
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        className="absolute -right-1.5 top-20 z-50 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Brand Header */}
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-6 border-b border-slate-100 transition-all",
          isCollapsed && "justify-center px-0"
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
          <GraduationCap className="h-5 w-5 animate-pulse" />
        </div>

        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-heading text-base font-black tracking-tight text-slate-900 flex items-center gap-1.5 truncate">
              The Japa Desk <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
            </span>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
              Study &amp; Relocation OS
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-6 space-y-6">
        {/* Main Section */}
        <div>
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Overview & Trackers
            </p>
          )}
          <nav className="space-y-1.5">
            {mainNavItems.map(({ href, label, Icon, badge }) => {
              const isActive =
                href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  title={isCollapsed ? label : undefined}
                  className={cn(
                    "group relative flex items-center rounded-2xl py-2.5 text-xs font-extrabold transition-all duration-200",
                    isCollapsed ? "justify-center px-0 h-11" : "justify-between px-3.5",
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-600 hover:bg-indigo-50/70 hover:text-indigo-950"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110",
                        isActive ? "text-amber-300" : "text-slate-400 group-hover:text-indigo-600"
                      )}
                    />
                    {!isCollapsed && <span>{label}</span>}
                  </div>

                  {!isCollapsed && badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                      )}
                    >
                      {badge}
                    </span>
                  )}

                  {/* Tooltip on Collapsed Hover */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 hidden rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-bold text-white shadow-xl group-hover:block z-50 whitespace-nowrap">
                      {label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tools Section */}
        <div>
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Vault & Finances
            </p>
          )}
          <nav className="space-y-1.5">
            {toolsNavItems.map(({ href, label, Icon, badge }) => {
              const isActive = pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  title={isCollapsed ? label : undefined}
                  className={cn(
                    "group relative flex items-center rounded-2xl py-2.5 text-xs font-extrabold transition-all duration-200",
                    isCollapsed ? "justify-center px-0 h-11" : "justify-between px-3.5",
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-600 hover:bg-indigo-50/70 hover:text-indigo-950"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110",
                        isActive ? "text-amber-300" : "text-slate-400 group-hover:text-indigo-600"
                      )}
                    />
                    {!isCollapsed && <span>{label}</span>}
                  </div>

                  {!isCollapsed && badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      )}
                    >
                      {badge}
                    </span>
                  )}

                  {/* Tooltip on Collapsed Hover */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 hidden rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-bold text-white shadow-xl group-hover:block z-50 whitespace-nowrap">
                      {label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Guide Section */}
        <div>
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Help & Guide
            </p>
          )}
          <nav className="space-y-1.5">
            {guideNavItems.map(({ href, label, Icon, badge }) => {
              const isActive = pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  title={isCollapsed ? label : undefined}
                  className={cn(
                    "group relative flex items-center rounded-2xl py-2.5 text-xs font-extrabold transition-all duration-200",
                    isCollapsed ? "justify-center px-0 h-11" : "justify-between px-3.5",
                    isActive
                      ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                      : "text-amber-800 bg-amber-50/80 hover:bg-amber-100 hover:text-amber-950"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110",
                        isActive ? "text-slate-950" : "text-amber-600"
                      )}
                    />
                    {!isCollapsed && <span>{label}</span>}
                  </div>

                  {!isCollapsed && badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                        isActive
                          ? "bg-black/20 text-slate-950"
                          : "bg-amber-200 text-amber-900 border border-amber-300"
                      )}
                    >
                      {badge}
                    </span>
                  )}

                  {/* Tooltip on Collapsed Hover */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 hidden rounded-xl bg-slate-900 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-300 shadow-xl group-hover:block z-50 whitespace-nowrap">
                      {label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Footer Card */}
      <div className="p-3 border-t border-slate-100">
        <div
          className={cn(
            "flex items-center rounded-2xl bg-slate-50 p-2.5 border border-slate-200/90 transition-all",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-heading text-xs font-bold text-white shadow-xs">
              {userInitials}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-black text-slate-900" title={userName ?? ""}>
                  {userName ?? "Student"}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Active Applicant</span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <form action={signOut}>
              <button
                type="submit"
                title="Sign out"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </aside>
  );
}


