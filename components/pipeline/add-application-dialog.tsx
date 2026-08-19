"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { createApplication, type ApplicationActionState } from "@/app/actions/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { CustomSelect } from "@/components/ui/custom-select";

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

interface AddApplicationDialogProps {
  open?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function AddApplicationDialog({
  open: controlledOpen,
  onClose: controlledOnClose,
  onSuccess,
}: AddApplicationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleClose = () => {
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  const [status, setStatus] = useState("Pathway Idea");
  const [priority, setPriority] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [state, formAction] = useActionState(
    async (prevState: ApplicationActionState, formData: FormData) => {
      setError(null);
      const res = await createApplication(prevState, formData);
      if (res.error) {
        setError(res.error);
        toast({
          title: "Failed to add program",
          description: res.error,
          type: "error",
        });
        return res;
      }
      handleClose();
      toast({
        title: "Program added!",
        description: "New university program added to your pipeline.",
        type: "success",
      });
      if (onSuccess) onSuccess();
      return { success: true };
    },
    {},
  );

  return (
    <>
      {!isControlled && (
        <Button onClick={() => setInternalOpen(true)} className="flex items-center gap-1.5" size="sm">
          <Plus className="h-4 w-4" /> Add Program
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
          <div
            className="relative z-10 w-full max-w-lg rounded-3xl border-2 border-slate-900/10 bg-white shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-black font-heading text-slate-900">Add New Application</h2>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form action={formAction} className="px-6 py-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="university_name">University Name</Label>
                  <Input id="university_name" name="university_name" placeholder="e.g. TU Munich" required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="program_name">Program Name</Label>
                  <Input id="program_name" name="program_name" placeholder="e.g. Informatics (M.Sc.)" required />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" placeholder="e.g. Germany" required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="scholarship_name">Scholarship (Optional)</Label>
                  <Input id="scholarship_name" name="scholarship_name" placeholder="e.g. DAAD Scholarship" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="status">Initial Status</Label>
                  <CustomSelect
                    id="status"
                    name="status"
                    value={status}
                    onChange={setStatus}
                    options={STATUS_COLUMNS.map((c) => ({ value: c, label: c }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input id="deadline" name="deadline" type="date" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="priority">Priority Ranking</Label>
                  <CustomSelect
                    id="priority"
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
                  <Label htmlFor="deposit_required">Deposit Required (Original Currency)</Label>
                  <Input id="deposit_required" name="deposit_required" type="number" min="0" step="0.01" defaultValue="0" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="visa_required"
                    name="visa_required"
                    value="true"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="visa_required" className="text-sm font-normal text-muted-foreground">
                    Visa required to study
                  </Label>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="link_url">Program Link URL</Label>
                  <Input id="link_url" name="link_url" placeholder="https://..." />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="notes">General Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  className="w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 text-foreground"
                  placeholder="Requirements notes, emails, contact persons, etc."
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="research_notes">Your Research Notes / Scratchpad</Label>
                <textarea
                  id="research_notes"
                  name="research_notes"
                  rows={2}
                  className="w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 text-foreground"
                  placeholder="Notes compiled outside the app before promotion"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Program
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
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
