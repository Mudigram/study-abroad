"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Sparkles,
  AlertTriangle,
  Clock,
  FileText,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { AddApplicationDialog } from "@/components/pipeline/add-application-dialog";
import { cn } from "@/lib/utils";

interface TopHeaderProps {
  userName: string | null;
}

export function TopHeader({ userName }: TopHeaderProps) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const firstName = userName ? userName.split(" ")[0] : "Scholar";
  const userInitials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "OS";

  // Mock Notification Feed Items for Application OS
  const notifications = [
    {
      id: "1",
      title: "Urgent Milestone Due",
      desc: "TU Munich SOP & Recommendation letters due in 3 days.",
      time: "2h ago",
      type: "urgent",
      href: "/deadlines",
      icon: Clock,
      color: "bg-rose-100 text-rose-600",
    },
    {
      id: "2",
      title: "Document Expiry Alert",
      desc: "Passport & IELTS Score sheet expire within 90 days.",
      time: "5h ago",
      type: "warning",
      href: "/vault",
      icon: AlertTriangle,
      color: "bg-amber-100 text-amber-700",
    },
    {
      id: "3",
      title: "Capital Ledger Sync",
      desc: "FX exchange rates updated. Shadow conversion active.",
      time: "1d ago",
      type: "info",
      href: "/ledger",
      icon: FileText,
      color: "bg-indigo-100 text-indigo-600",
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/pipeline?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200/80 bg-[#FAF8F5]/90 px-6 sm:px-8 backdrop-blur-md">
        {/* Left: Search Bar & Date */}
        <div className="flex items-center gap-6 flex-1 max-w-lg">
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search programs, tasks, docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-xs font-bold text-slate-800 placeholder:text-slate-400 shadow-xs transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            />
          </form>

          <div className="hidden lg:block shrink-0">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              {today}
            </p>
          </div>
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center gap-3.5">
          {/* Quick Action Button: New Application */}
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 active:scale-95 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
            <span className="hidden sm:inline">New Application</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Notifications Bell Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
              }}
              title="Notifications"
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition-all hover:border-indigo-400 hover:scale-105 active:scale-95 cursor-pointer",
                isNotifOpen && "border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/50 text-indigo-600",
              )}
            >
              <Bell className="h-4.5 w-4.5" />
              {hasUnread && (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Notifications Popover Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 top-12 z-[100] w-80 sm:w-96 rounded-3xl border-2 border-slate-900/10 bg-white p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-black text-slate-900">Notifications</h3>
                    {hasUnread && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-black text-rose-600">
                        3 New
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasUnread(false)}
                    className="text-[11px] font-extrabold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Mark read
                  </button>
                </div>

                {/* Feed Items */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {notifications.map((notif) => {
                    const IconComponent = notif.icon;
                    return (
                      <Link
                        key={notif.id}
                        href={notif.href}
                        onClick={() => setIsNotifOpen(false)}
                        className="group flex items-start gap-3 rounded-2xl p-3 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                      >
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs mt-0.5", notif.color)}>
                          <IconComponent className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-heading text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                              {notif.title}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-1">{notif.time}</span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-500 leading-snug line-clamp-2">
                            {notif.desc}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Footer Link */}
                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href="/deadlines"
                    onClick={() => setIsNotifOpen(false)}
                    className="flex items-center justify-center gap-1.5 w-full rounded-2xl bg-slate-50 py-2 text-xs font-extrabold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    <span>View All Deadlines & Alerts</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <Link
            href="/profile"
            className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3.5 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-indigo-600 text-xs font-bold text-white shadow-xs">
              {userInitials}
            </div>
            <span className="text-xs font-extrabold text-slate-800 hidden sm:inline">
              {firstName}
            </span>
          </Link>
        </div>
      </header>

      {/* Controlled Add Application Dialog triggered by header button */}
      <AddApplicationDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
