"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  FileCheck,
  Calendar,
  Trash2,
  Plus,
  X,
  Loader2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { createTracker, deleteTracker, type ProcessingTracker } from "@/app/actions/trackers";
import type { Application } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface ProcessingTrackersListProps {
  trackers: ProcessingTracker[];
  applications: Application[];
}

export function ProcessingTrackersList({ trackers, applications }: ProcessingTrackersListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [type, setType] = useState<"evaluation" | "visa">("evaluation");
  const [agency, setAgency] = useState("");
  const [status, setStatus] = useState("In Progress");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [appId, setAppId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency.trim()) {
      toast({
        title: "Validation error",
        description: "Agency name cannot be blank.",
        type: "error",
      });
      return;
    }

    startTransition(async () => {
      const res = await createTracker(
        appId || null,
        type,
        agency,
        status,
        trackingNumber || null,
        appointmentDate || null,
        notes || null,
      );

      if (res.error) {
        toast({
          title: "Submission failed",
          description: res.error,
          type: "error",
        });
      } else {
        toast({
          title: "Tracker logged!",
          description: `Logged update for ${agency}.`,
          type: "success",
        });
        setOpen(false);
        // Reset form
        setAgency("");
        setStatus("In Progress");
        setTrackingNumber("");
        setAppointmentDate("");
        setNotes("");
        setAppId("");
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the tracker for ${name}?`)) return;

    startTransition(async () => {
      const res = await deleteTracker(id);
      if (res.error) {
        toast({
          title: "Deletion failed",
          description: res.error,
          type: "error",
        });
      } else {
        toast({
          title: "Tracker deleted",
          description: `Removed ${name} from your list.`,
          type: "info",
        });
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-3xl border-2 border-slate-900/10 bg-white p-6 shadow-sm shadow-playful space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-black text-slate-900">Visa &amp; Evaluation Queue</h3>
            <p className="text-xs text-slate-500 font-medium">Log your WES, uni-assist, APS, and VFS slots</p>
          </div>
        </div>

        <Button
          onClick={() => setOpen(true)}
          className="rounded-2xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
          size="sm"
        >
          <Plus className="h-4 w-4" /> Log Queue Item
        </Button>
      </div>

      {/* Tracker list */}
      {trackers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileCheck className="h-8 w-8 text-slate-300 mb-2" />
          <h4 className="text-xs font-bold text-slate-600">No queues logged</h4>
          <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
            Log your transcript evaluation timelines or embassy visa queue stages to track milestones.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
          {trackers.map((tr) => {
            const linkedApp = applications.find((a) => a.id === tr.application_id);
            const dateStr = tr.appointment_date
              ? new Date(tr.appointment_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null;

            return (
              <div key={tr.id} className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                        tr.type === "visa"
                          ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                          : "bg-teal-100 text-teal-700 border border-teal-200"
                      )}
                    >
                      {tr.type}
                    </span>
                    <span className="font-heading text-sm font-black text-slate-900">{tr.agency}</span>
                    {linkedApp && (
                      <span className="text-[10px] font-extrabold text-slate-400 truncate">
                        ({linkedApp.university_name})
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-indigo-600" />
                      Status: <span className="font-extrabold text-slate-800">{tr.status}</span>
                    </span>

                    {dateStr && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Target/Appt: <span className="font-extrabold text-slate-800">{dateStr}</span>
                      </span>
                    )}

                    {tr.tracking_number && (
                      <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border text-[10px]">
                        Ref: {tr.tracking_number}
                      </span>
                    )}
                  </div>

                  {tr.notes && (
                    <p className="text-[11px] font-medium text-slate-400 leading-normal pl-4 border-l border-slate-200 italic">
                      {tr.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center shrink-0">
                  <Button
                    onClick={() => handleDelete(tr.id, tr.agency)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border-2 border-slate-900/10 bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="font-heading text-lg font-black text-slate-900">Log Queue or Milestone</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="tracker_type">Milestone Category</Label>
                <CustomSelect
                  id="tracker_type"
                  value={type}
                  onChange={(val) => setType(val as "evaluation" | "visa")}
                  options={[
                    { value: "evaluation", label: "Credential Evaluation (WES, uni-assist, etc.)" },
                    { value: "visa", label: "Visa Slots & Embassy booking (VFS, TLScontact)" },
                  ]}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="tracker_agency">Agency / Platform Name</Label>
                <Input
                  id="tracker_agency"
                  placeholder="e.g. VFS Global Poland, uni-assist, WES"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="tracker_status">Current Stage Status</Label>
                <Input
                  id="tracker_status"
                  placeholder="e.g. Documents Mailed, Appointment Booked, Awaiting Slot"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="tracker_ref">Reference / Tracking Number (Optional)</Label>
                <Input
                  id="tracker_ref"
                  placeholder="e.g. WES-1234567, VFS-998877"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="tracker_date">Appointment or Deadline Date (Optional)</Label>
                <Input
                  id="tracker_date"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="tracker_app">Link to Application Program (Optional)</Label>
                <CustomSelect
                  id="tracker_app"
                  value={appId}
                  onChange={setAppId}
                  options={[
                    { value: "", label: "No linked university" },
                    ...applications.map((app) => ({
                      value: app.id,
                      label: `${app.university_name} (${app.country})`,
                    })),
                  ]}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="tracker_notes">Private Notes (Optional)</Label>
                <Input
                  id="tracker_notes"
                  placeholder="e.g. Remind sibling to send verification code"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
                    </span>
                  ) : (
                    "Save Log"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
