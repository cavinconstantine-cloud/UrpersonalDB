"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { NumberInput } from "@/components/ui/number-field";
import { fmtRp } from "@/lib/finance/format";
import type { CashAccount } from "./transaction-modal";

export interface RecurringItem {
  id: string;
  label: string;
  amount: number;
  accountHoldingId: string | null;
}

interface RecurringItemsManagerProps {
  title: string;
  addPlaceholder: string;
  items: RecurringItem[];
  cashAccounts: CashAccount[];
  onAdd: (label: string, amount: number, accountHoldingId: string) => Promise<void>;
  onUpdate: (id: string, label: string, amount: number, accountHoldingId: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function accountLabel(id: string | null, cashAccounts: CashAccount[]): string | null {
  if (!id) return null;
  return cashAccounts.find((a) => a.id === id)?.label ?? null;
}

export function RecurringItemsManager({
  title,
  addPlaceholder,
  items,
  cashAccounts,
  onAdd,
  onUpdate,
  onDelete,
}: RecurringItemsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState(items);
  const [synced, setSynced] = useState(items);
  if (items !== synced) {
    setSynced(items);
    setLocal(items);
  }

  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState(0);
  const [newAccountId, setNewAccountId] = useState<string | null>(null);

  const total = local.reduce((s, i) => s + i.amount, 0);
  const hasCashAccounts = cashAccounts.length > 0;

  function patchLocal(id: string, patch: Partial<RecurringItem>) {
    setLocal((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function commit(item: RecurringItem) {
    if (!item.accountHoldingId) return;
    startTransition(async () => {
      await onUpdate(item.id, item.label, item.amount, item.accountHoldingId!);
      router.refresh();
    });
  }

  function pickAccountForExisting(item: RecurringItem, accountId: string) {
    patchLocal(item.id, { accountHoldingId: accountId });
    startTransition(async () => {
      await onUpdate(item.id, item.label, item.amount, accountId);
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
    if (!label || newAmount <= 0 || !newAccountId) return;
    startTransition(async () => {
      await onAdd(label, newAmount, newAccountId);
      router.refresh();
    });
    setNewLabel("");
    setNewAmount(0);
    setNewAccountId(null);
  }

  const canAdd = Boolean(newLabel.trim()) && newAmount > 0 && Boolean(newAccountId);

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
          {local.map((item) => {
            const acctLabel = accountLabel(item.accountHoldingId, cashAccounts);
            return (
              <div key={item.id} className="py-2 border-b border-hairline last:border-b-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => patchLocal(item.id, { label: e.target.value })}
                    onBlur={() => commit(local.find((i) => i.id === item.id)!)}
                    className="flex-1 min-w-0 text-sm px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text"
                  />
                  <NumberInput
                    value={item.amount}
                    onValueChange={(n) => patchLocal(item.id, { amount: n })}
                    onBlur={() => commit(local.find((i) => i.id === item.id)!)}
                    placeholder="0"
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
                {acctLabel ? (
                  <div className="mt-1.5 text-xs text-text-dim">🏦 {acctLabel}</div>
                ) : hasCashAccounts ? (
                  <div className="mt-1.5">
                    <div className="text-[11px] text-warning font-medium mb-1">⚠️ Pilih rekening</div>
                    <div className="flex flex-wrap gap-1.5">
                      {cashAccounts.map((a) => (
                        <Chip
                          key={a.id}
                          className="px-2.5 py-1 text-[11px]"
                          onClick={() => pickAccountForExisting(item, a.id)}
                        >
                          🏦 {a.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-1.5 text-[11px] text-warning">⚠️ Belum ada rekening — tambah dulu di Aset → Cash</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!hasCashAccounts && (
        <div className="text-[11.5px] text-text-dim bg-bg-input border border-hairline rounded-lg px-3 py-2.5 mb-3 leading-relaxed">
          Tambahin minimal 1 rekening dulu di <span className="text-text font-medium">Aset → Cash</span> sebelum bisa
          nambah item baru — tiap item harus terhubung ke rekening.
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder={addPlaceholder}
          disabled={!hasCashAccounts}
          className="flex-1 min-w-0 text-sm px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text disabled:opacity-50"
        />
        <NumberInput
          value={newAmount}
          onValueChange={setNewAmount}
          placeholder="Rp"
          disabled={!hasCashAccounts}
          className="w-[130px] text-sm px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text disabled:opacity-50"
        />
      </div>
      {hasCashAccounts && (
        <div className="mb-2">
          <div className="text-[11px] text-text-dim mb-1.5">Rekening</div>
          <div className="flex flex-wrap gap-1.5">
            {cashAccounts.map((a) => (
              <Chip
                key={a.id}
                active={newAccountId === a.id}
                className="px-2.5 py-1 text-[11px]"
                onClick={() => setNewAccountId(newAccountId === a.id ? null : a.id)}
              >
                🏦 {a.label}
              </Chip>
            ))}
          </div>
        </div>
      )}
      <Button size="sm" className="mt-1" onClick={add} disabled={isPending || !canAdd}>
        + Tambah
      </Button>
    </div>
  );
}
