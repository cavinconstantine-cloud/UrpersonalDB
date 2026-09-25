"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { OnboardingDraft } from "@/lib/onboarding/draft";
import { holdingDataToJson } from "@/lib/finance/types";
import { throwIfError } from "@/lib/supabase/db-error";

export async function completeOnboarding(draft: OnboardingDraft) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const income = Number(draft.cashflow.income) || 0;
  const fixedExpense = draft.fixedExpenseItems.reduce((s, it) => s + it.amount, 0);
  const cashHoldings = draft.assetHoldings["Cash"] || [];

  const holdingsRows = Object.entries(draft.assetHoldings)
    .filter(([category]) => category !== "Cash")
    .flatMap(([category, holdings]) => holdings.map((h) => ({ user_id: user.id, category, data: holdingDataToJson(h) })));
  const liabRows = Object.entries(draft.liabHoldings).flatMap(([category, holdings]) =>
    holdings.map((h) => ({ user_id: user.id, category, data: holdingDataToJson(h) })),
  );

  // Everything in this first round is independent of everything else here —
  // none of these rows reference another row created in this function — so
  // they run as one batch of concurrent round trips instead of six
  // sequential ones. (Cash holdings go in this round too; recurring
  // income/expense items below need their real ids, but nothing here does.)
  const [profileRes, cashflowRes, cashRes, assetsRes, liabRes, goalsRes] = await Promise.all([
    supabase
      .from("profiles")
      .update({
        name: draft.name,
        asset_categories: draft.assetCats,
        liability_categories: draft.liabCats,
        profile_type: draft.profileType || null,
        payday_day: draft.profileType === "karyawan" ? draft.paydayDay : null,
        onboarding_step: "done",
      })
      .eq("id", user.id),
    supabase.from("cashflow").upsert({
      user_id: user.id,
      income,
      fixed_expense: fixedExpense,
      lifestyle_expense: Number(draft.cashflow.lifestyleExpense) || 0,
      invest: Number(draft.cashflow.invest) || 0,
    }),
    cashHoldings.length > 0
      ? supabase
          .from("asset_holdings")
          .insert(cashHoldings.map((h) => ({ user_id: user.id, category: "Cash", data: holdingDataToJson(h) })))
          .select("id")
      : Promise.resolve({ data: [], error: null }),
    holdingsRows.length
      ? supabase.from("asset_holdings").insert(holdingsRows)
      : Promise.resolve({ data: null, error: null }),
    liabRows.length ? supabase.from("liabilities").insert(liabRows) : Promise.resolve({ data: null, error: null }),
    draft.goals.length
      ? supabase.from("goals").insert(
          draft.goals.map((g) => ({
            user_id: user.id,
            name: g.name,
            target: g.target,
            current: g.current,
            target_date: g.targetDate,
          })),
        )
      : Promise.resolve({ data: null, error: null }),
  ]);
  throwIfError(profileRes.error, "menyimpan profil");
  throwIfError(cashflowRes.error, "menyimpan arus kas");
  throwIfError(cashRes.error, "menyimpan rekening");
  throwIfError(assetsRes.error, "menyimpan aset");
  throwIfError(liabRes.error, "menyimpan utang");
  throwIfError(goalsRes.error, "menyimpan goals");

  // Recurring income/expense items need the real asset_holdings ids from the
  // Cash insert above (the draft only ever tracked them by array index,
  // since nothing had a database row yet while onboarding was in progress),
  // so this round has to wait for that — but the two inserts in it don't
  // depend on each other.
  const cashRealIds = (cashRes.data || []).map((r) => r.id);
  function resolveAccountId(idx: number | null): string | null {
    return idx !== null ? (cashRealIds[idx] ?? null) : null;
  }

  // Seed the "Pemasukan/Pengeluaran tetap" lists in Arus Kas Tetap with
  // exactly what was entered here, so nothing needs to be re-entered.
  // fixed_expense above is a cache of SUM(recurring_expenses.amount),
  // kept in sync the same way settings/cashflow-actions.ts does on every
  // future add/edit/delete there.
  const [recurringIncomeRes, recurringExpenseRes] = await Promise.all([
    income > 0
      ? supabase.from("recurring_incomes").insert({
          user_id: user.id,
          label: "Pemasukan",
          amount: income,
          account_holding_id: resolveAccountId(draft.incomeAccountIdx),
        })
      : Promise.resolve({ error: null }),
    draft.fixedExpenseItems.length > 0
      ? supabase.from("recurring_expenses").insert(
          draft.fixedExpenseItems.map((it) => ({
            user_id: user.id,
            label: it.label,
            amount: it.amount,
            account_holding_id: resolveAccountId(it.accountIdx),
          })),
        )
      : Promise.resolve({ error: null }),
  ]);
  throwIfError(recurringIncomeRes.error, "menyimpan pemasukan tetap");
  throwIfError(recurringExpenseRes.error, "menyimpan pengeluaran tetap");

  redirect("/app");
}
