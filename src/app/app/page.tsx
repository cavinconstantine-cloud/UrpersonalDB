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
  computeDBR,
  expenseByCategory,
  goalMonthlyNeed,
  investmentIncomeMonthly,
  liquidAssets,
  monthExpenseTotal,
  monthIncomeTotal,
  netWorth,
  totalAssets,
  totalLiabilities,
  upcomingInstallments,
  upcomingInvestmentIncome,
} from "@/lib/finance/calculations";
import { fmtRp } from "@/lib/finance/format";
import { HeroCard } from "@/components/dashboard/hero-card";
import { NetWorthTrend } from "@/components/dashboard/net-worth-trend";
import { InsightCard } from "@/components/dashboard/insight-card";
import { DbrCard } from "@/components/dashboard/dbr-card";
import { LiquidAssetsCard } from "@/components/dashboard/liquid-assets-card";
import { DailyRecapCard } from "@/components/dashboard/daily-recap-card";
import { AiInsightCard } from "@/components/dashboard/ai-insight-card";
import { AssetSection } from "@/components/dashboard/asset-section";
import { LiabilitySection } from "@/components/dashboard/liability-section";
import { GoalsPreview } from "@/components/dashboard/goals-preview";
import { TransactionsPreview } from "@/components/dashboard/transactions-preview";
import { UpcomingBillingCard } from "@/components/dashboard/upcoming-billing-card";
import { UpcomingInvestmentIncomeCard } from "@/components/dashboard/upcoming-investment-income-card";
import { FcfTrend } from "@/components/dashboard/fcf-trend";
import { MarketNewsCard } from "@/components/dashboard/market-news-card";
import { ExpenseSplitCard } from "@/components/dashboard/expense-split-card";
import { BudgetProgressCard } from "@/components/dashboard/budget-progress-card";
import { RecurringCashflowPreview } from "@/components/dashboard/recurring-cashflow-preview";
import type { TxRow } from "@/components/app/transaction-list";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const data = await getDashboardData();
  const lang = await getLang();
  const dict = getDictionary(lang);

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
  const monthExpTotal = monthExpenseTotal(monthExpensesMapped);
  const monthIncTotal = monthIncomeTotal(monthIncomesMapped);
  const investIncomeMonthly = investmentIncomeMonthly(data.holdings);

  const cf = cashflowNums(
    {
      income: Number(data.cashflow.income),
      fixedExpense: Number(data.cashflow.fixed_expense),
      lifestyleExpense: Number(data.cashflow.lifestyle_expense),
      invest: Number(data.cashflow.invest),
    },
    monthExpTotal,
    monthIncTotal + investIncomeMonthly,
  );
  const dbr = computeDBR(cf, data.liabilities);
  const totalAssetsVal = totalAssets(data.profile.asset_categories, data.holdings);
  const totalLiabVal = totalLiabilities(data.liabilities);
  const netWorthVal = netWorth(data.profile.asset_categories, data.holdings, data.liabilities);
  const liquidAssetsVal = liquidAssets(data.holdings);
  const dailyRecap = computeDailyRecap(monthExpensesMapped, monthIncomesMapped);
  const installments = upcomingInstallments(data.liabilities);
  const investIncomeItems = upcomingInvestmentIncome(data.holdings);
  const expenseSlices = expenseByCategory(monthExpensesMapped);
  const budgetItems = budgetProgress(monthExpensesMapped, data.budgets);

  // Deferred to run after the response is sent — this bookkeeping (net
  // worth / FCF / per-holding history) has no bearing on what's rendered,
  // so it shouldn't make the user wait for the dashboard to appear.
  after(() =>
    Promise.all([
      recordNetWorthSnapshot(data.user.id, netWorthVal, totalAssetsVal, totalLiabVal),
      recordFcfSnapshot(data.user.id, {
        incomeTotal: cf.incomeTotal,
        fixedExpense: cf.fixedExpense,
        lifestyleTotal: cf.lifestyleTotal,
        invest: cf.invest,
        fcf: cf.fcf,
        savingRate: cf.savingRate,
      }),
      recordAssetHoldingSnapshots(data.user.id, data.holdings),
    ]),
  );

  const totalNeed = data.goals.reduce((s, g) => s + goalMonthlyNeed(g), 0);

  const accountLabelById = new Map(
    data.holdings
      .filter((h) => h.category === "Cash")
      .map((h) => [h.id, String(h.data.label || "Rekening")] as const),
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

  const aiAvailable = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div className="pt-1">
      <LiquidAssetsCard total={liquidAssetsVal} todayNet={dailyRecap.net} />
      <HeroCard
        name={data.profile.name}
        netWorthVal={netWorthVal}
        totalAssetsVal={totalAssetsVal}
        totalLiabilitiesVal={totalLiabVal}
      />
      <NetWorthTrend
        points={data.snapshots.map((s) => ({ date: s.snapshot_date, netWorth: Number(s.net_worth) }))}
        current={netWorthVal}
      />
      <DailyRecapCard recap={dailyRecap} />
      <InsightCard hasGoals={data.goals.length > 0} totalNeed={totalNeed} fcf={cf.fcf} />

      <RecurringCashflowPreview incomeItems={data.recurringIncomes} expenseItems={data.recurringExpenses} />

      <div className="grid grid-cols-2 gap-2.5 mx-5 mb-4">
        <div className="bg-bg-raised border border-hairline rounded-2xl p-3.5 shadow-[var(--shadow-card)]">
          <div className="text-xs text-text-dim mb-1">{dict.dashboard.fcfMonthly}</div>
          <div className="serif text-[19px]">{fmtRp(cf.fcf)}</div>
        </div>
        <div className="bg-bg-raised border border-hairline rounded-2xl p-3.5 shadow-[var(--shadow-card)]">
          <div className="text-xs text-text-dim mb-1">{dict.dashboard.savingRate}</div>
          <div className="serif text-[19px]">{Math.round(cf.savingRate * 100)}%</div>
        </div>
      </div>
      <FcfTrend
        points={data.fcfSnapshots.map((s) => ({ month: s.snapshot_month, fcf: Number(s.fcf) }))}
        current={cf.fcf}
      />
      <DbrCard dbr={dbr} hasFixedExpense={cf.fixedExpense > 0} />
      <UpcomingBillingCard installments={installments} />
      <UpcomingInvestmentIncomeCard items={investIncomeItems} />
      <AiInsightCard available={aiAvailable} />
      <MarketNewsCard news={data.marketNews} />
      <AssetSection
        assetCats={data.profile.asset_categories}
        holdings={data.holdings}
        snapshots={data.assetHoldingSnapshots}
      />
      <LiabilitySection liabCats={data.profile.liability_categories} liabilities={data.liabilities} />
      <GoalsPreview goals={data.goals} fcf={cf.fcf} />
      <ExpenseSplitCard slices={expenseSlices} total={monthExpTotal} />
      <BudgetProgressCard items={budgetItems} />
      <TransactionsPreview
        transactions={recentTransactions}
        monthExpenseTotal={monthExpTotal}
        monthIncomeTotal={monthIncTotal}
      />
    </div>
  );
}
