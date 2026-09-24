export function StreakBadge({ current }: { current: number }) {
  if (current < 2) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-500">
      🔥 {current} hari beruntun
    </span>
  );
}
