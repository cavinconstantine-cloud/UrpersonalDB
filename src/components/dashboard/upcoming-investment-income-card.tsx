import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { fmtRp } from "@/lib/finance/format";
import type { UpcomingInvestmentIncome } from "@/lib/finance/calculations";

function whenLabel(daysUntil: number): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `in ${daysUntil} days`;
}

export function UpcomingInvestmentIncomeCard({ items }: { items: UpcomingInvestmentIncome[] }) {
  if (items.length === 0) return null;

  const upcoming = items.slice(0, 5);

  return (
    <SectionCard title="💰 Expected Income This Month">
      <div className="pb-2">
        {upcoming.map((item) => (
          <Link
            key={item.id}
            href={`/app/assets/${encodeURIComponent(item.category)}`}
            className="block"
          >
            <div className="flex items-center justify-between gap-3 py-2.5 border-b border-hairline last:border-b-0">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{item.label}</div>
                <div className="text-xs text-text-dim">
                  {item.category} · day {item.day}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[13px] font-medium" style={{ color: "var(--brand)" }}>
                  {whenLabel(item.daysUntil)}
                </div>
                <div className="text-xs text-text-dim">{fmtRp(item.amount)}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
