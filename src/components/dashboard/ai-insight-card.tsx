"use client";

import { useState, useTransition } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { generateAiInsight } from "@/app/app/ai-actions";

/** Flip to true once Anthropic credit is topped up — see the Split Bill "Kartu ditolak / credit" thread. */
const AI_INSIGHT_ENABLED = false;

export function AiInsightCard({ available }: { available: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run() {
    if (!AI_INSIGHT_ENABLED) return;
    setError(null);
    startTransition(async () => {
      const res = await generateAiInsight();
      if (res.ok) setText(res.text || "");
      else setError(res.error || "Terjadi kendala.");
    });
  }

  if (!available) return null;

  if (!AI_INSIGHT_ENABLED) {
    return (
      <SectionCard title="✨ Ringkasan & Saran AI">
        <div className="pb-4 opacity-50">
          <p className="text-sm text-text-dim mb-3.5 leading-relaxed">
            Minta AI membaca kondisi keuanganmu saat ini dan memberi saran.
          </p>
          <button disabled className="w-full rounded-xl bg-brand text-brand-ink py-3 text-sm font-medium cursor-not-allowed">
            Analisa dengan AI <span className="font-normal">(segera hadir)</span>
          </button>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="✨ Ringkasan & Saran AI"
      action={
        text && !isPending ? (
          <button className="text-xs text-brand-strong bg-brand/10 rounded-full px-3 py-1.5 font-medium" onClick={run}>
            Perbarui
          </button>
        ) : null
      }
    >
      {isPending ? (
        <div className="text-sm text-text-dim text-center py-6">Menganalisa data keuanganmu…</div>
      ) : text ? (
        <div className="text-sm leading-relaxed whitespace-pre-wrap pb-4">{text}</div>
      ) : error ? (
        <div className="pb-4">
          <div className="rounded-lg border border-warning/40 bg-warning-wash text-warning text-[13px] px-3.5 py-3 mb-3 leading-relaxed">
            {error}
          </div>
          <button className="text-sm text-brand-strong" onClick={run}>
            Coba lagi
          </button>
        </div>
      ) : (
        <div className="pb-4">
          <p className="text-sm text-text-dim mb-3.5 leading-relaxed">
            Minta AI membaca kondisi keuanganmu saat ini dan memberi saran.
          </p>
          <button
            className="w-full rounded-xl bg-brand text-brand-ink py-3 text-sm font-medium"
            onClick={run}
          >
            Analisa dengan AI
          </button>
        </div>
      )}
    </SectionCard>
  );
}
