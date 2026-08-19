"use client";

import { useState, useTransition } from "react";
import { Plus, Trash, AlertCircle } from "lucide-react";
import { createTemplate } from "@/app/actions/requirements";
import type { RequirementTemplateItem } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

interface TemplateBuilderProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function TemplateBuilder({ onSuccess, onCancel }: TemplateBuilderProps) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [items, setItems] = useState<RequirementTemplateItem[]>([
    { label: "", category: "Forms", default_due_offset_days: -30 },
  ]);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { label: "", category: "Forms", default_due_offset_days: -30 },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof RequirementTemplateItem,
    value: string | number | null,
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          [field]: value,
        };
      }),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Template name is required.");
      return;
    }

    const filteredItems = items.map((it) => ({
      ...it,
      label: it.label.trim(),
    }));

    const invalid = filteredItems.some((it) => !it.label || !it.category);
    if (invalid) {
      setError("All requirement items must have a description.");
      return;
    }

    startTransition(async () => {
      const res = await createTemplate(
        name,
        country ? country.trim() : null,
        filteredItems,
        isShared,
      );

      if (res.error) {
        setError(res.error);
      } else {
        onSuccess();
      }
    });
  };

  return (
    <Card className="w-full max-w-2xl border" style={{ borderColor: "var(--border)" }}>
      <CardHeader>
        <CardTitle>Create Custom Requirement Template</CardTitle>
        <CardDescription>
          Build a reusable list of tasks for scholarships or countries.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Metadata */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="template_name">Template Name</Label>
              <Input
                id="template_name"
                placeholder="e.g. Italy DSU Scholarship Checklist"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="template_country">Country (Optional)</Label>
              <Input
                id="template_country"
                placeholder="e.g. Italy"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_shared"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
            />
            <Label htmlFor="is_shared" className="text-sm font-normal text-muted-foreground">
              Share template with other pilot users (is_shared = true)
            </Label>
          </div>

          {/* Dynamic Item List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
              <Label className="text-sm font-semibold">Requirement Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Item
              </Button>
            </div>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-muted/20 p-2.5 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                  <div className="flex-1 grid gap-2 sm:grid-cols-12">
                    {/* Description */}
                    <div className="sm:col-span-6">
                      <Input
                        placeholder="Description (e.g. Certified translation of degree)"
                        value={item.label}
                        onChange={(e) => updateItem(idx, "label", e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>

                    {/* Category */}
                    <div className="sm:col-span-3">
                      <select
                        className="h-8 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-800 outline-none transition-all hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs cursor-pointer"
                        value={item.category}
                        onChange={(e) => updateItem(idx, "category", e.target.value)}
                      >
                        {COMMON_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Due offset */}
                    <div className="sm:col-span-3">
                      <Input
                        type="number"
                        placeholder="Days offset (e.g. -30)"
                        value={item.default_due_offset_days ?? ""}
                        onChange={(e) =>
                          updateItem(
                            idx,
                            "default_due_offset_days",
                            e.target.value ? parseInt(e.target.value) : null,
                          )
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Remove button */}
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItemRow(idx)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              * Days offset are calculated relative to the application deadline. E.g. -30 means the task is due 30 days before the deadline.
            </p>
          </div>

          {error && (
            <div className="flex gap-2 items-center text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating Template..." : "Create Template"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
