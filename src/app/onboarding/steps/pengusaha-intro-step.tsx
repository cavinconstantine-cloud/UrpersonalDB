"use client";

import { Button } from "@/components/ui/button";
import type { OnboardingDraft } from "@/lib/onboarding/draft";

const BARS = [
  { label: "Jun", h: 30, active: false },
  { label: "Jul", h: 66, active: false },
  { label: "Agt", h: 18, active: false },
  { label: "Sep", h: 84, active: true },
];

const CHANGES = [
  {
    body: (
      <>
        <b className="text-text">Free Cash Flow</b> dihitung otomatis dari rata-rata pendapatan yang kamu{" "}
        <i>beneran catat</i> — makin sering catat, makin akurat.
      </>
    ),
  },
  {
    body: (
      <>
        Ada kategori <b className="text-text">&quot;Pendapatan Usaha&quot;</b> khusus, dengan opsi hitung otomatis
        potongan pajaknya.
      </>
    ),
  },
  {
    body: <>Fixed expense (sewa toko, gaji karyawan, dll) tetap bisa dicatat rutin seperti biasa.</>,
  },
];

export function PengusahaIntroStep({
  update,
}: {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}) {
  return (
    <div>
      <h1 className="serif text-[24px] font-medium mb-2">Pendapatanmu fleksibel — jadi hitungannya juga.</h1>
      <p className="text-text-dim text-[13.5px] mb-5 leading-relaxed">
        Kita nggak akan minta kamu isi &quot;pendapatan bulanan&quot; yang tetap. Itu nggak relevan buat kamu — bulan
        ini omset 5 juta, bulan depan bisa 40 juta.
      </p>

      <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-[18px]">
        <div className="text-[11px] text-text-muted mb-2.5">Ilustrasi: pendapatan 4 bulan terakhir</div>
        <div className="flex items-end gap-2.5 h-[84px] mb-2.5">
          {BARS.map((b) => (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t"
                style={{ height: `${b.h}px`, background: b.active ? "var(--brand)" : "rgba(124,110,242,0.4)" }}
              />
              <span className={b.active ? "text-[9.5px] font-semibold text-brand-strong" : "text-[9.5px] text-text-muted"}>
                {b.label}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-hairline pt-2.5 flex items-center justify-between">
          <span className="text-xs text-text-dim">📊 Rata-rata 3 bulan terakhir</span>
          <span className="serif text-[15px] text-good">Rp 24.100.000/bln</span>
        </div>
      </div>

      <div className="text-[13px] font-medium mb-2.5">Yang berubah buat kamu:</div>
      <div className="flex flex-col gap-2.5 mb-2">
        {CHANGES.map((c, i) => (
          <div key={i} className="flex gap-2.5 items-start">
            <span className="text-[15px] shrink-0">✅</span>
            <span className="text-[12.5px] text-text-dim leading-relaxed">{c.body}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2.5 mt-6">
        <Button variant="ghost" onClick={() => update({ step: "profileType" })} className="w-[90px] flex-none">
          Kembali
        </Button>
        <Button onClick={() => update({ step: "assetPick" })} className="flex-1">
          Mengerti, Lanjut
        </Button>
      </div>
    </div>
  );
}
