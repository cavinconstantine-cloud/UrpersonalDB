import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { LanguageProvider } from "@/components/app/language-provider";
import { getLang } from "@/lib/i18n/lang";
import { getCashAccounts, getCustomCategories, getProfile } from "@/lib/data/shared";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [categories, cashAccounts, profileRes, lang] = await Promise.all([
    getCustomCategories(user.id),
    getCashAccounts(user.id),
    getProfile(user.id),
    getLang(),
  ]);

  return (
    <LanguageProvider initialLang={lang}>
      <AppShell
        customExpenseCategories={categories.customExpenseCategories}
        customIncomeCategories={categories.customIncomeCategories}
        cashAccounts={cashAccounts}
        userId={user.id}
        hasProfileType={Boolean(profileRes.data?.profile_type)}
        userName={profileRes.data?.name || null}
      >
        {children}
      </AppShell>
    </LanguageProvider>
  );
}
