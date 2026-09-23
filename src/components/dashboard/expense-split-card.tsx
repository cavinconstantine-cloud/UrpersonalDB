import { SectionCard } from "@/components/ui/section-card";
import { expenseCatColorVar, expenseCatIcon } from "@/lib/finance/constants";
import { fmtRp } from "@/lib/finance/format";
import type { ExpenseCategorySlice } from "@/lib/finance/calculations";

export function ExpenseSplitCard({
  slices,
  total,
  title = "🥧 Sebaran Pengeluaran",
}: {
  slices: ExpenseCategorySlice[];
  total: number;
  title?: string;
}) {
  if (slices.length === 0) return null;

  const stops = slices
    .map((s, i) => {
      const start = slices.slice(0, i).reduce((sum, x) => sum + x.pct, 0);
      return `${expenseCatColorVar(s.category)} ${start}% ${start + s.pct}%`;
    })
    .join(", ");

  return (
    <SectionCard title={title}>
      <div className="flex items-center gap-5 pb-4">
        <div className="relative w-[104px] h-[104px] shrink-0">
          <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${stops})` }} />
          <div className="absolute inset-[18px] rounded-full bg-bg-raised flex flex-col items-center justify-center">
            <div className="text-[10px] text-text-dim">Total</div>
            <div className="text-[13px] font-medium">{fmtRp(total)}</div>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          {slices.map((s) => (
            <div key={s.category} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-text-dim min-w-0">
                <span
                  className="w-2 h-2 rounded-[2px] shrink-0"
                  style={{ background: expenseCatColorVar(s.category) }}
                />
                <span className="truncate">
                  {expenseCatIcon(s.category)} {s.category}
                </span>
              </div>
              <span className="text-text font-medium shrink-0">{Math.round(s.pct)}%</span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
