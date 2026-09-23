import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { LanguageProvider } from "@/components/app/language-provider";
import { getLang } from "@/lib/i18n/lang";
import type { HoldingData } from "@/lib/finance/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [expenseCatsRes, incomeCatsRes, cashRes, lang] = await Promise.all([
    supabase.from("custom_expense_categories").select("name").eq("user_id", user.id),
    supabase.from("custom_income_categories").select("name").eq("user_id", user.id),
    supabase.from("asset_holdings").select("id, data").eq("user_id", user.id).eq("category", "Cash"),
    getLang(),
  ]);

  const cashAccounts = (cashRes.data || []).map((h) => ({
    id: h.id,
    label: String((h.data as HoldingData)?.label || "Rekening"),
  }));

  return (
    <LanguageProvider initialLang={lang}>
      <AppShell
        customExpenseCategories={(expenseCatsRes.data || []).map((c) => c.name)}
        customIncomeCategories={(incomeCatsRes.data || []).map((c) => c.name)}
        cashAccounts={cashAccounts}
      >
        {children}
      </AppShell>
    </LanguageProvider>
  );
}
