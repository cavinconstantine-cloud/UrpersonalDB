"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HoldingModal } from "@/components/finance/holding-modal";
import { Button } from "@/components/ui/button";
import { ASSET_SCHEMAS } from "@/lib/finance/schemas";
import { fmtRp } from "@/lib/finance/format";
import { addHolding, updateHolding, deleteHolding, removeAssetCategory } from "@/app/app/assets/actions";
import type { HoldingData } from "@/lib/finance/types";

interface Holding {
  id: string;
  data: HoldingData;
}

export function AssetCategoryManager({ category, holdings }: { category: string; holdings: Holding[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<{ open: boolean; holding?: Holding }>({ open: false });
  const schema = ASSET_SCHEMAS[category];

  const total = holdings.reduce((s, h) => s + schema.value(h.data), 0);
  const buyTotal = schema.buyValue ? holdings.reduce((s, h) => s + schema.buyValue!(h.data), 0) : null;
  const gain = buyTotal !== null ? total - buyTotal : null;

  function save(data: HoldingData) {
    startTransition(async () => {
      if (modal.holding) await updateHolding(modal.holding.id, data);
      else await addHolding(category, data);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteHolding(id, category);
      router.refresh();
    });
  }

  function removeCategory() {
    if (!confirm(`Hapus kategori "${category}" beserta semua datanya?`)) return;
    startTransition(async () => {
      await removeAssetCategory(category);
      router.push("/app");
    });
  }

  return (
    <div>
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
        <div className="text-sm text-text-dim py-2 mb-6">Belum ada data ditambahkan.</div>
      ) : (
        <div className="mb-6">
          {holdings.map((h) => {
            const v = schema.value(h.data);
            const bv = schema.buyValue ? schema.buyValue(h.data) : null;
            const g = bv !== null ? v - bv : null;
            const noteVal = schema.note ? schema.note(h.data) : "";
            return (
              <button
                key={h.id}
                onClick={() => setModal({ open: true, holding: h })}
                className="w-full flex items-start justify-between gap-3 py-3 border-b border-hairline text-sm text-left last:border-b-0"
              >
                <div>
                  <div>{String(h.data.label || category)}</div>
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

      <Button variant="danger" fullWidth onClick={removeCategory} disabled={isPending}>
        Hapus kategori ini
      </Button>

      {modal.open && (
        <HoldingModal
          key={modal.holding?.id ?? "new"}
          open={modal.open}
          onClose={() => setModal({ open: false })}
          title={category}
          fields={schema.fields}
          initial={modal.holding?.data}
          note={schema.note}
          onSave={save}
          onDelete={modal.holding ? () => remove(modal.holding!.id) : undefined}
        />
      )}
    </div>
  );
}
