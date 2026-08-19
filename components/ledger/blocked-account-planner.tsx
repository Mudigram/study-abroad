"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  LockKeyhole,
  Edit,
  TrendingUp,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { updateBlockedAccountGoal } from "@/app/actions/profile";
import type { CapitalSummary } from "@/app/actions/ledger";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface BlockedAccountPlannerProps {
  summary: CapitalSummary;
}

const CURRENCIES = ["USD", "EUR", "GBP", "HUF", "PLN", "NGN"];

export function BlockedAccountPlanner({ summary }: BlockedAccountPlannerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [targetInput, setTargetInput] = useState(String(summary.blockedAccountTarget || 11904));
  const [currencyInput, setCurrencyInput] = useState(summary.blockedAccountCurrency || "EUR");
  const [isPending, startTransition] = useTransition();

  // Dynamic live rates for the target
  const [targetInUsd, setTargetInUsd] = useState<number | null>(null);
  const [targetInNgn, setTargetInNgn] = useState<number | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);

  useEffect(() => {
    const val = parseFloat(targetInput);
    if (isNaN(val) || val <= 0) {
      setTargetInUsd(null);
      setTargetInNgn(null);
      return;
    }

    setRatesLoading(true);
    fetch(`/api/fx?amount=${val}&currency=${currencyInput}`)
      .then((res) => res.json())
      .then((data) => {
        setTargetInUsd(data.amountUsd);
        setTargetInNgn(data.amountNgn);
      })
      .catch((err) => {
        console.error("Failed to load live FX rates for target", err);
      })
      .finally(() => {
        setRatesLoading(false);
      });
  }, [targetInput, currencyInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetInput);
    if (isNaN(val) || val < 0) {
      toast({
        title: "Invalid input",
        description: "Goal amount must be a positive number.",
        type: "error",
      });
      return;
    }

    startTransition(async () => {
      const res = await updateBlockedAccountGoal(val, currencyInput);
      if (res.error) {
        toast({
          title: "Update failed",
          description: res.error,
          type: "error",
        });
      } else {
        toast({
          title: "Savings goal saved!",
          description: `Blocked account target updated to ${val} ${currencyInput}.`,
          type: "success",
        });
        setOpen(false);
        router.refresh();
      }
    });
  };

  // Convert currently locked capital from USD to Target Currency and Local Currency
  // Locked Capital is stored in USD in database: summary.lockedCapital
  const lockedCapitalUsd = summary.lockedCapital || 0;

  // Let's resolve the user's base currency representation
  const targetCurrency = summary.blockedAccountCurrency || "EUR";
  const targetGoal = summary.blockedAccountTarget || 0;

  // Live conversion rates (approximation based on live target query)
  const usdRateToTarget = targetInUsd && targetGoal > 0 ? targetInUsd / targetGoal : null;
  const lockedCapitalInTarget = lockedCapitalUsd && usdRateToTarget ? lockedCapitalUsd / usdRateToTarget : 0;

  const percent = targetGoal > 0 ? Math.min(Math.round((lockedCapitalInTarget / targetGoal) * 100), 100) : 0;

  // Remaining
  const remainingInTarget = Math.max(targetGoal - lockedCapitalInTarget, 0);

  function fmt(val: number, cur: string) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  }

  return (
    <>
      <div className="rounded-3xl border-2 border-slate-900/10 bg-white p-6 shadow-sm shadow-playful space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-black text-slate-900 flex items-center gap-1.5">
                Blocked Account &amp; Proof of Funds Planner
                <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
              </h3>
              <p className="text-xs text-slate-500 font-medium">Track your lock goal against actual entries</p>
            </div>
          </div>

          <Button
            onClick={() => setOpen(true)}
            variant="outline"
            className="rounded-2xl border-2 border-slate-900/10 font-extrabold text-xs hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5 mr-1" /> Adjust Goal
          </Button>
        </div>

        {targetGoal === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <TrendingUp className="h-8 w-8 text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Goal Setup</h4>
            <p className="text-xs text-slate-400 mt-0.5">Setup a target blocked account goal to track funding progress.</p>
            <Button size="sm" className="mt-3" onClick={() => setOpen(true)}>
              Setup Plan
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Meter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-slate-500 uppercase tracking-wider">Locked Capital Progress</span>
                <span className="text-indigo-600">{percent}% Completed</span>
              </div>
              <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Figures */}
            <div className="grid gap-4 sm:grid-cols-3 text-center sm:text-left">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase block">Total Goal Target</span>
                <span className="font-heading text-lg font-black text-slate-900 block mt-1">
                  {fmt(targetGoal, targetCurrency)}
                </span>
                {targetInNgn !== null && (
                  <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                    ≈ {fmt(targetInNgn, "NGN")} shadow NGN
                  </span>
                )}
              </div>

              <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
                <span className="text-[10px] font-black text-indigo-700 uppercase block">Locked To Date</span>
                <span className="font-heading text-lg font-black text-indigo-900 block mt-1">
                  {lockedCapitalUsd > 0 && usdRateToTarget
                    ? fmt(lockedCapitalInTarget, targetCurrency)
                    : fmt(0, targetCurrency)}
                </span>
                <span className="text-[10px] font-bold text-indigo-600 block mt-0.5">
                  ({fmt(lockedCapitalUsd, "USD")} USD cumulative)
                </span>
              </div>

              <div className="bg-rose-50/40 rounded-2xl p-4 border border-rose-100">
                <span className="text-[10px] font-black text-rose-700 uppercase block">Remaining Target</span>
                <span className="font-heading text-lg font-black text-rose-900 block mt-1">
                  {fmt(remainingInTarget, targetCurrency)}
                </span>
                {ratesLoading ? (
                  <span className="text-[10px] text-slate-400 block mt-0.5">Recalculating rates...</span>
                ) : (
                  <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                    Need to transfer/lock
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Goal Settings Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border-2 border-slate-900/10 bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-heading text-lg font-black text-slate-900">Configure Blocked Account Goal</h3>
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
                <Label htmlFor="target_limit">Target Goal Amount</Label>
                <Input
                  id="target_limit"
                  type="number"
                  placeholder="e.g. 11904"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="target_currency">Goal Currency</Label>
                <CustomSelect
                  id="target_currency"
                  value={currencyInput}
                  onChange={setCurrencyInput}
                  options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                    </span>
                  ) : (
                    "Save Goal"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
