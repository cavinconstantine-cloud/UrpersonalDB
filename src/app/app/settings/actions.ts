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

export async function updateProfileName(name: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("profiles").update({ name }).eq("id", user.id);
  throwIfError(error, "menyimpan nama");
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function updateProfileType(input: { profileType: "karyawan" | "pengusaha"; paydayDay: number | null }) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      profile_type: input.profileType,
      payday_day: input.profileType === "karyawan" ? input.paydayDay : null,
    })
    .eq("id", user.id);
  throwIfError(error, "menyimpan tipe profil");
  revalidatePath("/app");
  revalidatePath("/app/settings");
}
