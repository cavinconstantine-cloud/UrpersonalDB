"use client";

import { RecurringItemsManager, type RecurringItem } from "./recurring-items-manager";
import type { CashAccount } from "./transaction-modal";
import {
  addRecurringIncome,
  updateRecurringIncome,
  deleteRecurringIncome,
  addRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
} from "@/app/app/settings/cashflow-actions";

export function RecurringCashflowSections({
  incomeItems,
  expenseItems,
  cashAccounts,
}: {
  incomeItems: RecurringItem[];
  expenseItems: RecurringItem[];
  cashAccounts: CashAccount[];
}) {
  return (
    <>
      <RecurringItemsManager
        title="Pemasukan tetap (bulanan)"
        addPlaceholder="mis. Gaji, Sewa properti"
        items={incomeItems}
        cashAccounts={cashAccounts}
        onAdd={addRecurringIncome}
        onUpdate={updateRecurringIncome}
        onDelete={deleteRecurringIncome}
      />
      <RecurringItemsManager
        title="Pengeluaran tetap (bulanan)"
        addPlaceholder="mis. Sewa rumah, Internet, Sekolah"
        items={expenseItems}
        cashAccounts={cashAccounts}
        onAdd={addRecurringExpense}
        onUpdate={updateRecurringExpense}
        onDelete={deleteRecurringExpense}
      />
    </>
  );
}
