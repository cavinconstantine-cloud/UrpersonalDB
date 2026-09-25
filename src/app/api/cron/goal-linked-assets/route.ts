import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isResendConfigured, sendEmail } from "@/lib/email/resend";
import { fmtRp } from "@/lib/finance/format";
import {
  depositoMaturityDate,
  depositoNetInterestMonthly,
  depositoPayoutAmountThisMonth,
  depositoPayoutDayThisMonth,
  obligasiNetCouponMonthly,
  obligasiPayoutAmountThisMonth,
  obligasiPayoutDayThisMonth,
} from "@/lib/finance/schemas";
import type { HoldingData } from "@/lib/finance/types";

export const dynamic = "force-dynamic";

function jakartaTodayParts(): { day: number; isoDate: string; date: Date } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const isoDate = fmt.format(now); // en-CA formats as YYYY-MM-DD
  const [y, m, d] = isoDate.split("-").map(Number);
  return { day: d, isoDate, date: new Date(y, m - 1, d) };
}

/**
 * Daily job for goal-linked Deposito/Obligasi holdings (asset_holdings.goal_id set):
 * 1. On a payout day, credit that month's net interest/coupon into
 *    goal_interest_credits (idempotent — unique(holding_id, credit_date)).
 * 2. H-7 before maturity, email a reminder that the goal link is about to drop.
 * 3. On/after maturity, unlink the holding from its goal (goal_id = null) —
 *    matches the "tercopot dari goal saat cair" behavior promised in the UI.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Goal-linked asset job not configured (missing SUPABASE_SERVICE_ROLE_KEY).",
    });
  }
  // Rebound to a non-null local so the type stays narrowed inside
  // processHolding below (a closure over the original `const` doesn't keep
  // TS's null-check narrowing).
  const admin = adminClient;

  const { day, isoDate, date: today } = jakartaTodayParts();
  const emailEnabled = isResendConfigured();

  const { data: linkedHoldings, error } = await admin
    .from("asset_holdings")
    .select("id, user_id, category, data, goal_id")
    .not("goal_id", "is", null)
    .in("category", ["Deposito", "Obligasi"]);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  type HoldingRow = NonNullable<typeof linkedHoldings>[number];

  // Each holding's three steps (credit, reminder, unlink) touch only that
  // holding's own rows, so different holdings are fully independent of each
  // other — processed concurrently instead of one full holding at a time.
  async function processHolding(holding: HoldingRow) {
    const result = { credited: false, remindersSent: false, unlinked: false };
    const h = (holding.data as HoldingData) || {};
    const isDeposito = holding.category === "Deposito";

    // 1. Interest/coupon credit, on its payout day.
    const payoutDay = isDeposito ? depositoPayoutDayThisMonth(h, today) : obligasiPayoutDayThisMonth(h, today);
    if (payoutDay === day) {
      const amount = isDeposito ? depositoPayoutAmountThisMonth(h) : obligasiPayoutAmountThisMonth(h);
      if (amount > 0) {
        const { error: creditError } = await admin.from("goal_interest_credits").insert({
          user_id: holding.user_id,
          goal_id: holding.goal_id!,
          holding_id: holding.id,
          credit_date: isoDate,
          amount,
        });
        if (!creditError) result.credited = true;
        // A unique-constraint error just means today's credit already ran — not a failure.
      }
    }

    // 2. Maturity reminder / auto-unlink.
    const maturityStr = isDeposito ? depositoMaturityDate(h) : typeof h.maturityDate === "string" ? h.maturityDate : null;
    if (!maturityStr) return result;
    const maturity = new Date(maturityStr);
    if (isNaN(maturity.getTime())) return result;
    const daysUntil = Math.round((maturity.getTime() - today.getTime()) / 86400000);

    if (daysUntil === 7 && emailEnabled) {
      const { error: reminderError } = await admin
        .from("goal_maturity_reminders_sent")
        .insert({ holding_id: holding.id, sent_date: isoDate });
      if (!reminderError) {
        const { data: userRes } = await admin.auth.admin.getUserById(holding.user_id);
        const email = userRes?.user?.email;
        const label = typeof h.label === "string" && h.label ? h.label : holding.category;
        const monthlyRate = isDeposito ? depositoNetInterestMonthly(h) : obligasiNetCouponMonthly(h);
        if (email) {
          const ok = await sendEmail({
            to: email,
            subject: `Jatuh tempo 7 hari lagi — ${label} (terhubung ke goal)`,
            html: `
              <div style="font-family:sans-serif;font-size:15px;color:#1c1b18;line-height:1.6;">
                <p>Halo,</p>
                <p>Ini pengingat otomatis dari <strong>Uangku</strong> — instrumen berikut akan jatuh tempo <strong>7 hari lagi</strong> (${maturityStr}):</p>
                <p style="background:#f1eee6;border-radius:8px;padding:14px 16px;margin:16px 0;">
                  <strong>${label}</strong> (${holding.category})<br/>
                  Bunga/kupon bulanan yang selama ini masuk ke goal: <strong>${fmtRp(monthlyRate)}</strong>
                </p>
                <p>Saat jatuh tempo, instrumen ini otomatis tercopot dari goal-nya. Perpanjang instrumennya, atau pindahkan dananya ke rekening Cash lalu hubungkan lagi ke goal supaya progress tetap jalan.</p>
                <p style="color:#898781;font-size:12px;margin-top:24px;">Email otomatis dari Uangku, berdasarkan data yang kamu input sendiri.</p>
              </div>
            `,
          });
          if (ok) result.remindersSent = true;
        }
      }
    }

    if (daysUntil <= 0) {
      const { error: unlinkError } = await admin.from("asset_holdings").update({ goal_id: null }).eq("id", holding.id);
      if (!unlinkError) result.unlinked = true;
    }

    return result;
  }

  const results = await Promise.all((linkedHoldings || []).map(processHolding));
  const credited = results.filter((r) => r.credited).length;
  const remindersSent = results.filter((r) => r.remindersSent).length;
  const unlinked = results.filter((r) => r.unlinked).length;

  return NextResponse.json({ ok: true, checked: linkedHoldings?.length || 0, credited, remindersSent, unlinked });
}
