import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/** "Today" in WIB — streak day boundaries follow Indonesian wall-clock time regardless of caller (app request or WhatsApp webhook), not the transaction's own (possibly backdated) date. */
function todayIsoJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Advances a user's daily-logging streak whenever they record a transaction
 * (expense or income — from the app or WhatsApp). Idempotent within a day:
 * logging twice today doesn't double-count. A gap of more than one day
 * resets the streak to 1 instead of breaking it to 0, since the user is
 * logging again right now — the reset itself is the natural signal.
 */
export async function touchStreak(supabase: SupabaseClient<Database>, userId: string) {
  const todayIso = todayIsoJakarta();
  const { data: row } = await supabase
    .from("logging_streaks")
    .select("current_streak, longest_streak, last_logged_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (row?.last_logged_date === todayIso) return; // already logged today

  const yesterday = new Date(todayIso);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayIso = yesterday.toISOString().slice(0, 10);

  const continuing = row?.last_logged_date === yesterdayIso;
  const nextStreak = continuing ? (row?.current_streak || 0) + 1 : 1;
  const nextLongest = Math.max(nextStreak, row?.longest_streak || 0);

  await supabase.from("logging_streaks").upsert({
    user_id: userId,
    current_streak: nextStreak,
    longest_streak: nextLongest,
    last_logged_date: todayIso,
    updated_at: new Date().toISOString(),
  });
}
