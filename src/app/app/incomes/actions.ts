"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { INCOME_CATS } from "@/lib/finance/constants";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi berakhir — silakan masuk kembali.");
  return { supabase, user };
}

export async function addIncome(input: {
  date: string;
  category: string;
  amount: number;
  description: string;
  accountHoldingId?: string | null;
}) {
  const { supabase, user } = await requireUser();
  if (input.amount <= 0) throw new Error("Jumlah harus lebih dari 0.");
  if (!input.category) throw new Error("Pilih kategori dulu.");

  await supabase.from("incomes").insert({
    user_id: user.id,
    income_date: input.date,
    category: input.category,
    amount: input.amount,
    description: input.description,
    account_holding_id: input.accountHoldingId ?? null,
  });

  revalidatePath("/app");
  revalidatePath("/app/expenses");
}

export async function updateIncome(
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
  await supabase
    .from("incomes")
    .update({
      income_date: input.date,
      category: input.category,
      amount: input.amount,
      description: input.description,
      account_holding_id: input.accountHoldingId ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/app");
  revalidatePath("/app/expenses");
}

export async function deleteIncome(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("incomes").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/app");
  revalidatePath("/app/expenses");
}

export async function addCustomIncomeCategory(name: string) {
  const { supabase, user } = await requireUser();
  const trimmed = name.trim();
  if (!trimmed || (INCOME_CATS as readonly string[]).includes(trimmed)) return;

  await supabase.from("custom_income_categories").upsert({ user_id: user.id, name: trimmed });
  revalidatePath("/app");
  revalidatePath("/app/expenses");
}
