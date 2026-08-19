"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Search, Sparkles, AlertTriangle, Clock, Trash2, ExternalLink } from "lucide-react";
import {
  updateApplication,
  deleteApplication,
  triggerResearchAssist,
  type ApplicationActionState,
} from "@/app/actions/applications";
import type { Application } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { CustomSelect } from "@/components/ui/custom-select";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";

const STATUS_COLUMNS = [
  "Pathway Idea",
  "Discovery",
  "Preparing Docs",
  "Submitted",
  "Interview",
  "Accepted",
  "Rejected",
];

interface ApplicationDetailsDialogProps {
  application: Application;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplicationDetailsDialog({
  application,
  open,
  onClose,
  onSuccess,
}: ApplicationDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState<"details" | "research">("details");
  const [status, setStatus] = useState<string>(application.status);
  const [priority, setPriority] = useState<string>(application.priority ? String(application.priority) : "");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();

  const [state, formAction] = useActionState(
    async (prevState: ApplicationActionState, formData: FormData) => {
      setError(null);
      const res = await updateApplication(application.id, prevState, formData);
      if (res.error) {
        setError(res.error);
        toast({
          title: "Failed to update program",
          description: res.error,
          type: "error",
        });
        return res;
      }
      toast({
        title: "Program updated!",
        description: `${application.university_name} details saved.`,
        type: "success",
      });
      onSuccess();
      onClose();
      return { success: true };
    },
    {},
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteApplication(application.id);
    setIsDeleting(false);
    setShowConfirmDelete(false);
    toast({
      title: "Program removed",
      description: `${application.university_name} has been removed from your pipeline.`,
      type: "info",
    });
    onSuccess();
    onClose();
  };

  const handleResearch = () => {
    setAiError(null);
    setAiLoading(true);
    startTransition(async () => {
      const res = await triggerResearchAssist(application.id);
      setAiLoading(false);
      if (res.error) {
        setAiError(res.error);
        toast({
          title: "Research assist error",
          description: res.error,
          type: "error",
        });
      } else {
        toast({
          title: "AI Research generated!",
          description: "Requirements and program insights updated.",
          type: "success",
        });
        onSuccess();
      }
    });
  };

  if (!open) return null;

  return (
    <>
      <ConfirmModal
        open={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDelete}
        title={`Delete ${application.university_name}?`}
        description={`Are you sure you want to remove ${application.university_name} (${application.program_name}) from your pipeline? This cannot be undone.`}
        confirmText="Yes, Delete Program"
        isPending={isDeleting}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-2xl rounded-xl border shadow-2xl overflow-y-auto max-h-[90vh]"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2 className="text-base font-semibold">{application.university_name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{application.program_name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 py-2.5 text-center text-sm font-semibold border-b-2 outline-none transition-colors ${
              activeTab === "details"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Details & Notes
          </button>
          <button
            onClick={() => setActiveTab("research")}
            className={`flex-1 py-2.5 text-center text-sm font-semibold border-b-2 outline-none transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "research"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Research Assist
          </button>
        </div>

        {activeTab === "details" ? (
          /* Editable Details Form */
          <form action={formAction} className="px-6 py-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="edit_university_name">University Name</Label>
                <Input
                  id="edit_university_name"
                  name="university_name"
                  defaultValue={application.university_name}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit_program_name">Program Name</Label>
                <Input
                  id="edit_program_name"
                  name="program_name"
                  defaultValue={application.program_name}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="edit_country">Country</Label>
                <Input id="edit_country" name="country" defaultValue={application.country} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit_scholarship_name">Scholarship</Label>
                <Input
                  id="edit_scholarship_name"
                  name="scholarship_name"
                  defaultValue={application.scholarship_name ?? ""}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="edit_status">Pipeline Stage</Label>
                <CustomSelect
                  id="edit_status"
                  name="status"
                  value={status}
                  onChange={setStatus}
                  options={STATUS_COLUMNS.map((c) => ({ value: c, label: c }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit_deadline">Deadline</Label>
                <Input
                  id="edit_deadline"
                  name="deadline"
                  type="date"
                  defaultValue={application.deadline ?? ""}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="edit_priority">Priority Ranking</Label>
                <CustomSelect
                  id="edit_priority"
                  name="priority"
                  value={priority}
                  onChange={setPriority}
                  options={[
                    { value: "", label: "No priority" },
                    { value: "1", label: "Priority 1 (Top)" },
                    { value: "2", label: "Priority 2" },
                  ]}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit_deposit_required">Deposit Required</Label>
                <Input
                  id="edit_deposit_required"
                  name="deposit_required"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={application.deposit_required}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="edit_visa_required"
                  name="visa_required"
                  value="true"
                  defaultChecked={application.visa_required}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="edit_visa_required" className="text-sm font-normal text-muted-foreground">
                  Visa required to study
                </Label>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit_link_url">Program Link URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit_link_url"
                    name="link_url"
                    defaultValue={application.link_url ?? ""}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  {application.link_url && (
                    <a
                      href={application.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg border border-input p-2.5 hover:bg-muted text-muted-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit_notes">General Notes</Label>
              <textarea
                id="edit_notes"
                name="notes"
                rows={3}
                defaultValue={application.notes ?? ""}
                className="w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 text-foreground"
                placeholder="Requirements, contacts, fees..."
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit_research_notes">Your Research Notes / Scratchpad</Label>
              <textarea
                id="edit_research_notes"
                name="research_notes"
                rows={3}
                defaultValue={application.research_notes ?? ""}
                className="w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 text-foreground"
                placeholder="Free text scratchpad notes compiled before full discovery tracking..."
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <Button type="button" variant="ghost" onClick={() => setShowConfirmDelete(true)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete Program
              </Button>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        ) : (
          /* AI Research Assist tab */
          <div className="px-6 py-5 space-y-5">
            {/* Warning block */}
            <div className="flex gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-xs text-amber-500">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <span className="font-semibold block uppercase">Verification Required</span>
                <p className="leading-relaxed">
                  This summary is generated by Claude (Anthropic API) based on real-time web search passes.
                  Treat this strictly as a first-pass reference list to verify against official university catalogs.
                  It does <strong>not</strong> modify or overwrite your custom scratchpad notes.
                </p>
              </div>
            </div>

            {/* Existing AI summary */}
            {application.ai_research_summary ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-muted-foreground border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Last Updated: {application.ai_research_updated_at ? new Date(application.ai_research_updated_at).toLocaleString() : "Never"}
                  </span>
                  <Button
                    onClick={handleResearch}
                    variant="outline"
                    size="sm"
                    disabled={aiLoading}
                    className="h-8 text-xs flex gap-1.5 items-center"
                  >
                    <Search className="h-3 w-3" /> {aiLoading ? "Searching..." : "Re-Run Research"}
                  </Button>
                </div>

                <div
                  className="prose prose-sm prose-invert max-w-none max-h-[380px] overflow-y-auto pr-1 text-sm leading-relaxed space-y-4 font-sans text-muted-foreground"
                  style={{ color: "var(--foreground)" }}
                >
                  {/* Since we don't have a markdown library, let's render standard lists/lines cleanly */}
                  {application.ai_research_summary.split("\n").map((line, idx) => {
                    if (line.startsWith("### ")) {
                      return <h3 key={idx} className="text-sm font-bold text-foreground mt-4 mb-2">{line.replace("### ", "")}</h3>;
                    }
                    if (line.startsWith("#### ")) {
                      return <h4 key={idx} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-3 mb-1.5">{line.replace("#### ", "")}</h4>;
                    }
                    if (line.startsWith("* ")) {
                      return <li key={idx} className="list-disc pl-2 ml-4 mt-1 text-muted-foreground">{line.replace("* ", "")}</li>;
                    }
                    return <p key={idx} className="text-muted-foreground my-1.5 leading-relaxed">{line}</p>;
                  })}
                </div>
              </div>
            ) : (
              /* Trigger state */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="h-10 w-10 text-muted-foreground opacity-30 mb-4" />
                <h3 className="text-sm font-semibold">No AI research compiled yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Run Research Assist to automatically perform web search scrapes and compile funding, requirements, and deadlines.
                </p>
                <Button onClick={handleResearch} disabled={aiLoading} className="mt-6 flex gap-1.5 items-center">
                  <Search className="h-4 w-4" /> {aiLoading ? "Searching & Analyzing..." : "Run Research Assist"}
                </Button>
              </div>
            )}

            {aiError && <p className="text-sm text-destructive">{aiError}</p>}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

// Wrapper for useActionState backwards compatibility in React 19
function useActionState<State, Payload>(
  action: (state: State, payload: Payload) => Promise<State>,
  initialState: State,
): [State, (payload: Payload) => void, boolean] {
  const [state, setState] = useState<State>(initialState);
  const [isPending, startTransition] = useTransition();

  const dispatch = (payload: Payload) => {
    startTransition(async () => {
      const newState = await action(state, payload);
      setState(newState);
    });
  };

  return [state, dispatch, isPending];
}
