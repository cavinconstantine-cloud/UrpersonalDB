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
}: {
  goals: Goal[];
  fcf: number;
  monthlyIncome: number;
}) {
  if (!goals || goals.length === 0) return null;

  const result = await generateGoalProgressInsight(goals, fcf, monthlyIncome);

  if (!result.ok) return null;

  return (
    <SectionCard title="🎯 Goal Progress & Insight">
      <div className="text-sm leading-relaxed whitespace-pre-wrap pb-4">{result.text}</div>
    </SectionCard>
  );
}
