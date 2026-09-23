"use client";

import { useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/ui/section-card";
import { Chip } from "@/components/ui/chip";
import { ExpenseSplitCard } from "@/components/dashboard/expense-split-card";
import {
  expenseByCategory,
  expenseByCategoryForYear,
  topTransactions,
  type ExpenseCategorySlice,
  type TopTransaction,
} from "@/lib/finance/calculations";
import { expenseCatColorVar, expenseCatIcon, incomeCatColorVar, incomeCatIcon } from "@/lib/finance/constants";
import { fmtRp } from "@/lib/finance/format";
import type { Expense, Income } from "@/lib/finance/types";

interface FcfPoint {
  ym: string; // "YYYY-MM"
  fcf: number;
  savingRate: number;
}

type Mode = "monthly" | "yearly";

const MONTH_SHORT = new Intl.DateTimeFormat("id-ID", { month: "short" });
const MONTH_LONG = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });

function ymToDate(ym: string): Date {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

function shiftYm(ym: string, months: number): string {
  const d = ymToDate(ym);
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** The category whose spend dropped the most (by %) between two periods — needs at least 15% down and prior spend > 0. */
function biggestCategoryDecrease(
  current: ExpenseCategorySlice[],
  previous: ExpenseCategorySlice[],
): { category: string; pctDown: number } | null {
  const currentMap = new Map(current.map((c) => [c.category, c.amount]));
  let best: { category: string; pctDown: number } | null = null;
  for (const p of previous) {
    if (p.amount <= 0) continue;
    const curAmt = currentMap.get(p.category) ?? 0;
    const pctDown = ((p.amount - curAmt) / p.amount) * 100;
    if (pctDown >= 15 && (!best || pctDown > best.pctDown)) best = { category: p.category, pctDown };
  }
  return best;
}

/** The category whose spend rose the most (by %) between two periods — needs at least 15% up and prior spend > 0 (new categories aren't counted, there's no baseline % to report). */
function biggestCategoryIncrease(
  current: ExpenseCategorySlice[],
  previous: ExpenseCategorySlice[],
): { category: string; pctUp: number } | null {
  const previousMap = new Map(previous.map((p) => [p.category, p.amount]));
  let best: { category: string; pctUp: number } | null = null;
  for (const c of current) {
    const prevAmt = previousMap.get(c.category) ?? 0;
    if (prevAmt <= 0) continue;
    const pctUp = ((c.amount - prevAmt) / prevAmt) * 100;
    if (pctUp >= 15 && (!best || pctUp > best.pctUp)) best = { category: c.category, pctUp };
  }
  return best;
}

function buildInsightText(args: {
  delta: number | null;
  savingRate: number | null;
  avgSavingRate6mo: number | null;
  categoryDrop: { category: string; pctDown: number } | null;
  categoryRise: { category: string; pctUp: number } | null;
  topCategory: ExpenseCategorySlice | null;
  periodNoun: string; // "bulan ini" / "tahun ini"
}): string {
  const { delta, savingRate, avgSavingRate6mo, categoryDrop, categoryRise, topCategory, periodNoun } = args;
  const parts: string[] = [];
  if (topCategory) {
    parts.push(`Pengeluaran terbesar ${periodNoun} di ${topCategory.category} (${Math.round(topCategory.pct)}%)`);
  }
  if (delta !== null) {
    parts.push(delta >= 0 ? `FCF naik ${Math.abs(Math.round(delta))}% dibanding periode sebelumnya` : `FCF turun ${Math.abs(Math.round(delta))}% dibanding periode sebelumnya`);
  }
  if (categoryDrop) {
    parts.push(`pengeluaran ${categoryDrop.category} turun ${Math.round(categoryDrop.pctDown)}%`);
  } else if (categoryRise) {
    parts.push(`pengeluaran ${categoryRise.category} naik ${Math.round(categoryRise.pctUp)}%`);
  }
  if (savingRate !== null && avgSavingRate6mo !== null && avgSavingRate6mo > 0) {
    const vsPts = Math.round((savingRate - avgSavingRate6mo) * 100);
    if (Math.abs(vsPts) >= 2) {
      parts.push(
        `saving rate ${Math.round(savingRate * 100)}% ${vsPts >= 0 ? "di atas" : "di bawah"} rata-rata 6 bulan terakhir`,
      );
    }
  }
  if (parts.length === 0) return "";
  const emoji = delta !== null && delta < 0 ? "📉" : "✨";
  return `${emoji} ${parts[0]}${parts.length > 1 ? " — " + parts.slice(1).join(", ") : ""}.`;
}

function buildShareText(args: {
  periodLabel: string;
  fcfValue: number;
  expenseSlices: ExpenseCategorySlice[];
  topTx: TopTransaction[];
}): string {
  const { periodLabel, fcfValue, expenseSlices, topTx } = args;
  const lines = [`Ringkasan keuangan — ${periodLabel}`, `Free Cash Flow: ${fmtRp(fcfValue)}`];
  if (expenseSlices.length > 0) {
    lines.push("", "Pengeluaran terbesar:");
    for (const s of expenseSlices.slice(0, 3)) lines.push(`- ${s.category}: ${fmtRp(s.amount)} (${Math.round(s.pct)}%)`);
  }
  if (topTx.length > 0) {
    lines.push("", "Top transaksi:");
    for (const t of topTx) lines.push(`- ${t.description || t.category}: ${fmtRp(t.amount)}`);
  }
  return lines.join("\n");
}

export function SummaryView({
  expenses,
  incomes,
  fcfSeries,
}: {
  expenses: Expense[];
  incomes: Income[];
  fcfSeries: FcfPoint[];
}) {
  const [mode, setMode] = useState<Mode>("monthly");
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  }, []);
  const [selectedYm, setSelectedYm] = useState(months[months.length - 1]);
  const selectedYear = String(ymToDate(selectedYm).getFullYear());

  const fcfByYm = useMemo(() => new Map(fcfSeries.map((p) => [p.ym, p] as const)), [fcfSeries]);

  const periodPrefix = mode === "monthly" ? selectedYm : selectedYear;
  const periodLabel = mode === "monthly" ? MONTH_LONG.format(ymToDate(selectedYm)) : selectedYear;

  const fcfValue =
    mode === "monthly"
      ? (fcfByYm.get(selectedYm)?.fcf ?? 0)
      : fcfSeries.filter((p) => p.ym.startsWith(selectedYear)).reduce((s, p) => s + p.fcf, 0);

  const prevFcfValue = useMemo(() => {
    if (mode === "monthly") return fcfByYm.get(shiftYm(selectedYm, -1))?.fcf ?? null;
    const prevYear = String(Number(selectedYear) - 1);
    const prevPoints = fcfSeries.filter((p) => p.ym.startsWith(prevYear));
    return prevPoints.length > 0 ? prevPoints.reduce((s, p) => s + p.fcf, 0) : null;
  }, [mode, selectedYm, selectedYear, fcfByYm, fcfSeries]);

  const delta = prevFcfValue !== null ? pctChange(fcfValue, prevFcfValue) : null;

  const savingRate = mode === "monthly" ? (fcfByYm.get(selectedYm)?.savingRate ?? null) : null;
  const avgSavingRate6mo = useMemo(() => {
    if (mode !== "monthly") return null;
    const idx = fcfSeries.findIndex((p) => p.ym === selectedYm);
    const window = idx > 0 ? fcfSeries.slice(Math.max(0, idx - 6), idx) : [];
    if (window.length === 0) return null;
    return window.reduce((s, p) => s + p.savingRate, 0) / window.length;
  }, [mode, fcfSeries, selectedYm]);

  const expenseSlices =
    mode === "monthly" ? expenseByCategory(expenses, selectedYm) : expenseByCategoryForYear(expenses, selectedYear);
  const prevExpenseSlices = mode === "monthly" ? expenseByCategory(expenses, shiftYm(selectedYm, -1)) : [];
  const categoryDrop = mode === "monthly" ? biggestCategoryDecrease(expenseSlices, prevExpenseSlices) : null;
  const categoryRise = mode === "monthly" ? biggestCategoryIncrease(expenseSlices, prevExpenseSlices) : null;
  const topCategory = expenseSlices[0] ?? null;

  const topTx = topTransactions(expenses, incomes, periodPrefix, 3);

  const insight = buildInsightText({
    delta,
    savingRate,
    avgSavingRate6mo,
    categoryDrop,
    categoryRise,
    topCategory,
    periodNoun: mode === "monthly" ? "bulan ini" : "tahun ini",
  });

  async function handleShare() {
    const text = buildShareText({ periodLabel, fcfValue, expenseSlices, topTx });
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "Uangku — Summary", text });
        return;
      } catch {
        // cancelled or unsupported — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      // no clipboard permission — nothing more we can do
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between px-5 mb-5">
        <h1 className="serif text-[28px]">Summary</h1>
        <button
          type="button"
          onClick={handleShare}
          className="w-11 h-11 rounded-full bg-bg-raised border border-hairline flex items-center justify-center active:scale-95 transition shrink-0"
          aria-label="Bagikan ringkasan"
        >
          <Share2 size={18} />
        </button>
      </div>
      {shareState === "copied" && (
        <div className="px-5 -mt-3 mb-3 text-xs text-brand-strong">Ringkasan disalin ke clipboard ✓</div>
      )}

      <div className="mx-5 mb-4 flex gap-1 bg-bg-input rounded-xl p-1">
        {(["monthly", "yearly"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-medium transition",
              mode === m ? "bg-bg-raised text-text shadow-sm" : "text-text-dim",
            )}
          >
            {m === "monthly" ? "Bulanan" : "Tahunan"}
          </button>
        ))}
      </div>

      {mode === "monthly" && (
        <div className="mx-5 mb-4 flex gap-2 overflow-x-auto pb-1">
          {months.map((ym) => (
            <Chip key={ym} active={ym === selectedYm} onClick={() => setSelectedYm(ym)} className="shrink-0 capitalize">
              {MONTH_SHORT.format(ymToDate(ym))}
            </Chip>
          ))}
        </div>
      )}

      <div className="mx-5 mb-4 bg-bg-raised border border-hairline rounded-[22px] p-[18px] shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="text-sm text-text-dim">{periodLabel}</div>
          {delta !== null && (
            <div
              className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
              style={{
                color: delta >= 0 ? "var(--good)" : "var(--critical)",
                background: delta >= 0 ? "var(--good-wash)" : "var(--critical-wash)",
              }}
            >
              {delta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(delta))}% vs {mode === "monthly" ? "bulan lalu" : "tahun lalu"}
            </div>
          )}
        </div>
        <div className="serif text-[30px] mb-1">{fmtRp(fcfValue)}</div>
        <div className="text-xs text-text-dim">Free Cash Flow {mode === "monthly" ? "bulan ini" : "tahun ini"}</div>
        {insight && (
          <>
            <div className="h-px bg-hairline my-3.5" />
            <div className="text-sm italic text-text-dim leading-relaxed">{insight}</div>
          </>
        )}
      </div>

      <ExpenseSplitCard slices={expenseSlices} total={expenseSlices.reduce((s, e) => s + e.amount, 0)} title="📊 Pengeluaran Terbesar" />

      <SectionCard title="🏆 Top 3 Transaksi">
        {topTx.length === 0 ? (
          <div className="text-sm text-text-dim py-2 pb-4">Belum ada transaksi di periode ini.</div>
        ) : (
          topTx.map((t) => {
            const isIncome = t.type === "income";
            const icon = (isIncome ? incomeCatIcon : expenseCatIcon)(t.category);
            const color = (isIncome ? incomeCatColorVar : expenseCatColorVar)(t.category);
            return (
              <div
                key={`${t.type}-${t.id}`}
                className="flex items-center justify-between gap-3 py-[11px] border-b border-hairline last:border-b-0 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-base shrink-0"
                    style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}
                  >
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate">{t.description || t.category}</div>
                    <div className="text-xs text-text-dim">{t.category}</div>
                  </div>
                </div>
                <div className="shrink-0 font-medium" style={{ color: isIncome ? "var(--good)" : undefined }}>
                  {isIncome ? "+" : "-"}
                  {fmtRp(t.amount)}
                </div>
              </div>
            );
          })
        )}
      </SectionCard>
    </div>
  );
}
