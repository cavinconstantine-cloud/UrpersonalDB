import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RecurringCashflowSections } from "@/components/app/recurring-cashflow-sections";
import { BudgetManager } from "@/components/app/budget-manager";
import { EXPENSE_CATS } from "@/lib/finance/constants";
import type { HoldingData } from "@/lib/finance/types";

export const metadata: Metadata = { title: "Arus Kas Tetap" };

export default async function CashflowPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [recurringIncomeRes, recurringExpenseRes, budgetsRes, customExpCatRes, cashRes] = await Promise.all([
    supabase
      .from("recurring_incomes")
      .select("id, label, amount, account_holding_id")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase
      .from("recurring_expenses")
      .select("id, label, amount, account_holding_id")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase.from("budgets").select("category, monthly_limit").eq("user_id", user.id),
    supabase.from("custom_expense_categories").select("name").eq("user_id", user.id),
    supabase.from("asset_holdings").select("id, data").eq("user_id", user.id).eq("category", "Cash"),
  ]);

  const incomeItems = (recurringIncomeRes.data || []).map((r) => ({
    id: r.id,
    label: r.label,
    amount: Number(r.amount),
    accountHoldingId: r.account_holding_id,
  }));
  const expenseItems = (recurringExpenseRes.data || []).map((r) => ({
    id: r.id,
    label: r.label,
    amount: Number(r.amount),
    accountHoldingId: r.account_holding_id,
  }));
  const cashAccounts = (cashRes.data || []).map((h) => ({
    id: h.id,
    label: String((h.data as HoldingData)?.label || "Rekening"),
  }));

  const expenseCats = [...EXPENSE_CATS, ...(customExpCatRes.data || []).map((c) => c.name)];
  const budgetByCategory = new Map((budgetsRes.data || []).map((b) => [b.category, Number(b.monthly_limit)]));
  const budgetRows = expenseCats.map((category) => ({
    category,
    monthlyLimit: budgetByCategory.get(category) || 0,
  }));

  // Surface any load failure instead of silently falling back to "" (which
  // looks identical to "genuinely no data yet") — a query erroring out (e.g.
  // a column a pending migration hasn't added yet) must never read as "your
  // data got deleted".
  const loadError = [recurringIncomeRes.error, recurringExpenseRes.error, budgetsRes.error, cashRes.error].find(
    Boolean,
  );

  return (
    <div className="px-5 pt-6">
      <div className="mb-6">
        <h1 className="serif text-[24px] font-medium mb-1">Arus Kas Tetap</h1>
        <p className="text-text-dim text-sm leading-relaxed">
          Pemasukan & pengeluaran rutin (bulanan) — dasar hitungan Free Cash Flow di Dashboard.
        </p>
      </div>
      {loadError && (
        <div className="mb-4 p-4 rounded-2xl border border-critical/40 bg-critical/10 text-sm leading-relaxed">
          <div className="font-medium text-critical mb-1">⚠️ Gagal memuat data</div>
          <div className="text-text-dim">
            Datamu kemungkinan besar masih aman — ini kegagalan memuat, bukan kehilangan data. Detail teknis:{" "}
            <span className="font-mono text-[11px]">{loadError.message}</span>
          </div>
        </div>
      )}
      <RecurringCashflowSections incomeItems={incomeItems} expenseItems={expenseItems} cashAccounts={cashAccounts} />
      <BudgetManager rows={budgetRows} />
    </div>
  );
}
