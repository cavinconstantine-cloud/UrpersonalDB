import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EXPENSE_CATS } from "@/lib/finance/constants";
import { ExpenseList } from "@/components/app/expense-list";

export const metadata: Metadata = { title: "Transaksi" };

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [expensesRes, customCatRes] = await Promise.all([
    supabase.from("expenses").select("*").eq("user_id", user.id).order("expense_date", { ascending: false }),
    supabase.from("custom_expense_categories").select("name").eq("user_id", user.id),
  ]);

  const expenses = (expensesRes.data || []).map((e) => ({
    id: e.id,
    date: e.expense_date,
    category: e.category,
    amount: Number(e.amount),
    description: e.description,
  }));
  const categories = [...EXPENSE_CATS, ...(customCatRes.data || []).map((c) => c.name)];

  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="pt-6">
      <div className="px-5 mb-6">
        <h1 className="serif text-[24px] font-medium mb-1">Transaksi</h1>
        <p className="text-text-dim text-sm">
          {expenses.length} transaksi tercatat · total {totalAll.toLocaleString("id-ID")} Rupiah
        </p>
      </div>
      <ExpenseList expenses={expenses} categories={categories} />
    </div>
  );
}
