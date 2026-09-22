import { ASSET_SCHEMAS, LIAB_SCHEMAS, liabValue } from "./schemas";
import { currentYm, todayIso } from "./format";
import type { CashflowInputs, Expense, Goal, HoldingData, Income } from "./types";

export interface LiabilityHoldingRow extends HoldingRow {
  id: string;
}

export interface HoldingRow {
  category: string;
  data: HoldingData;
}

export function catValue(cat: string, holdings: HoldingRow[]): number {
  const schema = ASSET_SCHEMAS[cat];
  if (!schema) return 0;
  return holdings.filter((h) => h.category === cat).reduce((s, h) => s + schema.value(h.data), 0);
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

/** Current month's expenses grouped by category, sorted by amount descending. */
export function expenseByCategory(expenses: Expense[], ym: string = currentYm()): ExpenseCategorySlice[] {
  const monthExpenses = expenses.filter((e) => e.date.slice(0, 7) === ym);
  const total = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const byCategory = new Map<string, number>();
  for (const e of monthExpenses) {
    byCategory.set(e.category, (byCategory.get(e.category) || 0) + Number(e.amount || 0));
  }
  return Array.from(byCategory.entries())
    .map(([category, amount]) => ({ category, amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
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

export function goalMonthlyNeed(g: Pick<Goal, "target" | "current" | "targetDate">): number {
  const months = Math.max(1, monthsBetween(new Date(), new Date(g.targetDate)));
  return Math.max(0, (g.target - g.current) / months);
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

export function computeDBR(cf: CashflowNums, liabRows: HoldingRow[]): DbrResult {
  const monthlyDebt = totalMonthlyDebtPayment(liabRows);
  const pct = cf.income > 0 ? (monthlyDebt / cf.income) * 100 : 0;
  let label: string;
  let tone: DbrTone;
  if (cf.income <= 0) {
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
  return { pct: Math.round(pct * 10) / 10, label, tone, monthlyDebt, income: cf.income };
}
