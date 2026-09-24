"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { EXPENSE_CATS } from "@/lib/finance/constants";
import { adjustCashBalance } from "@/app/app/assets/account-sync";
import { throwIfError } from "@/lib/supabase/db-error";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi berakhir — silakan masuk kembali.");
  return { supabase, user };
}

export async function addExpense(input: {
  date: string;
  category: string;
  amount: number;
  description: string;
  accountHoldingId?: string | null;
}) {
  const { supabase, user } = await requireUser();
  if (input.amount <= 0) throw new Error("Jumlah harus lebih dari 0.");
  if (!input.category) throw new Error("Pilih kategori dulu.");

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id,
    expense_date: input.date,
    category: input.category,
    amount: input.amount,
    description: input.description,
    account_holding_id: input.accountHoldingId ?? null,
  });
  throwIfError(error, "menyimpan pengeluaran");
  await adjustCashBalance(supabase, user.id, input.accountHoldingId, -input.amount);

  revalidatePath("/app");
  revalidatePath("/app/expenses");
}

export async function addManyExpenses(
  rows: { date: string; category: string; amount: number; description: string }[],
) {
  const { supabase, user } = await requireUser();
  const valid = rows.filter((r) => r.amount > 0 && r.category);
  if (valid.length === 0) return;

  const { error } = await supabase.from("expenses").insert(
    valid.map((r) => ({
      user_id: user.id,
      expense_date: r.date,
      category: r.category,
      amount: r.amount,
      description: r.description,
    })),
  );
  throwIfError(error, "menyimpan pengeluaran");

  revalidatePath("/app");
  revalidatePath("/app/expenses");
}

export async function updateExpense(
  id: string,
  input: {
    date: string;
    category: string;
    amount: number;
    description: string;
    accountHoldingId?: string | null;
  },
) {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("expenses")
    .select("amount, account_holding_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("expenses")
    .update({
      expense_date: input.date,
      category: input.category,
      amount: input.amount,
      description: input.description,
      account_holding_id: input.accountHoldingId ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  throwIfError(error, "menyimpan perubahan pengeluaran");

  if (existing) {
    // undo the old debit, then apply the new one — handles amount changes,
    // switching accounts, or removing/adding the Sumber Dana link
    await adjustCashBalance(supabase, user.id, existing.account_holding_id, Number(existing.amount));
  }
  await adjustCashBalance(supabase, user.id, input.accountHoldingId, -input.amount);

  revalidatePath("/app");
  revalidatePath("/app/expenses");
}

export async function deleteExpense(id: string) {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("expenses")
    .select("amount, account_holding_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("expenses").delete().eq("id", id).eq("user_id", user.id);
  throwIfError(error, "menghapus pengeluaran");

  if (existing) {
    await adjustCashBalance(supabase, user.id, existing.account_holding_id, Number(existing.amount));
  }

  revalidatePath("/app");
  revalidatePath("/app/expenses");
}

export async function addCustomExpenseCategory(name: string) {
  const { supabase, user } = await requireUser();
  const trimmed = name.trim();
  if (!trimmed || (EXPENSE_CATS as readonly string[]).includes(trimmed)) return;

  const { error } = await supabase.from("custom_expense_categories").upsert({ user_id: user.id, name: trimmed });
  throwIfError(error, "menambah kategori");
  revalidatePath("/app");
  revalidatePath("/app/expenses");
}
