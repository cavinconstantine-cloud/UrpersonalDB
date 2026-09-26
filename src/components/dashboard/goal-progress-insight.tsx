import { SectionCard } from "@/components/ui/section-card";
import { generateGoalProgressInsight } from "@/app/app/ai-actions";

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  targetDate: string;
}

export async function GoalProgressInsight({
  goals,
  fcf,
  monthlyIncome,
  userName,
}: {
  goals: Goal[];
  fcf: number;
  monthlyIncome: number;
  userName?: string;
}) {
  if (!goals || goals.length === 0) return null;

  const name = userName || "You";
  const result = await generateGoalProgressInsight(goals, fcf, monthlyIncome, name);

  if (!result.ok) {
    if (result.error) {
      return (
        <SectionCard title="🎯 Goal Progress & Insight">
          <div className="rounded-lg border border-warning/20 bg-warning-wash p-4 text-warning text-sm">
            {result.error}
          </div>
        </SectionCard>
      );
    }
    return null;
  }

  return (
    <SectionCard title="🎯 Goal Progress & Insight">
      <div className="rounded-lg border border-brand/20 bg-brand/5 p-4 mb-4">
        <p className="text-sm leading-relaxed text-text">{result.text}</p>
      </div>
    </SectionCard>
  );
}
