"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import { expenseCatIcon, incomeCatIcon } from "@/lib/finance/constants";
import { fmtRp } from "@/lib/finance/format";
import { TransactionList, type TxRow } from "./transaction-list";
import { TransactionPieChart } from "./transaction-pie-chart";
import type { CashAccount } from "./transaction-modal";

type Tipe = "semua" | "expense" | "income";
type SortBy = "newest" | "oldest" | "largest" | "smallest";

interface FilterState {
  tipe: Tipe;
  cats: string[];
  accounts: string[];
  sort: SortBy;
}

const DEFAULT_FILTERS: FilterState = { tipe: "semua", cats: [], accounts: [], sort: "newest" };

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: "newest", label: "↓ Terbaru" },
  { key: "oldest", label: "↑ Terlama" },
  { key: "largest", label: "Nominal terbesar" },
  { key: "smallest", label: "Nominal terkecil" },
];

const NO_ACCOUNT = "none";

export function TransactionsView({
  transactions,
  expenseCategories,
  incomeCategories,
  cashAccounts,
}: {
  transactions: TxRow[];
  expenseCategories: string[];
  incomeCategories: string[];
  cashAccounts: CashAccount[];
}) {
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [applied, setApplied] = useState<FilterState>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<FilterState>(DEFAULT_FILTERS);

  const pie = useMemo(() => {
    const byCat = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      byCat.set(t.category, (byCat.get(t.category) || 0) + t.amount);
    }
    const total = Array.from(byCat.values()).reduce((s, v) => s + v, 0);
    const slices = Array.from(byCat.entries())
      .map(([category, amount]) => ({ category, amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
    return { slices, total };
  }, [transactions]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = transactions.filter((t) => {
      if (query && !(t.description.toLowerCase().includes(query) || t.category.toLowerCase().includes(query))) return false;
      if (applied.tipe !== "semua" && t.type !== applied.tipe) return false;
      if (applied.cats.length > 0 && !applied.cats.includes(t.category)) return false;
      if (applied.accounts.length > 0) {
        const key = t.accountHoldingId || NO_ACCOUNT;
        if (!applied.accounts.includes(key)) return false;
      }
      return true;
    });
    const sortFns: Record<SortBy, (a: TxRow, b: TxRow) => number> = {
      newest: (a, b) => b.date.localeCompare(a.date),
      oldest: (a, b) => a.date.localeCompare(b.date),
      largest: (a, b) => b.amount - a.amount,
      smallest: (a, b) => a.amount - b.amount,
    };
    return [...rows].sort(sortFns[applied.sort]);
  }, [transactions, search, applied]);

  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  function openSheet() {
    setDraft(applied);
    setSheetOpen(true);
  }
  function applyFilters() {
    setApplied(draft);
    setSheetOpen(false);
  }
  function resetAll() {
    setApplied(DEFAULT_FILTERS);
    setDraft(DEFAULT_FILTERS);
  }
  function toggleCat(cat: string) {
    setDraft((d) => ({ ...d, cats: d.cats.includes(cat) ? d.cats.filter((c) => c !== cat) : [...d.cats, cat] }));
  }
  function toggleAccount(key: string) {
    setDraft((d) => ({ ...d, accounts: d.accounts.includes(key) ? d.accounts.filter((a) => a !== key) : [...d.accounts, key] }));
  }

  const accountLabel = (key: string) => (key === NO_ACCOUNT ? "Tanpa Sumber Dana" : cashAccounts.find((a) => a.id === key)?.label || key);

  const activePills: { key: string; label: string; remove: () => void }[] = [];
  if (applied.tipe !== "semua") {
    activePills.push({
      key: "tipe",
      label: applied.tipe === "expense" ? "Pengeluaran" : "Pemasukan",
      remove: () => setApplied((f) => ({ ...f, tipe: "semua" })),
    });
  }
  for (const c of applied.cats) {
    activePills.push({ key: "cat-" + c, label: c, remove: () => setApplied((f) => ({ ...f, cats: f.cats.filter((x) => x !== c) })) });
  }
  for (const a of applied.accounts) {
    activePills.push({
      key: "acc-" + a,
      label: accountLabel(a),
      remove: () => setApplied((f) => ({ ...f, accounts: f.accounts.filter((x) => x !== a) })),
    });
  }

  const activeCount = (applied.tipe !== "semua" ? 1 : 0) + applied.cats.length + applied.accounts.length;
  const draftActiveCount = (draft.tipe !== "semua" ? 1 : 0) + draft.cats.length + draft.accounts.length;

  const catList = draft.tipe === "income" ? incomeCategories : expenseCategories;
  const catIcon = draft.tipe === "income" ? incomeCatIcon : expenseCatIcon;

  return (
    <div>
      <div className="px-5">
        <p className="text-text-dim text-sm mb-5">
          {filtered.length} transaksi · masuk {fmtRp(totalIncome)} · keluar {fmtRp(totalExpense)}
        </p>

        {pie.slices.length > 0 && (
          <div className="mb-5">
            <TransactionPieChart slices={pie.slices} total={pie.total} />
          </div>
        )}

        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex-1 min-w-0 flex items-center gap-2 bg-bg-input border border-hairline rounded-lg px-3 py-2.5">
            <Search size={14} className="text-text-muted shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari transaksi…"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-text placeholder:text-text-muted"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Hapus pencarian"
                className="shrink-0 w-4 h-4 rounded-full bg-hairline text-text-dim flex items-center justify-center"
              >
                <X size={10} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={openSheet}
            aria-label="Filter & urutkan"
            className={cn(
              "relative shrink-0 w-[38px] h-[38px] flex items-center justify-center rounded-lg bg-bg-input border",
              activeCount > 0 ? "border-brand" : "border-hairline",
            )}
          >
            <SlidersHorizontal size={15} className="text-text" />
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center border-2 border-bg">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {activePills.length > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto thin-scroll">
            {activePills.map((p) => (
              <span
                key={p.key}
                className="inline-flex items-center gap-1.5 shrink-0 text-[11.5px] font-medium pl-3 pr-1.5 py-1.5 rounded-full bg-brand/10 text-brand-strong border border-brand whitespace-nowrap"
              >
                {p.label}
                <button type="button" onClick={p.remove} aria-label={`Hapus filter ${p.label}`} className="w-4 h-4 rounded-full flex items-center justify-center">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 && transactions.length > 0 ? (
        <div className="mx-5 py-12 text-center text-sm text-text-dim">
          Nggak ada transaksi yang cocok dengan filter/pencarian ini.
          <br />
          Coba ubah atau reset filternya.
        </div>
      ) : (
        <TransactionList transactions={filtered} expenseCategories={expenseCategories} incomeCategories={incomeCategories} cashAccounts={cashAccounts} />
      )}

      <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filter & Urutkan">
        <div className="text-xs text-text-dim mb-2">Tipe</div>
        <div className="flex gap-2 mb-5">
          {(
            [
              { key: "semua", label: "Semua" },
              { key: "expense", label: "Pengeluaran" },
              { key: "income", label: "Pemasukan" },
            ] as const
          ).map((o) => (
            <Chip key={o.key} active={draft.tipe === o.key} onClick={() => setDraft((d) => ({ ...d, tipe: o.key }))} className="flex-1 text-center">
              {o.label}
            </Chip>
          ))}
        </div>

        <div className="text-xs text-text-dim mb-2">Urutkan</div>
        <div className="flex flex-wrap gap-2 mb-5">
          {SORT_OPTIONS.map((o) => (
            <Chip key={o.key} active={draft.sort === o.key} onClick={() => setDraft((d) => ({ ...d, sort: o.key }))}>
              {o.label}
            </Chip>
          ))}
        </div>

        <div className="text-xs text-text-dim mb-2">Kategori</div>
        <div className="flex flex-wrap gap-2 mb-5">
          {catList.map((c) => (
            <Chip key={c} active={draft.cats.includes(c)} onClick={() => toggleCat(c)}>
              {catIcon(c)} {c}
            </Chip>
          ))}
        </div>

        {cashAccounts.length > 0 && (
          <>
            <div className="text-xs text-text-dim mb-2">Sumber Dana</div>
            <div className="flex flex-wrap gap-2 mb-6">
              {cashAccounts.map((a) => (
                <Chip key={a.id} active={draft.accounts.includes(a.id)} onClick={() => toggleAccount(a.id)}>
                  🏦 {a.label}
                </Chip>
              ))}
              <Chip active={draft.accounts.includes(NO_ACCOUNT)} onClick={() => toggleAccount(NO_ACCOUNT)}>
                Tanpa Sumber Dana
              </Chip>
            </div>
          </>
        )}

        <div className="flex gap-2.5">
          <Button variant="ghost" onClick={resetAll} className="flex-none w-[96px]">
            Reset
          </Button>
          <Button onClick={applyFilters} className="flex-1">
            Terapkan{draftActiveCount > 0 ? ` (${draftActiveCount})` : ""}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
