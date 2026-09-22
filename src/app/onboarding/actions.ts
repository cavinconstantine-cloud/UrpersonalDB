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

  const income = Number(draft.cashflow.income) || 0;
  const fixedExpense = Number(draft.cashflow.fixedExpense) || 0;

  await supabase.from("cashflow").upsert({
    user_id: user.id,
    income,
    fixed_expense: fixedExpense,
    lifestyle_expense: Number(draft.cashflow.lifestyleExpense) || 0,
    invest: Number(draft.cashflow.invest) || 0,
  });

  // Seed a starter line item so the "Pemasukan/Pengeluaran tetap" lists in
  // Settings start in sync with what was just entered here, instead of
  // silently resetting to 0 the first time the user edits that section.
  if (income > 0) {
    await supabase.from("recurring_incomes").insert({ user_id: user.id, label: "Pemasukan", amount: income });
  }
  if (fixedExpense > 0) {
    await supabase
      .from("recurring_expenses")
      .insert({ user_id: user.id, label: "Pengeluaran tetap", amount: fixedExpense });
  }

  const holdingsRows = Object.entries(draft.assetHoldings).flatMap(([category, holdings]) =>
    holdings.map((h) => ({ user_id: user.id, category, data: holdingDataToJson(h) })),
  );
  if (holdingsRows.length) {
    await supabase.from("asset_holdings").insert(holdingsRows);
  }

  const liabRows = Object.entries(draft.liabHoldings).flatMap(([category, holdings]) =>
    holdings.map((h) => ({ user_id: user.id, category, data: holdingDataToJson(h) })),
  );
  if (liabRows.length) {
    await supabase.from("liabilities").insert(liabRows);
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
