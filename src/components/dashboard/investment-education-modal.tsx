"use client";

import { Modal } from "@/components/ui/modal";

interface InstrumentInfo {
  icon: string;
  name: string;
  risk: string;
  desc: string;
}

const INSTRUMENTS: InstrumentInfo[] = [
  {
    icon: "💧",
    name: "Reksadana Pasar Uang",
    risk: "Risiko rendah",
    desc: "Mirip tabungan tapi potensi hasilnya biasanya lebih baik. Cocok buat dana darurat atau tujuan jangka pendek (<1-2 tahun) — nilainya relatif stabil.",
  },
  {
    icon: "📜",
    name: "Obligasi Ritel (SBN)",
    risk: "Risiko rendah-menengah",
    desc: "Diterbitkan pemerintah, ada kupon/bunga rutin dan jangka waktu tertentu. Relatif aman, tapi dana terkunci sampai jatuh tempo (atau bisa dijual lebih awal dengan harga pasar).",
  },
  {
    icon: "📈",
    name: "Reksadana Saham / Saham",
    risk: "Risiko lebih tinggi",
    desc: "Potensi hasil lebih besar dalam jangka panjang, tapi nilainya naik-turun signifikan dalam jangka pendek. Cocok buat tujuan jangka panjang (>5 tahun) dan yang siap dengan fluktuasi.",
  },
];

export function InvestmentEducationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Kenalan sama Opsi Investasi">
      <p className="text-[13px] text-text-dim leading-relaxed mb-4">
        Ini gambaran umum, bukan rekomendasi beli produk tertentu — Uangku belum bekerja sama resmi dengan
        platform manapun. Sesuaikan pilihan dengan profil risiko &amp; kebutuhan likuiditas kamu sendiri.
      </p>

      <div className="flex flex-col gap-3 mb-4">
        {INSTRUMENTS.map((it) => (
          <div key={it.name} className="rounded-xl border border-hairline bg-bg-raised p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base leading-none">{it.icon}</span>
              <span className="text-[13.5px] font-medium">{it.name}</span>
              <span className="text-[10px] font-medium text-text-muted bg-bg-sunken rounded-full px-2 py-0.5 ml-auto">
                {it.risk}
              </span>
            </div>
            <p className="text-[12px] text-text-dim leading-relaxed">{it.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-text-muted leading-relaxed">
        Instrumen-instrumen ini umumnya bisa dibuka lewat platform investasi berizin OJK, mis. Bibit, Bareksa,
        Ajaib, atau Pluang. Angka return di kartu insight itu ilustratif/historis, bukan jaminan hasil masa
        depan.
      </p>
    </Modal>
  );
}
