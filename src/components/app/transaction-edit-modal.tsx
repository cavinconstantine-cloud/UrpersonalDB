"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { NumberField } from "@/components/ui/number-field";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { expenseCatIcon, incomeCatIcon } from "@/lib/finance/constants";
import { updateExpense, deleteExpense } from "@/app/app/expenses/actions";
import { updateIncome, deleteIncome } from "@/app/app/incomes/actions";
import type { CashAccount, TransactionType } from "./transaction-modal";

interface TransactionEditModalProps {
  open: boolean;
  onClose: () => void;
  type: TransactionType;
  categories: string[];
  cashAccounts: CashAccount[];
  transaction: {
    id: string;
    date: string;
    category: string;
    amount: number;
    description: string;
    accountHoldingId: string | null;
  };
}

export function TransactionEditModal({
  open,
  onClose,
  type,
  categories,
  cashAccounts,
  transaction,
}: TransactionEditModalProps) {
  const router = useRouter();
  const toast = useToast();
  const isExpense = type === "expense";
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(transaction.date);
  const [category, setCategory] = useState(transaction.category);
  const [amount, setAmount] = useState(transaction.amount);
  const [description, setDescription] = useState(transaction.description);
  const [accountHoldingId, setAccountHoldingId] = useState<string | null>(transaction.accountHoldingId);
  const [error, setError] = useState("");

  function save() {
    setError("");
    startTransition(async () => {
      try {
        const payload = { date, category, amount, description, accountHoldingId };
        if (isExpense) await updateExpense(transaction.id, payload);
        else await updateIncome(transaction.id, payload);
        router.refresh();
        toast.success("Perubahan tersimpan");
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan — coba lagi.");
      }
    });
  }

  function remove() {
    setError("");
    startTransition(async () => {
      try {
        if (isExpense) await deleteExpense(transaction.id);
        else await deleteIncome(transaction.id);
        router.refresh();
        toast.success(isExpense ? "Pengeluaran dihapus" : "Pemasukan dihapus");
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menghapus — coba lagi.");
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={isExpense ? "Edit pengeluaran" : "Edit pemasukan"}>
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {(isExpense ? expenseCatIcon : incomeCatIcon)(c)} {c}
          </Chip>
        ))}
      </div>
      {cashAccounts.length > 0 && (
        <div className="mb-4">
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-sm font-medium">Sumber Dana</span>
            <span className="text-xs text-text-muted">(opsional)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {cashAccounts.map((a) => (
              <Chip
                key={a.id}
                active={accountHoldingId === a.id}
                onClick={() => setAccountHoldingId(accountHoldingId === a.id ? null : a.id)}
              >
                🏦 {a.label}
              </Chip>
            ))}
          </div>
        </div>
      )}
      <TextField label="Tanggal" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <NumberField label="Jumlah (Rp)" value={amount} onValueChange={setAmount} />
      <TextField label="Detail / catatan" type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
      {error && (
        <div className="mb-3 text-[12.5px] text-critical bg-critical/10 border border-critical/30 rounded-lg px-3 py-2.5 leading-relaxed">
          ⚠️ {error}
        </div>
      )}
      <Button fullWidth onClick={save} disabled={isPending}>
        {isPending ? (
          <>
            <Spinner size={14} /> Menyimpan…
          </>
        ) : (
          "Simpan perubahan"
        )}
      </Button>
      <Button fullWidth variant="ghost" className="mt-2.5 text-critical" onClick={remove} disabled={isPending}>
        {isPending ? <Spinner size={14} /> : "Hapus"}
      </Button>
      <Button fullWidth variant="ghost" className="mt-2.5" onClick={onClose}>
        Batal
      </Button>
    </Modal>
  );
}
