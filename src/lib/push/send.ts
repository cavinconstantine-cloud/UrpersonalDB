import "server-only";
import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export function isPushConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@uangku.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

/**
 * Sends a push notification to every device a user has subscribed on.
 * Subscriptions the browser has revoked (410 Gone / 404) are pruned so the
 * next send doesn't keep retrying a dead endpoint.
 */
export async function sendPushToUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  payload: { title: string; body: string; url?: string },
) {
  if (!isPushConfigured()) return { sent: 0 };
  ensureConfigured();

  const { data: subs } = await supabase.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", userId);
  if (!subs || subs.length === 0) return { sent: 0 };

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
      sent++;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      } else {
        console.error("sendPushToUser: push failed for", sub.endpoint, err);
      }
    }
  }
  return { sent };
}
