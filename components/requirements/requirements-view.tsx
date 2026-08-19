"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Calendar,
  AlertCircle,
  FileCheck,
  Plus,
  Settings,
  ChevronRight,
  ClipboardList,
  Loader2,
} from "lucide-react";
import {
  updateRequirementStatus,
  updateRequirementDueDate,
  deleteRequirement,
} from "@/app/actions/requirements";
import { getSignedUrlAction } from "@/app/actions/documents";
import type {
  Application,
  ApplicationRequirement,
  RequirementTemplate,
  RequirementStatus,
  Document,
} from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { ApplyTemplateDialog } from "./apply-template-dialog";
import { AddRequirementDialog } from "./add-requirement-dialog";
import { TemplateBuilder } from "./template-builder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";

interface RequirementsViewProps {
  applications: Application[];
  activeAppId: string | null;
  requirements: ApplicationRequirement[];
  templates: RequirementTemplate[];
  documents: Document[];
}

export function RequirementsView({
  applications,
  activeAppId,
  requirements,
  templates,
  documents,
}: RequirementsViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"checklist" | "builder">("checklist");
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingReqId, setDeletingReqId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDownloadDoc = async (docId: string, path: string) => {
    setDownloadingDocId(docId);
    try {
      const url = await getSignedUrlAction(path);
      if (url) {
        window.open(url, "_blank");
      } else {
        toast({ title: "Download failed", description: "Could not retrieve secure download link.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Download failed", description: "Failed to download document.", type: "error" });
    } finally {
      setDownloadingDocId(null);
    }
  };

  // Find active application
  const activeApp = applications.find((a) => a.id === activeAppId) || applications[0] || null;

  // Handle application switch via router push (updates search query params)
  const handleAppChange = (appId: string) => {
    router.push(`/requirements?appId=${appId}`);
  };

  const handleStatusChange = (reqId: string, status: RequirementStatus) => {
    startTransition(async () => {
      await updateRequirementStatus(reqId, status);
      toast({ title: "Task status updated!", type: "success" });
    });
  };

  const handleDueDateChange = (reqId: string, dateStr: string) => {
    startTransition(async () => {
      await updateRequirementDueDate(reqId, dateStr ? dateStr : null);
      toast({ title: "Due date saved!", type: "success" });
    });
  };

  const confirmDeleteRequirement = async () => {
    if (!deletingReqId) return;
    const reqId = deletingReqId;
    setDeletingReqId(null);
    startTransition(async () => {
      await deleteRequirement(reqId);
      toast({ title: "Task removed", description: "Requirement deleted from checklist.", type: "info" });
    });
  };

  // Group requirements by category
  const categories = requirements.reduce<Record<string, ApplicationRequirement[]>>((acc, req) => {
    const cat = req.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(req);
    return acc;
  }, {});

  // Calculate progress
  const totalCount = requirements.length;
  const doneCount = requirements.filter((r) => r.status === "Done").length;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
        <ClipboardList className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-bold tracking-tight">No applications found</h2>
        <p className="text-muted-foreground text-sm mt-2 mb-6">
          You need to add at least one application to your Pipeline before configuring requirements.
        </p>
        <Button onClick={() => router.push("/pipeline")}>Go to Pipeline</Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12 max-w-6xl w-full">
      {/* Sidebar: App Switcher */}
      <div className="lg:col-span-3 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Select Application
          </label>
          <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
            {applications.map((app) => {
              const isSelected = activeApp && app.id === activeApp.id;
              return (
                <button
                  key={app.id}
                  onClick={() => handleAppChange(app.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border text-sm font-medium transition-all duration-150 flex items-center justify-between group",
                    isSelected
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold truncate text-foreground">
                      {app.university_name}
                    </div>
                    <div className="text-xs opacity-75 truncate mt-0.5">
                      {app.program_name} ({app.country})
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Builder navigation */}
        <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setActiveTab(activeTab === "checklist" ? "builder" : "checklist")}
            className={cn(
              "w-full flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium border transition-colors",
              activeTab === "builder"
                ? "bg-secondary text-secondary-foreground border-border"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20",
            )}
          >
            <Settings className="h-4 w-4" />
            {activeTab === "builder" ? "View Checklist" : "Manage Templates"}
          </button>
        </div>
      </div>

      {/* Main Checklist / Template Builder area */}
      <div className="lg:col-span-9 space-y-6">
        {activeTab === "builder" ? (
          <TemplateBuilder
            onSuccess={() => {
              setActiveTab("checklist");
              router.refresh();
            }}
            onCancel={() => setActiveTab("checklist")}
          />
        ) : (
          activeApp && (
            <div className="space-y-6">
              {/* Application Details Summary & Progress Card */}
              <Card className="border" style={{ borderColor: "var(--border)" }}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">
                        {activeApp.university_name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {activeApp.program_name} · {activeApp.country}
                        {activeApp.deadline && (
                          <span className="ml-2 inline-flex items-center gap-1 font-semibold text-amber-500">
                            <Clock className="h-3 w-3" /> Due {new Date(activeApp.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {requirements.length === 0 ? (
                        <Button onClick={() => setIsApplyOpen(true)} size="sm">
                          Attach Template
                        </Button>
                      ) : (
                        <Button onClick={() => setIsApplyOpen(true)} variant="outline" size="sm">
                          Re-apply Template
                        </Button>
                      )}
                      <Button onClick={() => setIsAddOpen(true)} variant="secondary" size="sm">
                        <Plus className="mr-1 h-3.5 w-3.5" /> Custom Task
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {totalCount > 0 && (
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground uppercase tracking-wider">
                          Document Checklist Progress
                        </span>
                        <span className="text-primary">{progressPercent}% ({doneCount}/{totalCount} Done)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Requirements List by Category */}
              {requirements.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-card"
                  style={{ borderColor: "var(--border)" }}
                >
                  <ClipboardList className="h-10 w-10 text-muted-foreground opacity-30 mb-3" />
                  <h3 className="text-sm font-semibold">Checklist is empty</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    No requirement tasks exist for this application. Attach a pre-made template or create custom tasks to get started.
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={() => setIsApplyOpen(true)}>
                      Apply Template
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsAddOpen(true)}>
                      Add Custom Task
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(categories).map(([category, items]) => (
                    <Card
                      key={category}
                      className="border relative overflow-hidden"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <CardHeader className="py-3 bg-muted/20 border-b" style={{ borderColor: "var(--border)" }}>
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {category}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 divide-y divide-border" style={{ borderColor: "var(--border)" }}>
                        {items.map((req) => {
                          const isDone = req.status === "Done";
                          const isInProgress = req.status === "In Progress";

                          return (
                            <div
                              key={req.id}
                              className={cn(
                                "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 text-sm hover:bg-muted/10 transition-colors",
                                isDone && "opacity-60",
                              )}
                            >
                              {/* Status Toggle & Label */}
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(
                                      req.id,
                                      isDone ? "Not Started" : "Done",
                                    )
                                  }
                                  className="mt-0.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </button>
                                <div className="space-y-0.5 min-w-0">
                                  <span
                                    className={cn(
                                      "font-medium block leading-tight text-foreground",
                                      isDone && "line-through text-muted-foreground",
                                    )}
                                  >
                                    {req.label}
                                  </span>

                                  {/* Document vault link details */}
                                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                    <FileCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    {req.document_id ? (
                                      (() => {
                                        const doc = documents.find((d) => d.id === req.document_id);
                                        const isDownloading = downloadingDocId === req.document_id;
                                        return doc ? (
                                          <button
                                            type="button"
                                            onClick={() => handleDownloadDoc(doc.id, doc.storage_url)}
                                            className="text-teal-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer truncate"
                                            disabled={isDownloading}
                                            title="Click to download document"
                                          >
                                            {doc.file_name} (Download)
                                            {isDownloading && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                                          </button>
                                        ) : (
                                          <span className="text-teal-400 font-semibold">Document attached</span>
                                        );
                                      })()
                                    ) : (
                                      <span>Vault link pending</span>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Actions / Inputs */}
                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-0 pt-2 sm:pt-0">
                                {/* Status select */}
                                <select
                                  value={req.status}
                                  onChange={(e) =>
                                    handleStatusChange(req.id, e.target.value as RequirementStatus)
                                  }
                                  className="h-9 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-800 outline-none transition-all hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs cursor-pointer"
                                >
                                  <option value="Not Started">Not Started</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Done">Done</option>
                                </select>

                                {/* Due date calendar input */}
                                <div className="flex items-center gap-1 text-xs border border-input rounded px-2 h-8 bg-transparent">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <input
                                    type="date"
                                    value={req.due_date ?? ""}
                                    onChange={(e) => handleDueDateChange(req.id, e.target.value)}
                                    className="bg-transparent border-0 outline-none text-foreground w-[110px]"
                                  />
                                </div>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => setDeletingReqId(req.id)}
                                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Dialogs */}
      {activeApp && (
        <>
          <ConfirmModal
            open={!!deletingReqId}
            onClose={() => setDeletingReqId(null)}
            onConfirm={confirmDeleteRequirement}
            title="Delete Checklist Task?"
            description="Are you sure you want to remove this requirement from your program checklist?"
            confirmText="Yes, Delete Task"
            isPending={isPending}
          />
          <ApplyTemplateDialog
            open={isApplyOpen}
            onClose={() => setIsApplyOpen(false)}
            applicationId={activeApp.id}
            templates={templates}
            onSuccess={() => router.refresh()}
          />
          <AddRequirementDialog
            open={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            applicationId={activeApp.id}
            onSuccess={() => router.refresh()}
          />
        </>
      )}
    </div>
  );
}
