"use client";

import { useState, type ReactNode } from "react";
import { Plus, ArrowDownLeft } from "lucide-react";
import { BottomNav } from "./bottom-nav";
import { TransactionModal, type TransactionType } from "./transaction-modal";

interface AppShellProps {
  customExpenseCategories: string[];
  customIncomeCategories: string[];
  children: ReactNode;
}

export function AppShell({ customExpenseCategories, customIncomeCategories, children }: AppShellProps) {
  const [modal, setModal] = useState<{ open: boolean; type: TransactionType }>({
    open: false,
    type: "expense",
  });

  return (
    <div className="min-h-full flex flex-col">
      <div className="max-w-[560px] w-full mx-auto flex-1 pb-28">{children}</div>

      <div className="fixed bottom-[76px] right-5 z-30 flex flex-col items-end gap-2.5">
        <button
          onClick={() => setModal({ open: true, type: "income" })}
          className="flex items-center gap-1.5 rounded-full bg-bg-raised border border-hairline text-good pl-3.5 pr-4 py-2.5 text-[13px] font-medium shadow-[var(--shadow-pop)]"
          aria-label="Catat pemasukan"
        >
          <ArrowDownLeft size={15} strokeWidth={2.5} />
          Pemasukan
        </button>
        <button
          onClick={() => setModal({ open: true, type: "expense" })}
          className="flex items-center gap-2 rounded-full bg-brand text-brand-ink pl-4 pr-5 py-3.5 text-sm font-medium shadow-[var(--shadow-pop)]"
          aria-label="Catat pengeluaran"
        >
          <Plus size={18} strokeWidth={2.5} />
          Catat
        </button>
      </div>

      <BottomNav />
      <TransactionModal
        key={modal.type}
        open={modal.open}
        defaultType={modal.type}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        customExpenseCategories={customExpenseCategories}
        customIncomeCategories={customIncomeCategories}
      />
    </div>
  );
}
