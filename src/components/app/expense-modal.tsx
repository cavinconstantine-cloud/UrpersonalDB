"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { EXPENSE_CATS, expenseCatIcon } from "@/lib/finance/constants";
import { todayIso } from "@/lib/finance/format";
import { addExpense, addCustomExpenseCategory } from "@/app/app/expenses/actions";

interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
  customCategories: string[];
}

export function ExpenseModal({ open, onClose, customCategories }: ExpenseModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [localCats, setLocalCats] = useState<string[]>([]);
  const [error, setError] = useState("");

  const allCats = [...EXPENSE_CATS, ...customCategories, ...localCats.filter((c) => !customCategories.includes(c))];

  function reset() {
    setCategory("");
    setAmount("");
    setDescription("");
    setAddingCat(false);
    setNewCatName("");
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function addCategory() {
    const name = newCatName.trim();
    if (!name) return;
    if (!allCats.includes(name)) {
      setLocalCats((c) => [...c, name]);
      startTransition(() => addCustomExpenseCategory(name));
    }
    setCategory(name);
    setNewCatName("");
    setAddingCat(false);
  }

  function save() {
    if (!category) {
      setError("Pilih kategori dulu");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Isi jumlah yang valid");
      return;
    }
    startTransition(async () => {
      await addExpense({ date: todayIso(), category, amount: Number(amount), description });
      router.refresh();
      handleClose();
    });
  }

  return (
    <Modal open={open} onClose={handleClose} title="Catat pengeluaran">
      <div className="flex flex-wrap gap-2 mb-4">
        {allCats.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {expenseCatIcon(c)} {c}
          </Chip>
        ))}
        <Chip onClick={() => setAddingCat((v) => !v)}>+ Kategori baru</Chip>
      </div>
      {addingCat && (
        <div className="flex gap-2 -mt-2 mb-4">
          <input
            autoFocus
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            placeholder="Nama kategori baru"
            className="flex-1 px-3 py-2.5 rounded-lg border border-hairline bg-bg-input text-text text-sm"
          />
          <Button size="sm" variant="ghost" onClick={addCategory}>
            Tambah
          </Button>
        </div>
      )}
      {error && <div className="mb-3 text-xs text-critical">{error}</div>}
      <TextField
        label="Jumlah (Rp)"
        type="number"
        inputMode="numeric"
        placeholder="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <TextField
        label="Detail / catatan (opsional)"
        type="text"
        placeholder="mis. makan siang di kantor"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button fullWidth onClick={save} disabled={isPending}>
        {isPending ? "Menyimpan…" : "Simpan"}
      </Button>
      <Button fullWidth variant="ghost" className="mt-2.5" onClick={handleClose}>
        Batal
      </Button>
    </Modal>
  );
}
