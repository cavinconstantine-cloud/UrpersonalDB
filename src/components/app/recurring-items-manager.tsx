"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fmtRp } from "@/lib/finance/format";

export interface RecurringItem {
  id: string;
  label: string;
  amount: number;
}

interface RecurringItemsManagerProps {
  title: string;
  addPlaceholder: string;
  items: RecurringItem[];
  onAdd: (label: string, amount: number) => Promise<void>;
  onUpdate: (id: string, label: string, amount: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function RecurringItemsManager({ title, addPlaceholder, items, onAdd, onUpdate, onDelete }: RecurringItemsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState(items);
  const [synced, setSynced] = useState(items);
  if (items !== synced) {
    setSynced(items);
    setLocal(items);
  }

  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const total = local.reduce((s, i) => s + i.amount, 0);

  function patchLocal(id: string, patch: Partial<RecurringItem>) {
    setLocal((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function commit(item: RecurringItem) {
    startTransition(async () => {
      await onUpdate(item.id, item.label, item.amount);
      router.refresh();
    });
  }

  function remove(id: string) {
    setLocal((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      await onDelete(id);
      router.refresh();
    });
  }

  function add() {
    const label = newLabel.trim();
    const amount = Number(newAmount) || 0;
    if (!label || amount <= 0) return;
    startTransition(async () => {
      await onAdd(label, amount);
      router.refresh();
    });
    setNewLabel("");
    setNewAmount("");
  }

  return (
    <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
      <div className="flex justify-between items-baseline mb-3">
        <div className="serif text-[15px]">{title}</div>
        <div className="text-sm text-text-dim">{fmtRp(total)}/bln</div>
      </div>

      {local.length === 0 ? (
        <div className="text-sm text-text-dim mb-3">Belum ada item.</div>
      ) : (
        <div className="mb-3">
          {local.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-2 border-b border-hairline last:border-b-0">
              <input
                type="text"
                value={item.label}
                onChange={(e) => patchLocal(item.id, { label: e.target.value })}
                onBlur={() => commit(local.find((i) => i.id === item.id)!)}
                className="flex-1 min-w-0 text-sm px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text"
              />
              <input
                type="number"
                inputMode="numeric"
                value={item.amount}
                onChange={(e) => patchLocal(item.id, { amount: Number(e.target.value) || 0 })}
                onBlur={() => commit(local.find((i) => i.id === item.id)!)}
                className="w-[130px] text-sm px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text"
              />
              <button
                onClick={() => remove(item.id)}
                disabled={isPending}
                className="text-xs text-critical bg-critical/10 rounded-full px-2.5 py-1.5 shrink-0"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder={addPlaceholder}
          className="flex-1 min-w-0 text-sm px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text"
        />
        <input
          type="number"
          inputMode="numeric"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          placeholder="Rp"
          className="w-[130px] text-sm px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text"
        />
      </div>
      <Button size="sm" className="mt-2.5" onClick={add} disabled={isPending}>
        + Tambah
      </Button>
    </div>
  );
}
