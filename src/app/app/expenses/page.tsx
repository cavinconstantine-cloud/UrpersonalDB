import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EXPENSE_CATS, INCOME_CATS } from "@/lib/finance/constants";
import { TransactionsView } from "@/components/app/transactions-view";
import type { TxRow } from "@/components/app/transaction-list";
import { getCashAccounts, getCustomCategories } from "@/lib/data/shared";

export const metadata: Metadata = { title: "Transaksi" };

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [expensesRes, incomesRes, categories, cashAccounts] = await Promise.all([
    supabase.from("expenses").select("*").eq("user_id", user.id).order("expense_date", { ascending: false }),
    supabase.from("incomes").select("*").eq("user_id", user.id).order("income_date", { ascending: false }),
    getCustomCategories(user.id),
    getCashAccounts(user.id),
  ]);

  const accountLabelById = new Map(cashAccounts.map((a) => [a.id, a.label]));

  const expenseRows: TxRow[] = (expensesRes.data || []).map((e) => ({
    id: e.id,
    type: "expense",
    date: e.expense_date,
    category: e.category,
    amount: Number(e.amount),
    description: e.description,
    accountHoldingId: e.account_holding_id,
    accountLabel: e.account_holding_id ? (accountLabelById.get(e.account_holding_id) ?? null) : null,
  }));
  const incomeRows: TxRow[] = (incomesRes.data || []).map((i) => ({
    id: i.id,
    type: "income",
    date: i.income_date,
    category: i.category,
    amount: Number(i.amount),
    description: i.description,
    accountHoldingId: i.account_holding_id,
    accountLabel: i.account_holding_id ? (accountLabelById.get(i.account_holding_id) ?? null) : null,
  }));

  const transactions = [...expenseRows, ...incomeRows].sort((a, b) => b.date.localeCompare(a.date));
  const expenseCategories = [...EXPENSE_CATS, ...categories.customExpenseCategories];
  const incomeCategories = [...INCOME_CATS, ...categories.customIncomeCategories];

  return (
    <div className="pt-6">
      <div className="px-5 mb-1">
        <h1 className="serif text-[24px] font-medium">Transaksi</h1>
      </div>
      <TransactionsView
        transactions={transactions}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        cashAccounts={cashAccounts}
      />
    </div>
  );
}
