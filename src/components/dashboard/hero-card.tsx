import { fmtRp, greeting } from "@/lib/finance/format";

export function HeroCard({
  name,
  netWorthVal,
  totalAssetsVal,
  totalLiabilitiesVal,
}: {
  name: string;
  netWorthVal: number;
  totalAssetsVal: number;
  totalLiabilitiesVal: number;
}) {
  return (
    <div
      className="mx-5 mt-4 mb-4 p-[22px] pb-6 rounded-[24px] border border-hairline shadow-[var(--shadow-card)] relative overflow-hidden"
      style={{ background: "var(--hero-grad)" }}
    >
      <div className="text-sm text-text-dim mb-4.5 flex items-center gap-2">
        👋 {greeting()}
        {name ? `, ${name}` : ""}
      </div>
      <div className="text-xs tracking-wide text-text-dim uppercase mb-1.5">Net Worth</div>
      <div className="serif font-medium text-[40px] leading-[1.05]">{fmtRp(netWorthVal)}</div>
      <div className="mt-1.5 text-sm text-text-dim">Posisi keuanganmu hari ini</div>
      <div className="flex gap-2.5 mt-5">
        <div className="flex-1 bg-black/[0.03] dark:bg-white/[0.06] border border-hairline rounded-xl px-3.5 py-3">
          <div className="flex items-center gap-1.5 text-xs text-text-dim mb-1">💎 Total Aset</div>
          <div className="serif text-[17px]">{fmtRp(totalAssetsVal)}</div>
        </div>
        <div className="flex-1 bg-black/[0.03] dark:bg-white/[0.06] border border-hairline rounded-xl px-3.5 py-3">
          <div className="flex items-center gap-1.5 text-xs text-text-dim mb-1">📉 Total Utang</div>
          <div className="serif text-[17px]">{fmtRp(totalLiabilitiesVal)}</div>
        </div>
      </div>
    </div>
  );
}
