import type { Metadata } from "next";
import { getDashboardData, recordNetWorthSnapshot } from "@/lib/data/dashboard";
import {
  cashflowNums,
  computeDailyRecap,
  computeDBR,
  goalMonthlyNeed,
  liquidAssets,
  monthExpenseTotal,
  monthIncomeTotal,
  netWorth,
  totalAssets,
  totalLiabilities,
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
import type { TxRow } from "@/components/app/transaction-list";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const data = await getDashboardData();

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

  const cf = cashflowNums(
    {
      income: Number(data.cashflow.income),
      fixedExpense: Number(data.cashflow.fixed_expense),
      lifestyleExpense: Number(data.cashflow.lifestyle_expense),
      invest: Number(data.cashflow.invest),
    },
    monthExpTotal,
  );
  const dbr = computeDBR(cf, data.liabilities);
  const totalAssetsVal = totalAssets(data.profile.asset_categories, data.holdings);
  const totalLiabVal = totalLiabilities(data.liabilities);
  const netWorthVal = netWorth(data.profile.asset_categories, data.holdings, data.liabilities);
  const liquidAssetsVal = liquidAssets(data.holdings);
  const dailyRecap = computeDailyRecap(monthExpensesMapped, monthIncomesMapped);

  await recordNetWorthSnapshot(data.user.id, netWorthVal, totalAssetsVal, totalLiabVal);

  const totalNeed = data.goals.reduce((s, g) => s + goalMonthlyNeed(g), 0);

  const recentExpensesMapped: TxRow[] = data.recentExpenses.map((e) => ({
    id: e.id,
    type: "expense",
    date: e.expense_date,
    category: e.category,
    amount: Number(e.amount),
    description: e.description,
  }));
  const recentIncomesMapped: TxRow[] = data.recentIncomes.map((i) => ({
    id: i.id,
    type: "income",
    date: i.income_date,
    category: i.category,
    amount: Number(i.amount),
    description: i.description,
  }));
  const recentTransactions = [...recentExpensesMapped, ...recentIncomesMapped]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const aiAvailable = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div className="pt-1">
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
      <LiquidAssetsCard total={liquidAssetsVal} todayNet={dailyRecap.net} />
      <InsightCard hasGoals={data.goals.length > 0} totalNeed={totalNeed} fcf={cf.fcf} />
      <div className="grid grid-cols-2 gap-2.5 mx-5 mb-4">
        <div className="bg-bg-raised border border-hairline rounded-2xl p-3.5 shadow-[var(--shadow-card)]">
          <div className="text-xs text-text-dim mb-1">💰 Free Cash Flow /bln</div>
          <div className="serif text-[19px]">{fmtRp(cf.fcf)}</div>
        </div>
        <div className="bg-bg-raised border border-hairline rounded-2xl p-3.5 shadow-[var(--shadow-card)]">
          <div className="text-xs text-text-dim mb-1">📊 Saving Rate</div>
          <div className="serif text-[19px]">{Math.round(cf.savingRate * 100)}%</div>
        </div>
      </div>
      <DbrCard dbr={dbr} hasFixedExpense={cf.fixedExpense > 0} />
      <AiInsightCard available={aiAvailable} />
      <AssetSection assetCats={data.profile.asset_categories} holdings={data.holdings} />
      <LiabilitySection liabCats={data.profile.liability_categories} liabilities={data.liabilities} />
      <GoalsPreview goals={data.goals} fcf={cf.fcf} />
      <TransactionsPreview
        transactions={recentTransactions}
        monthExpenseTotal={monthExpTotal}
        monthIncomeTotal={monthIncTotal}
      />
    </div>
  );
}
