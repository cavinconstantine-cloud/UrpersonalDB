"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { expenseCatIcon } from "@/lib/finance/constants";
import { updateExpense, deleteExpense } from "@/app/app/expenses/actions";

interface ExpenseEditModalProps {
  open: boolean;
  onClose: () => void;
  categories: string[];
  expense: { id: string; date: string; category: string; amount: number; description: string };
}

export function ExpenseEditModal({ open, onClose, categories, expense }: ExpenseEditModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(expense.date);
  const [category, setCategory] = useState(expense.category);
  const [amount, setAmount] = useState(String(expense.amount));
  const [description, setDescription] = useState(expense.description);

  function save() {
    startTransition(async () => {
      await updateExpense(expense.id, { date, category, amount: Number(amount) || 0, description });
      router.refresh();
      onClose();
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteExpense(expense.id);
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit pengeluaran">
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {expenseCatIcon(c)} {c}
          </Chip>
        ))}
      </div>
      <TextField label="Tanggal" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <TextField
        label="Jumlah (Rp)"
        type="number"
        inputMode="numeric"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
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
