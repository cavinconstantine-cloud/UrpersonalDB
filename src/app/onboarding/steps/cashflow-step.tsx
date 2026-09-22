"use client";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import type { OnboardingDraft } from "@/lib/onboarding/draft";

export function CashflowStep({
  draft,
  update,
}: {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}) {
  function set(key: keyof OnboardingDraft["cashflow"], value: string) {
    update({ cashflow: { ...draft.cashflow, [key]: value } });
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
      <TextField
        label="Income (Rp/bulan)"
        type="number"
        inputMode="numeric"
        placeholder="0"
        value={draft.cashflow.income}
        onChange={(e) => set("income", e.target.value)}
      />
      <TextField
        label="Fixed expense — cicilan, sewa, sekolah (Rp/bulan)"
        type="number"
        inputMode="numeric"
        placeholder="0"
        value={draft.cashflow.fixedExpense}
        onChange={(e) => set("fixedExpense", e.target.value)}
      />
      <TextField
        label="Lifestyle expense — belanja, hiburan (Rp/bulan)"
        type="number"
        inputMode="numeric"
        placeholder="0"
        value={draft.cashflow.lifestyleExpense}
        onChange={(e) => set("lifestyleExpense", e.target.value)}
      />
      <TextField
        label="Investasi rutin (Rp/bulan)"
        type="number"
        inputMode="numeric"
        placeholder="0"
        value={draft.cashflow.invest}
        onChange={(e) => set("invest", e.target.value)}
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
