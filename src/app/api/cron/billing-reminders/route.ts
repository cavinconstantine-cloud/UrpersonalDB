import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isResendConfigured, sendEmail } from "@/lib/email/resend";
import { fmtRp } from "@/lib/finance/format";
import { LIAB_SCHEMAS, liabValue } from "@/lib/finance/schemas";
import type { HoldingData } from "@/lib/finance/types";

export const dynamic = "force-dynamic";

function jakartaTodayParts(): { day: number; isoDate: string } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const isoDate = fmt.format(now); // en-CA formats as YYYY-MM-DD
  const day = Number(isoDate.slice(8, 10));
  return { day, isoDate };
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  if (!admin || !isResendConfigured()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Billing reminders not configured (missing SUPABASE_SERVICE_ROLE_KEY or RESEND_API_KEY).",
    });
  }

  const { day, isoDate } = jakartaTodayParts();

  const { data: dueLiabilities, error } = await admin
    .from("liabilities")
    .select("id, user_id, category, data")
    .eq("data->>billingDay", String(day));

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  const checked = dueLiabilities?.length || 0;

  for (const liability of dueLiabilities || []) {
    const { error: insertError } = await admin
      .from("billing_reminders_sent")
      .insert({ liability_id: liability.id, sent_date: isoDate });

    if (insertError) {
      // Unique constraint violation = already reminded today; anything else, skip too.
      skipped++;
      continue;
    }

    const { data: userRes } = await admin.auth.admin.getUserById(liability.user_id);
    const email = userRes?.user?.email;
    if (!email) {
      skipped++;
      continue;
    }

    const data = (liability.data as HoldingData) || {};
    const schema = LIAB_SCHEMAS[liability.category];
    const label = String(data.label || liability.category);
    const amount = liabValue(data);
    const monthlyPayment = schema ? schema.monthlyPayment(data) : 0;

    const ok = await sendEmail({
      to: email,
      subject: `Reminder: billing ${liability.category} — ${label}`,
      html: `
        <div style="font-family:sans-serif;font-size:15px;color:#1c1b18;line-height:1.6;">
          <p>Halo,</p>
          <p>Ini pengingat otomatis dari <strong>Uangku</strong> — hari ini tanggal billing untuk:</p>
          <p style="background:#f1eee6;border-radius:8px;padding:14px 16px;margin:16px 0;">
            <strong>${label}</strong> (${liability.category})<br/>
            Outstanding saat ini: <strong>${fmtRp(amount)}</strong>
            ${monthlyPayment ? `<br/>Estimasi cicilan/pembayaran bulanan: <strong>${fmtRp(monthlyPayment)}</strong>` : ""}
          </p>
          <p>Jangan lupa cek dan bayar tagihannya ya. Update juga angka OS terbaru di dashboard Uangku setelah bayar.</p>
          <p style="color:#898781;font-size:12px;margin-top:24px;">Email otomatis — data diambil dari input manual kamu di Uangku, bukan dari bank.</p>
        </div>
      `,
    });

    if (ok) sent++;
    else skipped++;
  }

  return NextResponse.json({ ok: true, checked, sent, skipped, day, isoDate });
}
