import "server-only";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { HoldingData } from "@/lib/finance/types";

function firstOfMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function getDashboardData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, cashflowRes, holdingsRes, liabRes, goalsRes, monthExpRes, recentExpRes, customCatRes, snapshotsRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("cashflow").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("asset_holdings").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("liabilities").select("*").eq("user_id", user.id),
      supabase.from("goals").select("*").eq("user_id", user.id).order("created_at"),
      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .gte("expense_date", firstOfMonthIso())
        .order("expense_date", { ascending: false }),
      supabase.from("expenses").select("*").eq("user_id", user.id).order("expense_date", { ascending: false }).limit(6),
      supabase.from("custom_expense_categories").select("name").eq("user_id", user.id),
      supabase
        .from("net_worth_snapshots")
        .select("*")
        .eq("user_id", user.id)
        .gte("snapshot_date", daysAgoIso(90))
        .order("snapshot_date"),
    ]);

  const profile = profileRes.data;
  if (!profile || profile.onboarding_step !== "done") redirect("/onboarding");

  const holdings = (holdingsRes.data || []).map((h) => ({
    id: h.id,
    category: h.category,
    data: (h.data as HoldingData) || {},
  }));
  const liabilities = (liabRes.data || []).map((l) => ({
    category: l.category,
    data: (l.data as HoldingData) || {},
  }));

  return {
    user,
    profile,
    cashflow: cashflowRes.data || {
      income: 0,
      fixed_expense: 0,
      lifestyle_expense: 0,
      invest: 0,
    },
    holdings,
    liabilities,
    goals: (goalsRes.data || []).map((g) => ({
      id: g.id,
      name: g.name,
      target: Number(g.target),
      current: Number(g.current),
      targetDate: g.target_date,
    })),
    monthExpenses: monthExpRes.data || [],
    recentExpenses: recentExpRes.data || [],
    customCategories: (customCatRes.data || []).map((c) => c.name),
    snapshots: snapshotsRes.data || [],
  };
}

export async function recordNetWorthSnapshot(
  userId: string,
  netWorthVal: number,
  totalAssetsVal: number,
  totalLiabilitiesVal: number,
) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("net_worth_snapshots").upsert({
    user_id: userId,
    snapshot_date: today,
    net_worth: netWorthVal,
    total_assets: totalAssetsVal,
    total_liabilities: totalLiabilitiesVal,
  });
}
