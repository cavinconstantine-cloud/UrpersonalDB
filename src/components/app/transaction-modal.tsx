"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { NumberField } from "@/components/ui/number-field";
import { cn } from "@/lib/utils";
import { EXPENSE_CATS, INCOME_CATS, expenseCatIcon, incomeCatIcon } from "@/lib/finance/constants";
import { todayIso } from "@/lib/finance/format";
import { addExpense, addCustomExpenseCategory } from "@/app/app/expenses/actions";
import { addIncome, addCustomIncomeCategory } from "@/app/app/incomes/actions";
import { SplitBillFlow } from "@/components/app/split/split-bill-flow";

/** Flip to true once Anthropic credit is topped up — see the "Kartu ditolak / credit" thread. */
const SPLIT_BILL_ENABLED = false;

export type TransactionType = "expense" | "income";

export interface CashAccount {
  id: string;
  label: string;
}

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  customExpenseCategories: string[];
  customIncomeCategories: string[];
  cashAccounts: CashAccount[];
}

export function TransactionModal({
  open,
  onClose,
  defaultType = "expense",
  customExpenseCategories,
  customIncomeCategories,
  cashAccounts,
}: TransactionModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<TransactionType>(defaultType);
  const [category, setCategory] = useState<string>("");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [accountHoldingId, setAccountHoldingId] = useState<string | null>(null);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [localExpenseCats, setLocalExpenseCats] = useState<string[]>([]);
  const [localIncomeCats, setLocalIncomeCats] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [splitMode, setSplitMode] = useState(false);

  const isExpense = type === "expense";
  const baseCats = isExpense ? EXPENSE_CATS : INCOME_CATS;
  const customCats = isExpense ? customExpenseCategories : customIncomeCategories;
  const localCats = isExpense ? localExpenseCats : localIncomeCats;
  const allCats = [...baseCats, ...customCats, ...localCats.filter((c) => !customCats.includes(c))];
  const catIcon = isExpense ? expenseCatIcon : incomeCatIcon;

  function reset() {
    setCategory("");
    setAmount(0);
    setDescription("");
    setAccountHoldingId(null);
    setAddingCat(false);
    setNewCatName("");
    setError("");
    setSplitMode(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function switchType(next: TransactionType) {
    setType(next);
    setCategory("");
    setError("");
    setAddingCat(false);
    setSplitMode(false);
  }

  function addCategory() {
    const name = newCatName.trim();
    if (!name) return;
    if (!allCats.includes(name)) {
      if (isExpense) {
        setLocalExpenseCats((c) => [...c, name]);
        startTransition(() => addCustomExpenseCategory(name));
      } else {
        setLocalIncomeCats((c) => [...c, name]);
        startTransition(() => addCustomIncomeCategory(name));
      }
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
    if (!amount || amount <= 0) {
      setError("Isi jumlah yang valid");
      return;
    }
    startTransition(async () => {
      if (isExpense) {
        await addExpense({ date: todayIso(), category, amount, description, accountHoldingId });
      } else {
        await addIncome({ date: todayIso(), category, amount, description, accountHoldingId });
      }
      router.refresh();
      handleClose();
    });
  }

  return (
    <Modal open={open} onClose={handleClose} title="Catat transaksi">
      <div className="flex rounded-xl bg-bg-input p-1 mb-5">
        <button
          type="button"
          onClick={() => switchType("expense")}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-medium transition duration-150 active:scale-95",
            isExpense ? "bg-bg-raised text-text shadow-sm" : "text-text-dim",
          )}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => switchType("income")}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-medium transition duration-150 active:scale-95",
            !isExpense ? "bg-bg-raised text-good shadow-sm" : "text-text-dim",
          )}
        >
          Pemasukan
        </button>
      </div>

      {isExpense && (
        <button
          type="button"
          disabled={!SPLIT_BILL_ENABLED}
          onClick={() => SPLIT_BILL_ENABLED && setSplitMode((v) => !v)}
          className={cn(
            "w-full flex items-center justify-between gap-2 rounded-xl border border-hairline bg-bg-raised px-3.5 py-3 mb-4",
            !SPLIT_BILL_ENABLED && "opacity-50 cursor-not-allowed",
          )}
        >
          <span className="flex items-center gap-2 text-sm text-text">
            🧾 Mode Split Bill
            <span className="text-[9.5px] font-bold tracking-wide text-warning bg-warning/14 border border-warning/35 rounded-full px-1.5 py-0.5">
              BETA
            </span>
            {!SPLIT_BILL_ENABLED && <span className="text-xs text-text-muted font-normal">(segera hadir)</span>}
          </span>
          <span
            className={cn(
              "w-9 h-5 rounded-full relative transition-colors shrink-0",
              splitMode ? "bg-brand" : "bg-bg-input border border-hairline",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                splitMode ? "left-[18px]" : "left-0.5",
              )}
            />
          </span>
        </button>
      )}

      {isExpense && SPLIT_BILL_ENABLED && splitMode ? (
        <SplitBillFlow cashAccounts={cashAccounts} onDone={() => { router.refresh(); handleClose(); }} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {allCats.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {catIcon(c)} {c}
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
          {error && <div className="mb-3 text-xs text-critical">{error}</div>}
          <NumberField label="Jumlah (Rp)" placeholder="0" value={amount} onValueChange={setAmount} />
          <TextField
            label="Detail / catatan (opsional)"
            type="text"
            placeholder={isExpense ? "mis. makan siang di kantor" : "mis. transfer dari Budi"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button fullWidth onClick={save} disabled={isPending}>
            {isPending ? "Menyimpan…" : "Simpan"}
          </Button>
          <Button fullWidth variant="ghost" className="mt-2.5" onClick={handleClose}>
            Batal
          </Button>
        </>
      )}
    </Modal>
  );
}
