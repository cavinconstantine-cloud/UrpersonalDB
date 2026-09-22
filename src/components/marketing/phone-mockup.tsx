const ALLOC = [
  { label: "Reksadana", pct: 34, color: "var(--series-4)" },
  { label: "Saham", pct: 26, color: "var(--series-2)" },
  { label: "Cash", pct: 22, color: "var(--series-1)" },
  { label: "Emas", pct: 18, color: "var(--series-8)" },
];

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
            <div className="text-[10px] uppercase tracking-wide text-text-dim mb-1">Net Worth</div>
            <div className="serif font-medium text-[28px] leading-none mb-3">Rp 412.850.000</div>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-black/[0.04] border border-hairline rounded-xl px-2.5 py-2">
                <div className="text-[9px] text-text-dim mb-0.5">Total Aset</div>
                <div className="serif text-[12px]">Rp 512jt</div>
              </div>
              <div className="flex-1 bg-black/[0.04] border border-hairline rounded-xl px-2.5 py-2">
                <div className="text-[9px] text-text-dim mb-0.5">Total Utang</div>
                <div className="serif text-[12px]">Rp 99jt</div>
              </div>
            </div>
          </div>

          <div className="mx-4 mb-3 bg-bg-raised border border-hairline rounded-2xl p-3 shadow-[var(--shadow-card)]">
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

          <div className="mx-4 mb-3 bg-bg-raised border border-hairline rounded-2xl p-3 shadow-[var(--shadow-card)]">
            <div className="text-[10px] serif mb-2">Alokasi Aset</div>
            <div className="flex h-2 rounded-full overflow-hidden gap-[2px] mb-2">
              {ALLOC.map((a) => (
                <div key={a.label} style={{ width: `${a.pct}%`, background: a.color }} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[8px] text-text-dim">
              {ALLOC.map((a) => (
                <span key={a.label} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.color }} />
                  {a.label} {a.pct}%
                </span>
              ))}
            </div>
          </div>

          <div className="mx-4 bg-bg-raised border border-hairline rounded-2xl p-3 shadow-[var(--shadow-card)]">
            <div className="flex justify-between items-baseline text-[10px] mb-2">
              <span className="serif">🎯 Dana Darurat</span>
              <span className="text-[8px] px-2 py-0.5 rounded-full" style={{ color: "var(--good)", background: "var(--good-wash)" }}>
                Sesuai jalur
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-hairline overflow-hidden mb-1.5">
              <div className="h-full rounded-full bg-brand" style={{ width: "62%" }} />
            </div>
            <div className="flex justify-between text-[8px] text-text-dim">
              <span>Rp 62jt dari Rp 100jt</span>
              <span>62%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
