"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  AlertCircle,
  FileCheck,
  CheckCircle,
  Clock,
  Sparkles,
  Link2,
  LayoutGrid,
  List,
  Edit,
} from "lucide-react";
import { updateApplicationStatus } from "@/app/actions/applications";
import type { Application, ApplicationStatus } from "@/lib/types/database";
import { ApplicationDetailsDialog } from "./application-details-dialog";
import { CustomSelect } from "@/components/ui/custom-select";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLUMNS: ApplicationStatus[] = [
  "Pathway Idea",
  "Discovery",
  "Preparing Docs",
  "Submitted",
  "Interview",
  "Accepted",
  "Rejected",
];

interface KanbanBoardProps {
  initialApplications: Application[];
}

export function KanbanBoard({ initialApplications }: KanbanBoardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedOverCol, setDraggedOverCol] = useState<ApplicationStatus | null>(null);
  const [viewMode, setViewMode] = useState<"columns" | "rows">("rows");
  const [isPending, startTransition] = useTransition();

  // Keep state sync'd when initialApplications changes (e.g. on server actions revalidatePath)
  useState(() => {
    setApplications(initialApplications);
  });

  const handleStatusChange = (id: string, newStatus: ApplicationStatus) => {
    const targetApp = applications.find((a) => a.id === id);
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
    );
    toast({
      title: "Stage updated!",
      description: `${targetApp?.university_name ?? "Program"} moved to ${newStatus}.`,
      type: "success",
    });
    startTransition(async () => {
      await updateApplicationStatus(id, newStatus);
    });
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  };

  const onDragEnd = () => {
    setDraggedId(null);
    setDraggedOverCol(null);
  };

  const onDragOver = (e: React.DragEvent, col: ApplicationStatus) => {
    e.preventDefault();
    if (draggedOverCol !== col) {
      setDraggedOverCol(col);
    }
  };

  const onDrop = (e: React.DragEvent, targetCol: ApplicationStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    if (!id) return;

    setDraggedOverCol(null);
    const appToMove = applications.find((a) => a.id === id);
    if (!appToMove || appToMove.status === targetCol) return;

    handleStatusChange(id, targetCol);
  };

  const getDeadlineStyle = (deadlineStr: string | null) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 14) {
      return {
        label: `${diffDays} days left`,
        className: "bg-rose-500/10 text-rose-600 border-rose-200",
      };
    }
    if (diffDays <= 30) {
      return {
        label: `${diffDays} days left`,
        className: "bg-amber-500/10 text-amber-600 border-amber-200",
      };
    }
    return {
      label: `${diffDays} days left`,
      className: "bg-teal-500/10 text-teal-600 border-teal-200",
    };
  };

  const [openRowId, setOpenRowId] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full gap-4">
      {/* Top View Mode Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <span>{applications.length} Total Programs</span>
        </div>

        <div className="flex items-center gap-1 rounded-2xl border-2 border-slate-900/10 bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode("rows")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer",
              viewMode === "rows"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            <List className="h-3.5 w-3.5" />
            <span>Horizontal Rows</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("columns")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer",
              viewMode === "columns"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Kanban Columns</span>
          </button>
        </div>
      </div>

      {/* ─── View 1: Horizontal Rows View ──────────────────────────────────────── */}
      {viewMode === "rows" ? (
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-24">
          {applications.map((app) => {
            const deadlineInfo = getDeadlineStyle(app.deadline);
            const hasAiResearch = app.ai_research_summary !== null;
            const isOpen = openRowId === app.id;

            return (
              <div
                key={app.id}
                className={cn(
                  "group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border-2 border-slate-900/10 bg-white p-5 shadow-sm shadow-playful transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                  isOpen ? "relative z-40 border-indigo-400" : "relative z-10 hover:z-20",
                )}
              >
                {/* Info & Badges */}
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                      {app.country}
                    </span>
                    {app.priority && (
                      <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-slate-950">
                        Priority {app.priority}
                      </span>
                    )}
                    {app.visa_required && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-700">
                        Visa Required
                      </span>
                    )}
                    {hasAiResearch && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-700">
                        <Sparkles className="h-3 w-3" /> AI Researched
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-heading text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {app.university_name}
                    </h3>
                    <p className="text-xs font-bold text-slate-600">
                      {app.program_name} {app.scholarship_name ? `· ${app.scholarship_name}` : ""}
                    </p>
                  </div>
                </div>

                {/* Stage Selector (Custom Dropdown with open state tracking) */}
                <div className="w-full md:w-52 shrink-0">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Pipeline Stage
                  </label>
                  <CustomSelect
                    value={app.status}
                    onChange={(val) => handleStatusChange(app.id, val as ApplicationStatus)}
                    options={COLUMNS.map((c) => ({ value: c, label: c }))}
                    onOpenChange={(open) => setOpenRowId(open ? app.id : null)}
                  />
                </div>

                {/* Deadline & Deposit */}
                <div className="flex items-center gap-4 shrink-0 border-t md:border-0 pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Deadline
                    </span>
                    {deadlineInfo ? (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold border ${deadlineInfo.className}`}>
                        <Calendar className="h-3 w-3" />
                        {deadlineInfo.label}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">No deadline set</span>
                    )}
                  </div>

                  {app.deposit_required > 0 && (
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Deposit Required
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 font-mono">
                        {app.deposit_required.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Edit Details Action */}
                  <Button
                    onClick={() => setSelectedApp(app)}
                    variant="outline"
                    className="rounded-2xl border-2 border-slate-900/10 font-extrabold text-xs hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" /> View / Edit
                  </Button>
                </div>
              </div>
            );
          })}

          {applications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white p-8">
              <p className="text-sm font-bold text-slate-500">No applications added yet.</p>
              <p className="text-xs text-slate-400 mt-1">Click "+ Add Program" at the top right to get started!</p>
            </div>
          )}
        </div>
      ) : (
        /* ─── View 2: Kanban Columns ────────────────────────────────────────────── */
        <div className="flex-1 overflow-x-auto flex gap-4 pb-4">
          {COLUMNS.map((col) => {
            const colCards = applications.filter((app) => app.status === col);
            const isOver = draggedOverCol === col;

            return (
              <div
                key={col}
                onDragOver={(e) => onDragOver(e, col)}
                onDrop={(e) => onDrop(e, col)}
                className={cn(
                  "w-72 shrink-0 flex flex-col rounded-3xl border-2 bg-white/60 transition-all duration-150 p-2 shadow-xs",
                  isOver ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200",
                )}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-3 py-2 mb-2 border-b border-slate-100">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    {col}
                  </span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-900 text-white">
                    {colCards.length}
                  </span>
                </div>

                {/* Card List Area */}
                <div className="flex-1 overflow-y-auto p-1 space-y-2.5 min-h-[350px]">
                  {colCards.map((app) => {
                    const deadlineInfo = getDeadlineStyle(app.deadline);
                    const hasAiResearch = app.ai_research_summary !== null;

                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, app.id)}
                        onDragEnd={onDragEnd}
                        onClick={() => setSelectedApp(app)}
                        className={cn(
                          "p-4 rounded-2xl border-2 border-slate-900/10 bg-white hover:border-indigo-400 shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing hover:shadow-md",
                          draggedId === app.id && "opacity-40",
                        )}
                      >
                        {/* Top Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          {app.priority && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 uppercase">
                              P{app.priority}
                            </span>
                          )}
                          {app.visa_required && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
                              Visa
                            </span>
                          )}
                          {hasAiResearch && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 flex items-center gap-0.5">
                              <Sparkles className="h-2.5 w-2.5" /> AI
                            </span>
                          )}
                        </div>

                        {/* Info block */}
                        <div className="space-y-1">
                          <h4 className="font-heading font-black text-sm text-slate-900 group-hover:text-indigo-600">
                            {app.university_name}
                          </h4>
                          <p className="text-xs text-slate-600 font-semibold line-clamp-1">
                            {app.program_name}
                          </p>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            {app.country} {app.scholarship_name ? `· ${app.scholarship_name}` : ""}
                          </p>
                        </div>

                        {/* Footer */}
                        {(deadlineInfo || app.notes || app.link_url) && (
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            {deadlineInfo ? (
                              <span className={`inline-flex items-center gap-0.5 font-extrabold px-1.5 py-0.5 rounded-md border ${deadlineInfo.className}`}>
                                <Calendar className="h-2.5 w-2.5" />
                                {deadlineInfo.label}
                              </span>
                            ) : (
                              <span className="text-slate-400">No deadline</span>
                            )}

                            <div className="flex items-center gap-1.5">
                              {app.link_url && <Link2 className="h-3.5 w-3.5 text-slate-400" />}
                              {app.notes && (
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" title="Has notes" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {colCards.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-2xl border-slate-200 text-center p-4">
                      <p className="text-xs font-bold text-slate-400">Drop cards here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details dialog popup */}
      {selectedApp && (
        <ApplicationDetailsDialog
          application={selectedApp}
          open={selectedApp !== null}
          onClose={() => setSelectedApp(null)}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
