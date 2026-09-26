import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { fmtRp } from "@/lib/finance/format";
import type { UpcomingInstallment } from "@/lib/finance/calculations";

function dueLabel(daysUntil: number): { text: string; tone: string } {
  if (daysUntil === 0) return { text: "Today", tone: "var(--critical)" };
  if (daysUntil === 1) return { text: "Tomorrow", tone: "var(--critical)" };
  if (daysUntil <= 3) return { text: `in ${daysUntil} days`, tone: "var(--critical)" };
  if (daysUntil <= 7) return { text: `in ${daysUntil} days`, tone: "var(--warning)" };
  return { text: `in ${daysUntil} days`, tone: "var(--text-dim)" };
}

export function UpcomingBillingCard({ installments }: { installments: UpcomingInstallment[] }) {
  if (installments.length === 0) return null;

  const upcoming = installments.slice(0, 5);

  return (
    <SectionCard title="📅 Upcoming Installments">
      <div className="pb-2">
        {upcoming.map((item) => {
          const due = dueLabel(item.daysUntil);
          const row = (
            <div className="flex items-center justify-between gap-3 py-2.5 border-b border-hairline last:border-b-0">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{item.label}</div>
                <div className="text-xs text-text-dim">
                  {item.category} · day {item.billingDay}
                  {item.monthlyPayment > 0 ? ` · ${fmtRp(item.monthlyPayment)}/mo` : ""}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[13px] font-medium" style={{ color: due.tone }}>
                  {due.text}
                </div>
                {item.amount > 0 && <div className="text-xs text-text-dim">{fmtRp(item.amount)}</div>}
              </div>
            </div>
          );
          return (
            <Link key={item.id} href={`/app/liabilities/${encodeURIComponent(item.category)}`} className="block">
              {row}
            </Link>
          );
        })}
      </div>
    </SectionCard>
  );
}
