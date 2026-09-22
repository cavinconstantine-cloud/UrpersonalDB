import { ASSET_SCHEMAS, LIAB_SCHEMAS, liabValue } from "./schemas";
import { currentYm } from "./format";
import type { CashflowInputs, Expense, Goal, HoldingData } from "./types";

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

export function netWorth(assetCats: string[], holdings: HoldingRow[], liabRows: HoldingRow[]): number {
  return totalAssets(assetCats, holdings) - totalLiabilities(liabRows);
}

export function monthExpenseTotal(expenses: Expense[], ym: string = currentYm()): number {
  return expenses.filter((e) => e.date.slice(0, 7) === ym).reduce((s, e) => s + Number(e.amount || 0), 0);
}

export interface CashflowNums extends CashflowInputs {
  lifestyleTotal: number;
  fcf: number;
  savingRate: number;
}

export function cashflowNums(cf: CashflowInputs, monthExpenses: number): CashflowNums {
  const lifestyleTotal = cf.lifestyleExpense + monthExpenses;
  const fcf = cf.income - cf.fixedExpense - lifestyleTotal - cf.invest;
  const savingRate = cf.income > 0 ? cf.invest / cf.income : 0;
  return { ...cf, lifestyleTotal, fcf, savingRate };
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
