"use client";

import { RecurringItemsManager, type RecurringItem } from "./recurring-items-manager";
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
}: {
  incomeItems: RecurringItem[];
  expenseItems: RecurringItem[];
}) {
  return (
    <>
      <RecurringItemsManager
        title="Pemasukan tetap (bulanan)"
        addPlaceholder="mis. Gaji, Sewa properti"
        items={incomeItems}
        onAdd={addRecurringIncome}
        onUpdate={updateRecurringIncome}
        onDelete={deleteRecurringIncome}
      />
      <RecurringItemsManager
        title="Pengeluaran tetap (bulanan)"
        addPlaceholder="mis. Sewa rumah, Internet, Sekolah"
        items={expenseItems}
        onAdd={addRecurringExpense}
        onUpdate={updateRecurringExpense}
        onDelete={deleteRecurringExpense}
      />
    </>
  );
}
