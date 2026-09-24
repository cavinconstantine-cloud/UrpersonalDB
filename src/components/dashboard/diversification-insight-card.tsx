"use client";

import { useState } from "react";
import { fmtRp } from "@/lib/finance/format";

/**
 * No affiliate account is registered with any reksadana/obligasi platform
 * yet (Bibit/Bareksa/Ajaib/Pluang) — flip once real partner links exist.
 * Same pattern as AI_INSIGHT_ENABLED / SPLIT_BILL_ENABLED elsewhere in this
 * codebase: the insight itself is real and useful without it, so it ships
 * now with the CTA disabled rather than waiting on the partnership.
 */
const AFFILIATE_CTA_ENABLED = false;

export type DiversificationInsight =
  | { kind: "idle-cash"; idleSurplus: number; cashBalance: number; emergencyFundTarget: number }
  | { kind: "goal-linked"; idleSurplus: number; goalName: string; monthlyNeed: number; fcf: number }
  | { kind: "first-timer" };

export function DiversificationInsightCard({ insight }: { insight: DiversificationInsight }) {
  const [open, setOpen] = useState(false);
  const isFirstTimer = insight.kind === "first-timer";

  const eyebrow = isFirstTimer ? "🌱 Langkah Pertama" : insight.kind === "goal-linked" ? "🎯 Percepat Goal" : "💡 Insight";

  const title = isFirstTimer
    ? "100% asetmu masih di Cash"
    : insight.kind === "goal-linked"
      ? `Goal "${insight.goalName}" perlu ${fmtRp(insight.monthlyNeed)}/bln, FCF kamu ${fmtRp(insight.fcf)}`
      : `${fmtRp(insight.idleSurplus)} lebih dari dana darurat idealmu`;

  const body = isFirstTimer
    ? "Nggak masalah — banyak yang mulai dari sini. Kalau suatu saat mau coba diversifikasi sedikit, ada opsi yang risikonya mirip tabungan tapi potensi hasilnya lebih baik."
    : insight.kind === "goal-linked"
      ? `Ada ${fmtRp(insight.idleSurplus)} nganggur di Cash. Dialokasikan ke instrumen yang cocok sama timeline goal ini bisa bantu kejar target lebih cepat — nggak cuma ngandelin nabung manual.`
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
      <button
        type="button"
        onClick={() => !isFirstTimer && setOpen((v) => !v)}
        className="w-full text-left"
      >
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

      {AFFILIATE_CTA_ENABLED ? (
        <button
          type="button"
          className="mt-3 w-full rounded-xl bg-brand text-brand-ink py-2.5 text-[13px] font-medium"
        >
          {ctaLabel} →
        </button>
      ) : (
        <button
          disabled
          className="mt-3 w-full rounded-xl bg-brand text-brand-ink py-2.5 text-[13px] font-medium opacity-40 cursor-not-allowed"
        >
          {ctaLabel} <span className="font-normal">(segera hadir)</span>
        </button>
      )}
    </div>
  );
}
