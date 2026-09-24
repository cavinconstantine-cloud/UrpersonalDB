import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  cashflowNums,
  investmentIncomeMonthly,
  monthExpenseTotal,
  monthIncomeTotal,
} from "@/lib/finance/calculations";
import { currentYmInTz, monthsAgoFirstOfMonthIsoInTz } from "@/lib/finance/format";
import { getVisitorTimezone } from "@/lib/i18n/timezone";
import type { Expense, HoldingData, Income } from "@/lib/finance/types";
import { SummaryView } from "@/components/app/summary-view";

export const metadata: Metadata = { title: "Summary" };

export default async function SummaryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tz = await getVisitorTimezone();
  const since = monthsAgoFirstOfMonthIsoInTz(12, tz);

  const [cashflowRes, holdingsRes, expRes, incRes, fcfRes, assetSnapshotsRes] = await Promise.all([
    supabase.from("cashflow").select("income, fixed_expense, lifestyle_expense, invest").eq("user_id", user.id).maybeSingle(),
    supabase.from("asset_holdings").select("id, category, data").eq("user_id", user.id),
    supabase
      .from("expenses")
      .select("id, expense_date, category, amount, description, is_auto_recurring")
      .eq("user_id", user.id)
      .gte("expense_date", since)
      .order("expense_date", { ascending: false }),
    supabase
      .from("incomes")
      .select("id, income_date, category, amount, description, is_auto_recurring")
      .eq("user_id", user.id)
      .gte("income_date", since)
      .order("income_date", { ascending: false }),
    supabase
      .from("fcf_snapshots")
      .select("snapshot_month, fcf, saving_rate")
      .eq("user_id", user.id)
      .gte("snapshot_month", since)
      .order("snapshot_month"),
    supabase
      .from("asset_holding_snapshots")
      .select("snapshot_date, holding_id, category, label, value")
      .eq("user_id", user.id)
      .gte("snapshot_date", since)
      .order("snapshot_date"),
  ]);

  const expenses: Expense[] = (expRes.data || []).map((e) => ({
    id: e.id,
    date: e.expense_date,
    category: e.category,
    amount: Number(e.amount),
    description: e.description,
  }));
  const incomes: Income[] = (incRes.data || []).map((i) => ({
    id: i.id,
    date: i.income_date,
    category: i.category,
    amount: Number(i.amount),
    description: i.description,
  }));
  const holdings = (holdingsRes.data || []).map((h) => ({
    id: h.id,
    category: h.category,
    data: (h.data as HoldingData) || {},
  }));
  const assetSnapshots = (assetSnapshotsRes.data || []).map((s) => ({
    date: s.snapshot_date,
    holdingId: s.holding_id,
    category: s.category,
    label: s.label,
    value: Number(s.value),
  }));

  // The current month's fcf_snapshots row can be stale (only refreshed when
  // the Home dashboard is viewed) — recompute it live here, same formula as
  // the dashboard, so Summary always agrees with what Home shows right now.
  const thisYm = currentYmInTz(tz);
  const cfRow = cashflowRes.data;
  const investIncomeMonthly = investmentIncomeMonthly(holdings);
  // Auto-generated payday transactions stay in `expenses`/`incomes` for the
  // charts below (real money movements) but are excluded here — FCF is
  // already fed by the flat planning totals, see page.tsx for the rationale.
  const expensesForFcf = (expRes.data || []).filter((e) => !e.is_auto_recurring);
  const incomesForFcf = (incRes.data || []).filter((i) => !i.is_auto_recurring);
  const liveCf = cashflowNums(
    {
      income: Number(cfRow?.income || 0),
      fixedExpense: Number(cfRow?.fixed_expense || 0),
      lifestyleExpense: Number(cfRow?.lifestyle_expense || 0),
      invest: Number(cfRow?.invest || 0),
    },
    monthExpenseTotal(
      expensesForFcf.map((e) => ({ id: e.id, date: e.expense_date, category: e.category, amount: Number(e.amount), description: e.description })),
      thisYm,
    ),
    monthIncomeTotal(
      incomesForFcf.map((i) => ({ id: i.id, date: i.income_date, category: i.category, amount: Number(i.amount), description: i.description })),
      thisYm,
    ) + investIncomeMonthly,
  );

  const historicalFcf = (fcfRes.data || [])
    .map((r) => ({ ym: r.snapshot_month.slice(0, 7), fcf: Number(r.fcf), savingRate: Number(r.saving_rate) }))
    .filter((p) => p.ym !== thisYm);
  const fcfSeries = [...historicalFcf, { ym: thisYm, fcf: liveCf.fcf, savingRate: liveCf.savingRate }].sort((a, b) =>
    a.ym.localeCompare(b.ym),
  );

  return (
    <div className="pt-6">
      <SummaryView expenses={expenses} incomes={incomes} fcfSeries={fcfSeries} holdings={holdings} assetSnapshots={assetSnapshots} />
    </div>
  );
}
