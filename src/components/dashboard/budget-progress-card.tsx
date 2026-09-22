import { SectionCard } from "@/components/ui/section-card";
import { expenseCatIcon } from "@/lib/finance/constants";
import { fmtRp } from "@/lib/finance/format";
import type { BudgetProgressItem } from "@/lib/finance/calculations";

const TONE_VAR: Record<BudgetProgressItem["tone"], string> = {
  good: "var(--brand)",
  warning: "var(--warning)",
  critical: "var(--critical)",
};

export function BudgetProgressCard({ items }: { items: BudgetProgressItem[] }) {
  if (items.length === 0) return null;

  return (
    <SectionCard title="🎯 Budget Bulanan">
      <div className="pb-2">
        {items.map((item) => {
          const color = TONE_VAR[item.tone];
          const barPct = Math.min(100, item.pct);
          return (
            <div key={item.category} className="py-2.5 border-b border-hairline last:border-b-0">
              <div className="flex items-center justify-between mb-1.5 text-sm">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span>{expenseCatIcon(item.category)}</span>
                  <span className="truncate">{item.category}</span>
                </span>
                <span className="shrink-0 text-xs" style={{ color }}>
                  {Math.round(item.pct)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-hairline overflow-hidden mb-1">
                <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: color }} />
              </div>
              <div className="text-xs text-text-dim">
                {fmtRp(item.spent)} dari {fmtRp(item.limit)}
                {item.tone === "critical" ? " · lewat budget" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
