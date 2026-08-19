"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  isPending?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Are you sure you want to delete this?",
  description = "This action cannot be undone and will permanently remove this item from your records.",
  confirmText = "Delete Permanently",
  isPending = false,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border-2 border-slate-900/10 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 fade-in duration-200">
        {/* Header with Icon */}
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-xs">
            <Trash2 className="h-6 w-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="font-heading text-lg font-black text-slate-900">{title}</h3>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="rounded-2xl border-slate-200 text-slate-700 font-extrabold hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-2xl bg-rose-600 text-white font-black hover:bg-rose-700 shadow-md shadow-rose-600/20"
          >
            {isPending ? "Deleting..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
