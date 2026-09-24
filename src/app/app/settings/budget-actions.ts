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

export async function setBudget(category: string, monthlyLimit: number) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("budgets")
    .upsert({ user_id: user.id, category, monthly_limit: monthlyLimit });
  if (error) throw new Error(`Gagal menyimpan budget: ${error.message}`);
  revalidatePath("/app");
  revalidatePath("/app/cashflow");
}
