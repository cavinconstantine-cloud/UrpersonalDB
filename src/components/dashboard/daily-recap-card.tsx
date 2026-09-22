import type { DailyRecap } from "@/lib/finance/calculations";
import { fmtRp } from "@/lib/finance/format";

export function DailyRecapCard({ recap }: { recap: DailyRecap }) {
  const { incomeTotal, expenseTotal, net, biggestExpense } = recap;
  const hasActivity = incomeTotal > 0 || expenseTotal > 0;
  const positive = net >= 0;

  return (
    <div className="mx-5 mb-4 p-4 rounded-2xl border border-hairline bg-bg-raised shadow-[var(--shadow-card)]">
      <div className="flex justify-between items-baseline mb-1.5">
        <div className="text-xs text-text-dim">📊 Recap hari ini</div>
        {hasActivity && (
          <div className="serif text-[19px]" style={{ color: positive ? "var(--good)" : "var(--critical)" }}>
            {positive ? "+" : "-"}
            {fmtRp(Math.abs(net))}
          </div>
        )}
      </div>
      {!hasActivity ? (
        <div className="text-[13px] text-text-dim">Belum ada transaksi hari ini.</div>
      ) : (
        <>
          <div className="text-[13px] text-text-dim mb-1">
            Masuk {fmtRp(incomeTotal)} · Keluar {fmtRp(expenseTotal)}
          </div>
          {biggestExpense && (
            <div className="text-[13px] text-text-dim">
              {positive ? "Pengeluaran terbesar" : "Minus terbesar dari"}: <strong className="text-text">{biggestExpense.category}</strong>{" "}
              ({fmtRp(biggestExpense.amount)})
            </div>
          )}
        </>
      )}
    </div>
  );
}
