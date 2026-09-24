"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, ArrowDownLeft, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionType } from "./transaction-modal";

/** How long after the last scroll event before the toggle reappears. */
const SCROLL_IDLE_MS = 500;

interface CatatToggleProps {
  onOpen: (type: TransactionType) => void;
  onOpenSplit: () => void;
  expenseLabel: string;
  incomeLabel: string;
  expenseAria: string;
  incomeAria: string;
  splitLabel: string;
  splitAria: string;
}

/**
 * Merged floating "Catat" control — one toggle instead of two stacked
 * buttons. The active side expands to show its full label; tapping it again
 * opens the modal in one tap (this is the most-used control in the app, so
 * switching type and logging a transaction each cost at most one tap).
 * Tapping the collapsed side just switches which type is active.
 */
export function CatatToggle({
  onOpen,
  onOpenSplit,
  expenseLabel,
  incomeLabel,
  expenseAria,
  incomeAria,
  splitLabel,
  splitAria,
}: CatatToggleProps) {
  const [active, setActive] = useState<TransactionType>("expense");
  const [scrolling, setScrolling] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tucks the toggle away while the user is actively scrolling so it doesn't
  // sit over content, then brings it back once scrolling settles. touchmove
  // is included alongside scroll because on some mobile browsers a "scroll"
  // event lags behind an upward finger-drag near the top of the page (the
  // address bar animating back in) — touchmove fires the instant the finger
  // moves, in either direction, so the toggle never gets caught mid-drag.
  useEffect(() => {
    function handleActivity() {
      setScrolling(true);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setScrolling(false), SCROLL_IDLE_MS);
    }
    window.addEventListener("scroll", handleActivity, { passive: true });
    window.addEventListener("touchmove", handleActivity, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("touchmove", handleActivity);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  function tap(type: TransactionType) {
    if (active === type) onOpen(type);
    else setActive(type);
  }

  const expenseActive = active === "expense";
  const incomeActive = active === "income";

  return (
    <div
      className={cn(
        "fixed bottom-[76px] right-5 z-30 flex flex-col items-end gap-2 transition-[transform,opacity] duration-300 ease-out",
        scrolling ? "translate-y-3 opacity-0 pointer-events-none" : "translate-y-0 opacity-100",
      )}
    >
      <button
        onClick={onOpenSplit}
        aria-label={splitAria}
        className="h-10 shrink-0 rounded-full border border-hairline bg-bg-raised text-text-dim flex items-center justify-center gap-1.5 px-4 shadow-[var(--shadow-pop)]"
      >
        <Receipt size={15} strokeWidth={2.25} className="shrink-0 text-brand-strong" />
        <span className="text-[12.5px] font-medium whitespace-nowrap">{splitLabel}</span>
      </button>
      <div className="flex items-center gap-2">
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
    </div>
  );
}
