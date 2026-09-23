import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cashflowNums, investmentIncomeMonthly } from "@/lib/finance/calculations";
import type { HoldingData } from "@/lib/finance/types";
import { GoalsManager } from "@/components/app/goals-manager";

export const metadata: Metadata = { title: "Goals" };

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);

  const [goalsRes, cashflowRes, monthExpRes, holdingsRes] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("cashflow").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", user.id)
      .gte("expense_date", firstOfMonth.toISOString().slice(0, 10)),
    supabase.from("asset_holdings").select("category, data").eq("user_id", user.id),
  ]);

  const cf = cashflowRes.data;
  const monthTotal = (monthExpRes.data || []).reduce((s, e) => s + Number(e.amount), 0);
  const holdings = (holdingsRes.data || []).map((h) => ({ category: h.category, data: (h.data as HoldingData) || {} }));
  const investIncomeMonthly = investmentIncomeMonthly(holdings);
  const cashflow = cashflowNums(
    {
      income: Number(cf?.income || 0),
      fixedExpense: Number(cf?.fixed_expense || 0),
      lifestyleExpense: Number(cf?.lifestyle_expense || 0),
      invest: Number(cf?.invest || 0),
    },
    monthTotal,
    investIncomeMonthly,
  );

  const goals = (goalsRes.data || []).map((g) => ({
    id: g.id,
    name: g.name,
    target: Number(g.target),
    current: Number(g.current),
    targetDate: g.target_date,
  }));

  return (
    <div className="pt-6">
      <div className="px-5 mb-6">
        <h1 className="serif text-[24px] font-medium mb-1">Goals</h1>
        <p className="text-text-dim text-sm leading-relaxed">
          Tujuan finansialmu — kelola kapan saja, progress dihitung otomatis dari free cash flow bulananmu.
        </p>
      </div>
      <GoalsManager goals={goals} fcf={cashflow.fcf} />
    </div>
  );
}
