"use client";

import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import type { OnboardingDraft } from "@/lib/onboarding/draft";

export function CashflowStep({
  draft,
  update,
}: {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}) {
  function set(key: keyof OnboardingDraft["cashflow"], value: number) {
    update({ cashflow: { ...draft.cashflow, [key]: value ? String(value) : "" } });
  }

  function back() {
    if (draft.liabCats.length === 0) {
      update({ step: "liabPick" });
      return;
    }
    update({ step: "liabInput", liabIdx: draft.liabCats.length - 1 });
  }

  return (
    <div>
      <h1 className="serif text-[26px] font-medium mb-2">Arus kas bulanan</h1>
      <p className="text-text-dim text-sm mb-7 leading-relaxed">Angka rata-rata per bulan cukup. Kamu bisa perbarui kapan saja.</p>
      <NumberField
        label="Income (Rp/bulan)"
        placeholder="0"
        value={Number(draft.cashflow.income) || 0}
        onValueChange={(n) => set("income", n)}
      />
      <NumberField
        label="Fixed expense — cicilan, sewa, sekolah (Rp/bulan)"
        placeholder="0"
        value={Number(draft.cashflow.fixedExpense) || 0}
        onValueChange={(n) => set("fixedExpense", n)}
      />
      <NumberField
        label="Lifestyle expense — belanja, hiburan (Rp/bulan)"
        placeholder="0"
        value={Number(draft.cashflow.lifestyleExpense) || 0}
        onValueChange={(n) => set("lifestyleExpense", n)}
      />
      <NumberField
        label="Investasi rutin (Rp/bulan)"
        placeholder="0"
        value={Number(draft.cashflow.invest) || 0}
        onValueChange={(n) => set("invest", n)}
      />
      <div className="flex gap-2.5 mt-2">
        <Button variant="ghost" onClick={back} className="w-[90px] flex-none">
          Kembali
        </Button>
        <Button onClick={() => update({ step: "goals" })} className="flex-1">
          Lanjut
        </Button>
      </div>
    </div>
  );
}
