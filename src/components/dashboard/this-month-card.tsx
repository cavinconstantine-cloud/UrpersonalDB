import Link from "next/link";
import { fmtRpCompact } from "@/lib/finance/format";

export function ThisMonthCard({
  monthExpTotal,
  prevMonthExpenseTotal,
  totalMonthlyBudget,
}: {
  monthExpTotal: number;
  /** 0 means "no data yet" (new account) — the delta is hidden rather than shown as a misleading -100%/+∞. */
  prevMonthExpenseTotal: number;
  /** Sum of every category's monthly_limit — 0 when the user hasn't set any budgets. */
  totalMonthlyBudget: number;
}) {
  const deltaPct = prevMonthExpenseTotal > 0 ? ((monthExpTotal - prevMonthExpenseTotal) / prevMonthExpenseTotal) * 100 : null;
  const down = (deltaPct ?? 0) <= 0;
  const hasBudget = totalMonthlyBudget > 0;
  const remaining = totalMonthlyBudget - monthExpTotal;
  const barPct = hasBudget ? Math.min(100, (monthExpTotal / totalMonthlyBudget) * 100) : 0;
  const barColor = barPct >= 100 ? "var(--critical)" : barPct >= 80 ? "var(--warning)" : "var(--brand)";

  return (
    <div className="mx-5 mb-2.5 p-4 rounded-2xl border border-hairline bg-bg-raised shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-wide text-text-dim uppercase font-semibold mb-0.5">
            This Month · Spending
          </div>
          <div className="serif font-medium text-[22px] leading-[1.1]">{fmtRpCompact(monthExpTotal)}</div>
          {deltaPct !== null && (
            <div className="text-[11px] mt-0.5" style={{ color: down ? "var(--good)" : "var(--critical)" }}>
              {down ? "↓" : "↑"} {Math.abs(Math.round(deltaPct))}% vs last month
            </div>
          )}
        </div>
        {hasBudget && (
          <div className="text-right shrink-0">
            <div className="serif text-[15px]">{fmtRpCompact(totalMonthlyBudget)}</div>
            <div className="text-[10px] text-text-muted">Budget</div>
          </div>
        )}
      </div>
      {hasBudget && (
        <>
          <div className="h-[5px] rounded-full bg-hairline overflow-hidden mt-2.5">
            <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: barColor }} />
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="text-[11px] text-text-muted">
              {remaining >= 0 ? `${fmtRpCompact(remaining)} remaining` : `${fmtRpCompact(-remaining)} over budget`}
            </div>
            <Link
              href="/app/cashflow#budget"
              className="text-[11px] font-medium text-brand-strong hover:underline shrink-0"
            >
              View budget details ›
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
