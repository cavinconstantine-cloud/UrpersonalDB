import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { goalMonthlyNeed } from "@/lib/finance/calculations";
import { fmtRpCompact } from "@/lib/finance/format";
import type { Goal } from "@/lib/finance/types";

export function GoalsPreview({ goals, fcf }: { goals: Goal[]; fcf: number }) {
  return (
    <SectionCard
      title="🎯 Goals"
      action={
        <Link href="/app/goals" className="text-xs text-brand-strong bg-brand/10 rounded-full px-3 py-1.5 font-medium">
          Manage
        </Link>
      }
    >
      {goals.length === 0 ? (
        <div className="text-sm text-text-dim py-2 pb-4">No goals yet.</div>
      ) : (
        goals.map((g) => {
          const need = goalMonthlyNeed(g);
          const pct = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
          const onTrack = need <= Math.max(0, fcf);
          return (
            <div key={g.id} className="py-3 border-b border-hairline last:border-b-0">
              <div className="flex justify-between text-sm mb-1.5">
                <span>{g.name}</span>
                <span
                  className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                  style={{
                    color: onTrack ? "var(--good)" : "var(--warning)",
                    background: onTrack ? "var(--good-wash)" : "var(--warning-wash)",
                  }}
                >
                  {onTrack ? "On Track" : "Needs Attention"}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-hairline overflow-hidden mb-1.5">
                <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-text-dim">
                <span>
                  {fmtRpCompact(g.current)} / {fmtRpCompact(g.target)}
                </span>
                <span>needs {fmtRpCompact(need)}/mo</span>
              </div>
            </div>
          );
        })
      )}
    </SectionCard>
  );
}
