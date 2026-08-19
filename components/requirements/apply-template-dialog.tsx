"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Check } from "lucide-react";
import { applyTemplateToApplication } from "@/app/actions/requirements";
import type { RequirementTemplate } from "@/lib/types/database";
import { CustomSelect } from "@/components/ui/custom-select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { useToast } from "@/components/ui/toast";

interface ApplyTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  templates: RequirementTemplate[];
  onSuccess: () => void;
}

export function ApplyTemplateDialog({
  open,
  onClose,
  applicationId,
  templates,
  onSuccess,
}: ApplyTemplateDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) return;

    setError(null);
    startTransition(async () => {
      const res = await applyTemplateToApplication(applicationId, selectedTemplateId);
      if (res.error) {
        setError(res.error);
        toast({
          title: "Failed to apply template",
          description: res.error,
          type: "error",
        });
      } else {
        toast({
          title: "Template applied!",
          description: "Checklist tasks added to program.",
          type: "success",
        });
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
          <h2 className="text-base font-semibold">Apply Checklist Template</h2>
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
            <Label htmlFor="template_select">Select Template</Label>
            <CustomSelect
              id="template_select"
              value={selectedTemplateId}
              onChange={setSelectedTemplateId}
              options={
                templates.length === 0
                  ? [{ value: "", label: "No templates available" }]
                  : templates.map((t) => ({
                      value: t.id,
                      label: `${t.name} ${t.country ? `(${t.country})` : ""}`,
                    }))
              }
            />
          </div>

          {templates.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <span className="font-semibold block text-foreground">
                Items to be instantiated:
              </span>
              <ul className="list-disc pl-4 space-y-1">
                {templates
                  .find((t) => t.id === selectedTemplateId)
                  ?.items.slice(0, 5)
                  .map((item, idx) => (
                    <li key={idx}>
                      {item.label} <span className="opacity-75">({item.category})</span>
                    </li>
                  ))}
                {(templates.find((t) => t.id === selectedTemplateId)?.items.length ?? 0) > 5 && (
                  <li>
                    + {(templates.find((t) => t.id === selectedTemplateId)?.items.length ?? 0) - 5} more items...
                  </li>
                )}
              </ul>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !selectedTemplateId}>
              {isPending ? "Applying..." : "Apply Template"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
