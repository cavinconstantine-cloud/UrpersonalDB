import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser, isPushConfigured } from "@/lib/push/send";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function todayIsoJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Runs ~20:00 WIB. For every user who's opted into push and hasn't logged a
 * transaction yet today, sends a reminder — worded around their streak if
 * they have one (the strongest pull), a plain nudge otherwise.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  if (!admin || !isPushConfigured()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Push not configured (missing SUPABASE_SERVICE_ROLE_KEY or VAPID keys).",
    });
  }

  const todayIso = todayIsoJakarta();

  const { data: profiles, error } = await admin.from("profiles").select("id").eq("push_enabled", true);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skippedAlreadyLogged = 0;

  const userIds = (profiles || []).map((p) => p.id);
  const { data: streaks } = userIds.length
    ? await admin.from("logging_streaks").select("user_id, current_streak, last_logged_date").in("user_id", userIds)
    : { data: [] };
  const streakByUser = new Map((streaks || []).map((s) => [s.user_id, s]));

  for (const p of profiles || []) {
    const streak = streakByUser.get(p.id);

    if (streak?.last_logged_date === todayIso) {
      skippedAlreadyLogged++;
      continue;
    }

    const body =
      streak && streak.current_streak > 0
        ? `Streak ${streak.current_streak} hari kamu bisa putus kalau belum catat apa-apa hari ini. Chat WA atau buka app, yuk!`
        : "Belum ada transaksi tercatat hari ini. Yuk catat pengeluaran/pemasukanmu — cukup 10 detik.";

    const result = await sendPushToUser(admin, p.id, { title: "Uangku", body, url: "/app" });
    if (result.sent > 0) sent++;
  }

  return NextResponse.json({ ok: true, usersChecked: profiles?.length || 0, sent, skippedAlreadyLogged });
}
