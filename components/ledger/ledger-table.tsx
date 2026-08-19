import { Trash2 } from "lucide-react";

import { deleteLedgerEntry } from "@/app/actions/ledger";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import type { ExpenseType, FundingSource, LedgerEntry } from "@/lib/types/database";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EXPENSE_LABELS: Record<ExpenseType, string> = {
  application_fee: "App Fee",
  translation: "Translation",
  exam_fee: "Exam Fee",
  visa_fee: "Visa Fee",
  blocked_account: "Blocked Acct",
  flight: "Flight",
  agent_fee: "Agent Fee",
  other: "Other",
};

const EXPENSE_VARIANTS: Record<ExpenseType, BadgeVariant> = {
  application_fee: "blue",
  translation: "purple",
  exam_fee: "teal",
  visa_fee: "orange",
  blocked_account: "amber",
  flight: "sky",
  agent_fee: "red",
  other: "gray",
};

const FUNDING_LABELS: Record<FundingSource, string> = {
  personal_savings: "Savings",
  family_support: "Family",
  loan: "Loan",
  scholarship_disbursement: "Scholarship",
  other: "Other",
};

function fmtCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "HUF" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

// ─── Delete button (Server Component form) ────────────────────────────────────

function DeleteButton({ id }: { id: string }) {
  const boundAction = deleteLedgerEntry.bind(null, id);

  return (
    <form action={boundAction}>
      <button
        type="submit"
        title="Delete entry"
        className="flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}

// ─── Main component (Server Component) ───────────────────────────────────────

interface LedgerTableProps {
  entries: LedgerEntry[];
}

export function LedgerTable({ entries }: LedgerTableProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border py-16 text-center" style={{ borderColor: "var(--border)" }}>
        <p className="text-sm font-medium">No expenses yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add your first expense with the button above.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr
            className="border-b text-xs uppercase tracking-wider text-muted-foreground"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
          >
            <th className="px-4 py-3 text-left font-medium">Date</th>
            <th className="px-4 py-3 text-left font-medium">Description</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-4 py-3 text-right font-medium">≈ USD</th>
            <th className="px-4 py-3 text-right font-medium">₦ NGN</th>
            <th className="px-4 py-3 text-left font-medium">Funding</th>
            <th className="px-4 py-3 text-center font-medium sr-only">Del</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className="border-b transition-colors hover:bg-muted/40 last:border-0"
              style={{ borderColor: "var(--border)" }}
            >
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {fmtDate(entry.created_at)}
              </td>
              <td className="px-4 py-3 max-w-[180px]">
                <span className="block truncate" title={entry.description ?? ""}>
                  {entry.description ?? <span className="text-muted-foreground italic">—</span>}
                </span>
              </td>
              <td className="px-4 py-3">
                <Badge variant={EXPENSE_VARIANTS[entry.expense_type]}>
                  {EXPENSE_LABELS[entry.expense_type]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                {fmtCurrency(entry.amount_original, entry.currency)}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                {fmtCurrency(entry.amount_usd, "USD")}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                {entry.amount_ngn !== null
                  ? fmtCurrency(entry.amount_ngn, "NGN")
                  : <span className="opacity-40">—</span>}
              </td>
              <td className="px-4 py-3">
                {entry.funding_source ? (
                  <span className="text-muted-foreground text-xs">
                    {FUNDING_LABELS[entry.funding_source]}
                  </span>
                ) : (
                  <span className="opacity-40 text-xs">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <DeleteButton id={entry.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
