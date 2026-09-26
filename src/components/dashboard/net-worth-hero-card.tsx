import { fmtRpCompact } from "@/lib/finance/format";

export function NetWorthHeroCard({
  netWorthVal,
  liquidAssetsVal,
  illiquidAssetsVal,
  totalLiabilitiesVal,
  deltaPct,
}: {
  netWorthVal: number;
  liquidAssetsVal: number;
  illiquidAssetsVal: number;
  totalLiabilitiesVal: number;
  /** vs. the closest net-worth snapshot before this month started — null when there's no snapshot old enough yet. */
  deltaPct: number | null;
}) {
  const positive = (deltaPct ?? 0) >= 0;

  return (
    <div
      className="mx-5 mt-4 mb-2.5 p-[18px] pb-4 rounded-[24px] border border-hairline shadow-[var(--shadow-card)] relative overflow-hidden"
      style={{ background: "var(--hero-grad)" }}
    >
      <svg
        viewBox="0 0 240 90"
        preserveAspectRatio="none"
        className="absolute right-0 bottom-0 pointer-events-none"
        style={{ width: "62%", height: "68%", opacity: 0.16 }}
        aria-hidden="true"
      >
        <path
          d="M0,80 C45,70 68,75 90,55 C112,35 142,50 172,25 C195,6 217,14 240,0 L240,90 L0,90 Z"
          fill="var(--brand)"
        />
      </svg>

      <div className="flex items-center justify-between relative">
        <div className="text-[10px] tracking-wide text-text-dim uppercase font-semibold">Total Net Worth</div>
        <span className="text-text-dim text-sm">›</span>
      </div>
      <div className="serif font-medium text-[30px] leading-[1.1] mt-0.5 relative">{fmtRpCompact(netWorthVal)}</div>
      {deltaPct !== null && (
        <div className="flex items-center gap-1.5 mt-1 relative">
          <span
            className="text-[11px] font-semibold rounded-full px-2 py-0.5"
            style={{
              color: positive ? "var(--good)" : "var(--critical)",
              background: positive ? "var(--good-wash)" : "var(--critical-wash)",
            }}
          >
            {positive ? "↑" : "↓"} {Math.abs(deltaPct).toFixed(1)}%
          </span>
          <span className="text-[11px] text-text-muted">vs last month</span>
        </div>
      )}

      <div className="flex gap-2 mt-3 relative">
        <div className="flex-1 min-w-0 bg-black/[0.03] dark:bg-white/[0.06] rounded-xl px-2.5 py-2">
          <div className="text-[9px] text-text-muted whitespace-nowrap">💧 Liquid</div>
          <div className="text-[13px] font-semibold">{fmtRpCompact(liquidAssetsVal)}</div>
        </div>
        <div className="flex-1 min-w-0 bg-black/[0.03] dark:bg-white/[0.06] rounded-xl px-2.5 py-2">
          <div className="text-[9px] text-text-muted whitespace-nowrap">🏘️ Illiquid</div>
          <div className="text-[13px] font-semibold">{fmtRpCompact(illiquidAssetsVal)}</div>
        </div>
        <div className="flex-1 min-w-0 bg-black/[0.03] dark:bg-white/[0.06] rounded-xl px-2.5 py-2">
          <div className="text-[9px] text-text-muted whitespace-nowrap">📉 Liabilities</div>
          <div className="text-[13px] font-semibold">{fmtRpCompact(totalLiabilitiesVal)}</div>
        </div>
      </div>
    </div>
  );
}
