import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RecurringCashflowSections } from "@/components/app/recurring-cashflow-sections";

export const metadata: Metadata = { title: "Arus Kas Tetap" };

export default async function CashflowPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [recurringIncomeRes, recurringExpenseRes] = await Promise.all([
    supabase.from("recurring_incomes").select("id, label, amount").eq("user_id", user.id).order("created_at"),
    supabase.from("recurring_expenses").select("id, label, amount").eq("user_id", user.id).order("created_at"),
  ]);

  const incomeItems = (recurringIncomeRes.data || []).map((r) => ({ id: r.id, label: r.label, amount: Number(r.amount) }));
  const expenseItems = (recurringExpenseRes.data || []).map((r) => ({ id: r.id, label: r.label, amount: Number(r.amount) }));

  return (
    <div className="pt-6">
      <div className="px-5 mb-6">
        <h1 className="serif text-[24px] font-medium mb-1">Arus Kas Tetap</h1>
        <p className="text-text-dim text-sm leading-relaxed">
          Pemasukan & pengeluaran rutin (bulanan) — dasar hitungan Free Cash Flow di Dashboard.
        </p>
      </div>
      <RecurringCashflowSections incomeItems={incomeItems} expenseItems={expenseItems} />
    </div>
  );
}
