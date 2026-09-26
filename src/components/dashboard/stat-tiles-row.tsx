import { fmtRpCompact } from "@/lib/finance/format";

export function StatTilesRow({
  incomeTotal,
  fcf,
  savingRate,
}: {
  incomeTotal: number;
  fcf: number;
  savingRate: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 mx-5 mb-2.5">
      <div className="bg-bg-raised border border-hairline rounded-2xl p-2.5 shadow-[var(--shadow-card)]">
        <div className="text-[9px] text-text-muted mb-1">💰 Income</div>
        <div className="serif text-[13px] font-medium">{fmtRpCompact(incomeTotal)}</div>
      </div>
      <div className="bg-bg-raised border border-hairline rounded-2xl p-2.5 shadow-[var(--shadow-card)]">
        <div className="text-[9px] text-text-muted mb-1">🧮 Free Cash</div>
        <div className="serif text-[13px] font-medium" style={{ color: fcf >= 0 ? undefined : "var(--critical)" }}>
          {fmtRpCompact(fcf)}
        </div>
      </div>
      <div className="bg-bg-raised border border-hairline rounded-2xl p-2.5 shadow-[var(--shadow-card)]">
        <div className="text-[9px] text-text-muted mb-1">📊 Savings</div>
        <div className="serif text-[13px] font-medium" style={{ color: savingRate >= 0 ? undefined : "var(--critical)" }}>
          {savingRate >= 0 ? "+" : ""}
          {Math.round(savingRate * 100)}%
        </div>
      </div>
    </div>
  );
}
