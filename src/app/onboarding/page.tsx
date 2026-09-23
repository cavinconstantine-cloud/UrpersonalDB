import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { OnboardingWizard } from "./onboarding-wizard";
import type { StockPriceInfo } from "@/components/finance/saham-holding-modal";

export const metadata: Metadata = { title: "Mulai" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: stockPriceRows }] = await Promise.all([
    supabase.from("profiles").select("name, onboarding_step").eq("id", user.id).single(),
    supabase.from("stock_prices").select("*").neq("ticker", "^JKSE"),
  ]);

  if (profile?.onboarding_step === "done") redirect("/app");

  const stockPrices: Record<string, StockPriceInfo> = {};
  for (const row of stockPriceRows || []) {
    stockPrices[row.ticker] = {
      companyName: row.company_name,
      price: Number(row.price),
      changePct: Number(row.change_pct),
      asOf: row.as_of,
    };
  }

  return <OnboardingWizard userId={user.id} initialName={profile?.name || ""} stockPrices={stockPrices} />;
}
