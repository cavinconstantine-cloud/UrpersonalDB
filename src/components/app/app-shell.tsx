"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { BottomNav } from "./bottom-nav";
import { ExpenseModal } from "./expense-modal";

export function AppShell({ customCategories, children }: { customCategories: string[]; children: ReactNode }) {
  const [expenseOpen, setExpenseOpen] = useState(false);

  return (
    <div className="min-h-full flex flex-col">
      <div className="max-w-[560px] w-full mx-auto flex-1 pb-28">{children}</div>

      <button
        onClick={() => setExpenseOpen(true)}
        className="fixed bottom-[76px] right-5 z-30 flex items-center gap-2 rounded-full bg-brand text-brand-ink pl-4 pr-5 py-3.5 text-sm font-medium shadow-[var(--shadow-pop)]"
        aria-label="Catat pengeluaran"
      >
        <Plus size={18} strokeWidth={2.5} />
        Catat
      </button>

      <BottomNav />
      <ExpenseModal open={expenseOpen} onClose={() => setExpenseOpen(false)} customCategories={customCategories} />
    </div>
  );
}
