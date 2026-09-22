"use client";

import { Button } from "@/components/ui/button";
import { ProgressDots } from "@/components/ui/chip";
import { SchemaForm } from "@/components/finance/schema-form";
import { LIAB_SCHEMAS } from "@/lib/finance/schemas";
import type { HoldingData } from "@/lib/finance/types";
import type { OnboardingDraft } from "@/lib/onboarding/draft";

export function LiabInputStep({
  draft,
  update,
}: {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}) {
  const cat = draft.liabCats[draft.liabIdx];
  const schema = LIAB_SCHEMAS[cat];
  const values = draft.liabData[cat] || {};

  function onChange(key: string, value: string) {
    const nextValues: HoldingData = { ...values, [key]: value };
    update({ liabData: { ...draft.liabData, [cat]: nextValues } });
  }

  function back() {
    if (draft.liabIdx === 0) {
      update({ step: "liabPick" });
      return;
    }
    update({ liabIdx: draft.liabIdx - 1 });
  }

  function next() {
    // normalize numeric fields
    const normalized: HoldingData = {};
    schema.fields.forEach((f) => {
      normalized[f.key] = Number(values[f.key]) || 0;
    });
    const nextLiabData = { ...draft.liabData, [cat]: normalized };
    if (draft.liabIdx < draft.liabCats.length - 1) {
      update({ liabData: nextLiabData, liabIdx: draft.liabIdx + 1 });
    } else {
      update({ liabData: nextLiabData, step: "cashflow" });
    }
  }

  return (
    <div>
      <ProgressDots current={3} total={5} />
      <h1 className="serif text-[26px] font-medium mb-2">{cat}</h1>
      <p className="text-text-dim text-sm mb-6 leading-relaxed">Isi sesuai perjanjian atau billing statement terakhir.</p>
      <SchemaForm fields={schema.fields} values={values} onChange={onChange} noteText={schema.note?.(values)} />
      <div className="flex gap-2.5 mt-2">
        <Button variant="ghost" onClick={back} className="w-[90px] flex-none">
          Kembali
        </Button>
        <Button onClick={next} className="flex-1">
          {draft.liabIdx < draft.liabCats.length - 1 ? "Lanjut" : "Lanjut ke Cash Flow"}
        </Button>
      </div>
    </div>
  );
}
