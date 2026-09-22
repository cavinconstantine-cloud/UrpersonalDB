import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EXPENSE_CATS, INCOME_CATS } from "@/lib/finance/constants";
import { fmtRp } from "@/lib/finance/format";
import { TransactionList, type TxRow } from "@/components/app/transaction-list";

export const metadata: Metadata = { title: "Transaksi" };

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [expensesRes, incomesRes, customExpCatRes, customIncCatRes] = await Promise.all([
    supabase.from("expenses").select("*").eq("user_id", user.id).order("expense_date", { ascending: false }),
    supabase.from("incomes").select("*").eq("user_id", user.id).order("income_date", { ascending: false }),
    supabase.from("custom_expense_categories").select("name").eq("user_id", user.id),
    supabase.from("custom_income_categories").select("name").eq("user_id", user.id),
  ]);

  const expenseRows: TxRow[] = (expensesRes.data || []).map((e) => ({
    id: e.id,
    type: "expense",
    date: e.expense_date,
    category: e.category,
    amount: Number(e.amount),
    description: e.description,
  }));
  const incomeRows: TxRow[] = (incomesRes.data || []).map((i) => ({
    id: i.id,
    type: "income",
    date: i.income_date,
    category: i.category,
    amount: Number(i.amount),
    description: i.description,
  }));

  const transactions = [...expenseRows, ...incomeRows].sort((a, b) => b.date.localeCompare(a.date));
  const expenseCategories = [...EXPENSE_CATS, ...(customExpCatRes.data || []).map((c) => c.name)];
  const incomeCategories = [...INCOME_CATS, ...(customIncCatRes.data || []).map((c) => c.name)];

  const totalExpense = expenseRows.reduce((s, e) => s + e.amount, 0);
  const totalIncome = incomeRows.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="pt-6">
      <div className="px-5 mb-6">
        <h1 className="serif text-[24px] font-medium mb-1">Transaksi</h1>
        <p className="text-text-dim text-sm">
          {transactions.length} transaksi · masuk {fmtRp(totalIncome)} · keluar {fmtRp(totalExpense)}
        </p>
      </div>
      <TransactionList
        transactions={transactions}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
      />
    </div>
  );
}
