import { Metadata } from "next";
import { getCapitalSummary, getLedgerEntries } from "@/app/actions/ledger";
import { AddExpenseDialog } from "@/components/ledger/add-expense-dialog";
import { CapitalWidget } from "@/components/ledger/capital-widget";
import { ExpensePieChart } from "@/components/ledger/expense-pie-chart";
import { BlockedAccountPlanner } from "@/components/ledger/blocked-account-planner";
import { LedgerTable } from "@/components/ledger/ledger-table";
import { Wallet, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "FX Capital Ledger | The Japa Desk",
  description: "Track liquid capital, multi-currency expenses, live FX exchange rates, and category pie chart breakdowns.",
};

export default async function LedgerPage() {
  const [summary, entries] = await Promise.all([
    getCapitalSummary(),
    getLedgerEntries(),
  ]);

  return (
    <div className="flex w-full flex-col gap-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-black text-indigo-700 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Multi-Currency Capital &amp; FX Tracker</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            FX Capital Ledger
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1">
            Track liquid vs. locked capital, application fee conversions, and visual expense allocation.
          </p>
        </div>
        <AddExpenseDialog />
      </div>

      {/* Capital Position Overview Widget */}
      <CapitalWidget summary={summary} />

      {/* Blocked Account Target Progress Planner */}
      <BlockedAccountPlanner summary={summary} />

      {/* Visual Pie Chart Expense Breakdown */}
      <ExpensePieChart entries={entries} baseCurrency={summary.baseCurrency} />

      {/* Detailed Expense Log Table */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-black text-slate-900 flex items-center gap-2">
            <span>Expense Transaction History</span>
            <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-black text-slate-600">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          </h2>
        </div>
        <LedgerTable entries={entries} />
      </div>
    </div>
  );
}
