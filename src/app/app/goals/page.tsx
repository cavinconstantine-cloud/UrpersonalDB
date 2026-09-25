import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  cashflowNums,
  goalLinkedValue,
  goalMonthlyContributionRate,
  holdingValue,
  investmentIncomeMonthly,
  rollingAverageMonthlyIncome,
  type HoldingRowWithGoal,
} from "@/lib/finance/calculations";
import { currentPeriodStartIsoInTz, monthsAgoFirstOfMonthIsoInTz } from "@/lib/finance/format";
import { getVisitorTimezone } from "@/lib/i18n/timezone";
import { depositoNetInterestMonthly, obligasiNetCouponMonthly } from "@/lib/finance/schemas";
import type { HoldingData } from "@/lib/finance/types";
import { GoalsManager, type GoalLinkedAsset, type GoalLinkedSummary } from "@/components/app/goals-manager";

export const metadata: Metadata = { title: "Goals" };

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tz = await getVisitorTimezone();

  // Fetched first — the "current period" expense query below needs to know
  // profile_type/payday_day before it can be built (payday-to-payday for
  // Karyawan, calendar month otherwise; see currentPeriodStartIsoInTz()).
  const profileRes = await supabase.from("profiles").select("profile_type, payday_day").eq("id", user.id).single();
  const periodStart = currentPeriodStartIsoInTz(
    tz,
    profileRes.data?.profile_type === "karyawan" ? profileRes.data.payday_day : null,
  );

  const [goalsRes, cashflowRes, monthExpRes, holdingsRes, creditsRes, incomesLast3MonthsRes] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("cashflow").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("expenses")
      .select("amount, is_auto_recurring")
      .eq("user_id", user.id)
      .gte("expense_date", periodStart),
    supabase.from("asset_holdings").select("id, category, data, goal_id").eq("user_id", user.id),
    supabase.from("goal_interest_credits").select("goal_id, amount").eq("user_id", user.id),
    supabase
      .from("incomes")
      .select("id, income_date, category, amount, description, is_auto_recurring")
      .eq("user_id", user.id)
      .gte("income_date", monthsAgoFirstOfMonthIsoInTz(2, tz)),
  ]);

  const cf = cashflowRes.data;
  // Auto-generated payday transactions excluded from FCF the same way as
  // the Home dashboard — see page.tsx for the double-counting rationale.
  const monthTotal = (monthExpRes.data || [])
    .filter((e) => !e.is_auto_recurring)
    .reduce((s, e) => s + Number(e.amount), 0);
  const holdings = (holdingsRes.data || []).map((h) => ({ category: h.category, data: (h.data as HoldingData) || {} }));
  const investIncomeMonthly = investmentIncomeMonthly(holdings);
  const isPengusaha = profileRes.data?.profile_type === "pengusaha";
  const trackedIncomeForCf = isPengusaha
    ? rollingAverageMonthlyIncome(
        (incomesLast3MonthsRes.data || [])
          .filter((i) => !i.is_auto_recurring)
          .map((i) => ({
            id: i.id,
            date: i.income_date,
            category: i.category,
            amount: Number(i.amount),
            description: i.description,
          })),
      )
    : 0;

  const holdingsWithGoal: HoldingRowWithGoal[] = (holdingsRes.data || []).map((h) => ({
    id: h.id,
    category: h.category,
    data: (h.data as HoldingData) || {},
    goalId: h.goal_id,
  }));

  const creditedByGoal = new Map<string, number>();
  for (const c of creditsRes.data || []) {
    creditedByGoal.set(c.goal_id, (creditedByGoal.get(c.goal_id) || 0) + Number(c.amount));
  }

  const linkedByGoal: Record<string, GoalLinkedAsset[]> = {};
  for (const h of holdingsWithGoal) {
    if (!h.goalId) continue;
    const monthlyAmount =
      h.category === "Deposito"
        ? depositoNetInterestMonthly(h.data)
        : h.category === "Obligasi"
          ? obligasiNetCouponMonthly(h.data)
          : 0;
    const asset: GoalLinkedAsset = {
      id: h.id,
      category: h.category,
      label: typeof h.data.label === "string" && h.data.label ? h.data.label : h.category,
      value: holdingValue(h.category, h.data),
      monthlyAmount,
    };
    (linkedByGoal[h.goalId] ||= []).push(asset);
  }
  const cashflow = cashflowNums(
    {
      income: Number(cf?.income || 0),
      fixedExpense: Number(cf?.fixed_expense || 0),
      lifestyleExpense: Number(cf?.lifestyle_expense || 0),
      invest: Number(cf?.invest || 0),
    },
    monthTotal,
    trackedIncomeForCf + investIncomeMonthly,
  );

  const goals = (goalsRes.data || []).map((g) => ({
    id: g.id,
    name: g.name,
    target: Number(g.target),
    current: Number(g.current),
    targetDate: g.target_date,
  }));

  const linked: Record<string, GoalLinkedSummary> = {};
  for (const g of goals) {
    const linkedValue = goalLinkedValue(g.id, holdingsWithGoal);
    const monthlyRate = goalMonthlyContributionRate(g.id, holdingsWithGoal);
    const creditedTotal = creditedByGoal.get(g.id) || 0;
    linked[g.id] = {
      assets: linkedByGoal[g.id] || [],
      linkedValue,
      monthlyRate,
      creditedTotal,
    };
  }

  return (
    <div className="pt-6">
      <div className="px-5 mb-6">
        <h1 className="serif text-[24px] font-medium mb-1">Goals</h1>
        <p className="text-text-dim text-sm leading-relaxed">
          Tujuan finansialmu — kelola kapan saja, progress dihitung otomatis dari free cash flow bulananmu.
        </p>
      </div>
      <GoalsManager goals={goals} fcf={cashflow.fcf} linked={linked} />
    </div>
  );
}
