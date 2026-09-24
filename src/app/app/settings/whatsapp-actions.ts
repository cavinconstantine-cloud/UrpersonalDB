"use server";

import { createClient } from "@/lib/supabase/server";
import { throwIfError } from "@/lib/supabase/db-error";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi berakhir — silakan masuk kembali.");
  return { supabase, user };
}

function randomPairingCode() {
  // Short, easy to type on a phone keyboard — collision risk is a non-issue
  // since a code is only ever "live" for the single user who just generated
  // it, and gets cleared the moment it's consumed by the webhook.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function generatePairingCode() {
  const { supabase, user } = await requireUser();
  const code = randomPairingCode();
  const { error } = await supabase.from("profiles").update({ whatsapp_pairing_code: code }).eq("id", user.id);
  throwIfError(error, "membuat kode pairing");
  revalidatePath("/app/settings");
  return code;
}

export async function unlinkWhatsapp() {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ whatsapp_number: null, whatsapp_pairing_code: null, whatsapp_linked_at: null })
    .eq("id", user.id);
  throwIfError(error, "melepas hubungan WhatsApp");
  revalidatePath("/app/settings");
}
