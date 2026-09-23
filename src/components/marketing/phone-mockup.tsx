"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, Receipt, CalendarRange, Wallet, Settings } from "lucide-react";

const NAV_ICONS = [LayoutGrid, Receipt, CalendarRange, Wallet, Settings];
const SLIDE_MS = 2000;

function Screen({ opacity, children }: { opacity: number; children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-0 pt-9 px-5 pb-14 box-border"
      style={{ opacity, transition: "opacity 0.7s ease", pointerEvents: "none" }}
    >
      {children}
    </div>
  );
}

function ScreenHome({ opacity }: { opacity: number }) {
  return (
    <Screen opacity={opacity}>
      <div className="text-[11px] text-text-dim mb-2.5">👋 Selamat pagi, Dinda</div>
      <div className="text-[10px] uppercase tracking-wide text-text-dim mb-1">💧 Liquid Assets</div>
      <div className="serif font-medium text-[22px] leading-none mb-1.5">Rp 186.400.000</div>
      <div className="text-[9px] mb-2.5" style={{ color: "var(--good)" }}>
        Hari ini +Rp 850.000 (0.5% dari liquid assets)
      </div>
      <div className="flex gap-2 mb-2.5">
        <div className="flex-1 bg-black/[0.04] border border-hairline rounded-xl px-2.5 py-[7px]">
          <div className="text-[9px] text-text-dim mb-0.5">Net Worth</div>
          <div className="serif text-[12px]">Rp 412jt</div>
        </div>
        <div className="flex-1 bg-black/[0.04] border border-hairline rounded-xl px-2.5 py-[7px]">
          <div className="text-[9px] text-text-dim mb-0.5">Total Utang</div>
          <div className="serif text-[12px]">Rp 99jt</div>
        </div>
      </div>

      <div
        className="mb-2.5 rounded-2xl p-3 shadow-[var(--shadow-card)]"
        style={{ border: "1px solid var(--brand)", background: "linear-gradient(135deg, var(--brand-wash), var(--bg-raised))" }}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[11px]">✨</span>
          <span className="serif text-[11px]">Ringkasan AI</span>
        </div>
        <div className="text-[8.5px] text-text-dim leading-relaxed">
          Kondisi keuanganmu sehat — likuiditas 45% dari net worth. Saving rate naik 3 bulan berturut-turut;
          pertimbangkan alokasi tambahan ke Reksadana untuk dana darurat.
        </div>
      </div>

      <div className="bg-bg-raised border border-hairline rounded-2xl p-3 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-hairline">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px]">📅</span>
            <div>
              <div className="text-[9px]">KPR BCA</div>
              <div className="text-[8px] text-text-dim">Angsuran · tgl 25</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-medium" style={{ color: "var(--warning)" }}>
              3 hari lagi
            </div>
            <div className="text-[8px] text-text-dim">-Rp 15,2jt</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px]">💰</span>
            <div>
              <div className="text-[9px]">Deposito BCA</div>
              <div className="text-[8px] text-text-dim">Bunga cair · tgl 27</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-medium" style={{ color: "var(--good)" }}>
              2 hari lagi
            </div>
            <div className="text-[8px]" style={{ color: "var(--good)" }}>
              +Rp 317.000
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-hairline">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px]">🏦</span>
            <div>
              <div className="text-[9px]">Obligasi FR0100</div>
              <div className="text-[8px] text-text-dim">Kupon cair · tgl 30</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-medium" style={{ color: "var(--good)" }}>
              5 hari lagi
            </div>
            <div className="text-[8px]" style={{ color: "var(--good)" }}>
              +Rp 937.500
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

const TRANSAKSI_ROWS = [
  { label: "Gaji bulanan", cat: "Gaji", date: "1 Sep", amount: "+Rp 15.000.000", income: true, icon: "💼" },
  { label: "Belanja bulanan", cat: "Makan & Minum", date: "3 Sep", amount: "-Rp 1.560.000", income: false, icon: "🍜" },
  { label: "Premi asuransi", cat: "Tagihan", date: "5 Sep", amount: "-Rp 1.110.000", income: false, icon: "🧾" },
  { label: "Bensin & tol", cat: "Transportasi", date: "10 Sep", amount: "-Rp 950.000", income: false, icon: "🚗" },
  { label: "Nonton & langganan", cat: "Hiburan", date: "15 Sep", amount: "-Rp 400.000", income: false, icon: "🎬" },
];

function ScreenTransaksi({ opacity }: { opacity: number }) {
  return (
    <Screen opacity={opacity}>
      <div className="serif text-[15px] mb-0.5">🧾 Transaksi</div>
      <div className="text-[9px] text-text-dim mb-3.5">Masuk Rp 15.000.000 · Keluar Rp 5.570.000</div>
      {TRANSAKSI_ROWS.map((t) => (
        <div key={t.label} className="flex items-center justify-between py-2 border-b border-hairline last:border-b-0">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] shrink-0"
              style={{ background: t.income ? "var(--good-wash)" : "rgba(255,255,255,0.06)" }}
            >
              {t.icon}
            </div>
            <div className="min-w-0">
              <div className="text-[9px] truncate">{t.label}</div>
              <div className="text-[8px] text-text-dim">
                {t.cat} · {t.date}
              </div>
            </div>
          </div>
          <div className="text-[9px] font-medium shrink-0" style={{ color: t.income ? "var(--good)" : undefined }}>
            {t.amount}
          </div>
        </div>
      ))}
    </Screen>
  );
}

const ASSET_MOVERS = [
  { label: "BBCA", pct: "▲ 20%", up: true },
  { label: "FR0100", pct: "▲ 10%", up: true },
  { label: "Reksadana X", pct: "▼ 10%", up: false },
];

function ScreenSummary({ opacity }: { opacity: number }) {
  return (
    <Screen opacity={opacity}>
      <div className="bg-bg-raised border border-hairline rounded-2xl p-3 shadow-[var(--shadow-card)] mb-2.5">
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="serif text-[11px]">📊 Summary Bulanan</div>
          <div
            className="text-[8px] font-medium rounded-full px-[7px] py-[2px]"
            style={{ color: "var(--good)", background: "var(--good-wash)" }}
          >
            ▲ 19%
          </div>
        </div>
        <div className="serif text-[17px] mb-1.5">Rp 6.900.000</div>
        <div className="text-[8px] italic text-text-dim leading-relaxed">
          ✨ Terbesar di Makan &amp; Minum (28%) — saving rate 27% di atas rata-rata.
        </div>
      </div>

      <div className="bg-bg-raised border border-hairline rounded-2xl p-3 shadow-[var(--shadow-card)] mb-2.5">
        <div className="text-[9px] mb-2">📊 Pengeluaran Terbesar</div>
        <div className="flex items-center gap-2.5">
          <div className="relative w-14 h-14 shrink-0">
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "conic-gradient(var(--series-1) 0% 28%, var(--series-5) 28% 56%, var(--series-4) 56% 76%, var(--series-7) 76% 93%, var(--series-3) 93% 100%)",
              }}
            />
            <div className="absolute inset-[10px] rounded-full bg-bg-raised" />
          </div>
          <div className="flex flex-col gap-[3px] text-[8px] text-text-dim">
            <div>
              🍜 Makan &amp; Minum <span className="text-text">28%</span>
            </div>
            <div>
              🧾 Tagihan <span className="text-text">20%</span>
            </div>
            <div>
              🚗 Transportasi <span className="text-text">17%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-bg-raised border border-hairline rounded-2xl p-3 shadow-[var(--shadow-card)]">
        <div className="text-[8px] text-text-muted uppercase tracking-wide mb-1.5">🚀 Aset paling bergerak</div>
        <div className="flex gap-1.5">
          {ASSET_MOVERS.map((a) => (
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
    </Screen>
  );
}

const FIXED_EXPENSE_ROWS = [
  { label: "Sewa rumah", amount: "Rp 3.000.000" },
  { label: "Internet", amount: "Rp 500.000" },
  { label: "Sekolah", amount: "Rp 2.000.000" },
];

function ScreenArusKas({ opacity }: { opacity: number }) {
  return (
    <Screen opacity={opacity}>
      <div className="serif text-[15px] mb-0.5">💵 Arus Kas Tetap</div>
      <div className="text-[9px] text-text-dim mb-3.5">Dasar hitungan Free Cash Flow bulananmu.</div>

      <div className="text-[9px] text-text-muted uppercase tracking-wide mb-1.5">Pemasukan tetap</div>
      <div className="flex justify-between py-[7px] border-b border-hairline text-[9px]">
        <span>Gaji</span>
        <span style={{ color: "var(--good)" }}>Rp 15.000.000</span>
      </div>

      <div className="text-[9px] text-text-muted uppercase tracking-wide mt-3.5 mb-1.5">Pengeluaran tetap</div>
      {FIXED_EXPENSE_ROWS.map((f) => (
        <div key={f.label} className="flex justify-between py-[7px] border-b border-hairline text-[9px] last:border-b-0">
          <span>{f.label}</span>
          <span style={{ color: "var(--critical)" }}>{f.amount}</span>
        </div>
      ))}

      <div className="bg-bg-raised border border-hairline rounded-2xl p-3 shadow-[var(--shadow-card)] mt-4">
        <div className="text-[8px] text-text-dim mb-0.5">Free Cash Flow bulanan</div>
        <div className="serif text-[17px]" style={{ color: "var(--good)" }}>
          Rp 6.900.000
        </div>
      </div>
    </Screen>
  );
}

const SETTINGS_ROWS = [
  { icon: "👤", label: "Profil", value: "Dinda" },
  { icon: "🏷️", label: "Kategori Aset & Utang", value: "" },
  { icon: "📊", label: "Budget Bulanan", value: "" },
  { icon: "🌐", label: "Bahasa", value: "Indonesia" },
  { icon: "🌙", label: "Tema", value: "Sistem" },
  { icon: "🚪", label: "Keluar", value: "" },
];

function ScreenPengaturan({ opacity }: { opacity: number }) {
  return (
    <Screen opacity={opacity}>
      <div className="serif text-[15px] mb-3.5">⚙️ Pengaturan</div>
      {SETTINGS_ROWS.map((s) => (
        <div key={s.label} className="flex items-center justify-between py-[9px] border-b border-hairline last:border-b-0">
          <div className="flex items-center gap-2 text-[9px]">
            <span>{s.icon}</span> {s.label}
          </div>
          <div className="text-[8px] text-text-dim">{s.value}</div>
        </div>
      ))}
    </Screen>
  );
}

export function PhoneMockup() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % 5), SLIDE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      <div className="rounded-[40px] border-[6px] border-[#1c1b18] bg-[#1c1b18] shadow-[0_30px_80px_-20px_rgba(30,25,10,0.45)] overflow-hidden">
        <div className="h-[580px] overflow-hidden relative" style={{ background: "var(--hero-grad)" }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#1c1b18] rounded-b-2xl z-20" />

          <ScreenHome opacity={active === 0 ? 1 : 0} />
          <ScreenTransaksi opacity={active === 1 ? 1 : 0} />
          <ScreenSummary opacity={active === 2 ? 1 : 0} />
          <ScreenArusKas opacity={active === 3 ? 1 : 0} />
          <ScreenPengaturan opacity={active === 4 ? 1 : 0} />

          <div className="absolute left-0 right-0 bottom-0 h-[46px] bg-bg-raised/90 backdrop-blur-sm border-t border-hairline flex items-center justify-around z-20">
            {NAV_ICONS.map((Icon, i) => (
              <Icon
                key={i}
                size={15}
                strokeWidth={active === i ? 2.25 : 1.75}
                style={{ color: active === i ? "var(--brand-strong)" : "var(--text-muted)" }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
