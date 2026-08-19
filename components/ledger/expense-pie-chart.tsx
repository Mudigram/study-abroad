"use client";

import { useState, useMemo } from "react";
import { PieChart as PieChartIcon, Tag, Wallet, DollarSign, Info } from "lucide-react";
import type { LedgerEntry, ExpenseType, FundingSource } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const EXPENSE_LABELS: Record<string, string> = {
  application_fee: "Application Fee",
  translation: "Translation",
  exam_fee: "Exam Fee",
  visa_fee: "Visa Fee",
  blocked_account: "Blocked Account",
  flight: "Flight",
  agent_fee: "Consultant / Agent",
  other: "Other Expense",
};

const EXPENSE_COLORS: Record<string, string> = {
  application_fee: "#4D7CFF", // Vibrant Indigo Blue
  translation: "#D946EF", // Fuchsia
  exam_fee: "#FF5722", // Bright Orange
  visa_fee: "#046A38", // Emerald
  blocked_account: "#8B1E3F", // Maroon Rose
  flight: "#EAB308", // Gold Yellow
  agent_fee: "#06B6D4", // Cyan
  other: "#64748B", // Slate
};

const FUNDING_LABELS: Record<string, string> = {
  personal_savings: "Personal Savings",
  family_support: "Family Support",
  loan: "Student / Bank Loan",
  scholarship_disbursement: "Scholarship",
  other: "Other Source",
  unspecified: "Unspecified",
};

const FUNDING_COLORS: Record<string, string> = {
  personal_savings: "#046A38",
  family_support: "#4D7CFF",
  loan: "#FF5722",
  scholarship_disbursement: "#EAB308",
  other: "#D946EF",
  unspecified: "#94A3B8",
};

interface ExpensePieChartProps {
  entries: LedgerEntry[];
  baseCurrency?: string;
}

export function ExpensePieChart({ entries, baseCurrency = "USD" }: ExpensePieChartProps) {
  const [groupBy, setGroupBy] = useState<"category" | "funding">("category");
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);

  // Group entries and calculate totals & percentages
  const chartData = useMemo(() => {
    const totalSpentUsd = entries.reduce((sum, e) => sum + (e.amount_usd ?? 0), 0);
    if (totalSpentUsd === 0) return { segments: [], totalSpentUsd: 0 };

    const grouped: Record<string, number> = {};

    entries.forEach((entry) => {
      const key =
        groupBy === "category"
          ? entry.expense_type || "other"
          : entry.funding_source || "unspecified";

      grouped[key] = (grouped[key] || 0) + (entry.amount_usd ?? 0);
    });

    const segments = Object.entries(grouped)
      .map(([key, amountUsd]) => {
        const percent = (amountUsd / totalSpentUsd) * 100;
        const label =
          groupBy === "category"
            ? EXPENSE_LABELS[key] || key
            : FUNDING_LABELS[key] || key;

        const color =
          groupBy === "category"
            ? EXPENSE_COLORS[key] || "#64748B"
            : FUNDING_COLORS[key] || "#94A3B8";

        return { key, label, amountUsd, percent, color };
      })
      .sort((a, b) => b.amountUsd - a.amountUsd);

    return { segments, totalSpentUsd };
  }, [entries, groupBy]);

  const { segments, totalSpentUsd } = chartData;

  // SVG Arc calculation for Donut Segments
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const svgArcs = segments.map((seg, i) => {
    const strokeDasharray = `${(seg.percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    cumulativePercent += seg.percent;

    return {
      ...seg,
      strokeDasharray,
      strokeDashoffset,
      index: i,
    };
  });

  const fmtUsd = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-slate-900/10 bg-white p-8 shadow-sm shadow-playful flex flex-col items-center justify-center text-center space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <PieChartIcon className="h-6 w-6" />
        </div>
        <h3 className="font-heading text-base font-black text-slate-900">No Expense Data</h3>
        <p className="text-xs font-semibold text-slate-500 max-w-sm leading-relaxed">
          Log application fees, exam costs, or visa deposits to see a visual pie chart breakdown of your expenses.
        </p>
      </div>
    );
  }

  const activeSeg = activeSegmentIndex !== null ? segments[activeSegmentIndex] : null;

  return (
    <div className="rounded-3xl border-2 border-slate-900/10 bg-white p-6 shadow-sm shadow-playful space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-heading text-lg font-black text-slate-900 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-indigo-600" />
            <span>Expense Breakdown</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Visual allocation of total spent across category and funding sources
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => {
              setGroupBy("category");
              setActiveSegmentIndex(null);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer",
              groupBy === "category" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
            )}
          >
            <Tag className="h-3.5 w-3.5" />
            <span>Category</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setGroupBy("funding");
              setActiveSegmentIndex(null);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer",
              groupBy === "funding" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900",
            )}
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Funding Source</span>
          </button>
        </div>
      </div>

      {/* Chart & Legend Grid */}
      <div className="grid gap-8 md:grid-cols-12 items-center">
        {/* Interactive Donut Graphic */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative h-56 w-56 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90 transform">
              {/* Background Ring */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                className="fill-none stroke-slate-100"
                strokeWidth="24"
              />

              {/* Segment Wedges */}
              {svgArcs.map((arc) => {
                const isActive = activeSegmentIndex === arc.index;
                return (
                  <circle
                    key={arc.key}
                    cx="100"
                    cy="100"
                    r={radius}
                    className="fill-none transition-all duration-300 cursor-pointer"
                    stroke={arc.color}
                    strokeWidth={isActive ? "32" : "24"}
                    strokeDasharray={arc.strokeDasharray}
                    strokeDashoffset={arc.strokeDashoffset}
                    onMouseEnter={() => setActiveSegmentIndex(arc.index)}
                    onMouseLeave={() => setActiveSegmentIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {activeSeg ? activeSeg.label : "Total Spent"}
              </span>
              <span className="font-heading text-xl font-black text-slate-900">
                {fmtUsd(activeSeg ? activeSeg.amountUsd : totalSpentUsd)}
              </span>
              <span className="text-[10px] font-extrabold text-indigo-600 mt-0.5">
                {activeSeg ? `${activeSeg.percent.toFixed(1)}% of total` : `${segments.length} Categories`}
              </span>
            </div>
          </div>
        </div>

        {/* Segment Legend List */}
        <div className="md:col-span-7 space-y-2.5">
          {segments.map((seg, idx) => {
            const isActive = activeSegmentIndex === idx;
            return (
              <div
                key={seg.key}
                onMouseEnter={() => setActiveSegmentIndex(idx)}
                onMouseLeave={() => setActiveSegmentIndex(null)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer",
                  isActive
                    ? "border-indigo-400 bg-indigo-50/50 shadow-xs scale-[1.01]"
                    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-3.5 w-3.5 shrink-0 rounded-full shadow-2xs"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="font-heading text-xs font-black text-slate-900 truncate">
                    {seg.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-extrabold text-slate-900">
                    {fmtUsd(seg.amountUsd)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">
                    {seg.percent.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
