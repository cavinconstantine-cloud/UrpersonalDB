import type { DailyRecap } from "@/lib/finance/calculations";
import { fmtRp } from "@/lib/finance/format";

export function DailyRecapCard({ recap }: { recap: DailyRecap }) {
  const { incomeTotal, expenseTotal, net, biggestExpense } = recap;
  const hasActivity = incomeTotal > 0 || expenseTotal > 0;
  const positive = net >= 0;

  return (
    <div className="mx-5 mb-4 p-4 rounded-2xl border border-hairline bg-bg-raised shadow-[var(--shadow-card)]">
      <div className="flex justify-between items-baseline mb-1.5">
        <div className="text-xs text-text-dim">📊 Today&apos;s Recap</div>
        {hasActivity && (
          <div className="serif text-[19px]" style={{ color: positive ? "var(--good)" : "var(--critical)" }}>
            {positive ? "+" : "-"}
            {fmtRp(Math.abs(net))}
          </div>
        )}
      </div>
      {!hasActivity ? (
        <div className="text-[13px] text-text-dim">No transactions yet today.</div>
      ) : (
        <>
          <div className="text-[13px] text-text-dim mb-1">
            In {fmtRp(incomeTotal)} · Out {fmtRp(expenseTotal)}
          </div>
          {biggestExpense && (
            <div className="text-[13px] text-text-dim">
              {positive ? "Biggest expense" : "Biggest hit from"}: <strong className="text-text">{biggestExpense.category}</strong>{" "}
              ({fmtRp(biggestExpense.amount)})
            </div>
          )}
        </>
      )}
    </div>
  );
}
