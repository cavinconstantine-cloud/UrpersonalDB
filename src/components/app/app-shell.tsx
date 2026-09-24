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
        <div className="max-w-[560px] w-full mx-auto flex-1 pb-28">{children}</div>

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
