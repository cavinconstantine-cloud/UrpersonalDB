import { SectionCard } from "@/components/ui/section-card";
import { goalProgressInsight } from "@/lib/finance/calculations";
import { fmtRp } from "@/lib/finance/format";

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  targetDate: string;
}

export function GoalProgressInsight({
  goals,
  fcf,
  userName,
}: {
  goals: Goal[];
  fcf: number;
  monthlyIncome: number;
  userName?: string;
}) {
  if (!goals || goals.length === 0) return null;

  const name = userName || "Kamu";
  const { totalMonthlyNeed, gap, feasible } = goalProgressInsight(goals, fcf);

  const text = feasible
    ? `Untuk mencapai semua goals tepat waktu, ${name} perlu menabung ${fmtRp(totalMonthlyNeed)}/bulan, dan FCF saat ini ${fmtRp(fcf)}/bulan sudah cukup — surplus ${fmtRp(fcf - totalMonthlyNeed)}/bulan. Goals kamu on track, pertimbangkan alokasikan surplus ini ke goal lain atau investasi.`
    : `Untuk mencapai semua goals tepat waktu, ${name} perlu menabung ${fmtRp(totalMonthlyNeed)}/bulan, tapi FCF saat ini hanya ${fmtRp(fcf)}/bulan — kurang ${fmtRp(gap)}/bulan. Dengan kondisi saat ini goals belum bisa tercapai tepat waktu, harus ada yang dilakukan: tambah income sekitar ${fmtRp(gap)}/bulan, kurangi expense sebesar itu, atau perpanjang target date beberapa goal.`;

  return (
    <SectionCard title="🎯 Goal Progress & Insight">
      <div className="rounded-lg border border-brand/20 bg-brand/5 p-4 mb-4">
        <p className="text-sm leading-relaxed text-text">{text}</p>
      </div>
    </SectionCard>
  );
}
