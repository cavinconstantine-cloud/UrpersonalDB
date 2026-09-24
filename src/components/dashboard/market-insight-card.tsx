"use client";

import { useState } from "react";
import { fmtRp, capNameOrKamu } from "@/lib/finance/format";
import { InvestmentEducationModal } from "./investment-education-modal";

/** IHSG drop worth surfacing — small daily wiggles aren't. */
export const IHSG_DROP_THRESHOLD_PCT = -2.5;

export function MarketInsightCard({
  ihsgChangePct,
  idleCash,
  name,
}: {
  ihsgChangePct: number;
  idleCash: number;
  name?: string | null;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  if (ihsgChangePct > IHSG_DROP_THRESHOLD_PCT || idleCash <= 0) return null;

  return (
    <div
      className="mx-5 mb-4 p-4 rounded-2xl border shadow-[var(--shadow-card)]"
      style={{ background: "var(--critical-wash)", borderColor: "rgba(193,54,47,0.3)" }}
    >
      <div className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-wide uppercase mb-1.5" style={{ color: "var(--critical)" }}>
        📉 IHSG Turun {Math.abs(ihsgChangePct).toFixed(1)}%
      </div>
      <p className="text-[14.5px] font-medium leading-snug mb-1">IHSG turun {Math.abs(ihsgChangePct).toFixed(1)}% hari ini</p>
      <p className="text-[12px] text-text-dim leading-relaxed mb-2">
        Historisnya, penurunan seperti ini kadang jadi entry point yang lebih menarik buat rencana investasi
        jangka panjang. {capNameOrKamu(name)} punya {fmtRp(idleCash)} nganggur di Cash.
      </p>
      <p className="text-[10.5px] text-text-muted leading-relaxed mb-3">
        Bukan ajakan beli sekarang — harga bisa terus turun. Timing pasar sulit diprediksi; sesuaikan dengan
        profil risiko &amp; horizon investasimu sebelum memutuskan.
      </p>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="w-full rounded-xl py-2.5 text-[13px] font-medium"
        style={{ background: "var(--critical)", color: "white" }}
      >
        Pelajari opsi investasi →
      </button>

      <InvestmentEducationModal open={modalOpen} onClose={() => setModalOpen(false)} name={name} />
    </div>
  );
}
