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
import { cn } from "@/lib/utils";
import { BUSINESS_INCOME_CAT, EXPENSE_CATS, INCOME_CATS, expenseCatIcon, incomeCatIcon } from "@/lib/finance/constants";
import { fmtRp, todayIso } from "@/lib/finance/format";
import { addExpense, addCustomExpenseCategory } from "@/app/app/expenses/actions";
import { addIncome, addCustomIncomeCategory } from "@/app/app/incomes/actions";
import { SplitBillFlow } from "@/components/app/split/split-bill-flow";

/** Relaunched — Anthropic credit topped up (see the "Kartu ditolak / credit" thread). */
const SPLIT_BILL_ENABLED = true;

export type TransactionType = "expense" | "income";

export interface CashAccount {
  id: string;
  label: string;
}

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  defaultSplitMode?: boolean;
  customExpenseCategories: string[];
  customIncomeCategories: string[];
  cashAccounts: CashAccount[];
  userName?: string | null;
}

export function TransactionModal({
  open,
  onClose,
  defaultType = "expense",
  defaultSplitMode = false,
  customExpenseCategories,
  customIncomeCategories,
  cashAccounts,
  userName,
}: TransactionModalProps) {
  const router = useRouter();
  const toast = useToast();
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
  const [splitMode, setSplitMode] = useState(defaultSplitMode);
  const [taxOn, setTaxOn] = useState(true);
  const [taxType, setTaxType] = useState<"umkm" | "jasa">("umkm");

  const isExpense = type === "expense";
  const baseCats = isExpense ? EXPENSE_CATS : INCOME_CATS;
  const customCats = isExpense ? customExpenseCategories : customIncomeCategories;
  const localCats = isExpense ? localExpenseCats : localIncomeCats;
  const allCats = [...baseCats, ...customCats, ...localCats.filter((c) => !customCats.includes(c))];
  const catIcon = isExpense ? expenseCatIcon : incomeCatIcon;
  const isBusinessIncome = !isExpense && category === BUSINESS_INCOME_CAT;

  const taxRate = taxType === "umkm" ? 0.005 : 0.025;
  const taxAmount = isBusinessIncome && taxOn ? Math.round(amount * taxRate) : 0;
  const netAmount = amount - taxAmount;

  function reset() {
    setCategory("");
    setAmount(0);
    setDescription("");
    setAccountHoldingId(null);
    setAddingCat(false);
    setNewCatName("");
    setError("");
    setSplitMode(false);
    setTaxOn(true);
    setTaxType("umkm");
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
        startTransition(async () => {
          try {
            await addCustomExpenseCategory(name);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Gagal menyimpan kategori baru.");
          }
        });
      } else {
        setLocalIncomeCats((c) => [...c, name]);
        startTransition(async () => {
          try {
            await addCustomIncomeCategory(name);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Gagal menyimpan kategori baru.");
          }
        });
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
    setError("");
    startTransition(async () => {
      try {
        if (isExpense) {
          await addExpense({ date: todayIso(), category, amount, description, accountHoldingId });
        } else if (isBusinessIncome && taxOn) {
          const taxLabel = taxType === "umkm" ? "PPh Final UMKM 0,5%" : "PPh Non-Karyawan/Jasa ~2,5%";
          const taxNote = `Kotor ${fmtRp(amount)}, dipotong ${taxLabel} (${fmtRp(taxAmount)})`;
          await addIncome({
            date: todayIso(),
            category,
            amount: netAmount,
            description: description ? `${description} — ${taxNote}` : taxNote,
            accountHoldingId,
          });
        } else {
          await addIncome({ date: todayIso(), category, amount, description, accountHoldingId });
        }
        router.refresh();
        toast.success(isExpense ? "Pengeluaran tersimpan" : "Pemasukan tersimpan");
        handleClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan — coba lagi.");
      }
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
        <SplitBillFlow cashAccounts={cashAccounts} userName={userName} onDone={() => { router.refresh(); handleClose(); }} />
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
          <NumberField
            label={isBusinessIncome ? "Jumlah Kotor (Rp)" : "Jumlah (Rp)"}
            placeholder="0"
            value={amount}
            onValueChange={setAmount}
          />

          {isBusinessIncome && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setTaxOn((v) => !v)}
                className="w-full flex items-center justify-between gap-2.5 rounded-xl border border-hairline bg-bg-raised px-3.5 py-3 mb-3"
              >
                <span className="text-left">
                  <span className="block text-[13.5px] font-medium">Kena potong pajak?</span>
                  <span className="block text-[11px] text-text-muted">Kita bantu hitung otomatis</span>
                </span>
                <span
                  className={cn(
                    "w-[42px] h-6 rounded-full relative shrink-0 transition-colors",
                    taxOn ? "bg-brand" : "bg-bg-input border border-hairline",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all",
                      taxOn ? "left-[20px]" : "left-0.5",
                    )}
                  />
                </span>
              </button>

              {taxOn && (
                <>
                  <div className="text-xs text-text-dim mb-2">Jenis pajak</div>
                  <div className="flex flex-col gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setTaxType("umkm")}
                      className={cn(
                        "text-left px-3.5 py-3 rounded-xl border",
                        taxType === "umkm" ? "bg-brand/10 border-brand" : "bg-bg-raised border-hairline",
                      )}
                    >
                      <div className="text-[13px] font-medium">PPh Final UMKM — 0,5%</div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        PP 23/2018 — untuk usaha ber-omset ≤ Rp4,8M/tahun
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxType("jasa")}
                      className={cn(
                        "text-left px-3.5 py-3 rounded-xl border",
                        taxType === "jasa" ? "bg-brand/10 border-brand" : "bg-bg-raised border-hairline",
                      )}
                    >
                      <div className="text-[13px] font-medium">PPh Non-Karyawan / Jasa — ±2,5%</div>
                      <div className="text-[11px] text-text-muted mt-0.5">Perkiraan untuk pendapatan jasa/freelance</div>
                    </button>
                  </div>

                  <div className="bg-bg-raised border border-hairline rounded-2xl p-3.5 mb-2">
                    <div className="flex justify-between text-[13px] mb-2">
                      <span className="text-text-dim">Jumlah kotor</span>
                      <span>{fmtRp(amount)}</span>
                    </div>
                    <div className="flex justify-between text-[13px] mb-2">
                      <span className="text-text-dim">Pajak ({taxType === "umkm" ? "0,5%" : "2,5%"})</span>
                      <span className="text-critical">- {fmtRp(taxAmount)}</span>
                    </div>
                    <div className="border-t border-dashed border-hairline pt-2 flex justify-between items-baseline">
                      <span className="serif text-[13px]">Bersih masuk ke kas</span>
                      <span className="serif text-[16px] text-good">{fmtRp(netAmount)}</span>
                    </div>
                  </div>
                  <div className="text-[10.5px] text-text-muted leading-relaxed mb-1">
                    *Estimasi kasar — tarif pastinya tergantung status NPWP &amp; jenis usahamu. Konsultasikan ke
                    konsultan pajak buat kepastian.
                  </div>
                </>
              )}
            </div>
          )}

          <TextField
            label="Detail / catatan (opsional)"
            type="text"
            placeholder={isExpense ? "mis. makan siang di kantor" : "mis. transfer dari Budi"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button fullWidth onClick={save} disabled={isPending}>
            {isPending ? (
              <>
                <Spinner size={14} /> Menyimpan…
              </>
            ) : isBusinessIncome && taxOn ? (
              `Simpan (${fmtRp(netAmount)})`
            ) : (
              "Simpan"
            )}
          </Button>
          <Button fullWidth variant="ghost" className="mt-2.5" onClick={handleClose}>
            Batal
          </Button>
        </>
      )}
    </Modal>
  );
}
