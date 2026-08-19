"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { X } from "lucide-react";

import {
  addLedgerEntry,
  type LedgerActionState,
} from "@/app/actions/ledger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { CustomSelect } from "@/components/ui/custom-select";

const CURRENCIES = ["USD", "EUR", "GBP", "HUF", "PLN", "NGN"];

const EXPENSE_TYPES = [
  { value: "application_fee", label: "Application Fee" },
  { value: "translation", label: "Document Translation" },
  { value: "exam_fee", label: "Exam Fee (IELTS, GRE, etc.)" },
  { value: "visa_fee", label: "Visa Fee" },
  { value: "blocked_account", label: "Blocked Account Deposit" },
  { value: "flight", label: "Flight" },
  { value: "agent_fee", label: "Agent / Consultant Fee" },
  { value: "other", label: "Other" },
] as const;

const FUNDING_SOURCES = [
  { value: "personal_savings", label: "Personal Savings" },
  { value: "family_support", label: "Family Support" },
  { value: "loan", label: "Loan" },
  { value: "scholarship_disbursement", label: "Scholarship Disbursement" },
  { value: "other", label: "Other" },
] as const;

// ─── FX preview hook ─────────────────────────────────────────────────────────

interface FxPreview {
  amountUsd: number | null;
  amountNgn: number | null;
  status: "idle" | "loading" | "success" | "error";
}

function useFxPreview(amount: string, currency: string) {
  const [preview, setPreview] = useState<FxPreview>({
    amountUsd: null,
    amountNgn: null,
    status: "idle",
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPreview = useCallback(async (amt: string, cur: string) => {
    const num = parseFloat(amt);
    if (isNaN(num) || num <= 0) {
      setPreview({ amountUsd: null, amountNgn: null, status: "idle" });
      return;
    }
    setPreview((p) => ({ ...p, status: "loading" }));
    try {
      const res = await fetch(`/api/fx?amount=${num}&currency=${encodeURIComponent(cur)}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as { amountUsd: number | null; amountNgn: number | null };
      setPreview({ ...data, status: data.amountUsd !== null ? "success" : "error" });
    } catch {
      setPreview({ amountUsd: null, amountNgn: null, status: "error" });
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchPreview(amount, currency), 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [amount, currency, fetchPreview]);

  return preview;
}

// ─── Dialog shell ─────────────────────────────────────────────────────────────

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Dialog({ open, onClose, children }: DialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-lg rounded-xl border shadow-2xl overflow-y-auto max-h-[90vh]"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const initialState: LedgerActionState = {};

import { useToast } from "@/components/ui/toast";

export function AddExpenseDialog() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [expenseType, setExpenseType] = useState("application_fee");
  const [fundingSource, setFundingSource] = useState("");
  const [manualUsd, setManualUsd] = useState("");
  const [manualNgn, setManualNgn] = useState("");
  const { toast } = useToast();

  const preview = useFxPreview(amount, currency);
  const fxFailed = preview.status === "error";

  const [state, formAction, pending] = useActionState(
    addLedgerEntry,
    initialState,
  );

  // Close dialog on success
  useEffect(() => {
    if (state.success) {
      setOpen(false);
      toast({
        title: "Expense logged!",
        description: "Transaction added to your FX capital ledger.",
        type: "success",
      });
      setAmount("");
      setCurrency("USD");
      setExpenseType("application_fee");
      setFundingSource("");
      setManualUsd("");
      setManualNgn("");
    } else if (state.error) {
      toast({
        title: "Failed to log expense",
        description: state.error,
        type: "error",
      });
    }
  }, [state.success, state.error, toast]);

  function fmtUsd(v: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(v);
  }
  function fmtNgn(v: number) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(v);
  }

  return (
    <>
      <Button id="add-expense-btn" onClick={() => setOpen(true)}>
        Add expense
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-base font-semibold">Add expense</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form action={formAction} className="px-6 py-5 space-y-4">
          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="e.g. TU Munich application fee"
            />
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="amount_original">Amount</Label>
              <Input
                id="amount_original"
                name="amount_original"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="currency">Currency</Label>
              <CustomSelect
                id="currency"
                name="currency"
                value={currency}
                onChange={setCurrency}
                options={CURRENCIES.map((c) => ({ value: c, label: c }))}
              />
            </div>
          </div>

          {/* FX preview */}
          {preview.status !== "idle" && (
            <div
              className={cn(
                "rounded-lg px-4 py-3 text-sm",
                preview.status === "loading" && "bg-muted text-muted-foreground",
                preview.status === "success" && "bg-primary/10 text-primary",
                preview.status === "error" && "bg-destructive/10 text-destructive",
              )}
            >
              {preview.status === "loading" && "Fetching exchange rates…"}
              {preview.status === "success" && preview.amountUsd !== null && (
                <span>
                  ≈{" "}
                  <strong>{fmtUsd(preview.amountUsd)}</strong>
                  {preview.amountNgn !== null && (
                    <> &nbsp;/&nbsp; <strong>{fmtNgn(preview.amountNgn)}</strong></>
                  )}
                </span>
              )}
              {preview.status === "error" &&
                "Could not fetch live rates — please enter the USD equivalent below."}
            </div>
          )}

          {/* Manual USD fallback */}
          {(fxFailed || currency === "USD") && currency !== "NGN" && (
            <div className="grid gap-1.5">
              <Label htmlFor="amount_usd_manual">
                USD equivalent
                {currency === "USD" ? " (same currency)" : " (enter manually)"}
              </Label>
              <Input
                id="amount_usd_manual"
                name="amount_usd_manual"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={
                  currency === "USD"
                    ? amount
                    : manualUsd
                }
                readOnly={currency === "USD"}
                onChange={(e) => setManualUsd(e.target.value)}
              />
            </div>
          )}

          {/* Manual NGN fallback (always optional) */}
          {fxFailed && (
            <div className="grid gap-1.5">
              <Label htmlFor="amount_ngn_manual">₦ NGN equivalent (optional)</Label>
              <Input
                id="amount_ngn_manual"
                name="amount_ngn_manual"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={manualNgn}
                onChange={(e) => setManualNgn(e.target.value)}
              />
            </div>
          )}

          {/* Expense type */}
          <div className="grid gap-1.5">
            <Label htmlFor="expense_type">Expense type</Label>
            <CustomSelect
              id="expense_type"
              name="expense_type"
              value={expenseType}
              onChange={setExpenseType}
              options={EXPENSE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            />
          </div>

          {/* Funding source */}
          <div className="grid gap-1.5">
            <Label htmlFor="funding_source">Funding source (optional)</Label>
            <CustomSelect
              id="funding_source"
              name="funding_source"
              value={fundingSource}
              onChange={setFundingSource}
              options={[
                { value: "", label: "— not specified —" },
                ...FUNDING_SOURCES.map((f) => ({ value: f.value, label: f.label })),
              ]}
            />
          </div>

          {/* Error */}
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save expense"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
