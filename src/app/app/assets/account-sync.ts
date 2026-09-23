import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { HoldingData } from "@/lib/finance/types";

/**
 * Adjusts a Cash holding's stored balance by `delta` (positive = credit, negative = debit) —
 * keeps `asset_holdings.data.amount` in sync with transactions tagged to it via Sumber Dana.
 * No-ops silently for a holding that isn't Cash, isn't in IDR (transactions are always
 * recorded in Rupiah, so a foreign-currency balance can't be safely adjusted without a kurs),
 * or no longer exists (e.g. deleted) — this is a best-effort side effect of saving a
 * transaction, never something that should block it.
 */
export async function adjustCashBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  holdingId: string | null | undefined,
  delta: number,
) {
  if (!holdingId || delta === 0) return;

  const { data: holding } = await supabase
    .from("asset_holdings")
    .select("id, category, data")
    .eq("id", holdingId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!holding || holding.category !== "Cash") return;

  const current = (holding.data as HoldingData) || {};
  const currency = typeof current.currency === "string" ? current.currency : "IDR";
  if (currency !== "IDR") return;

  const nextAmount = (Number(current.amount) || 0) + delta;
  await supabase
    .from("asset_holdings")
    .update({ data: { ...current, amount: nextAmount } })
    .eq("id", holdingId)
    .eq("user_id", userId);
}
