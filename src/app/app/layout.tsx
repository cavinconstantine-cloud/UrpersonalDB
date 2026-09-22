import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [expenseCatsRes, incomeCatsRes] = await Promise.all([
    supabase.from("custom_expense_categories").select("name").eq("user_id", user.id),
    supabase.from("custom_income_categories").select("name").eq("user_id", user.id),
  ]);

  return (
    <AppShell
      customExpenseCategories={(expenseCatsRes.data || []).map((c) => c.name)}
      customIncomeCategories={(incomeCatsRes.data || []).map((c) => c.name)}
    >
      {children}
    </AppShell>
  );
}
