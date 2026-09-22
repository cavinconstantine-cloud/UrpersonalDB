"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { holdingDataToJson, type HoldingData } from "@/lib/finance/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi berakhir — silakan masuk kembali.");
  return { supabase, user };
}

export async function saveLiability(category: string, data: HoldingData) {
  const { supabase, user } = await requireUser();
  await supabase.from("liabilities").upsert({ user_id: user.id, category, data: holdingDataToJson(data) });
  revalidatePath("/app");
  revalidatePath(`/app/liabilities/${category}`);
}

export async function removeLiabilityCategory(category: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("liabilities").delete().eq("user_id", user.id).eq("category", category);
  const { data: profile } = await supabase.from("profiles").select("liability_categories").eq("id", user.id).single();
  const next = (profile?.liability_categories || []).filter((c) => c !== category);
  await supabase.from("profiles").update({ liability_categories: next }).eq("id", user.id);
  revalidatePath("/app");
}
