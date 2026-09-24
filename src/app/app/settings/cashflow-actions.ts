"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi berakhir — silakan masuk kembali.");
  return { supabase, user };
}

async function syncIncomeTotal(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("recurring_incomes").select("amount").eq("user_id", userId);
  const total = (data || []).reduce((s, r) => s + Number(r.amount), 0);
  await supabase.from("cashflow").upsert({ user_id: userId, income: total });
}

async function syncFixedExpenseTotal(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("recurring_expenses").select("amount").eq("user_id", userId);
  const total = (data || []).reduce((s, r) => s + Number(r.amount), 0);
  await supabase.from("cashflow").upsert({ user_id: userId, fixed_expense: total });
}

export async function addRecurringIncome(label: string, amount: number, accountHoldingId: string) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("recurring_incomes")
    .insert({ user_id: user.id, label, amount, account_holding_id: accountHoldingId });
  await syncIncomeTotal(supabase, user.id);
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function updateRecurringIncome(id: string, label: string, amount: number, accountHoldingId: string) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("recurring_incomes")
    .update({ label, amount, account_holding_id: accountHoldingId })
    .eq("id", id)
    .eq("user_id", user.id);
  await syncIncomeTotal(supabase, user.id);
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function deleteRecurringIncome(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("recurring_incomes").delete().eq("id", id).eq("user_id", user.id);
  await syncIncomeTotal(supabase, user.id);
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function addRecurringExpense(label: string, amount: number, accountHoldingId: string) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("recurring_expenses")
    .insert({ user_id: user.id, label, amount, account_holding_id: accountHoldingId });
  await syncFixedExpenseTotal(supabase, user.id);
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function updateRecurringExpense(id: string, label: string, amount: number, accountHoldingId: string) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("recurring_expenses")
    .update({ label, amount, account_holding_id: accountHoldingId })
    .eq("id", id)
    .eq("user_id", user.id);
  await syncFixedExpenseTotal(supabase, user.id);
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function deleteRecurringExpense(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("recurring_expenses").delete().eq("id", id).eq("user_id", user.id);
  await syncFixedExpenseTotal(supabase, user.id);
  revalidatePath("/app");
  revalidatePath("/app/settings");
}
