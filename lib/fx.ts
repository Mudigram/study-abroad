import "server-only";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FrankfurterResponse {
  rates: Record<string, number>;
}

interface ErApiResponse {
  result: string;
  rates: Record<string, number>;
}

// ---------------------------------------------------------------------------
// frankfurter.app — ECB currencies (USD, EUR, GBP, HUF, PLN, …)
// Does NOT support NGN.
// ---------------------------------------------------------------------------

const FRANKFURTER_BASE = "https://api.frankfurter.app";

/**
 * Convert `amount` in `fromCurrency` to USD via frankfurter.app.
 * Returns null if the currency is unsupported or the network call fails.
 */
export async function toUsd(
  amount: number,
  fromCurrency: string,
): Promise<number | null> {
  if (fromCurrency === "USD") return amount;

  try {
    const res = await fetch(
      `${FRANKFURTER_BASE}/latest?from=${encodeURIComponent(fromCurrency)}&to=USD`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as FrankfurterResponse;
    const rate = data.rates?.USD;
    if (typeof rate !== "number") return null;
    return +(amount * rate).toFixed(4);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// open.er-api.com — covers NGN and most world currencies
// Used specifically for the NGN shadow value on every ledger entry.
// ---------------------------------------------------------------------------

const ERAPI_BASE = "https://open.er-api.com/v6/latest/USD";

let erApiCache: { rates: Record<string, number>; fetchedAt: number } | null =
  null;
const ER_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getErApiRates(): Promise<Record<string, number> | null> {
  const now = Date.now();
  if (erApiCache && now - erApiCache.fetchedAt < ER_CACHE_TTL_MS) {
    return erApiCache.rates;
  }
  try {
    const res = await fetch(ERAPI_BASE, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as ErApiResponse;
    if (data.result !== "success" || !data.rates) return null;
    erApiCache = { rates: data.rates, fetchedAt: now };
    return data.rates;
  } catch {
    return null;
  }
}

/**
 * Convert a USD amount to NGN via open.er-api.com.
 * Returns null if the fetch fails.
 */
export async function usdToNgn(amountUsd: number): Promise<number | null> {
  const rates = await getErApiRates();
  if (!rates) return null;
  const rate = rates["NGN"];
  if (typeof rate !== "number") return null;
  return +(amountUsd * rate).toFixed(2);
}

/**
 * Convert an NGN amount to USD via open.er-api.com.
 * Returns null if the fetch fails.
 */
export async function ngnToUsd(amountNgn: number): Promise<number | null> {
  const rates = await getErApiRates();
  if (!rates) return null;
  const rate = rates["NGN"];
  if (typeof rate !== "number") return null;
  return +(amountNgn / rate).toFixed(4);
}

// ---------------------------------------------------------------------------
// Convenience: resolve both USD and NGN amounts in one call
// ---------------------------------------------------------------------------

export interface FxResult {
  amountUsd: number | null;
  amountNgn: number | null;
}

/**
 * Given an amount in any currency:
 * - Resolves amountUsd via frankfurter (or open.er-api for NGN)
 * - Resolves amountNgn shadow value
 *
 * Either value may be null if the network call fails — callers must handle
 * this and allow the user to enter the value manually.
 */
export async function resolveFx(
  amount: number,
  currency: string,
): Promise<FxResult> {
  if (currency === "NGN") {
    const amountUsd = await ngnToUsd(amount);
    return { amountUsd, amountNgn: amount };
  }

  const amountUsd = await toUsd(amount, currency);
  const amountNgn = amountUsd !== null ? await usdToNgn(amountUsd) : null;
  return { amountUsd, amountNgn };
}
