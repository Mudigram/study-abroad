"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  Circle,
  FileText,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  LayoutGrid,
  List,
  CalendarDays,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { updateRequirementStatus } from "@/app/actions/requirements";
import type { DeadlineItem } from "@/app/actions/deadlines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { cn } from "@/lib/utils";

interface DeadlinesTimelineProps {
  initialItems: DeadlineItem[];
}

export function DeadlinesTimeline({ initialItems }: DeadlinesTimelineProps) {
  const router = useRouter();
  const [items, setItems] = useState<DeadlineItem[]>(initialItems);
  const [viewMode, setViewMode] = useState<"calendar" | "timeline" | "matrix">("calendar");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (id: string, currentStatus: string) => {
    if (!id.startsWith("req_")) return;
    const reqId = id.replace("req_", "");
    const nextStatus = currentStatus === "Done" ? "Not Started" : "Done";

    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: nextStatus } : it)),
    );

    startTransition(async () => {
      await updateRequirementStatus(reqId, nextStatus);
      router.refresh();
    });
  };

  // Filter items based on search and selected type/status
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        filterType === "all" ||
        (filterType === "application" && item.type === "application") ||
        (filterType === "requirement" && item.type === "requirement");

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "pending" && item.status !== "Done") ||
        (filterStatus === "completed" && item.status === "Done");

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [items, searchQuery, filterType, filterStatus]);

  // Compute metric stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);

  const urgentCount = items.filter((it) => {
    const due = new Date(it.dueDate);
    return due >= today && due <= sevenDaysLater && it.status !== "Done";
  }).length;

  const overdueCount = items.filter((it) => {
    const due = new Date(it.dueDate);
    return due < today && it.status !== "Done";
  }).length;

  const completedCount = items.filter((it) => it.status === "Done").length;

  // Calendar Grid Data Generator
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const totalDays = lastDayOfMonth.getDate();

    const daysArray = [];

    // Empty lead days from previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      daysArray.push(null);
    }

    // Actual days of month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);

      // Find deadline items on this day
      const dayDeadlines = filteredItems.filter((it) => {
        const d = new Date(it.dueDate);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === date.getTime();
      });

      daysArray.push({ day, date, deadlines: dayDeadlines });
    }

    return daysArray;
  }, [currentMonth, filteredItems]);

  // Calendar Navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Group items by university program for Matrix View
  const matrixGrouped = useMemo(() => {
    const groups: Record<string, DeadlineItem[]> = {};
    filteredItems.forEach((item) => {
      const key = item.subtitle || "General Milestones";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filteredItems]);

  return (
    <div className="flex w-full flex-col gap-8 pb-16">
      {/* ─── Metric Overview Cards ────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border-2 border-slate-900/10 bg-white p-5 shadow-sm shadow-playful flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 font-extrabold shadow-xs">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Urgent (0-7 Days)</span>
            <span className="font-heading text-2xl font-black text-slate-900">{urgentCount} Pending</span>
          </div>
        </div>

        <div className="rounded-3xl border-2 border-slate-900/10 bg-white p-5 shadow-sm shadow-playful flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 font-extrabold shadow-xs">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Overdue Tasks</span>
            <span className="font-heading text-2xl font-black text-slate-900">{overdueCount} Overdue</span>
          </div>
        </div>

        <div className="rounded-3xl border-2 border-slate-900/10 bg-white p-5 shadow-sm shadow-playful flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 font-extrabold shadow-xs">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Completed Milestones</span>
            <span className="font-heading text-2xl font-black text-slate-900">{completedCount} Done</span>
          </div>
        </div>
      </div>

      {/* ─── Search, Filters & View Switcher ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search deadlines or programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-36">
            <CustomSelect
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: "all", label: "All Types" },
                { value: "application", label: "Submissions" },
                { value: "requirement", label: "Checklists" },
              ]}
            />
          </div>

          <div className="w-36">
            <CustomSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "pending", label: "Pending" },
                { value: "completed", label: "Completed" },
              ]}
            />
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center gap-1 rounded-2xl border-2 border-slate-900/10 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer",
                viewMode === "calendar" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer",
                viewMode === "timeline" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span>Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer",
                viewMode === "matrix" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Program Matrix</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── View 1: Interactive Month Calendar Grid ───────────────────────────── */}
      {viewMode === "calendar" && (
        <div className="rounded-3xl border-2 border-slate-900/10 bg-white p-6 shadow-sm shadow-playful space-y-4">
          {/* Month Header Controls */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="font-heading text-xl font-black text-slate-900">
              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevMonth}
                className="rounded-xl h-9 w-9 p-0 border-slate-200 hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                className="rounded-xl h-9 px-3 text-xs font-extrabold border-slate-200 hover:bg-slate-100"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextMonth}
                className="rounded-xl h-9 w-9 p-0 border-slate-200 hover:bg-slate-100"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wider text-slate-400 py-2 border-b border-slate-100">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((cell, idx) => {
              if (!cell) {
                return <div key={idx} className="h-28 rounded-2xl bg-slate-50/50 border border-transparent" />;
              }

              const isTodayCell =
                cell.date.getDate() === today.getDate() &&
                cell.date.getMonth() === today.getMonth() &&
                cell.date.getFullYear() === today.getFullYear();

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col justify-between h-28 rounded-2xl border p-2 text-xs font-bold transition-all overflow-hidden",
                    isTodayCell
                      ? "border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-200"
                      : "border-slate-200/80 bg-white hover:border-indigo-300",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-black",
                        isTodayCell ? "bg-indigo-600 text-white" : "text-slate-700",
                      )}
                    >
                      {cell.day}
                    </span>
                    {cell.deadlines.length > 0 && (
                      <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-black text-white">
                        {cell.deadlines.length}
                      </span>
                    )}
                  </div>

                  {/* Deadline Pills in Day Cell */}
                  <div className="space-y-1 my-1 overflow-y-auto max-h-16 pr-0.5">
                    {cell.deadlines.map((item) => {
                      const isDone = item.status === "Done";
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (item.id.startsWith("req_")) {
                              handleStatusChange(item.id, item.status);
                            }
                          }}
                          className={cn(
                            "group flex items-center justify-between rounded-lg px-2 py-1 text-[10px] font-extrabold truncate cursor-pointer transition-all",
                            item.type === "application"
                              ? "bg-amber-400 text-slate-950 shadow-xs"
                              : isDone
                              ? "bg-slate-100 text-slate-400 line-through"
                              : "bg-indigo-600 text-white shadow-xs",
                          )}
                          title={`${item.title} (${item.subtitle})`}
                        >
                          <span className="truncate">{item.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── View 2: Chronological Timeline View ───────────────────────────────── */}
      {viewMode === "timeline" && (
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white p-8">
              <CalendarIcon className="h-10 w-10 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-600">No deadlines match your filters</h3>
              <p className="text-xs text-slate-400 mt-1">Try clearing your search or filter tags.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isDone = item.status === "Done";
              const formattedDate = new Date(item.dueDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              const due = new Date(item.dueDate);
              due.setHours(0, 0, 0, 0);
              const diffTime = due.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              const isOverdue = diffDays < 0 && !isDone;
              const isUrgent = diffDays >= 0 && diffDays <= 7 && !isDone;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border-2 p-5 shadow-sm shadow-playful transition-all duration-200 hover:-translate-y-1 hover:shadow-md bg-white",
                    isOverdue && "border-rose-400 bg-rose-50/30",
                    isUrgent && "border-amber-400 bg-amber-50/30",
                    !isOverdue && !isUrgent && "border-slate-900/10",
                  )}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {item.type === "requirement" ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.id, item.status)}
                        className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300" />
                        )}
                      </button>
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-black shadow-xs mt-0.5">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                    )}

                    <div className="space-y-1 min-w-0">
                      <h4 className={cn("font-heading text-base font-black text-slate-900 truncate", isDone && "line-through text-slate-400")}>
                        {item.title}
                      </h4>
                      <p className="text-xs font-bold text-slate-500 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black border",
                        isOverdue && "bg-rose-500 text-white border-rose-600",
                        isUrgent && "bg-amber-400 text-slate-950 border-amber-500",
                        !isOverdue && !isUrgent && "bg-slate-100 text-slate-700 border-slate-200",
                      )}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {isOverdue ? "OVERDUE" : isUrgent ? `${diffDays} days left` : formattedDate}
                    </span>

                    <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase text-white tracking-wider">
                      {item.type}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── View 3: Program Matrix View (Grouped by University) ─────────────── */}
      {viewMode === "matrix" && (
        <div className="space-y-6">
          {Object.entries(matrixGrouped).map(([programName, programItems]) => (
            <div
              key={programName}
              className="rounded-3xl border-2 border-slate-900/10 bg-white p-6 shadow-sm shadow-playful space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-heading text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>{programName}</span>
                </h3>
                <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-black text-indigo-700">
                  {programItems.length} Milestones
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {programItems.map((item) => {
                  const isDone = item.status === "Done";
                  const formattedDate = new Date(item.dueDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  });

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all",
                        isDone ? "bg-slate-50 border-slate-200/60 opacity-60" : "bg-white border-slate-200/90 hover:border-indigo-400 shadow-2xs",
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.type === "requirement" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.id, item.status)}
                            className="cursor-pointer shrink-0"
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                            ) : (
                              <Circle className="h-4.5 w-4.5 text-slate-300" />
                            )}
                          </button>
                        )}
                        <span className={cn("text-xs font-extrabold text-slate-800 truncate", isDone && "line-through text-slate-400")}>
                          {item.title}
                        </span>
                      </div>

                      <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full shrink-0 ml-2">
                        {formattedDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
