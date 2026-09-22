import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/(auth)/actions";
import { SettingsForm } from "@/components/app/settings-form";
import { RecurringCashflowSections } from "@/components/app/recurring-cashflow-sections";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, cashflowRes, recurringIncomeRes, recurringExpenseRes] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),
    supabase.from("cashflow").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("recurring_incomes").select("id, label, amount").eq("user_id", user.id).order("created_at"),
    supabase.from("recurring_expenses").select("id, label, amount").eq("user_id", user.id).order("created_at"),
  ]);

  return (
    <div className="px-5 pt-6">
      <h1 className="serif text-[24px] font-medium mb-6">Pengaturan</h1>

      <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
        <div className="serif text-[15px] mb-3">Tampilan</div>
        <ThemeToggle />
      </div>

      <SettingsForm
        initialName={profileRes.data?.name || ""}
        initialOtherCashflow={{
          lifestyleExpense: Number(cashflowRes.data?.lifestyle_expense || 0),
          invest: Number(cashflowRes.data?.invest || 0),
        }}
      />

      <RecurringCashflowSections
        incomeItems={(recurringIncomeRes.data || []).map((r) => ({ id: r.id, label: r.label, amount: Number(r.amount) }))}
        expenseItems={(recurringExpenseRes.data || []).map((r) => ({ id: r.id, label: r.label, amount: Number(r.amount) }))}
      />

      <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
        <div className="serif text-[15px] mb-1">Akun</div>
        <p className="text-xs text-text-dim mb-3">Masuk sebagai {user.email}</p>
        <form action={signOutAction}>
          <Button variant="ghost" fullWidth type="submit">
            Keluar
          </Button>
        </form>
      </div>

      <p className="text-xs text-text-muted text-center pb-6 leading-relaxed">
        Uangku · Draft testing — data disimpan aman di akunmu dan bisa diakses dari perangkat mana pun.
      </p>
    </div>
  );
}
