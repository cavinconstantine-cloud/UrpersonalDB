"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { NumberField } from "@/components/ui/number-field";
import { expenseCatIcon, incomeCatIcon } from "@/lib/finance/constants";
import { updateExpense, deleteExpense } from "@/app/app/expenses/actions";
import { updateIncome, deleteIncome } from "@/app/app/incomes/actions";
import type { TransactionType } from "./transaction-modal";

interface TransactionEditModalProps {
  open: boolean;
  onClose: () => void;
  type: TransactionType;
  categories: string[];
  transaction: { id: string; date: string; category: string; amount: number; description: string };
}

export function TransactionEditModal({ open, onClose, type, categories, transaction }: TransactionEditModalProps) {
  const router = useRouter();
  const isExpense = type === "expense";
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(transaction.date);
  const [category, setCategory] = useState(transaction.category);
  const [amount, setAmount] = useState(transaction.amount);
  const [description, setDescription] = useState(transaction.description);

  function save() {
    startTransition(async () => {
      const payload = { date, category, amount, description };
      if (isExpense) await updateExpense(transaction.id, payload);
      else await updateIncome(transaction.id, payload);
      router.refresh();
      onClose();
    });
  }

  function remove() {
    startTransition(async () => {
      if (isExpense) await deleteExpense(transaction.id);
      else await deleteIncome(transaction.id);
      router.refresh();
      onClose();
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
      <TextField label="Tanggal" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <NumberField label="Jumlah (Rp)" value={amount} onValueChange={setAmount} />
      <TextField label="Detail / catatan" type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Button fullWidth onClick={save} disabled={isPending}>
        {isPending ? "Menyimpan…" : "Simpan perubahan"}
      </Button>
      <Button fullWidth variant="ghost" className="mt-2.5 text-critical" onClick={remove} disabled={isPending}>
        Hapus
      </Button>
      <Button fullWidth variant="ghost" className="mt-2.5" onClick={onClose}>
        Batal
      </Button>
    </Modal>
  );
}
