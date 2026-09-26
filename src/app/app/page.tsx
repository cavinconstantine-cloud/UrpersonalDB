import type { Metadata } from "next";
import { after } from "next/server";
import {
  getDashboardData,
  recordAssetHoldingSnapshots,
  recordFcfSnapshot,
  recordNetWorthSnapshot,
} from "@/lib/data/dashboard";
import {
  budgetProgress,
  cashflowNums,
  computeDailyRecap,
  expenseByCategory,
  investmentIncomeMonthly,
  liquidAssets,
  monthExpenseTotal,
  monthIncomeTotal,
  netWorth,
  rollingAverageMonthlyIncome,
  totalAssets,
  totalLiabilities,
  upcomingGoalMaturities,
  upcomingInstallments,
  upcomingInvestmentIncome,
} from "@/lib/finance/calculations";
import { daysAgoIsoInTz, monthsAgoFirstOfMonthIsoInTz, todayIsoInTz } from "@/lib/finance/format";
import { getVisitorTimezone } from "@/lib/i18n/timezone";
import { GreetingHeader } from "@/components/dashboard/greeting-header";
import { NetWorthHeroCard } from "@/components/dashboard/net-worth-hero-card";
import { ThisMonthCard } from "@/components/dashboard/this-month-card";
import { StatTilesRow } from "@/components/dashboard/stat-tiles-row";
import { PaydayReminderCard } from "@/components/dashboard/payday-reminder-card";
import { MissingAccountReminder } from "@/components/dashboard/missing-account-reminder";
import { DailyRecapCard } from "@/components/dashboard/daily-recap-card";
import { SpendingByCategoryCard } from "@/components/dashboard/spending-by-category-card";
import { AssetSection } from "@/components/dashboard/asset-section";
import { LiabilitySection } from "@/components/dashboard/liability-section";
import { GoalsPreview } from "@/components/dashboard/goals-preview";
import { GoalProgressInsight } from "@/components/dashboard/goal-progress-insight";
import { TransactionsPreview } from "@/components/dashboard/transactions-preview";
import { UpcomingBillingCard } from "@/components/dashboard/upcoming-billing-card";
import { UpcomingInvestmentIncomeCard } from "@/components/dashboard/upcoming-investment-income-card";
import { GoalMaturityCard } from "@/components/dashboard/goal-maturity-card";
import { RecurringCashflowPreview } from "@/components/dashboard/recurring-cashflow-preview";
import type { TxRow } from "@/components/app/transaction-list";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const tz = await getVisitorTimezone();
  const data = await getDashboardData(tz);
  const today = todayIsoInTz(tz);

  const monthExpensesMapped = data.monthExpenses.map((e) => ({
    id: e.id,
    date: e.expense_date,
    category: e.category,
    amount: Number(e.amount),
    description: e.description,
  }));
  const monthIncomesMapped = data.monthIncomes.map((i) => ({
    id: i.id,
    date: i.income_date,
    category: i.category,
    amount: Number(i.amount),
    description: i.description,
  }));
  // FCF is already fed by the flat "Pemasukan/Pengeluaran Tetap" planning
  // totals below (cf.income/cf.fixedExpense) — payday automation's own
  // auto-generated transactions are excluded here so they don't get counted
  // twice. Every other use of monthExpensesMapped/monthIncomesMapped (daily
  // recap, category breakdown, budget progress) keeps them, since they're
  // real money movements.
  //
  // `null` here (instead of a "YYYY-MM" ym) because data.monthExpenses/
  // monthIncomes are already scoped to the user's current *period* by the
  // query in getDashboardData() — for Karyawan that's payday-to-payday, not
  // the calendar month, so it can span two different "YYYY-MM" values and a
  // prefix-match filter here would incorrectly chop part of it back off.
  const monthExpTotal = monthExpenseTotal(
    data.monthExpenses.filter((e) => !e.is_auto_recurring).map((e) => ({
      id: e.id,
      date: e.expense_date,
      category: e.category,
      amount: Number(e.amount),
      description: e.description,
    })),
    null,
  );
  const monthIncTotal = monthIncomeTotal(
    data.monthIncomes.filter((i) => !i.is_auto_recurring).map((i) => ({
      id: i.id,
      date: i.income_date,
      category: i.category,
      amount: Number(i.amount),
      description: i.description,
    })),
    null,
  );
  const investIncomeMonthly = investmentIncomeMonthly(data.holdings);
  const isPengusaha = data.profile.profile_type === "pengusaha";
  const incomesLast3MonthsMapped = data.incomesLast3Months
    .filter((i) => !i.is_auto_recurring)
    .map((i) => ({
      id: i.id,
      date: i.income_date,
      category: i.category,
      amount: Number(i.amount),
      description: i.description,
    }));
  const trackedIncomeForCf = isPengusaha
    ? rollingAverageMonthlyIncome(incomesLast3MonthsMapped)
    : monthIncTotal;

  const cf = cashflowNums(
    {
      income: Number(data.cashflow.income),
      fixedExpense: Number(data.cashflow.fixed_expense),
      lifestyleExpense: Number(data.cashflow.lifestyle_expense),
      invest: Number(data.cashflow.invest),
    },
    monthExpTotal,
    trackedIncomeForCf + investIncomeMonthly,
  );
  const totalAssetsVal = totalAssets(data.profile.asset_categories, data.holdings);
  const totalLiabVal = totalLiabilities(data.liabilities);
  const netWorthVal = netWorth(data.profile.asset_categories, data.holdings, data.liabilities);
  const liquidAssetsVal = liquidAssets(data.holdings);
  const illiquidAssetsVal = Math.max(0, totalAssetsVal - liquidAssetsVal);
  const dailyRecap = computeDailyRecap(monthExpensesMapped, monthIncomesMapped, today);
  const installments = upcomingInstallments(data.liabilities);
  const investIncomeItems = upcomingInvestmentIncome(data.holdings);
  const expenseSlices = expenseByCategory(monthExpensesMapped, null);
  const budgetItems = budgetProgress(monthExpensesMapped, data.budgets, null);
  const totalMonthlyBudget = data.budgets.reduce((s, b) => s + (b.monthlyLimit > 0 ? b.monthlyLimit : 0), 0);
  const goalMaturities = upcomingGoalMaturities(data.holdings);
  const goalNameById = new Map(data.goals.map((g) => [g.id, g.name] as const));

  // Net worth ~30 days ago — the closest snapshot at or before that date —
  // used for the hero card's "vs last month" badge. `null` (badge hidden)
  // when the account isn't old enough to have one yet, rather than faking a
  // percentage off a missing baseline.
  const oneMonthAgoIso = daysAgoIsoInTz(30, tz);
  const baselineSnapshot = [...data.snapshots].reverse().find((s) => s.snapshot_date <= oneMonthAgoIso);
  const baselineNetWorth = baselineSnapshot ? Number(baselineSnapshot.net_worth) : null;
  const netWorthDeltaPct =
    baselineNetWorth !== null && baselineNetWorth !== 0
      ? ((netWorthVal - baselineNetWorth) / Math.abs(baselineNetWorth)) * 100
      : null;

  // Deferred to run after the response is sent — this bookkeeping (net
  // worth / FCF / per-holding history) has no bearing on what's rendered,
  // so it shouldn't make the user wait for the dashboard to appear.
  after(() =>
    Promise.all([
      recordNetWorthSnapshot(data.user.id, netWorthVal, totalAssetsVal, totalLiabVal, tz),
      recordFcfSnapshot(
        data.user.id,
        {
          incomeTotal: cf.incomeTotal,
          fixedExpense: cf.fixedExpense,
          lifestyleTotal: cf.lifestyleTotal,
          invest: cf.invest,
          fcf: cf.fcf,
          savingRate: cf.savingRate,
        },
        `${data.periodStart.slice(0, 7)}-01`,
      ),
      recordAssetHoldingSnapshots(data.user.id, data.holdings, tz),
    ]),
  );

  const accountLabelById = new Map(
    data.holdings
      .filter((h) => h.category === "Cash")
      .map((h) => [h.id, String(h.data.label || "Account")] as const),
  );

  const recentExpensesMapped: TxRow[] = data.recentExpenses.map((e) => ({
    id: e.id,
    type: "expense",
    date: e.expense_date,
    category: e.category,
    amount: Number(e.amount),
    description: e.description,
    accountHoldingId: e.account_holding_id,
    accountLabel: e.account_holding_id ? (accountLabelById.get(e.account_holding_id) ?? null) : null,
  }));
  const recentIncomesMapped: TxRow[] = data.recentIncomes.map((i) => ({
    id: i.id,
    type: "income",
    date: i.income_date,
    category: i.category,
    amount: Number(i.amount),
    description: i.description,
    accountHoldingId: i.account_holding_id,
    accountLabel: i.account_holding_id ? (accountLabelById.get(i.account_holding_id) ?? null) : null,
  }));
  const recentTransactions = [...recentExpensesMapped, ...recentIncomesMapped]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const missingAccountCount = [...data.recurringIncomes, ...data.recurringExpenses].filter(
    (r) => !r.accountHoldingId,
  ).length;

  // "You have leftover funds" reminder — karyawan: shown on their payday
  // (this month's running FCF, since a fixed payday falls close to when that
  // cycle's income/expenses have mostly landed). Pengusaha: shown on the
  // 1st (a fresh month has ~nothing tracked yet, so it reports last
  // month's already-recorded snapshot instead of a near-zero live number).
  // "today" here is the visitor's own local calendar day (see getVisitorTimezone above).
  const todayDay = Number(today.slice(8, 10));
  const isPayday = data.profile.profile_type === "karyawan" && data.profile.payday_day === todayDay;
  const isMonthStart = data.profile.profile_type === "pengusaha" && todayDay === 1;
  let paydayReminder: { label: string; fcf: number; savingRate: number } | null = null;
  if (isPayday) {
    paydayReminder = { label: "Payday today!", fcf: cf.fcf, savingRate: cf.savingRate };
  } else if (isMonthStart) {
    const prevMonthIso = monthsAgoFirstOfMonthIsoInTz(1, tz);
    const prevSnapshot = data.fcfSnapshots.find((s) => s.snapshot_month === prevMonthIso);
    if (prevSnapshot) {
      paydayReminder = {
        label: "A new month has started!",
        fcf: Number(prevSnapshot.fcf),
        savingRate: Number(prevSnapshot.saving_rate),
      };
    }
  }

  return (
    <div className="pt-1">
      <GreetingHeader name={data.profile.name} streak={data.streak.current} />
      {paydayReminder && (
        <PaydayReminderCard
          label={paydayReminder.label}
          fcf={paydayReminder.fcf}
          savingRate={paydayReminder.savingRate}
          name={data.profile.name}
        />
      )}
      <MissingAccountReminder count={missingAccountCount} />
      <NetWorthHeroCard
        netWorthVal={netWorthVal}
        liquidAssetsVal={liquidAssetsVal}
        illiquidAssetsVal={illiquidAssetsVal}
        totalLiabilitiesVal={totalLiabVal}
        deltaPct={netWorthDeltaPct}
      />
      <ThisMonthCard
        monthExpTotal={monthExpTotal}
        prevMonthExpenseTotal={data.prevMonthExpenseTotal}
        totalMonthlyBudget={totalMonthlyBudget}
      />
      <StatTilesRow incomeTotal={monthIncTotal} fcf={cf.fcf} savingRate={cf.savingRate} />
      <SpendingByCategoryCard budgetItems={budgetItems} expenseSlices={expenseSlices} />
      <DailyRecapCard recap={dailyRecap} />
      <AssetSection
        assetCats={data.profile.asset_categories}
        holdings={data.holdings}
        snapshots={data.assetHoldingSnapshots}
      />
      <LiabilitySection liabCats={data.profile.liability_categories} liabilities={data.liabilities} />
      <GoalsPreview goals={data.goals} fcf={cf.fcf} />
      <GoalProgressInsight goals={data.goals} fcf={cf.fcf} monthlyIncome={monthIncTotal} userName={data.profile.name} />
      <RecurringCashflowPreview incomeItems={data.recurringIncomes} expenseItems={data.recurringExpenses} />
      <UpcomingBillingCard installments={installments} />
      <UpcomingInvestmentIncomeCard items={investIncomeItems} />
      <GoalMaturityCard items={goalMaturities} goalNameById={goalNameById} />
      <TransactionsPreview
        transactions={recentTransactions}
        monthExpenseTotal={monthExpTotal}
        monthIncomeTotal={monthIncTotal}
      />
    </div>
  );
}
