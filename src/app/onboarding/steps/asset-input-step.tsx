"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProgressDots } from "@/components/ui/chip";
import { HoldingModal } from "@/components/finance/holding-modal";
import { ASSET_SCHEMAS } from "@/lib/finance/schemas";
import { fmtRp } from "@/lib/finance/format";
import type { HoldingData } from "@/lib/finance/types";
import type { OnboardingDraft } from "@/lib/onboarding/draft";

export function AssetInputStep({
  draft,
  update,
}: {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}) {
  const cat = draft.assetCats[draft.assetIdx];
  const schema = ASSET_SCHEMAS[cat];
  const holdings = draft.assetHoldings?.[cat] || [];
  const [modal, setModal] = useState<{ open: boolean; index?: number }>({ open: false });

  const total = holdings.reduce((s, h) => s + schema.value(h), 0);
  const buyTotal = schema.buyValue ? holdings.reduce((s, h) => s + schema.buyValue!(h), 0) : null;
  const gain = buyTotal !== null ? total - buyTotal : null;

  function setHoldings(next: HoldingData[]) {
    update({ assetHoldings: { ...draft.assetHoldings, [cat]: next } });
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
    if (draft.assetIdx === 0) {
      update({ step: "assetPick" });
      return;
    }
    update({ assetIdx: draft.assetIdx - 1 });
  }

  function next() {
    if (draft.assetIdx < draft.assetCats.length - 1) {
      update({ assetIdx: draft.assetIdx + 1 });
    } else {
      update({ step: "liabPick" });
    }
  }

  return (
    <div>
      <ProgressDots current={4} total={6} />
      <h1 className="serif text-[26px] font-medium mb-2">{cat}</h1>
      <p className="text-text-dim text-sm mb-3.5 leading-relaxed">
        Kamu bisa menambahkan lebih dari satu — mis. beberapa {cat === "Cash" ? "rekening" : "produk reksadana"}{" "}
        sekaligus.
      </p>

      {cat === "Cash" && (
        <div className="flex gap-2.5 bg-good/10 border border-good/30 rounded-2xl p-3.5 mb-6">
          <span className="text-base leading-tight shrink-0">💡</span>
          <p className="text-xs text-text-dim leading-relaxed">
            <span className="text-text font-medium">Tambahin semua rekeningmu di sini.</span> Nanti pas catat
            pengeluaran/pemasukan, kamu bisa pilih rekening mana yang kepakai lewat{" "}
            <span className="text-good font-medium">Sumber Dana</span> — saldo rekening itu otomatis ke-update
            sendiri, jadi nggak perlu itung manual.
          </p>
        </div>
      )}

      <div className={gain !== null ? "grid grid-cols-2 gap-2.5 mb-5" : "grid grid-cols-1 gap-2.5 mb-5"}>
        <div className="bg-bg-raised border border-hairline rounded-2xl p-3.5 shadow-[var(--shadow-card)]">
          <div className="text-xs text-text-dim mb-1">Total nilai sekarang</div>
          <div className="serif text-[19px]">{fmtRp(total)}</div>
        </div>
        {gain !== null && (
          <div className="bg-bg-raised border border-hairline rounded-2xl p-3.5 shadow-[var(--shadow-card)]">
            <div className="text-xs text-text-dim mb-1">Gain / loss</div>
            <div className="serif text-[19px]" style={{ color: gain >= 0 ? "var(--good)" : "var(--critical)" }}>
              {gain >= 0 ? "+" : ""}
              {fmtRp(gain)}
            </div>
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
            const v = schema.value(h);
            const bv = schema.buyValue ? schema.buyValue(h) : null;
            const g = bv !== null ? v - bv : null;
            const noteVal = schema.note ? schema.note(h) : "";
            return (
              <button
                key={i}
                onClick={() => setModal({ open: true, index: i })}
                className="w-full flex items-start justify-between gap-3 py-3 border-b border-hairline text-sm text-left last:border-b-0"
              >
                <div>
                  <div>{String(h.label || cat)}</div>
                  {g !== null && (
                    <div className="text-xs" style={{ color: g >= 0 ? "var(--good)" : "var(--critical)" }}>
                      {g >= 0 ? "+" : ""}
                      {fmtRp(g)} dari harga beli
                    </div>
                  )}
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
          {draft.assetIdx < draft.assetCats.length - 1 ? "Lanjut" : "Lanjut ke Utang"}
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
