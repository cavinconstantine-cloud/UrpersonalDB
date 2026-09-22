export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      <div className="rounded-[40px] border-[6px] border-[#1c1b18] bg-[#1c1b18] shadow-[0_30px_80px_-20px_rgba(30,25,10,0.45)] overflow-hidden">
        <div
          className="h-[580px] overflow-hidden relative"
          style={{ background: "var(--hero-grad)" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#1c1b18] rounded-b-2xl z-10" />
          <div className="pt-9 px-5">
            <div className="text-[11px] text-text-dim mb-3">👋 Selamat pagi, Dinda</div>
            <div className="text-[10px] uppercase tracking-wide text-text-dim mb-1">💧 Liquid Assets</div>
            <div className="serif font-medium text-[24px] leading-none mb-1.5">Rp 186.400.000</div>
            <div className="text-[9px] mb-3" style={{ color: "var(--good)" }}>
              Hari ini +Rp 850.000 (0.5% dari liquid assets)
            </div>
            <div className="flex gap-2 mb-3">
              <div className="flex-1 bg-black/[0.04] border border-hairline rounded-xl px-2.5 py-2">
                <div className="text-[9px] text-text-dim mb-0.5">Net Worth</div>
                <div className="serif text-[12px]">Rp 412jt</div>
              </div>
              <div className="flex-1 bg-black/[0.04] border border-hairline rounded-xl px-2.5 py-2">
                <div className="text-[9px] text-text-dim mb-0.5">Total Utang</div>
                <div className="serif text-[12px]">Rp 99jt</div>
              </div>
            </div>
          </div>

          <div className="mx-4 mb-2.5 bg-bg-raised border border-hairline rounded-2xl p-3 shadow-[var(--shadow-card)]">
            <div className="flex justify-between text-[9px] text-text-dim mb-1.5">
              <span>Net worth · 90 hari</span>
              <span style={{ color: "var(--good)" }}>+Rp 18jt</span>
            </div>
            <svg viewBox="0 0 100 28" className="w-full h-7">
              <path
                d="M0,22 L15,20 L30,17 L45,18 L60,12 L75,9 L100,4"
                fill="none"
                stroke="var(--series-1)"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="mx-4 mb-2.5 bg-bg-raised border border-hairline rounded-2xl p-3 shadow-[var(--shadow-card)]">
            <div className="text-[10px] serif mb-2">📅 Jatuh Tempo Angsuran</div>
            <div className="flex items-center justify-between text-[9px]">
              <div>
                <div>KPR BCA</div>
                <div className="text-text-dim text-[8px]">KPR · tgl 25 · Rp 15,2jt/bln</div>
              </div>
              <div className="text-right shrink-0" style={{ color: "var(--warning)" }}>
                3 hari lagi
              </div>
            </div>
          </div>

          <div className="mx-4 bg-bg-raised border border-hairline rounded-2xl p-3 shadow-[var(--shadow-card)]">
            <div className="text-[10px] serif mb-1.5">🌐 Berita Pasar</div>
            <div className="text-[9px] font-medium leading-snug mb-1">
              The Fed naikkan suku bunga, tekan Rupiah &amp; pasar EM
            </div>
            <div className="text-[8px] text-text-dim leading-relaxed mb-1.5">
              Dianalisa AI — dampak ke reksadana &amp; obligasi kamu dijelaskan singkat, tetap dikutip dari sumber
              tepercaya.
            </div>
            <div className="text-[7px] text-brand-strong">Bloomberg ↗ · Reuters ↗</div>
          </div>
        </div>
      </div>
    </div>
  );
}
