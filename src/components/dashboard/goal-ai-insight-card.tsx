"use client";

import { useState, useTransition } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { Spinner } from "@/components/ui/spinner";
import { generateGoalAiInsight } from "@/app/app/ai-actions";

const AI_INSIGHT_ENABLED = false;

export function GoalAiInsightCard({ available }: { available: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run() {
    if (!AI_INSIGHT_ENABLED) return;
    setError(null);
    startTransition(async () => {
      const res = await generateGoalAiInsight();
      if (res.ok) setText(res.text || "");
      else setError(res.error || "Terjadi kendala.");
    });
  }

  if (!available) return null;

  if (!AI_INSIGHT_ENABLED) {
    return (
      <SectionCard title="🎯 Analisa Goal & Saran AI">
        <div className="pb-4 opacity-50">
          <p className="text-sm text-text-dim mb-3.5 leading-relaxed">
            Minta AI menganalisa progress goals-mu dan beri saran cara mencapainya.
          </p>
          <button disabled className="w-full rounded-xl bg-brand text-brand-ink py-3 text-sm font-medium cursor-not-allowed">
            Analisa Goals <span className="font-normal">(segera hadir)</span>
          </button>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="🎯 Analisa Goal & Saran AI"
      action={
        text && !isPending ? (
          <button className="text-xs text-brand-strong bg-brand/10 rounded-full px-3 py-1.5 font-medium" onClick={run}>
            Perbarui
          </button>
        ) : null
      }
    >
      {isPending ? (
        <div className="flex items-center justify-center gap-2 text-sm text-text-dim py-6">
          <Spinner size={15} /> Menganalisa goals-mu…
        </div>
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
            Minta AI menganalisa progress goals-mu dan beri saran cara mencapainya.
          </p>
          <button
            className="w-full rounded-xl bg-brand text-brand-ink py-3 text-sm font-medium"
            onClick={run}
          >
            Analisa Goals
          </button>
        </div>
      )}
    </SectionCard>
  );
}
