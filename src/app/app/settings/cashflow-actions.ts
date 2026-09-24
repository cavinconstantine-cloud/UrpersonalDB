"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { throwIfError } from "@/lib/supabase/db-error";

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
  const { error } = await supabase
    .from("recurring_incomes")
    .insert({ user_id: user.id, label, amount, account_holding_id: accountHoldingId });
  throwIfError(error, "menambah pemasukan tetap");
  await syncIncomeTotal(supabase, user.id);
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function updateRecurringIncome(id: string, label: string, amount: number, accountHoldingId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("recurring_incomes")
    .update({ label, amount, account_holding_id: accountHoldingId })
    .eq("id", id)
    .eq("user_id", user.id);
  throwIfError(error, "menyimpan pemasukan tetap");
  await syncIncomeTotal(supabase, user.id);
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function deleteRecurringIncome(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("recurring_incomes").delete().eq("id", id).eq("user_id", user.id);
  throwIfError(error, "menghapus pemasukan tetap");
  await syncIncomeTotal(supabase, user.id);
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function addRecurringExpense(label: string, amount: number, accountHoldingId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("recurring_expenses")
    .insert({ user_id: user.id, label, amount, account_holding_id: accountHoldingId });
  throwIfError(error, "menambah pengeluaran tetap");
  await syncFixedExpenseTotal(supabase, user.id);
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function updateRecurringExpense(id: string, label: string, amount: number, accountHoldingId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("recurring_expenses")
    .update({ label, amount, account_holding_id: accountHoldingId })
    .eq("id", id)
    .eq("user_id", user.id);
  throwIfError(error, "menyimpan pengeluaran tetap");
  await syncFixedExpenseTotal(supabase, user.id);
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function deleteRecurringExpense(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("recurring_expenses").delete().eq("id", id).eq("user_id", user.id);
  throwIfError(error, "menghapus pengeluaran tetap");
  await syncFixedExpenseTotal(supabase, user.id);
  revalidatePath("/app");
  revalidatePath("/app/settings");
}
