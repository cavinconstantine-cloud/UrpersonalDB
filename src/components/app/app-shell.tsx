"use client";

import { useState, type ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { CatatToggle } from "./catat-toggle";
import { TransactionModal, type CashAccount, type TransactionType } from "./transaction-modal";
import { WhatsNewSlideshow } from "./whats-new-slideshow";
import { useLanguage } from "./language-provider";
import { ToastProvider } from "@/components/ui/toast";
import { TimezoneSync } from "./timezone-sync";

interface AppShellProps {
  customExpenseCategories: string[];
  customIncomeCategories: string[];
  cashAccounts: CashAccount[];
  userId: string;
  hasProfileType: boolean;
  userName?: string | null;
  children: ReactNode;
}

export function AppShell({
  customExpenseCategories,
  customIncomeCategories,
  cashAccounts,
  userId,
  hasProfileType,
  userName,
  children,
}: AppShellProps) {
  const { dict } = useLanguage();
  const [modal, setModal] = useState<{ open: boolean; type: TransactionType; split: boolean }>({
    open: false,
    type: "expense",
    split: false,
  });

  return (
    <ToastProvider>
      <TimezoneSync />
      <div className="min-h-full flex flex-col">
        <div className="max-w-[560px] w-full mx-auto flex-1 pb-28">
          <div className="flex items-center gap-2 px-5 pt-3 pb-2.5 border-b border-hairline">
            <svg viewBox="0 0 100 100" width="20" height="20" className="shrink-0" aria-hidden="true">
              <rect width="100" height="100" rx="22" fill="#5643c9" />
              <path
                d="M32,26 L32,56 A18,18 0 0 0 68,56 L68,26"
                fill="none"
                stroke="#ffffff"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="50" cy="56" r="9" fill="#ffffff" />
            </svg>
            <span className="serif text-[15px] font-medium text-brand-strong">Uangku</span>
          </div>
          {children}
        </div>

        <CatatToggle
          onOpen={(type) => setModal({ open: true, type, split: false })}
          onOpenSplit={() => setModal({ open: true, type: "expense", split: true })}
          expenseLabel={dict.shell.addExpense}
          incomeLabel={dict.shell.addIncome}
          expenseAria={dict.shell.addExpenseAria}
          incomeAria={dict.shell.addIncomeAria}
          splitLabel={dict.shell.splitBill}
          splitAria={dict.shell.splitBillAria}
        />

        <BottomNav />
        <WhatsNewSlideshow userId={userId} hasProfileType={hasProfileType} />
        <TransactionModal
          key={`${modal.type}-${modal.split}`}
          open={modal.open}
          defaultType={modal.type}
          defaultSplitMode={modal.split}
          onClose={() => setModal((m) => ({ ...m, open: false, split: false }))}
          customExpenseCategories={customExpenseCategories}
          customIncomeCategories={customIncomeCategories}
          cashAccounts={cashAccounts}
          userName={userName}
        />
      </div>
    </ToastProvider>
  );
}
