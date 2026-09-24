import {
  ASSET_SCHEMAS,
  LIAB_SCHEMAS,
  liabValue,
  isIncludedInCashflow,
  depositoNetInterestMonthly,
  obligasiNetCouponMonthly,
  depositoPayoutDayThisMonth,
  depositoPayoutAmountThisMonth,
  obligasiPayoutDayThisMonth,
  obligasiPayoutAmountThisMonth,
  depositoMaturityDate,
} from "./schemas";
import { currentYm, todayIso } from "./format";
import type { CashflowInputs, Expense, Goal, HoldingData, Income } from "./types";

export interface LiabilityHoldingRow extends HoldingRow {
  id: string;
}

export interface HoldingRow {
  category: string;
  data: HoldingData;
}

/** A holding row with its id — used wherever a result needs to key/link back to the specific holding. */
export type HoldingRowWithId = HoldingRow & { id: string };

export function catValue(cat: string, holdings: HoldingRow[]): number {
  const schema = ASSET_SCHEMAS[cat];
  if (!schema) return 0;
  return holdings.filter((h) => h.category === cat).reduce((s, h) => s + schema.value(h.data), 0);
}

export function holdingValue(cat: string, data: HoldingData): number {
  const schema = ASSET_SCHEMAS[cat];
  return schema ? schema.value(data) : 0;
}

export function catBuyValue(cat: string, holdings: HoldingRow[]): number | null {
  const schema = ASSET_SCHEMAS[cat];
  if (!schema || !schema.buyValue) return null;
  return holdings
    .filter((h) => h.category === cat)
    .reduce((s, h) => s + schema.buyValue!(h.data), 0);
}

export function totalAssets(assetCats: string[], holdings: HoldingRow[]): number {
  return assetCats.reduce((s, c) => s + catValue(c, holdings), 0);
}

export function totalLiabilities(liabRows: HoldingRow[]): number {
  return liabRows.reduce((s, l) => s + liabValue(l.data), 0);
}

export function liabCatValue(cat: string, liabRows: HoldingRow[]): number {
  return liabRows.filter((l) => l.category === cat).reduce((s, l) => s + liabValue(l.data), 0);
}

export function liabCatMonthlyPayment(cat: string, liabRows: HoldingRow[]): number {
  const schema = LIAB_SCHEMAS[cat];
  if (!schema) return 0;
  return liabRows.filter((l) => l.category === cat).reduce((s, l) => s + schema.monthlyPayment(l.data), 0);
}

export function netWorth(assetCats: string[], holdings: HoldingRow[], liabRows: HoldingRow[]): number {
  return totalAssets(assetCats, holdings) - totalLiabilities(liabRows);
}

export function monthExpenseTotal(expenses: Expense[], ym: string = currentYm()): number {
  return expenses.filter((e) => e.date.slice(0, 7) === ym).reduce((s, e) => s + Number(e.amount || 0), 0);
}

export interface ExpenseCategorySlice {
  category: string;
  amount: number;
  pct: number;
}

/** Expenses whose date falls within `datePrefix` ("YYYY-MM" for a month, "YYYY" for a year), grouped by category, sorted by amount descending. */
function expenseByCategoryForPrefix(expenses: Expense[], datePrefix: string): ExpenseCategorySlice[] {
  const matched = expenses.filter((e) => e.date.startsWith(datePrefix));
  const total = matched.reduce((s, e) => s + Number(e.amount || 0), 0);
  const byCategory = new Map<string, number>();
  for (const e of matched) {
    byCategory.set(e.category, (byCategory.get(e.category) || 0) + Number(e.amount || 0));
  }
  return Array.from(byCategory.entries())
    .map(([category, amount]) => ({ category, amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

/** Current month's expenses grouped by category, sorted by amount descending. */
export function expenseByCategory(expenses: Expense[], ym: string = currentYm()): ExpenseCategorySlice[] {
  return expenseByCategoryForPrefix(expenses, ym);
}

/** A given year's expenses grouped by category, sorted by amount descending. */
export function expenseByCategoryForYear(expenses: Expense[], year: string): ExpenseCategorySlice[] {
  return expenseByCategoryForPrefix(expenses, year);
}

export interface TopTransaction {
  id: string;
  type: "expense" | "income";
  date: string;
  category: string;
  amount: number;
  description: string;
}

/** Largest transactions (expenses + incomes combined) whose date falls within `datePrefix` ("YYYY-MM" or "YYYY"), biggest amount first. */
export function topTransactions(
  expenses: Expense[],
  incomes: Income[],
  datePrefix: string,
  limit = 3,
): TopTransaction[] {
  const combined: TopTransaction[] = [
    ...expenses
      .filter((e) => e.date.startsWith(datePrefix))
      .map((e) => ({
        id: e.id,
        type: "expense" as const,
        date: e.date,
        category: e.category,
        amount: Number(e.amount || 0),
        description: e.description,
      })),
    ...incomes
      .filter((i) => i.date.startsWith(datePrefix))
      .map((i) => ({
        id: i.id,
        type: "income" as const,
        date: i.date,
        category: i.category,
        amount: Number(i.amount || 0),
        description: i.description,
      })),
  ];
  return combined.sort((a, b) => b.amount - a.amount).slice(0, limit);
}

export interface AssetSnapshotRow {
  date: string; // "YYYY-MM-DD"
  holdingId: string;
  category: string;
  label: string;
  value: number;
}

export interface AssetMover {
  id: string;
  category: string;
  label: string;
  currentValue: number;
  baselineValue: number;
  pctChange: number;
}

/** Start/end dates for a "YYYY-MM" or "YYYY" period, clamped to `today` when the period is still ongoing. */
function periodBounds(datePrefix: string, today: Date): { startIso: string; endIso: string; includesLiveToday: boolean } {
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  if (datePrefix.length === 7) {
    const [y, m] = datePrefix.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);
    const isCurrent = today.getFullYear() === y && today.getMonth() === m - 1;
    return { startIso: toIso(start), endIso: toIso(isCurrent ? today : lastDay), includesLiveToday: isCurrent };
  }
  const y = Number(datePrefix);
  const isCurrent = today.getFullYear() === y;
  return {
    startIso: `${y}-01-01`,
    endIso: toIso(isCurrent ? today : new Date(y, 11, 31)),
    includesLiveToday: isCurrent,
  };
}

/**
 * The holdings whose value moved the most (up or down, by %) between the
 * start of the given period and now — e.g. "which stock/fund grew or
 * shrank the most this month". Needs a snapshot from before the period
 * (the baseline) to compute a % against; holdings without one (tracking
 * hasn't started yet, or too new) are left out rather than guessed at.
 * The current-period end uses the live holding value when the period is
 * still ongoing (this month/year), falling back to the latest in-period
 * snapshot for a period that's already over.
 */
export function topAssetMovers(
  snapshots: AssetSnapshotRow[],
  liveHoldings: HoldingRowWithId[],
  datePrefix: string,
  today: Date = new Date(),
  limit = 3,
): AssetMover[] {
  const { startIso, endIso, includesLiveToday } = periodBounds(datePrefix, today);
  const liveById = new Map(liveHoldings.map((h) => [h.id, h]));

  const byHolding = new Map<string, AssetSnapshotRow[]>();
  for (const s of snapshots) {
    if (!byHolding.has(s.holdingId)) byHolding.set(s.holdingId, []);
    byHolding.get(s.holdingId)!.push(s);
  }

  const movers: AssetMover[] = [];
  for (const [holdingId, rows] of byHolding) {
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    const before = sorted.filter((r) => r.date < startIso);
    const baseline = before.length > 0 ? before[before.length - 1] : null;
    if (!baseline || baseline.value <= 0) continue;

    let currentValue: number;
    let category: string;
    let label: string;
    const live = liveById.get(holdingId);
    if (includesLiveToday && live) {
      currentValue = holdingValue(live.category, live.data);
      category = live.category;
      label = typeof live.data.label === "string" && live.data.label ? live.data.label : live.category;
    } else {
      const withinPeriod = sorted.filter((r) => r.date >= startIso && r.date <= endIso);
      if (withinPeriod.length === 0) continue;
      const latest = withinPeriod[withinPeriod.length - 1];
      currentValue = latest.value;
      category = latest.category;
      label = latest.label || latest.category;
    }

    const pctChange = ((currentValue - baseline.value) / baseline.value) * 100;
    movers.push({ id: holdingId, category, label, currentValue, baselineValue: baseline.value, pctChange });
  }

  return movers.sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange)).slice(0, limit);
}

export interface DailyMovement {
  currentValue: number;
  previousValue: number;
  absChange: number;
  pctChange: number | null;
}

/**
 * Per-holding day-over-day movement: baseline is the latest snapshot
 * strictly before today (yesterday's close, or whenever tracking last
 * recorded a value), current is the LIVE holding value rather than
 * today's snapshot — today's snapshot is written post-response via
 * `after()`, so it doesn't exist yet when a page renders. Holdings with
 * no snapshot before today are left out (nothing to compare against yet).
 */
export function dailyMovementByHolding(
  snapshots: AssetSnapshotRow[],
  liveHoldings: HoldingRowWithId[],
  today: Date = new Date(),
): Map<string, DailyMovement> {
  const cutoffIso = today.toISOString().slice(0, 10);
  const byHolding = new Map<string, AssetSnapshotRow[]>();
  for (const s of snapshots) {
    if (!byHolding.has(s.holdingId)) byHolding.set(s.holdingId, []);
    byHolding.get(s.holdingId)!.push(s);
  }

  const result = new Map<string, DailyMovement>();
  for (const live of liveHoldings) {
    const rows = byHolding.get(live.id);
    if (!rows) continue;
    const before = rows.filter((r) => r.date < cutoffIso).sort((a, b) => a.date.localeCompare(b.date));
    if (before.length === 0) continue;
    const previousValue = before[before.length - 1].value;
    const currentValue = holdingValue(live.category, live.data);
    const absChange = currentValue - previousValue;
    const pctChange = previousValue !== 0 ? (absChange / previousValue) * 100 : null;
    result.set(live.id, { currentValue, previousValue, absChange, pctChange });
  }
  return result;
}

/** Aggregates `dailyMovementByHolding` across every holding in a category — null when none of the category's holdings have a baseline yet. */
export function categoryDailyMovement(
  category: string,
  snapshots: AssetSnapshotRow[],
  liveHoldings: HoldingRowWithId[],
  today: Date = new Date(),
): DailyMovement | null {
  const byHolding = dailyMovementByHolding(snapshots, liveHoldings, today);
  const catHoldingIds = new Set(liveHoldings.filter((h) => h.category === category).map((h) => h.id));

  let currentValue = 0;
  let previousValue = 0;
  let found = false;
  for (const [id, movement] of byHolding) {
    if (!catHoldingIds.has(id)) continue;
    found = true;
    currentValue += movement.currentValue;
    previousValue += movement.previousValue;
  }
  if (!found) return null;

  const absChange = currentValue - previousValue;
  const pctChange = previousValue !== 0 ? (absChange / previousValue) * 100 : null;
  return { currentValue, previousValue, absChange, pctChange };
}

export interface CategoryBudget {
  category: string;
  monthlyLimit: number;
}

export type BudgetTone = "good" | "warning" | "critical";

export interface BudgetProgressItem {
  category: string;
  spent: number;
  limit: number;
  pct: number;
  tone: BudgetTone;
}

/** Spend-vs-limit for each category with a budget set (limit > 0), sorted by pct spent descending. */
export function budgetProgress(
  expenses: Expense[],
  budgets: CategoryBudget[],
  ym: string = currentYm(),
): BudgetProgressItem[] {
  const spentByCategory = new Map<string, number>();
  for (const slice of expenseByCategory(expenses, ym)) {
    spentByCategory.set(slice.category, slice.amount);
  }
  return budgets
    .filter((b) => b.monthlyLimit > 0)
    .map((b) => {
      const spent = spentByCategory.get(b.category) || 0;
      const pct = (spent / b.monthlyLimit) * 100;
      const tone: BudgetTone = pct >= 100 ? "critical" : pct >= 80 ? "warning" : "good";
      return { category: b.category, spent, limit: b.monthlyLimit, pct, tone };
    })
    .sort((a, b) => b.pct - a.pct);
}

export function monthIncomeTotal(incomes: Income[], ym: string = currentYm()): number {
  return incomes.filter((i) => i.date.slice(0, 7) === ym).reduce((s, i) => s + Number(i.amount || 0), 0);
}

/**
 * Average monthly income over the trailing `months` calendar months
 * (current month included), counting only months that actually have
 * recorded income — used instead of a static `cashflow.income` for
 * Pengusaha/freelancer profiles, whose earnings swing too much month to
 * month for a single fixed number to mean anything. Falls back to 0 when
 * nothing has been recorded yet.
 */
export function rollingAverageMonthlyIncome(incomes: Income[], months = 3, today: Date = new Date()): number {
  const anchor = new Date(today.getFullYear(), today.getMonth(), 1);
  let total = 0;
  let countedMonths = 0;
  for (let i = 0; i < months; i++) {
    const ym = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1).toISOString().slice(0, 7);
    const monthTotal = monthIncomeTotal(incomes, ym);
    if (monthTotal > 0) {
      total += monthTotal;
      countedMonths++;
    }
  }
  return countedMonths > 0 ? total / countedMonths : 0;
}

/** Categories treated as liquid — accessible within a short time if needed. */
export const LIQUID_ASSET_CATS = ["Cash", "Deposito", "Reksadana", "Obligasi"] as const;

/** Sum of Cash, Deposito, Reksadana & Obligasi — the portion of net worth that can be tapped quickly. */
export function liquidAssets(holdings: HoldingRow[]): number {
  return LIQUID_ASSET_CATS.reduce((s, cat) => s + catValue(cat, holdings), 0);
}

export interface DailyRecap {
  date: string;
  incomeTotal: number;
  expenseTotal: number;
  net: number;
  biggestExpense: { category: string; amount: number } | null;
}

export function computeDailyRecap(
  expenses: Expense[],
  incomes: Income[],
  date: string = todayIso(),
): DailyRecap {
  const todaysExpenses = expenses.filter((e) => e.date === date);
  const todaysIncomes = incomes.filter((i) => i.date === date);
  const expenseTotal = todaysExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const incomeTotal = todaysIncomes.reduce((s, i) => s + Number(i.amount || 0), 0);

  const byCategory = new Map<string, number>();
  for (const e of todaysExpenses) {
    byCategory.set(e.category, (byCategory.get(e.category) || 0) + Number(e.amount || 0));
  }
  let biggestExpense: DailyRecap["biggestExpense"] = null;
  for (const [category, amount] of byCategory) {
    if (!biggestExpense || amount > biggestExpense.amount) biggestExpense = { category, amount };
  }

  return { date, incomeTotal, expenseTotal, net: incomeTotal - expenseTotal, biggestExpense };
}

export interface CashflowNums extends CashflowInputs {
  lifestyleTotal: number;
  /** Income rutin + income tambahan yang dicatat manual bulan ini (mis. transferan, side income). */
  incomeTotal: number;
  fcf: number;
  savingRate: number;
}

export function cashflowNums(cf: CashflowInputs, monthExpenses: number, monthIncome = 0): CashflowNums {
  const lifestyleTotal = cf.lifestyleExpense + monthExpenses;
  const incomeTotal = cf.income + monthIncome;
  const fcf = incomeTotal - cf.fixedExpense - lifestyleTotal - cf.invest;
  const savingRate = incomeTotal > 0 ? cf.invest / incomeTotal : 0;
  return { ...cf, lifestyleTotal, incomeTotal, fcf, savingRate };
}

export function monthsBetween(a: Date, b: Date): number {
  return Math.max(1, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()));
}

export interface GoalMonthlySavingsPlan {
  /** Months remaining until the goal's target date (min 1). */
  months: number;
  /** target - current, floored at 0. */
  gap: number;
  /** monthlyRate * months — interest/coupon income projected to arrive before the target date. */
  projectedInterest: number;
  /** gap minus projectedInterest, floored at 0 — what manual savings still has to cover. */
  adjustedGap: number;
  /** adjustedGap / months — what to save per month to hit the target date. */
  monthlyNeed: number;
}

/**
 * How much to save per month, manually, to hit a goal's target by its
 * target date — netting out interest/coupon income its linked assets are
 * projected to earn over the remaining months. Without `monthlyRate` this
 * reduces to the plain gap/months need. Returns the full breakdown (not
 * just the final number) so a UI showing the math and the top-line "need"
 * both read from the same computation instead of risking drift.
 */
export function goalMonthlySavingsPlan(
  g: Pick<Goal, "target" | "current" | "targetDate">,
  monthlyRate = 0,
): GoalMonthlySavingsPlan {
  const months = Math.max(1, monthsBetween(new Date(), new Date(g.targetDate)));
  const gap = Math.max(0, g.target - g.current);
  const projectedInterest = monthlyRate > 0 ? monthlyRate * months : 0;
  const adjustedGap = Math.max(0, gap - projectedInterest);
  return { months, gap, projectedInterest, adjustedGap, monthlyNeed: adjustedGap / months };
}

export function goalMonthlyNeed(g: Pick<Goal, "target" | "current" | "targetDate">, monthlyRate = 0): number {
  return goalMonthlySavingsPlan(g, monthlyRate).monthlyNeed;
}

/** A Cash/Deposito/Obligasi/Reksadana holding, optionally linked to a goal via `goalId`. */
export type HoldingRowWithGoal = HoldingRowWithId & { goalId: string | null };

/** Live value of every holding linked to `goalId` — the "pokok" (principal) contribution to that goal's progress. */
export function goalLinkedValue(goalId: string, holdings: HoldingRowWithGoal[]): number {
  return holdings
    .filter((h) => h.goalId === goalId)
    .reduce((s, h) => s + holdingValue(h.category, h.data), 0);
}

/** Net monthly interest/coupon income from Deposito/Obligasi holdings linked to `goalId` — the "fix income" that gets credited to the goal over time. */
export function goalMonthlyContributionRate(goalId: string, holdings: HoldingRowWithGoal[]): number {
  let total = 0;
  for (const h of holdings) {
    if (h.goalId !== goalId) continue;
    if (h.category === "Deposito") total += depositoNetInterestMonthly(h.data);
    else if (h.category === "Obligasi") total += obligasiNetCouponMonthly(h.data);
  }
  return total;
}

export interface UpcomingGoalMaturity {
  id: string;
  category: string;
  label: string;
  goalId: string;
  maturityDate: string;
  daysUntil: number;
}

/** Goal-linked Deposito/Obligasi holdings maturing within the next `withinDays` (default 7) — nearest first. Used for the "jatuh tempo, akan tercopot dari goal" reminder. */
export function upcomingGoalMaturities(
  holdings: HoldingRowWithGoal[],
  today: Date = new Date(),
  withinDays = 7,
): UpcomingGoalMaturity[] {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const result: UpcomingGoalMaturity[] = [];
  for (const h of holdings) {
    if (!h.goalId) continue;
    let maturityStr: string | null = null;
    if (h.category === "Deposito") maturityStr = depositoMaturityDate(h.data);
    else if (h.category === "Obligasi") maturityStr = typeof h.data.maturityDate === "string" ? h.data.maturityDate : null;
    else continue;
    if (!maturityStr) continue;
    const maturity = new Date(maturityStr);
    if (isNaN(maturity.getTime())) continue;
    const daysUntil = Math.round((maturity.getTime() - base.getTime()) / 86400000);
    if (daysUntil < 0 || daysUntil > withinDays) continue;
    result.push({
      id: h.id,
      category: h.category,
      label: typeof h.data.label === "string" && h.data.label ? h.data.label : h.category,
      goalId: h.goalId,
      maturityDate: maturityStr,
      daysUntil,
    });
  }
  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function totalMonthlyDebtPayment(liabRows: HoldingRow[]): number {
  return liabRows.reduce((s, l) => {
    const schema = LIAB_SCHEMAS[l.category];
    return s + (schema ? schema.monthlyPayment(l.data) : 0);
  }, 0);
}

export type DbrTone = "good" | "watch" | "danger" | "neutral";

export interface DbrResult {
  pct: number;
  label: string;
  tone: DbrTone;
  monthlyDebt: number;
  income: number;
}

export interface UpcomingInstallment {
  id: string;
  category: string;
  label: string;
  billingDay: number;
  daysUntil: number;
  dueDate: string;
  amount: number;
  monthlyPayment: number;
}

/** Days from `today` to the next occurrence of `billingDay` (0 = today, wraps to next month). */
export function daysUntilBilling(billingDay: number, today: Date = new Date()): { daysUntil: number; dueDate: string } {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let candidate = new Date(base.getFullYear(), base.getMonth(), billingDay);
  if (candidate < base) {
    candidate = new Date(base.getFullYear(), base.getMonth() + 1, billingDay);
  }
  const daysUntil = Math.round((candidate.getTime() - base.getTime()) / 86400000);
  return { daysUntil, dueDate: candidate.toISOString().slice(0, 10) };
}

/** Net-of-tax monthly interest (Deposito) + coupon (Obligasi) income, for holdings flagged to include in cashflow. */
export function investmentIncomeMonthly(holdings: HoldingRow[]): number {
  let total = 0;
  for (const h of holdings) {
    if (!isIncludedInCashflow(h.data)) continue;
    if (h.category === "Deposito") total += depositoNetInterestMonthly(h.data);
    else if (h.category === "Obligasi") total += obligasiNetCouponMonthly(h.data);
  }
  return total;
}

export interface UpcomingInvestmentIncome {
  id: string;
  category: string;
  label: string;
  day: number;
  daysUntil: number;
  amount: number;
}

/** Deposito interest / Obligasi coupon payouts landing within the current calendar month (today or later), nearest first. */
export function upcomingInvestmentIncome(
  holdings: LiabilityHoldingRow[],
  today: Date = new Date(),
): UpcomingInvestmentIncome[] {
  const result: UpcomingInvestmentIncome[] = [];
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (const h of holdings) {
    if (!isIncludedInCashflow(h.data)) continue;
    let day: number | null = null;
    let amount = 0;
    if (h.category === "Deposito") {
      day = depositoPayoutDayThisMonth(h.data, today);
      amount = depositoPayoutAmountThisMonth(h.data);
    } else if (h.category === "Obligasi") {
      day = obligasiPayoutDayThisMonth(h.data, today);
      amount = obligasiPayoutAmountThisMonth(h.data);
    } else {
      continue;
    }
    if (day == null || amount <= 0) continue;
    const candidate = new Date(today.getFullYear(), today.getMonth(), day);
    if (candidate < base) continue;
    const daysUntil = Math.round((candidate.getTime() - base.getTime()) / 86400000);
    result.push({
      id: h.id,
      category: h.category,
      label: typeof h.data.label === "string" && h.data.label ? h.data.label : h.category,
      day,
      daysUntil,
      amount,
    });
  }
  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Liabilities with a billingDay set, sorted by nearest due date first. */
export function upcomingInstallments(liabRows: LiabilityHoldingRow[], today: Date = new Date()): UpcomingInstallment[] {
  const result: UpcomingInstallment[] = [];
  for (const l of liabRows) {
    const billingDay = Number(l.data.billingDay) || 0;
    if (!billingDay || billingDay < 1 || billingDay > 31) continue;
    const schema = LIAB_SCHEMAS[l.category];
    const { daysUntil, dueDate } = daysUntilBilling(billingDay, today);
    result.push({
      id: l.id,
      category: l.category,
      label: typeof l.data.label === "string" && l.data.label ? l.data.label : l.category,
      billingDay,
      daysUntil,
      dueDate,
      amount: liabValue(l.data),
      monthlyPayment: schema ? schema.monthlyPayment(l.data) : 0,
    });
  }
  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Uses `incomeTotal` (static income + tracked transactions) rather than the
 * static `income` alone — Pengusaha profiles never set a static income, so
 * anchoring on `income` would always read "belum bisa dihitung" for them
 * even once they're recording real earnings.
 */
export function computeDBR(cf: CashflowNums, liabRows: HoldingRow[]): DbrResult {
  const monthlyDebt = totalMonthlyDebtPayment(liabRows);
  const income = cf.incomeTotal;
  const pct = income > 0 ? (monthlyDebt / income) * 100 : 0;
  let label: string;
  let tone: DbrTone;
  if (income <= 0) {
    label = "Belum bisa dihitung — isi Income di Cash Flow";
    tone = "neutral";
  } else if (pct <= 35) {
    label = "Sehat";
    tone = "good";
  } else if (pct <= 40) {
    label = "Perlu diperhatikan";
    tone = "watch";
  } else {
    label = "Berisiko";
    tone = "danger";
  }
  return { pct: Math.round(pct * 10) / 10, label, tone, monthlyDebt, income };
}
