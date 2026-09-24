"use client";

import { useState, type ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { CatatToggle } from "./catat-toggle";
import { TransactionModal, type CashAccount, type TransactionType } from "./transaction-modal";
import { WhatsNewSlideshow } from "./whats-new-slideshow";
import { useLanguage } from "./language-provider";
import { ToastProvider } from "@/components/ui/toast";

interface AppShellProps {
  customExpenseCategories: string[];
  customIncomeCategories: string[];
  cashAccounts: CashAccount[];
  userId: string;
  hasProfileType: boolean;
  children: ReactNode;
}

export function AppShell({
  customExpenseCategories,
  customIncomeCategories,
  cashAccounts,
  userId,
  hasProfileType,
  children,
}: AppShellProps) {
  const { dict } = useLanguage();
  const [modal, setModal] = useState<{ open: boolean; type: TransactionType }>({
    open: false,
    type: "expense",
  });

  return (
    <ToastProvider>
      <div className="min-h-full flex flex-col">
        <div className="max-w-[560px] w-full mx-auto flex-1 pb-28">{children}</div>

        <CatatToggle
          onOpen={(type) => setModal({ open: true, type })}
          expenseLabel={dict.shell.addExpense}
          incomeLabel={dict.shell.addIncome}
          expenseAria={dict.shell.addExpenseAria}
          incomeAria={dict.shell.addIncomeAria}
        />

        <BottomNav />
        <WhatsNewSlideshow userId={userId} hasProfileType={hasProfileType} />
        <TransactionModal
          key={modal.type}
          open={modal.open}
          defaultType={modal.type}
          onClose={() => setModal((m) => ({ ...m, open: false }))}
          customExpenseCategories={customExpenseCategories}
          customIncomeCategories={customIncomeCategories}
          cashAccounts={cashAccounts}
        />
      </div>
    </ToastProvider>
  );
}
