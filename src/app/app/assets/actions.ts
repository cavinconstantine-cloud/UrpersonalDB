"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { holdingDataToJson, type HoldingData } from "@/lib/finance/types";
import { throwIfError } from "@/lib/supabase/db-error";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi berakhir — silakan masuk kembali.");
  return { supabase, user };
}

export async function addHolding(category: string, data: HoldingData, goalId?: string | null) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("asset_holdings")
    .insert({ user_id: user.id, category, data: holdingDataToJson(data), goal_id: goalId ?? null });
  throwIfError(error, "menyimpan aset");
  revalidatePath("/app");
  revalidatePath("/app/goals");
  revalidatePath(`/app/assets/${category}`);
}

export async function updateHolding(id: string, data: HoldingData, goalId?: string | null) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("asset_holdings")
    .update({ data: holdingDataToJson(data), goal_id: goalId ?? null })
    .eq("id", id)
    .eq("user_id", user.id);
  throwIfError(error, "menyimpan perubahan aset");
  revalidatePath("/app");
  revalidatePath("/app/goals");
  revalidatePath("/app/assets");
}

export async function deleteHolding(id: string, category: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("asset_holdings").delete().eq("id", id).eq("user_id", user.id);
  throwIfError(error, "menghapus aset");
  revalidatePath("/app");
  revalidatePath(`/app/assets/${category}`);
}

export async function removeAssetCategory(category: string) {
  const { supabase, user } = await requireUser();
  const { error: deleteError } = await supabase
    .from("asset_holdings")
    .delete()
    .eq("user_id", user.id)
    .eq("category", category);
  throwIfError(deleteError, "menghapus kategori");
  const { data: profile } = await supabase.from("profiles").select("asset_categories").eq("id", user.id).single();
  const next = (profile?.asset_categories || []).filter((c) => c !== category);
  const { error: updateError } = await supabase.from("profiles").update({ asset_categories: next }).eq("id", user.id);
  throwIfError(updateError, "menghapus kategori");
  revalidatePath("/app");
}
