"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { OnboardingDraft } from "@/lib/onboarding/draft";
import { holdingDataToJson } from "@/lib/finance/types";

export async function completeOnboarding(draft: OnboardingDraft) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .update({
      name: draft.name,
      asset_categories: draft.assetCats,
      liability_categories: draft.liabCats,
      onboarding_step: "done",
    })
    .eq("id", user.id);

  await supabase.from("cashflow").upsert({
    user_id: user.id,
    income: Number(draft.cashflow.income) || 0,
    fixed_expense: Number(draft.cashflow.fixedExpense) || 0,
    lifestyle_expense: Number(draft.cashflow.lifestyleExpense) || 0,
    invest: Number(draft.cashflow.invest) || 0,
  });

  const holdingsRows = Object.entries(draft.assetHoldings).flatMap(([category, holdings]) =>
    holdings.map((h) => ({ user_id: user.id, category, data: holdingDataToJson(h) })),
  );
  if (holdingsRows.length) {
    await supabase.from("asset_holdings").insert(holdingsRows);
  }

  const liabRows = draft.liabCats
    .map((cat) => ({ user_id: user.id, category: cat, data: draft.liabData[cat] || {} }))
    .filter((r) => Object.keys(r.data).length > 0)
    .map((r) => ({ ...r, data: holdingDataToJson(r.data) }));
  if (liabRows.length) {
    await supabase.from("liabilities").upsert(liabRows);
  }

  if (draft.goals.length) {
    await supabase.from("goals").insert(
      draft.goals.map((g) => ({
        user_id: user.id,
        name: g.name,
        target: g.target,
        current: g.current,
        target_date: g.targetDate,
      })),
    );
  }

  redirect("/app");
}
