import "server-only";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { holdingValue } from "@/lib/finance/calculations";
import {
  currentPeriodStartIsoInTz,
  daysAgoIsoInTz,
  monthsAgoFirstOfMonthIsoInTz,
  todayIsoInTz,
} from "@/lib/finance/format";
import type { HoldingData } from "@/lib/finance/types";

export async function getDashboardData(tz: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetched first (not in the big Promise.all below) because the "current
  // period" for a Karyawan starts on their payday_day, not the 1st — the
  // month-scoped queries below need that resolved before they can be built.
  // See currentPeriodStartIsoInTz() for why: without this, a bill charged
  // right on payday landed in the tail of the *previous* calendar month's
  // totals instead of starting the new period clean.
  const profileRes = await supabase
    .from("profiles")
    .select("name, onboarding_step, asset_categories, liability_categories, profile_type, payday_day")
    .eq("id", user.id)
    .single();

  const profile = profileRes.data;
  if (!profile || profile.onboarding_step !== "done") redirect("/onboarding");

  const periodStart = currentPeriodStartIsoInTz(tz, profile.profile_type === "karyawan" ? profile.payday_day : null);

  const [
    cashflowRes,
    holdingsRes,
    liabRes,
    goalsRes,
    monthExpRes,
    monthIncRes,
    incomesLast3MonthsRes,
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
    ihsgRes,
    priorCashSnapshotsRes,
    streakRes,
  ] = await Promise.all([
    supabase.from("cashflow").select("income, fixed_expense, lifestyle_expense, invest").eq("user_id", user.id).maybeSingle(),
    supabase.from("asset_holdings").select("id, category, data, goal_id").eq("user_id", user.id).order("created_at"),
    supabase.from("liabilities").select("id, category, data").eq("user_id", user.id),
    supabase.from("goals").select("id, name, target, current, target_date").eq("user_id", user.id).order("created_at"),
    supabase
      .from("expenses")
      .select("id, expense_date, category, amount, description, is_auto_recurring")
      .eq("user_id", user.id)
      .gte("expense_date", periodStart)
      .order("expense_date", { ascending: false }),
    supabase
      .from("incomes")
      .select("id, income_date, category, amount, description, is_auto_recurring")
      .eq("user_id", user.id)
      .gte("income_date", periodStart)
      .order("income_date", { ascending: false }),
    supabase
      .from("incomes")
      .select("id, income_date, category, amount, description, is_auto_recurring")
      .eq("user_id", user.id)
      .gte("income_date", monthsAgoFirstOfMonthIsoInTz(2, tz))
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
      .gte("snapshot_date", daysAgoIsoInTz(90, tz))
      .order("snapshot_date"),
    supabase
      .from("market_news")
      .select("id, headline, summary, sources, published_at")
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("fcf_snapshots")
      .select("snapshot_month, fcf, saving_rate")
      .eq("user_id", user.id)
      .gte("snapshot_month", monthsAgoFirstOfMonthIsoInTz(11, tz))
      .order("snapshot_month"),
    supabase.from("budgets").select("category, monthly_limit").eq("user_id", user.id),
    supabase
      .from("recurring_incomes")
      .select("id, label, amount, account_holding_id")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase
      .from("recurring_expenses")
      .select("id, label, amount, account_holding_id")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase
      .from("asset_holding_snapshots")
      .select("snapshot_date, holding_id, category, label, value")
      .eq("user_id", user.id)
      .gte("snapshot_date", daysAgoIsoInTz(4, tz)),
    supabase.from("stock_prices").select("change_pct").eq("ticker", "^JKSE").maybeSingle(),
    // Baseline for the "windfall" insight — Cash-category snapshots from
    // ~30 days back or earlier (there may be no row from exactly 30 days
    // ago), most recent first; cashWindfall() picks the closest date.
    supabase
      .from("asset_holding_snapshots")
      .select("snapshot_date, value")
      .eq("user_id", user.id)
      .eq("category", "Cash")
      .lte("snapshot_date", daysAgoIsoInTz(30, tz))
      .order("snapshot_date", { ascending: false })
      .limit(20),
    supabase
      .from("logging_streaks")
      .select("current_streak, longest_streak, last_logged_date")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

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
    incomesLast3Months: incomesLast3MonthsRes.data || [],
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
    recurringIncomes: (recurringIncomeRes.data || []).map((r) => ({
      id: r.id,
      label: r.label,
      amount: Number(r.amount),
      accountHoldingId: r.account_holding_id,
    })),
    recurringExpenses: (recurringExpenseRes.data || []).map((r) => ({
      id: r.id,
      label: r.label,
      amount: Number(r.amount),
      accountHoldingId: r.account_holding_id,
    })),
    assetHoldingSnapshots: (assetHoldingSnapshotsRes.data || []).map((s) => ({
      date: s.snapshot_date,
      holdingId: s.holding_id,
      category: s.category,
      label: s.label,
      value: Number(s.value),
    })),
    ihsgChangePct: ihsgRes.data ? Number(ihsgRes.data.change_pct) : null,
    priorCashSnapshots: (priorCashSnapshotsRes.data || []).map((r) => ({
      snapshotDate: r.snapshot_date,
      value: Number(r.value),
    })),
    streak: streakRes.data
      ? {
          current: streakRes.data.current_streak,
          longest: streakRes.data.longest_streak,
          lastLoggedDate: streakRes.data.last_logged_date,
        }
      : { current: 0, longest: 0, lastLoggedDate: null },
    periodStart,
  };
}

/**
 * Narrow variant of getDashboardData() for the AI insight action — fetches
 * only the fields buildFinancialSnapshot() actually consumes, instead of
 * the full 17-query dashboard payload (market news, snapshots, budgets,
 * recurring items, recent transactions, etc. are irrelevant to the prompt).
 */
export async function getFinancialSnapshotData(tz: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profileRes = await supabase
    .from("profiles")
    .select("onboarding_step, asset_categories, liability_categories, profile_type, payday_day")
    .eq("id", user.id)
    .single();

  const profile = profileRes.data;
  if (!profile || profile.onboarding_step !== "done") redirect("/onboarding");

  const periodStart = currentPeriodStartIsoInTz(tz, profile.profile_type === "karyawan" ? profile.payday_day : null);

  const [cashflowRes, holdingsRes, liabRes, goalsRes, monthExpRes, monthIncRes, incomesLast3MonthsRes] = await Promise.all([
    supabase.from("cashflow").select("income, fixed_expense, lifestyle_expense, invest").eq("user_id", user.id).maybeSingle(),
    supabase.from("asset_holdings").select("id, category, data").eq("user_id", user.id).order("created_at"),
    supabase.from("liabilities").select("id, category, data").eq("user_id", user.id),
    supabase.from("goals").select("id, name, target, current, target_date").eq("user_id", user.id).order("created_at"),
    supabase
      .from("expenses")
      .select("id, expense_date, category, amount, description, is_auto_recurring")
      .eq("user_id", user.id)
      .gte("expense_date", periodStart)
      .order("expense_date", { ascending: false }),
    supabase
      .from("incomes")
      .select("id, income_date, category, amount, description, is_auto_recurring")
      .eq("user_id", user.id)
      .gte("income_date", periodStart)
      .order("income_date", { ascending: false }),
    supabase
      .from("incomes")
      .select("id, income_date, category, amount, description, is_auto_recurring")
      .eq("user_id", user.id)
      .gte("income_date", monthsAgoFirstOfMonthIsoInTz(2, tz))
      .order("income_date", { ascending: false }),
  ]);

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
    incomesLast3Months: incomesLast3MonthsRes.data || [],
  };
}

export async function recordNetWorthSnapshot(
  userId: string,
  netWorthVal: number,
  totalAssetsVal: number,
  totalLiabilitiesVal: number,
  tz: string,
) {
  const supabase = await createClient();
  const today = todayIsoInTz(tz);
  await supabase.from("net_worth_snapshots").upsert({
    user_id: userId,
    snapshot_date: today,
    net_worth: netWorthVal,
    total_assets: totalAssetsVal,
    total_liabilities: totalLiabilitiesVal,
  });
}

/**
 * Upserts the current period's FCF breakdown, keyed by the 1st of the
 * calendar month the period *starts* in. Called on every dashboard view —
 * the row stays live for as long as that period is current, then is left
 * untouched (frozen) once the next one starts, giving a natural per-period
 * history without any manual reset.
 *
 * `snapshotMonth` must be the caller's already-resolved period-start month
 * (see currentPeriodStartIsoInTz) — not recomputed from `today` here, since
 * for a Karyawan whose payday isn't the 1st, "today's calendar month" and
 * "the month the current pay period started in" are only the same for part
 * of the month and would otherwise silently overwrite the wrong row's data
 * depending on which day of the month the dashboard happens to be viewed.
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
  snapshotMonth: string,
) {
  const supabase = await createClient();
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
  tz: string,
) {
  if (holdings.length === 0) return;
  const supabase = await createClient();
  const today = todayIsoInTz(tz);
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
