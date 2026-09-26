import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { expenseCatColorVar, expenseCatIcon } from "@/lib/finance/constants";
import { fmtRpCompact } from "@/lib/finance/format";
import type { BudgetProgressItem, ExpenseCategorySlice } from "@/lib/finance/calculations";

const TONE_VAR: Record<BudgetProgressItem["tone"], string> = {
  good: "var(--brand)",
  warning: "var(--warning)",
  critical: "var(--critical)",
};

export function SpendingByCategoryCard({
  budgetItems,
  expenseSlices,
}: {
  budgetItems: BudgetProgressItem[];
  expenseSlices: ExpenseCategorySlice[];
}) {
  const hasBudgets = budgetItems.length > 0;
  const rows = hasBudgets
    ? budgetItems.slice(0, 5).map((b) => ({
        category: b.category,
        amountLabel: fmtRpCompact(b.spent),
        barPct: Math.min(100, b.pct),
        color: TONE_VAR[b.tone],
      }))
    : expenseSlices.slice(0, 5).map((s) => ({
        category: s.category,
        amountLabel: fmtRpCompact(s.amount),
        barPct: Math.min(100, s.pct),
        color: expenseCatColorVar(s.category),
      }));

  return (
    <SectionCard
      title="Spending by Category"
      action={
        <Link href="/app/expenses" className="text-[11px] text-brand-strong">
          See all ›
        </Link>
      }
    >
      {rows.length === 0 ? (
        <div className="text-sm text-text-dim py-2 pb-4">No expenses recorded yet this month.</div>
      ) : (
        <div className="pb-2">
          {rows.map((r) => (
            <div key={r.category} className="py-2 border-b border-hairline last:border-b-0">
              <div className="flex items-center justify-between mb-1.5 text-[13px]">
                <span className="flex items-center gap-1.5 min-w-0 truncate">
                  {expenseCatIcon(r.category)} {r.category}
                </span>
                <span className="shrink-0 text-text-dim text-xs">{r.amountLabel}</span>
              </div>
              <div className="h-[5px] rounded-full bg-hairline overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${r.barPct}%`, background: r.color }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
