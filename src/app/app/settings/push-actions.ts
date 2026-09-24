"use server";

import { createClient } from "@/lib/supabase/server";
import { throwIfError } from "@/lib/supabase/db-error";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi berakhir — silakan masuk kembali.");
  return { supabase, user };
}

export async function subscribePush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" },
  );
  throwIfError(error, "mengaktifkan notifikasi");

  await supabase.from("profiles").update({ push_enabled: true }).eq("id", user.id);
}

export async function unsubscribePush(endpoint: string) {
  const { supabase, user } = await requireUser();

  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", user.id);

  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (!count) {
    await supabase.from("profiles").update({ push_enabled: false }).eq("id", user.id);
  }
}
