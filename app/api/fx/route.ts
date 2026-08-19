import type { NextRequest } from "next/server";

import { resolveFx } from "@/lib/fx";

/**
 * GET /api/fx?amount=100&currency=EUR
 *
 * Returns live FX preview for the Add Expense dialog.
 * Used client-side for the live preview — the server action re-fetches
 * on submit so the client value is only cosmetic.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawAmount = searchParams.get("amount");
  const currency = (searchParams.get("currency") ?? "USD").toUpperCase();

  const amount = rawAmount ? parseFloat(rawAmount) : NaN;

  if (isNaN(amount) || amount <= 0) {
    return Response.json({ amountUsd: null, amountNgn: null });
  }

  const result = await resolveFx(amount, currency);
  return Response.json(result);
}
