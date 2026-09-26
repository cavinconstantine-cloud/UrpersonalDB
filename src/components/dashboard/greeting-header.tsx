import { capNameOrKamu } from "@/lib/finance/format";
import { StreakBadge } from "@/components/dashboard/streak-badge";

export function GreetingHeader({ name, streak }: { name: string | null | undefined; streak: number }) {
  return (
    <div className="mx-5 mt-4 text-sm text-text-dim flex items-center gap-2">
      👋 Hi, {capNameOrKamu(name)}
      <StreakBadge current={streak} />
    </div>
  );
}
