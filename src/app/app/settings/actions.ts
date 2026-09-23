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

export async function updateProfileName(name: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ name }).eq("id", user.id);
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function updateCashflow(input: { lifestyleExpense: number; invest: number }) {
  const { supabase, user } = await requireUser();
  await supabase.from("cashflow").upsert({
    user_id: user.id,
    lifestyle_expense: input.lifestyleExpense,
    invest: input.invest,
  });
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function updateProfileType(input: { profileType: "karyawan" | "pengusaha"; paydayDay: number | null }) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("profiles")
    .update({
      profile_type: input.profileType,
      payday_day: input.profileType === "karyawan" ? input.paydayDay : null,
    })
    .eq("id", user.id);
  revalidatePath("/app");
  revalidatePath("/app/settings");
}
