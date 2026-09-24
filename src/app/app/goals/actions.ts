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

export async function addGoal(name: string, targetDate: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("goals")
    .insert({ user_id: user.id, name, target: 0, current: 0, target_date: targetDate });
  throwIfError(error, "menambah goal");
  revalidatePath("/app");
  revalidatePath("/app/goals");
}

export async function updateGoal(id: string, patch: { name?: string; target?: number; current?: number; targetDate?: string }) {
  const { supabase, user } = await requireUser();
  const update: { name?: string; target?: number; current?: number; target_date?: string } = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.target !== undefined) update.target = patch.target;
  if (patch.current !== undefined) update.current = patch.current;
  if (patch.targetDate !== undefined) update.target_date = patch.targetDate;

  const { error } = await supabase.from("goals").update(update).eq("id", id).eq("user_id", user.id);
  throwIfError(error, "menyimpan goal");
  revalidatePath("/app");
  revalidatePath("/app/goals");
}

export async function deleteGoal(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", user.id);
  throwIfError(error, "menghapus goal");
  revalidatePath("/app");
  revalidatePath("/app/goals");
}
