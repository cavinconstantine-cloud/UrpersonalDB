import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/(auth)/actions";
import { SettingsForm } from "@/components/app/settings-form";
import { BudgetManager } from "@/components/app/budget-manager";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATS } from "@/lib/finance/constants";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, cashflowRes, budgetsRes, customExpCatRes] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),
    supabase.from("cashflow").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("budgets").select("category, monthly_limit").eq("user_id", user.id),
    supabase.from("custom_expense_categories").select("name").eq("user_id", user.id),
  ]);

  const expenseCats = [...EXPENSE_CATS, ...(customExpCatRes.data || []).map((c) => c.name)];
  const budgetByCategory = new Map((budgetsRes.data || []).map((b) => [b.category, Number(b.monthly_limit)]));
  const budgetRows = expenseCats.map((category) => ({
    category,
    monthlyLimit: budgetByCategory.get(category) || 0,
  }));

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

      <BudgetManager rows={budgetRows} />

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
