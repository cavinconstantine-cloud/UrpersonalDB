import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/(auth)/actions";
import { SettingsForm } from "@/components/app/settings-form";
import { ProfileTypeSettings } from "@/components/app/profile-type-settings";
import { BudgetManager } from "@/components/app/budget-manager";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { LanguageToggle } from "@/components/app/language-toggle";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATS } from "@/lib/finance/constants";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, budgetsRes, customExpCatRes] = await Promise.all([
    supabase.from("profiles").select("name, profile_type, payday_day").eq("id", user.id).single(),
    supabase.from("budgets").select("category, monthly_limit").eq("user_id", user.id),
    supabase.from("custom_expense_categories").select("name").eq("user_id", user.id),
  ]);

  const expenseCats = [...EXPENSE_CATS, ...(customExpCatRes.data || []).map((c) => c.name)];
  const budgetByCategory = new Map((budgetsRes.data || []).map((b) => [b.category, Number(b.monthly_limit)]));
  const budgetRows = expenseCats.map((category) => ({
    category,
    monthlyLimit: budgetByCategory.get(category) || 0,
  }));

  const lang = await getLang();
  const dict = getDictionary(lang);

  return (
    <div className="px-5 pt-6">
      <h1 className="serif text-[24px] font-medium mb-6">{dict.settings.title}</h1>

      <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
        <div className="serif text-[15px] mb-3">{dict.theme.title}</div>
        <ThemeToggle />
      </div>

      <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
        <div className="serif text-[15px] mb-3">{dict.language.title}</div>
        <LanguageToggle />
      </div>

      <SettingsForm initialName={profileRes.data?.name || ""} />

      <ProfileTypeSettings
        initialProfileType={(profileRes.data?.profile_type as "karyawan" | "pengusaha" | null) || ""}
        initialPaydayDay={profileRes.data?.payday_day ?? null}
      />

      <BudgetManager rows={budgetRows} />

      <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
        <div className="serif text-[15px] mb-1">{dict.settings.account}</div>
        <p className="text-xs text-text-dim mb-3">
          {dict.settings.signedInAs} {user.email}
        </p>
        <form action={signOutAction}>
          <Button variant="ghost" fullWidth type="submit">
            {dict.settings.signOut}
          </Button>
        </form>
      </div>

      <p className="text-xs text-text-muted text-center pb-6 leading-relaxed">{dict.settings.footer}</p>
    </div>
  );
}
