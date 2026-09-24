"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { NumberInput } from "@/components/ui/number-field";
import { Spinner } from "@/components/ui/spinner";
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

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Gagal menyimpan — coba lagi.";
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
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  const total = local.reduce((s, i) => s + i.amount, 0);
  const hasCashAccounts = cashAccounts.length > 0;

  function patchLocal(id: string, patch: Partial<RecurringItem>) {
    setLocal((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function commit(item: RecurringItem) {
    if (!item.accountHoldingId) return;
    setError(null);
    setSavingId(item.id);
    startTransition(async () => {
      try {
        await onUpdate(item.id, item.label, item.amount, item.accountHoldingId!);
        router.refresh();
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setSavingId(null);
      }
    });
  }

  function pickAccountForExisting(item: RecurringItem, accountId: string) {
    setError(null);
    setSavingId(item.id);
    patchLocal(item.id, { accountHoldingId: accountId });
    startTransition(async () => {
      try {
        await onUpdate(item.id, item.label, item.amount, accountId);
        router.refresh();
      } catch (err) {
        setError(errorMessage(err));
        patchLocal(item.id, { accountHoldingId: null });
      } finally {
        setSavingId(null);
      }
    });
  }

  function remove(id: string) {
    setError(null);
    setSavingId(id);
    const removed = local.find((i) => i.id === id);
    setLocal((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      try {
        await onDelete(id);
        router.refresh();
      } catch (err) {
        setError(errorMessage(err));
        if (removed) setLocal((prev) => [...prev, removed]);
      } finally {
        setSavingId(null);
      }
    });
  }

  function add() {
    const label = newLabel.trim();
    if (!label || newAmount <= 0 || !newAccountId) return;
    setError(null);
    setAddingNew(true);
    startTransition(async () => {
      try {
        await onAdd(label, newAmount, newAccountId);
        router.refresh();
        setNewLabel("");
        setNewAmount(0);
        setNewAccountId(null);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setAddingNew(false);
      }
    });
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
            const rowSaving = isPending && savingId === item.id;
            return (
              <div key={item.id} className="py-2 border-b border-hairline last:border-b-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => patchLocal(item.id, { label: e.target.value })}
                    onBlur={() => commit(local.find((i) => i.id === item.id)!)}
                    disabled={rowSaving}
                    className="flex-1 min-w-0 text-sm px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text disabled:opacity-60"
                  />
                  <NumberInput
                    value={item.amount}
                    onValueChange={(n) => patchLocal(item.id, { amount: n })}
                    onBlur={() => commit(local.find((i) => i.id === item.id)!)}
                    placeholder="0"
                    disabled={rowSaving}
                    className="w-[130px] text-sm px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text disabled:opacity-60"
                  />
                  <button
                    onClick={() => remove(item.id)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 text-xs text-critical bg-critical/10 rounded-full px-2.5 py-1.5 shrink-0 disabled:opacity-50"
                  >
                    {rowSaving ? <Spinner size={12} /> : "Hapus"}
                  </button>
                </div>
                {acctLabel ? (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-text-dim">
                    🏦 {acctLabel}
                    {rowSaving && <Spinner size={11} className="text-text-dim" />}
                  </div>
                ) : hasCashAccounts ? (
                  <div className="mt-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-warning font-medium mb-1">
                      ⚠️ Pilih rekening
                      {rowSaving && <Spinner size={11} className="text-warning" />}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cashAccounts.map((a) => (
                        <Chip
                          key={a.id}
                          disabled={isPending}
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

      {error && (
        <div className="text-[11.5px] text-critical bg-critical/10 border border-critical/30 rounded-lg px-3 py-2.5 mb-3 leading-relaxed">
          ⚠️ {error}
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder={addPlaceholder}
          disabled={!hasCashAccounts || addingNew}
          className="flex-1 min-w-0 text-sm px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text disabled:opacity-50"
        />
        <NumberInput
          value={newAmount}
          onValueChange={setNewAmount}
          placeholder="Rp"
          disabled={!hasCashAccounts || addingNew}
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
                disabled={addingNew}
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
        {addingNew ? (
          <>
            <Spinner size={14} /> Menyimpan...
          </>
        ) : (
          "+ Tambah"
        )}
      </Button>
    </div>
  );
}
