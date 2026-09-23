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

          <div className="mx-4 bg-bg-raised border border-hairline rounded-2xl p-3 shadow-[var(--shadow-card)]">
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[11px] serif">📊 Summary Bulanan</div>
              <div
                className="text-[8px] font-medium rounded-full px-[7px] py-[2px]"
                style={{ color: "var(--good)", background: "var(--good-wash)" }}
              >
                ▲ 19% vs bulan lalu
              </div>
            </div>
            <div className="serif text-[17px] leading-none mb-0.5">Rp 6.900.000</div>
            <div className="text-[8px] text-text-dim mb-2">Free Cash Flow bulan ini</div>
            <div className="text-[8px] italic text-text-dim leading-relaxed mb-2.5">
              ✨ Pengeluaran terbesar di Makan &amp; Minum (28%) — saving rate 27% di atas rata-rata 6 bulan.
            </div>
            <div className="h-px bg-hairline mb-2" />
            <div className="text-[8px] uppercase tracking-wide text-text-muted mb-1.5">🚀 Aset paling bergerak</div>
            <div className="flex gap-1.5">
              {[
                { label: "BBCA", pct: "▲ 20%", up: true },
                { label: "FR0100", pct: "▲ 10%", up: true },
                { label: "Reksadana X", pct: "▼ 10%", up: false },
              ].map((a) => (
                <div
                  key={a.label}
                  className="flex-1 rounded-[10px] px-2 py-1.5"
                  style={{ background: a.up ? "var(--good-wash)" : "var(--critical-wash)" }}
                >
                  <div className="text-[8px] font-medium truncate">{a.label}</div>
                  <div className="text-[8px] font-medium" style={{ color: a.up ? "var(--good)" : "var(--critical)" }}>
                    {a.pct}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
