import { SectionCard } from "@/components/ui/section-card";
import type { UpcomingGoalMaturity } from "@/lib/finance/calculations";

export function GoalMaturityCard({
  items,
  goalNameById,
}: {
  items: UpcomingGoalMaturity[];
  goalNameById: Map<string, string>;
}) {
  if (items.length === 0) return null;

  return (
    <SectionCard title="⏰ Maturing — Linked to Goal">
      {items.map((item) => (
        <div key={item.id} className="flex items-start justify-between gap-3 py-2.5 border-b border-hairline last:border-b-0 text-sm">
          <div className="min-w-0">
            <div className="text-text">{item.label}</div>
            <div className="text-xs text-text-dim mt-0.5">
              {item.daysUntil === 0 ? "Matures today" : `Matures in ${item.daysUntil} days`} · {item.maturityDate}
            </div>
            <div className="text-xs text-text-dim mt-1 leading-relaxed">
              Automatically unlinked from this goal once it matures — renew it, or move it to Cash and relink.
            </div>
          </div>
          <span className="text-[10px] font-medium text-brand-strong bg-brand/10 rounded-full px-2 py-1 shrink-0">
            🔗 {goalNameById.get(item.goalId) || "Goal"}
          </span>
        </div>
      ))}
    </SectionCard>
  );
}
