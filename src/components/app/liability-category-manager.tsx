"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HoldingModal } from "@/components/finance/holding-modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { LIAB_SCHEMAS, liabValue } from "@/lib/finance/schemas";
import { fmtRp } from "@/lib/finance/format";
import {
  addLiabilityHolding,
  updateLiabilityHolding,
  deleteLiabilityHolding,
  removeLiabilityCategory,
} from "@/app/app/liabilities/actions";
import type { HoldingData } from "@/lib/finance/types";

interface Holding {
  id: string;
  data: HoldingData;
}

export function LiabilityCategoryManager({ category, holdings }: { category: string; holdings: Holding[] }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<{ open: boolean; holding?: Holding }>({ open: false });
  const schema = LIAB_SCHEMAS[category];

  const total = holdings.reduce((s, h) => s + liabValue(h.data), 0);
  const monthlyTotal = holdings.reduce((s, h) => s + schema.monthlyPayment(h.data), 0);

  async function save(data: HoldingData) {
    if (modal.holding) await updateLiabilityHolding(modal.holding.id, data);
    else await addLiabilityHolding(category, data);
    router.refresh();
    toast.success("Utang tersimpan");
  }

  async function remove(id: string) {
    await deleteLiabilityHolding(id, category);
    router.refresh();
    toast.success("Utang dihapus");
  }

  function removeCategory() {
    if (!confirm(`Hapus kategori "${category}" beserta semua datanya?`)) return;
    startTransition(async () => {
      try {
        await removeLiabilityCategory(category);
        router.push("/app");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menghapus kategori — coba lagi.");
      }
    });
  }

  return (
    <div>
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
        <div className="text-sm text-text-dim py-2 mb-6">Belum ada data ditambahkan.</div>
      ) : (
        <div className="mb-6">
          {holdings.map((h) => {
            const v = liabValue(h.data);
            const noteVal = schema.note ? schema.note(h.data) : "";
            return (
              <button
                key={h.id}
                onClick={() => setModal({ open: true, holding: h })}
                className="w-full flex items-start justify-between gap-3 py-3 border-b border-hairline text-sm text-left last:border-b-0"
              >
                <div>
                  <div>{String(h.data.label || category)}</div>
                  {noteVal && <div className="text-xs text-text-dim">{noteVal}</div>}
                </div>
                <div>{fmtRp(v)}</div>
              </button>
            );
          })}
        </div>
      )}

      <Button variant="danger" fullWidth onClick={removeCategory} disabled={isPending}>
        {isPending ? <Spinner size={14} /> : "Hapus kategori ini"}
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
