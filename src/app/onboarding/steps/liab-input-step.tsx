"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProgressDots } from "@/components/ui/chip";
import { HoldingModal } from "@/components/finance/holding-modal";
import { LIAB_SCHEMAS, liabValue } from "@/lib/finance/schemas";
import { fmtRp } from "@/lib/finance/format";
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
  const holdings = draft.liabHoldings?.[cat] || [];
  const [modal, setModal] = useState<{ open: boolean; index?: number }>({ open: false });

  const total = holdings.reduce((s, h) => s + liabValue(h), 0);
  const monthlyTotal = holdings.reduce((s, h) => s + schema.monthlyPayment(h), 0);

  function setHoldings(next: HoldingData[]) {
    update({ liabHoldings: { ...draft.liabHoldings, [cat]: next } });
  }

  function saveHolding(data: HoldingData) {
    const next = [...holdings];
    if (modal.index !== undefined) next[modal.index] = data;
    else next.push(data);
    setHoldings(next);
  }

  function deleteHolding(idx: number) {
    setHoldings(holdings.filter((_, i) => i !== idx));
  }

  function back() {
    if (draft.liabIdx === 0) {
      update({ step: "liabPick" });
      return;
    }
    update({ liabIdx: draft.liabIdx - 1 });
  }

  function next() {
    if (draft.liabIdx < draft.liabCats.length - 1) {
      update({ liabIdx: draft.liabIdx + 1 });
    } else {
      update({ step: "cashflow" });
    }
  }

  return (
    <div>
      <ProgressDots current={4} total={6} />
      <h1 className="serif text-[26px] font-medium mb-2">{cat}</h1>
      <p className="text-text-dim text-sm mb-6 leading-relaxed">
        Kamu bisa menambahkan lebih dari satu — mis. beberapa kartu kredit sekaligus.
      </p>

      <div className={monthlyTotal > 0 ? "grid grid-cols-2 gap-2.5 mb-5" : "grid grid-cols-1 gap-2.5 mb-5"}>
        <div className="bg-bg-raised border border-hairline rounded-2xl p-3.5 shadow-[var(--shadow-card)]">
          <div className="text-xs text-text-dim mb-1">Total outstanding</div>
          <div className="serif text-[19px]">{fmtRp(total)}</div>
        </div>
        {monthlyTotal > 0 && (
          <div className="bg-bg-raised border border-hairline rounded-2xl p-3.5 shadow-[var(--shadow-card)]">
            <div className="text-xs text-text-dim mb-1">Cicilan bulanan</div>
            <div className="serif text-[19px]">{fmtRp(monthlyTotal)}</div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-baseline mb-2.5">
        <div className="serif text-[15px]">Rincian</div>
        <button
          className="text-xs text-brand-strong bg-brand/10 rounded-full px-3 py-1.5 font-medium"
          onClick={() => setModal({ open: true })}
        >
          + Tambah
        </button>
      </div>

      {holdings.length === 0 ? (
        <div className="text-sm text-text-dim py-2 mb-4">Belum ada data ditambahkan.</div>
      ) : (
        <div className="mb-4">
          {holdings.map((h, i) => {
            const v = liabValue(h);
            const noteVal = schema.note ? schema.note(h) : "";
            return (
              <button
                key={i}
                onClick={() => setModal({ open: true, index: i })}
                className="w-full flex items-start justify-between gap-3 py-3 border-b border-hairline text-sm text-left last:border-b-0"
              >
                <div>
                  <div>{String(h.label || cat)}</div>
                  {noteVal && <div className="text-xs text-text-dim">{noteVal}</div>}
                </div>
                <div>{fmtRp(v)}</div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2.5 mt-6">
        <Button variant="ghost" onClick={back} className="w-[90px] flex-none">
          Kembali
        </Button>
        <Button onClick={next} className="flex-1">
          {draft.liabIdx < draft.liabCats.length - 1 ? "Lanjut" : "Lanjut ke Cash Flow"}
        </Button>
      </div>

      {modal.open && (
        <HoldingModal
          key={modal.index ?? "new"}
          open={modal.open}
          onClose={() => setModal({ open: false })}
          title={cat}
          fields={schema.fields}
          initial={modal.index !== undefined ? holdings[modal.index] : undefined}
          note={schema.note}
          onSave={saveHolding}
          onDelete={modal.index !== undefined ? () => deleteHolding(modal.index!) : undefined}
        />
      )}
    </div>
  );
}
