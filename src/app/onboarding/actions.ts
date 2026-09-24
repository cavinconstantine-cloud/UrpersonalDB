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
      profile_type: draft.profileType || null,
      payday_day: draft.profileType === "karyawan" ? draft.paydayDay : null,
      onboarding_step: "done",
    })
    .eq("id", user.id);

  const income = Number(draft.cashflow.income) || 0;
  const fixedExpense = draft.fixedExpenseItems.reduce((s, it) => s + it.amount, 0);

  await supabase.from("cashflow").upsert({
    user_id: user.id,
    income,
    fixed_expense: fixedExpense,
    lifestyle_expense: Number(draft.cashflow.lifestyleExpense) || 0,
    invest: Number(draft.cashflow.invest) || 0,
  });

  // Cash holdings go in first, and separately from the rest — recurring
  // income/expense items below need their real asset_holdings ids to link
  // to (the draft only ever tracked them by array index, since nothing has
  // a database row yet while onboarding is in progress).
  const cashHoldings = draft.assetHoldings["Cash"] || [];
  let cashRealIds: string[] = [];
  if (cashHoldings.length > 0) {
    const { data: insertedCash } = await supabase
      .from("asset_holdings")
      .insert(cashHoldings.map((h) => ({ user_id: user.id, category: "Cash", data: holdingDataToJson(h) })))
      .select("id");
    cashRealIds = (insertedCash || []).map((r) => r.id);
  }
  function resolveAccountId(idx: number | null): string | null {
    return idx !== null ? (cashRealIds[idx] ?? null) : null;
  }

  // Seed the "Pemasukan/Pengeluaran tetap" lists in Arus Kas Tetap with
  // exactly what was entered here, so nothing needs to be re-entered.
  // fixed_expense above is a cache of SUM(recurring_expenses.amount),
  // kept in sync the same way settings/cashflow-actions.ts does on every
  // future add/edit/delete there.
  if (income > 0) {
    await supabase.from("recurring_incomes").insert({
      user_id: user.id,
      label: "Pemasukan",
      amount: income,
      account_holding_id: resolveAccountId(draft.incomeAccountIdx),
    });
  }
  if (draft.fixedExpenseItems.length > 0) {
    await supabase.from("recurring_expenses").insert(
      draft.fixedExpenseItems.map((it) => ({
        user_id: user.id,
        label: it.label,
        amount: it.amount,
        account_holding_id: resolveAccountId(it.accountIdx),
      })),
    );
  }

  const holdingsRows = Object.entries(draft.assetHoldings)
    .filter(([category]) => category !== "Cash")
    .flatMap(([category, holdings]) => holdings.map((h) => ({ user_id: user.id, category, data: holdingDataToJson(h) })));
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
