"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addCategory(kind: "asset" | "liability", category: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi berakhir — silakan masuk kembali.");

  if (kind === "asset") {
    const { data: profile } = await supabase.from("profiles").select("asset_categories").eq("id", user.id).single();
    const current = profile?.asset_categories || [];
    if (current.includes(category)) return;
    await supabase.from("profiles").update({ asset_categories: [...current, category] }).eq("id", user.id);
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("liability_categories")
      .eq("id", user.id)
      .single();
    const current = profile?.liability_categories || [];
    if (current.includes(category)) return;
    await supabase.from("profiles").update({ liability_categories: [...current, category] }).eq("id", user.id);
  }

  revalidatePath("/app");
}
