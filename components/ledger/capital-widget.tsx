import { LockKeyhole, TrendingDown, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CapitalSummary } from "@/app/actions/ledger";

function fmtUsd(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

interface CapitalWidgetProps {
  summary: CapitalSummary;
}

export function CapitalWidget({ summary }: CapitalWidgetProps) {
  const { totalBudget, baseCurrency, liquidCapital, lockedCapital, totalSpent } =
    summary;

  const cards = [
    {
      label: "Liquid Capital Available",
      value: fmtUsd(liquidCapital),
      sub: `of ${fmtUsd(totalBudget, baseCurrency)} total budget`,
      Icon: Wallet,
      accent: "oklch(0.62 0.19 264)", // indigo
      positive: liquidCapital >= 0,
    },
    {
      label: "Capital Locked",
      value: fmtUsd(lockedCapital),
      sub: "Blocked account — committed, not spent",
      Icon: LockKeyhole,
      accent: "oklch(0.65 0.18 60)", // amber
      positive: true,
    },
    {
      label: "Total Spent",
      value: fmtUsd(totalSpent),
      sub: "Fees, translations, flights, etc.",
      Icon: TrendingDown,
      accent: "oklch(0.60 0.22 30)", // orange-red
      positive: true,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map(({ label, value, sub, Icon, accent, positive }) => (
        <Card key={label} className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </CardTitle>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ backgroundColor: accent + "25", color: accent }}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p
              className="text-2xl font-bold tracking-tight"
              style={!positive ? { color: "var(--destructive)" } : {}}
            >
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </CardContent>
          <div
            className="absolute inset-x-0 bottom-0 h-0.5 opacity-50"
            style={{
              background: `linear-gradient(to right, ${accent}, transparent)`,
            }}
          />
        </Card>
      ))}
    </div>
  );
}
