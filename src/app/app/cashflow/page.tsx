import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RecurringCashflowSections } from "@/components/app/recurring-cashflow-sections";
import { BudgetManager } from "@/components/app/budget-manager";
import { EXPENSE_CATS } from "@/lib/finance/constants";

export const metadata: Metadata = { title: "Arus Kas Tetap" };

export default async function CashflowPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [recurringIncomeRes, recurringExpenseRes, budgetsRes, customExpCatRes] = await Promise.all([
    supabase.from("recurring_incomes").select("id, label, amount").eq("user_id", user.id).order("created_at"),
    supabase.from("recurring_expenses").select("id, label, amount").eq("user_id", user.id).order("created_at"),
    supabase.from("budgets").select("category, monthly_limit").eq("user_id", user.id),
    supabase.from("custom_expense_categories").select("name").eq("user_id", user.id),
  ]);

  const incomeItems = (recurringIncomeRes.data || []).map((r) => ({ id: r.id, label: r.label, amount: Number(r.amount) }));
  const expenseItems = (recurringExpenseRes.data || []).map((r) => ({ id: r.id, label: r.label, amount: Number(r.amount) }));

  const expenseCats = [...EXPENSE_CATS, ...(customExpCatRes.data || []).map((c) => c.name)];
  const budgetByCategory = new Map((budgetsRes.data || []).map((b) => [b.category, Number(b.monthly_limit)]));
  const budgetRows = expenseCats.map((category) => ({
    category,
    monthlyLimit: budgetByCategory.get(category) || 0,
  }));

  return (
    <div className="px-5 pt-6">
      <div className="mb-6">
        <h1 className="serif text-[24px] font-medium mb-1">Arus Kas Tetap</h1>
        <p className="text-text-dim text-sm leading-relaxed">
          Pemasukan & pengeluaran rutin (bulanan) — dasar hitungan Free Cash Flow di Dashboard.
        </p>
      </div>
      <RecurringCashflowSections incomeItems={incomeItems} expenseItems={expenseItems} />
      <BudgetManager rows={budgetRows} />
    </div>
  );
}
