import { fmtRp } from "@/lib/finance/format";

export function LiquidAssetsCard({ total, todayNet }: { total: number; todayNet: number }) {
  const pct = total > 0 ? (Math.abs(todayNet) / total) * 100 : 0;
  const positive = todayNet >= 0;

  return (
    <div className="mx-5 mt-4 mb-4 p-4 rounded-2xl border border-hairline bg-bg-raised shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-1.5 text-xs text-text-dim mb-1.5">
        💧 Liquid Assets (Cash, Deposito, Reksadana, Obligasi)
      </div>
      <div className="serif text-[22px] mb-1.5">{fmtRp(total)}</div>
      {todayNet !== 0 ? (
        <div className="text-[13px]" style={{ color: positive ? "var(--good)" : "var(--critical)" }}>
          Hari ini {positive ? "+" : "-"}
          {fmtRp(Math.abs(todayNet))}
          {total > 0 ? ` (${pct.toFixed(1)}% dari liquid assets)` : ""}
        </div>
      ) : (
        <div className="text-[13px] text-text-dim">Belum ada transaksi hari ini</div>
      )}
    </div>
  );
}
