"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { addCustomRequirement } from "@/app/actions/requirements";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COMMON_CATEGORIES = [
  "Forms",
  "CV & Motivation",
  "Identity",
  "Translations",
  "Academic Records",
  "Language",
  "Finance",
  "Visa",
  "Medical",
  "Insurance",
  "Verification",
  "National Service",
  "Other",
];

import { useToast } from "@/components/ui/toast";

interface AddRequirementDialogProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  onSuccess: () => void;
}

export function AddRequirementDialog({
  open,
  onClose,
  applicationId,
  onSuccess,
}: AddRequirementDialogProps) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("Forms");
  const [dueDate, setDueDate] = useState("");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    setError(null);
    startTransition(async () => {
      const res = await addCustomRequirement(
        applicationId,
        label,
        category,
        dueDate ? dueDate : null,
      );
      if (res.error) {
        setError(res.error);
        toast({
          title: "Failed to add task",
          description: res.error,
          type: "error",
        });
      } else {
        toast({
          title: "Task added!",
          description: `"${label}" added to requirements checklist.`,
          type: "success",
        });
        setLabel("");
        setCategory("Forms");
        setDueDate("");
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md rounded-xl border shadow-2xl overflow-y-auto max-h-[90vh]"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-base font-semibold">Add Custom Requirement</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="req_label">Description</Label>
            <Input
              id="req_label"
              placeholder="e.g. Certified translation of degree"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="req_category">Category</Label>
            <CustomSelect
              id="req_category"
              value={category}
              onChange={setCategory}
              options={COMMON_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="req_due_date">Due Date (Optional)</Label>
            <Input
              id="req_due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Requirement"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
