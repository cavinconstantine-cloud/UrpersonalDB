"use client";

import { useState } from "react";
import { Plus, ArrowDownLeft } from "lucide-react";
import type { TransactionType } from "./transaction-modal";

interface CatatToggleProps {
  onOpen: (type: TransactionType) => void;
  expenseLabel: string;
  incomeLabel: string;
  expenseAria: string;
  incomeAria: string;
}

/**
 * Merged floating "Catat" control — one toggle instead of two stacked
 * buttons. The active side expands to show its full label; tapping it again
 * opens the modal in one tap (this is the most-used control in the app, so
 * switching type and logging a transaction each cost at most one tap).
 * Tapping the collapsed side just switches which type is active.
 */
export function CatatToggle({ onOpen, expenseLabel, incomeLabel, expenseAria, incomeAria }: CatatToggleProps) {
  const [active, setActive] = useState<TransactionType>("expense");

  function tap(type: TransactionType) {
    if (active === type) onOpen(type);
    else setActive(type);
  }

  const expenseActive = active === "expense";
  const incomeActive = active === "income";

  return (
    <div className="fixed bottom-[76px] right-5 z-30 flex items-center gap-2">
      <button
        onClick={() => tap("expense")}
        aria-label={expenseAria}
        style={{
          width: expenseActive ? 200 : 48,
          background: expenseActive ? "var(--brand)" : "var(--bg-raised)",
          color: expenseActive ? "var(--brand-ink)" : "var(--brand-strong)",
        }}
        className="h-12 shrink-0 rounded-full border border-hairline flex items-center justify-center gap-2 overflow-hidden shadow-[var(--shadow-pop)] transition-[width,background-color] duration-300 ease-out"
      >
        <Plus size={18} strokeWidth={2.5} className="shrink-0" />
        <span
          className="text-[13.5px] font-medium whitespace-nowrap transition-opacity duration-150"
          style={{ opacity: expenseActive ? 1 : 0 }}
        >
          {expenseLabel}
        </span>
      </button>
      <button
        onClick={() => tap("income")}
        aria-label={incomeAria}
        style={{
          width: incomeActive ? 200 : 48,
          background: incomeActive ? "var(--good)" : "var(--bg-raised)",
          color: incomeActive ? "var(--good-ink)" : "var(--good)",
        }}
        className="h-12 shrink-0 rounded-full border border-hairline flex items-center justify-center gap-2 overflow-hidden shadow-[var(--shadow-pop)] transition-[width,background-color] duration-300 ease-out"
      >
        <ArrowDownLeft size={18} strokeWidth={2.5} className="shrink-0" />
        <span
          className="text-[13.5px] font-medium whitespace-nowrap transition-opacity duration-150"
          style={{ opacity: incomeActive ? 1 : 0 }}
        >
          {incomeLabel}
        </span>
      </button>
    </div>
  );
}
