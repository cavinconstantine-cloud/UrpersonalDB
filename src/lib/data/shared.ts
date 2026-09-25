import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { HoldingData } from "@/lib/finance/types";

/**
 * Custom categories and Cash accounts are fetched by the `/app` layout (for
 * AppShell/TransactionModal) and independently by several pages nested under
 * it (Transaksi, Arus Kas Tetap, ...) that need the same data server-side.
 * React's `cache()` dedupes calls with the same arguments within a single
 * request/render pass, so the layout and a page both calling these during
 * the same navigation share one Supabase round trip instead of firing it
 * twice.
 */
export const getCustomCategories = cache(async (userId: string) => {
  const supabase = await createClient();
  const [expenseCatsRes, incomeCatsRes] = await Promise.all([
    supabase.from("custom_expense_categories").select("name").eq("user_id", userId),
    supabase.from("custom_income_categories").select("name").eq("user_id", userId),
  ]);
  return {
    customExpenseCategories: (expenseCatsRes.data || []).map((c) => c.name),
    customIncomeCategories: (incomeCatsRes.data || []).map((c) => c.name),
  };
});

export const getCashAccountsResult = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("asset_holdings")
    .select("id, data")
    .eq("user_id", userId)
    .eq("category", "Cash");
  const accounts = (data || []).map((h) => ({
    id: h.id,
    label: String((h.data as HoldingData)?.label || "Rekening"),
  }));
  return { accounts, error };
});

export async function getCashAccounts(userId: string) {
  return (await getCashAccountsResult(userId)).accounts;
}

/**
 * The `profiles` row, superset of columns every `/app/*` page that reads it
 * needs (layout, dashboard, goals, summary, settings, asset/liability
 * category pages). Nearly every page under `/app` was independently
 * re-selecting a different subset of this same row — deduped here the same
 * way as getCustomCategories/getCashAccounts above.
 */
export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  return supabase
    .from("profiles")
    .select(
      "name, onboarding_step, asset_categories, liability_categories, profile_type, payday_day, whatsapp_number, whatsapp_pairing_code, push_enabled",
    )
    .eq("id", userId)
    .single();
});
