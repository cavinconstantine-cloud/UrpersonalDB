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
  const { data: lastRow } = await supabase
    .from("asset_holdings")
    .select("sort_order")
    .eq("user_id", user.id)
    .eq("category", category)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = (lastRow?.sort_order ?? -1) + 1;
  const { error } = await supabase.from("asset_holdings").insert({
    user_id: user.id,
    category,
    data: holdingDataToJson(data),
    goal_id: goalId ?? null,
    sort_order: nextSortOrder,
  });
  throwIfError(error, "menyimpan aset");
  revalidatePath("/app");
  revalidatePath("/app/goals");
  revalidatePath(`/app/assets/${category}`);
}

/** Persists a drag/tap reorder of a category's holdings — `orderedIds` is the full list, in its new top-to-bottom order. */
export async function reorderHoldings(category: string, orderedIds: string[]) {
  const { supabase, user } = await requireUser();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("asset_holdings")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("category", category),
    ),
  );
  const failed = results.find((r) => r.error);
  throwIfError(failed?.error ?? null, "menyimpan urutan aset");
  revalidatePath(`/app/assets/${category}`);
  revalidatePath("/app");
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
