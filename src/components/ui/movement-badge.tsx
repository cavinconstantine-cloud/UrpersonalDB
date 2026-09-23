import type { DailyMovement } from "@/lib/finance/calculations";

/** Small pill showing day-over-day movement — ▲/▼ % colored, "Stabil" when flat, nothing when there's no baseline to compare against yet. */
export function MovementBadge({ movement }: { movement: DailyMovement | null | undefined }) {
  if (!movement || movement.pctChange === null) return null;
  const pct = movement.pctChange;
  if (Math.abs(pct) < 0.05) {
    return <span className="text-[10px] text-text-dim shrink-0">Stabil</span>;
  }
  const isUp = pct > 0;
  return (
    <span
      className="text-[10px] font-medium rounded-full px-1.5 py-0.5 shrink-0"
      style={{
        color: isUp ? "var(--good)" : "var(--critical)",
        background: isUp
          ? "color-mix(in srgb, var(--good) 14%, transparent)"
          : "color-mix(in srgb, var(--critical) 14%, transparent)",
      }}
    >
      {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}
