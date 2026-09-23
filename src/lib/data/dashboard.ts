import "server-only";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { holdingValue } from "@/lib/finance/calculations";
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

function monthsAgoFirstOfMonthIso(months: number): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - months, 1).toISOString().slice(0, 10);
}

export async function getDashboardData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    profileRes,
    cashflowRes,
    holdingsRes,
    liabRes,
    goalsRes,
    monthExpRes,
    monthIncRes,
    recentExpRes,
    recentIncRes,
    customExpCatRes,
    customIncCatRes,
    snapshotsRes,
    marketNewsRes,
    fcfSnapshotsRes,
    budgetsRes,
    recurringIncomeRes,
    recurringExpenseRes,
    assetHoldingSnapshotsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("name, onboarding_step, asset_categories, liability_categories").eq("id", user.id).single(),
    supabase.from("cashflow").select("income, fixed_expense, lifestyle_expense, invest").eq("user_id", user.id).maybeSingle(),
    supabase.from("asset_holdings").select("id, category, data, goal_id").eq("user_id", user.id).order("created_at"),
    supabase.from("liabilities").select("id, category, data").eq("user_id", user.id),
    supabase.from("goals").select("id, name, target, current, target_date").eq("user_id", user.id).order("created_at"),
    supabase
      .from("expenses")
      .select("id, expense_date, category, amount, description")
      .eq("user_id", user.id)
      .gte("expense_date", firstOfMonthIso())
      .order("expense_date", { ascending: false }),
    supabase
      .from("incomes")
      .select("id, income_date, category, amount, description")
      .eq("user_id", user.id)
      .gte("income_date", firstOfMonthIso())
      .order("income_date", { ascending: false }),
    supabase
      .from("expenses")
      .select("id, expense_date, category, amount, description, account_holding_id")
      .eq("user_id", user.id)
      .order("expense_date", { ascending: false })
      .limit(8),
    supabase
      .from("incomes")
      .select("id, income_date, category, amount, description, account_holding_id")
      .eq("user_id", user.id)
      .order("income_date", { ascending: false })
      .limit(8),
    supabase.from("custom_expense_categories").select("name").eq("user_id", user.id),
    supabase.from("custom_income_categories").select("name").eq("user_id", user.id),
    supabase
      .from("net_worth_snapshots")
      .select("snapshot_date, net_worth")
      .eq("user_id", user.id)
      .gte("snapshot_date", daysAgoIso(90))
      .order("snapshot_date"),
    supabase
      .from("market_news")
      .select("id, headline, summary, sources, published_at")
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("fcf_snapshots")
      .select("snapshot_month, fcf")
      .eq("user_id", user.id)
      .gte("snapshot_month", monthsAgoFirstOfMonthIso(11))
      .order("snapshot_month"),
    supabase.from("budgets").select("category, monthly_limit").eq("user_id", user.id),
    supabase.from("recurring_incomes").select("id, label, amount").eq("user_id", user.id).order("created_at"),
    supabase.from("recurring_expenses").select("id, label, amount").eq("user_id", user.id).order("created_at"),
    supabase
      .from("asset_holding_snapshots")
      .select("snapshot_date, holding_id, category, label, value")
      .eq("user_id", user.id)
      .gte("snapshot_date", daysAgoIso(4)),
  ]);

  const profile = profileRes.data;
  if (!profile || profile.onboarding_step !== "done") redirect("/onboarding");

  const holdings = (holdingsRes.data || []).map((h) => ({
    id: h.id,
    category: h.category,
    data: (h.data as HoldingData) || {},
    goalId: h.goal_id,
  }));
  const liabilities = (liabRes.data || []).map((l) => ({
    id: l.id,
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
    monthIncomes: monthIncRes.data || [],
    recentExpenses: recentExpRes.data || [],
    recentIncomes: recentIncRes.data || [],
    customExpenseCategories: (customExpCatRes.data || []).map((c) => c.name),
    customIncomeCategories: (customIncCatRes.data || []).map((c) => c.name),
    snapshots: snapshotsRes.data || [],
    marketNews: (marketNewsRes.data || []).map((n) => ({
      id: n.id,
      headline: n.headline,
      summary: n.summary,
      sources: (Array.isArray(n.sources) ? n.sources : []) as unknown as {
        title: string;
        url: string;
        publisher?: string;
      }[],
      publishedAt: n.published_at,
    })),
    fcfSnapshots: fcfSnapshotsRes.data || [],
    budgets: (budgetsRes.data || []).map((b) => ({ category: b.category, monthlyLimit: Number(b.monthly_limit) })),
    recurringIncomes: (recurringIncomeRes.data || []).map((r) => ({ id: r.id, label: r.label, amount: Number(r.amount) })),
    recurringExpenses: (recurringExpenseRes.data || []).map((r) => ({ id: r.id, label: r.label, amount: Number(r.amount) })),
    assetHoldingSnapshots: (assetHoldingSnapshotsRes.data || []).map((s) => ({
      date: s.snapshot_date,
      holdingId: s.holding_id,
      category: s.category,
      label: s.label,
      value: Number(s.value),
    })),
  };
}

/**
 * Narrow variant of getDashboardData() for the AI insight action — fetches
 * only the fields buildFinancialSnapshot() actually consumes, instead of
 * the full 17-query dashboard payload (market news, snapshots, budgets,
 * recurring items, recent transactions, etc. are irrelevant to the prompt).
 */
export async function getFinancialSnapshotData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, cashflowRes, holdingsRes, liabRes, goalsRes, monthExpRes, monthIncRes] = await Promise.all([
    supabase.from("profiles").select("onboarding_step, asset_categories, liability_categories").eq("id", user.id).single(),
    supabase.from("cashflow").select("income, fixed_expense, lifestyle_expense, invest").eq("user_id", user.id).maybeSingle(),
    supabase.from("asset_holdings").select("id, category, data").eq("user_id", user.id).order("created_at"),
    supabase.from("liabilities").select("id, category, data").eq("user_id", user.id),
    supabase.from("goals").select("id, name, target, current, target_date").eq("user_id", user.id).order("created_at"),
    supabase
      .from("expenses")
      .select("id, expense_date, category, amount, description")
      .eq("user_id", user.id)
      .gte("expense_date", firstOfMonthIso())
      .order("expense_date", { ascending: false }),
    supabase
      .from("incomes")
      .select("id, income_date, category, amount, description")
      .eq("user_id", user.id)
      .gte("income_date", firstOfMonthIso())
      .order("income_date", { ascending: false }),
  ]);

  const profile = profileRes.data;
  if (!profile || profile.onboarding_step !== "done") redirect("/onboarding");

  const holdings = (holdingsRes.data || []).map((h) => ({
    id: h.id,
    category: h.category,
    data: (h.data as HoldingData) || {},
  }));
  const liabilities = (liabRes.data || []).map((l) => ({
    id: l.id,
    category: l.category,
    data: (l.data as HoldingData) || {},
  }));

  return {
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
    monthIncomes: monthIncRes.data || [],
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

/**
 * Upserts the current month's FCF breakdown, keyed by the 1st of the month.
 * Called on every dashboard view — the current month's row stays live all
 * month, then is left untouched (frozen) once the month rolls over, giving
 * a natural per-month history without any manual reset.
 */
export async function recordFcfSnapshot(
  userId: string,
  cf: {
    incomeTotal: number;
    fixedExpense: number;
    lifestyleTotal: number;
    invest: number;
    fcf: number;
    savingRate: number;
  },
) {
  const supabase = await createClient();
  const now = new Date();
  const snapshotMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  await supabase.from("fcf_snapshots").upsert({
    user_id: userId,
    snapshot_month: snapshotMonth,
    income: cf.incomeTotal,
    fixed_expense: cf.fixedExpense,
    lifestyle_expense: cf.lifestyleTotal,
    invest: cf.invest,
    fcf: cf.fcf,
    saving_rate: cf.savingRate,
  });
}

/**
 * Upserts today's value for every holding, one row per holding. Called on
 * every dashboard view, same pattern as the net worth / FCF snapshots —
 * today's row stays live, older days are frozen history. Snapshotting at
 * the holding level (rather than just a category total) is what lets the
 * Summary review answer "which specific stock/fund grew the most this
 * month", not just "Saham as a whole". label/category are copied in as of
 * today rather than joined live, so history stays correct even if the
 * holding is later renamed or deleted; a category total for a given day
 * is just SUM(value) GROUP BY category over this table, so there's no
 * separate category-level table to keep in sync.
 */
export async function recordAssetHoldingSnapshots(
  userId: string,
  holdings: { id: string; category: string; data: HoldingData }[],
) {
  if (holdings.length === 0) return;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const rows = holdings.map((h) => ({
    user_id: userId,
    snapshot_date: today,
    holding_id: h.id,
    category: h.category,
    label: typeof h.data.label === "string" ? h.data.label : "",
    value: holdingValue(h.category, h.data),
  }));
  await supabase.from("asset_holding_snapshots").upsert(rows);
}
