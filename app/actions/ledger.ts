"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { resolveFx } from "@/lib/fx";
import { createClient } from "@/lib/supabase/server";
import type {
  ExpenseType,
  FundingSource,
  LedgerEntry,
} from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LedgerActionState {
  error?: string;
  success?: boolean;
}

export interface CapitalSummary {
  totalBudget: number;
  baseCurrency: string;
  liquidCapital: number;
  lockedCapital: number;
  totalSpent: number;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getLedgerEntries(): Promise<LedgerEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("ledger")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as LedgerEntry[];
}

export async function getCapitalSummary(): Promise<CapitalSummary> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Profile for total_budget + base_currency
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("total_budget, base_currency")
    .eq("id", user.id)
    .single();

  if (profileError) throw new Error(profileError.message);

  const totalBudget = (profile?.total_budget as number) ?? 0;
  const baseCurrency = (profile?.base_currency as string) ?? "USD";

  // All ledger entries
  const entries = await getLedgerEntries();

  const lockedCapital = entries
    .filter((e) => e.expense_type === "blocked_account")
    .reduce((sum, e) => sum + e.amount_usd, 0);

  const totalSpent = entries
    .filter((e) => e.expense_type !== "blocked_account")
    .reduce((sum, e) => sum + e.amount_usd, 0);

  // Liquid = budget − spent − locked
  const liquidCapital = totalBudget - totalSpent - lockedCapital;

  return {
    totalBudget,
    baseCurrency,
    liquidCapital,
    lockedCapital,
    totalSpent,
  };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

const VALID_EXPENSE_TYPES: ExpenseType[] = [
  "application_fee",
  "translation",
  "exam_fee",
  "visa_fee",
  "blocked_account",
  "flight",
  "agent_fee",
  "other",
];

const VALID_FUNDING_SOURCES: FundingSource[] = [
  "personal_savings",
  "family_support",
  "loan",
  "scholarship_disbursement",
  "other",
];

function isExpenseType(v: string): v is ExpenseType {
  return VALID_EXPENSE_TYPES.includes(v as ExpenseType);
}

function isFundingSource(v: string): v is FundingSource {
  return VALID_FUNDING_SOURCES.includes(v as FundingSource);
}

export async function addLedgerEntry(
  _prevState: LedgerActionState,
  formData: FormData,
): Promise<LedgerActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Field extraction ──────────────────────────────────────────────────────
  const description = formData.get("description");
  const rawAmount = formData.get("amount_original");
  const currency = formData.get("currency");
  const expenseTypeRaw = formData.get("expense_type");
  const fundingSourceRaw = formData.get("funding_source");
  const rawManualUsd = formData.get("amount_usd_manual");
  const rawManualNgn = formData.get("amount_ngn_manual");

  // ── Validation ────────────────────────────────────────────────────────────
  if (typeof currency !== "string" || !currency.trim()) {
    return { error: "Currency is required." };
  }
  if (typeof expenseTypeRaw !== "string" || !isExpenseType(expenseTypeRaw)) {
    return { error: "Select a valid expense type." };
  }

  const amountOriginal =
    typeof rawAmount === "string" ? parseFloat(rawAmount) : NaN;
  if (isNaN(amountOriginal) || amountOriginal <= 0) {
    return { error: "Enter a positive amount." };
  }

  const fundingSource =
    typeof fundingSourceRaw === "string" && isFundingSource(fundingSourceRaw)
      ? fundingSourceRaw
      : null;

  // ── FX resolution ─────────────────────────────────────────────────────────
  // Try live rates first. Fall back to user-provided manual values.
  // Never block the entry on a network failure.
  let { amountUsd, amountNgn } = await resolveFx(
    amountOriginal,
    currency.toUpperCase(),
  );

  if (amountUsd === null) {
    const manualUsd =
      typeof rawManualUsd === "string" ? parseFloat(rawManualUsd) : NaN;
    if (isNaN(manualUsd) || manualUsd < 0) {
      return {
        error:
          "Could not fetch the USD exchange rate. Please enter the USD equivalent manually.",
      };
    }
    amountUsd = manualUsd;
  }

  if (amountNgn === null) {
    const manualNgn =
      typeof rawManualNgn === "string" ? parseFloat(rawManualNgn) : NaN;
    amountNgn = !isNaN(manualNgn) && manualNgn > 0 ? manualNgn : null;
    // NGN shadow is optional — we don't block on it.
  }

  // ── Insert ────────────────────────────────────────────────────────────────
  const { error } = await supabase.from("ledger").insert({
    user_id: user.id,
    amount_original: amountOriginal,
    currency: currency.toUpperCase(),
    amount_usd: amountUsd,
    amount_ngn: amountNgn,
    expense_type: expenseTypeRaw,
    funding_source: fundingSource,
    description:
      typeof description === "string" && description.trim()
        ? description.trim()
        : null,
  });

  if (error) return { error: error.message };

  revalidatePath("/ledger");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteLedgerEntry(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("ledger")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // RLS + defence-in-depth

  revalidatePath("/ledger");
  revalidatePath("/dashboard");
}
