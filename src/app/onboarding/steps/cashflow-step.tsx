"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NumberField, NumberInput } from "@/components/ui/number-field";
import { fmtRp } from "@/lib/finance/format";
import type { OnboardingDraft } from "@/lib/onboarding/draft";

export function CashflowStep({
  draft,
  update,
}: {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState(0);

  function set(key: "income" | "lifestyleExpense" | "invest", value: number) {
    update({ cashflow: { ...draft.cashflow, [key]: value ? String(value) : "" } });
  }

  const fixedTotal = draft.fixedExpenseItems.reduce((s, it) => s + it.amount, 0);

  function addItem() {
    const label = newLabel.trim();
    if (!label || newAmount <= 0) return;
    update({ fixedExpenseItems: [...draft.fixedExpenseItems, { id: crypto.randomUUID(), label, amount: newAmount }] });
    setNewLabel("");
    setNewAmount(0);
  }

  function removeItem(id: string) {
    update({ fixedExpenseItems: draft.fixedExpenseItems.filter((it) => it.id !== id) });
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
      <p className="text-text-dim text-sm mb-4 leading-relaxed">Angka rata-rata per bulan cukup. Kamu bisa perbarui kapan saja.</p>

      <div className="flex gap-2.5 bg-brand/10 border border-brand/20 rounded-2xl p-3.5 mb-6">
        <span className="text-base leading-tight">💡</span>
        <p className="text-xs text-text-dim leading-relaxed">
          Kenapa ini ditanya? Income dikurangi semua pengeluaran dan investasi rutin ={" "}
          <span className="text-text font-medium">Free Cash Flow</span> bulananmu — angka utama yang dipakai di
          seluruh dashboard, termasuk saving rate dan progress goals. Fixed expense sekarang bisa dirinci per item —
          data yang sama dipakai di halaman <span className="text-text font-medium">Arus Kas Tetap</span>, jadi
          tidak perlu diisi dua kali nanti.
        </p>
      </div>

      <NumberField
        label="Income (Rp/bulan)"
        placeholder="0"
        value={Number(draft.cashflow.income) || 0}
        onValueChange={(n) => set("income", n)}
      />

      <div className="mb-[18px]">
        <div className="flex justify-between items-baseline mb-1.5">
          <label className="text-xs text-text-dim">Fixed expense — cicilan, sewa, sekolah</label>
          <span className="text-xs text-brand-strong font-medium">{fmtRp(fixedTotal)}/bln</span>
        </div>
        <div className="border border-hairline rounded-lg bg-bg-input p-2.5">
          {draft.fixedExpenseItems.length === 0 ? (
            <div className="text-xs text-text-dim py-1.5 px-1">Belum ada item.</div>
          ) : (
            draft.fixedExpenseItems.map((it) => (
              <div key={it.id} className="flex items-center gap-2 py-1.5 border-b border-hairline last:border-b-0">
                <span className="flex-1 min-w-0 text-sm truncate">{it.label}</span>
                <span className="text-sm text-text-dim shrink-0">{fmtRp(it.amount)}</span>
                <button
                  onClick={() => removeItem(it.id)}
                  className="text-xs text-critical bg-critical/10 rounded-full px-2.5 py-1 shrink-0"
                >
                  Hapus
                </button>
              </div>
            ))
          )}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="mis. Cicilan mobil"
              className="flex-1 min-w-0 text-sm px-2.5 py-2 rounded-md border border-hairline bg-bg text-text"
            />
            <NumberInput
              value={newAmount}
              onValueChange={setNewAmount}
              placeholder="Rp"
              className="w-[110px] text-sm px-2.5 py-2 rounded-md border border-hairline bg-bg text-text"
            />
          </div>
          <button
            onClick={addItem}
            className="w-full mt-2 text-sm text-text-dim border border-dashed border-hairline rounded-md py-2"
          >
            + Tambah item
          </button>
        </div>
      </div>

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
