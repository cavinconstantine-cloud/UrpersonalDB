"use client";

import { useState } from "react";
import { fmtRp } from "@/lib/finance/format";
import { InvestmentEducationModal } from "./investment-education-modal";

export type DiversificationInsight =
  | { kind: "idle-cash"; idleSurplus: number; cashBalance: number; emergencyFundTarget: number }
  | { kind: "goal-linked"; idleSurplus: number; goalName: string; monthlyNeed: number; fcf: number }
  | { kind: "windfall"; increaseAmount: number; priorCash: number; currentCash: number }
  | { kind: "first-timer" };

export function DiversificationInsightCard({ insight }: { insight: DiversificationInsight }) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const isFirstTimer = insight.kind === "first-timer";

  const eyebrow =
    insight.kind === "first-timer"
      ? "🌱 Langkah Pertama"
      : insight.kind === "goal-linked"
        ? "🎯 Percepat Goal"
        : insight.kind === "windfall"
          ? "📈 Baru Masuk"
          : "💡 Insight";

  const title =
    insight.kind === "first-timer"
      ? "100% asetmu masih di Cash"
      : insight.kind === "goal-linked"
        ? `Goal "${insight.goalName}" perlu ${fmtRp(insight.monthlyNeed)}/bln, FCF kamu ${fmtRp(insight.fcf)}`
        : insight.kind === "windfall"
          ? `${fmtRp(insight.increaseAmount)} baru masuk ke Cash dalam sebulan terakhir`
          : `${fmtRp(insight.idleSurplus)} lebih dari dana darurat idealmu`;

  const body =
    insight.kind === "first-timer"
      ? "Nggak masalah — banyak yang mulai dari sini. Kalau suatu saat mau coba diversifikasi sedikit, ada opsi yang risikonya mirip tabungan tapi potensi hasilnya lebih baik."
      : insight.kind === "goal-linked"
        ? `Ada ${fmtRp(insight.idleSurplus)} nganggur di Cash. Dialokasikan ke instrumen yang cocok sama timeline goal ini bisa bantu kejar target lebih cepat — nggak cuma ngandelin nabung manual.`
        : insight.kind === "windfall"
          ? "Belum keliatan rencana buat dana ini di goals kamu. Sebelum kepakai buat hal lain, mau dipertimbangkan buat instrumen yang lebih efektif dulu?"
          : `Dana darurat ideal kamu sekitar ${fmtRp(insight.emergencyFundTarget)}. Saldo Cash kamu ${fmtRp(insight.cashBalance)} — ada ${fmtRp(insight.idleSurplus)} yang bisa dialokasikan tanpa ganggu safety net.`;

  const ctaLabel = isFirstTimer ? "Pelajari, nggak buru-buru" : "Lihat opsi lain";

  return (
    <div
      className="mx-5 mb-4 p-4 rounded-2xl border shadow-[var(--shadow-card)]"
      style={{
        background: isFirstTimer ? "var(--bg-raised)" : "linear-gradient(155deg, var(--brand-wash), var(--bg-raised) 60%)",
        borderColor: isFirstTimer ? "var(--hairline)" : "rgba(124,110,242,0.3)",
      }}
    >
      <button type="button" onClick={() => !isFirstTimer && setOpen((v) => !v)} className="w-full text-left">
        <div
          className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-wide uppercase mb-1.5"
          style={{ color: isFirstTimer ? "var(--text-dim)" : "var(--brand-strong)" }}
        >
          {eyebrow}
        </div>
        <p className="text-[14.5px] font-medium leading-snug mb-1">{title}</p>
        <p className="text-[12px] text-text-dim leading-relaxed">{body}</p>
      </button>

      {!isFirstTimer && open && (
        <div className="pt-3 mt-3 border-t border-hairline">
          <div className="flex flex-col gap-1.5 mb-2">
            <div className="flex justify-between items-baseline text-[12px]">
              <span className="font-medium">Tabungan biasa (posisi kamu)</span>
              <span className="text-text-dim">~0–2%/thn</span>
            </div>
            <div className="flex justify-between items-baseline text-[12px]">
              <span>Reksadana Pasar Uang</span>
              <span className="text-good font-medium">~4–6%/thn*</span>
            </div>
            <div className="flex justify-between items-baseline text-[12px]">
              <span>Obligasi Ritel (SBN)</span>
              <span className="text-good font-medium">~6–7%/thn*</span>
            </div>
          </div>
          <p className="text-[10.5px] text-text-muted leading-relaxed mb-3">
            *Angka historis/ilustratif, bukan jaminan return masa depan. Sesuaikan dengan profil risiko &amp;
            kebutuhan likuiditasmu — ini bukan rekomendasi beli produk tertentu.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="mt-3 w-full rounded-xl bg-brand text-brand-ink py-2.5 text-[13px] font-medium"
      >
        {ctaLabel} →
      </button>

      <InvestmentEducationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
