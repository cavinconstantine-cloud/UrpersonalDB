import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adjustCashBalance } from "@/app/app/assets/account-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Karyawan-only for now — Pengusaha has no fixed `payday_day` (their FCF is
 * already a rolling average of actually-recorded income, so there's no
 * single date to hang an automatic debit/credit off of). Revisit if/when
 * Pengusaha gets its own recurring-cashflow concept.
 */
function jakartaDateParts(isoOverride: string | null): { day: number; isoDate: string; daysInMonth: number } {
  let isoDate: string;
  if (isoOverride && /^\d{4}-\d{2}-\d{2}$/.test(isoOverride)) {
    isoDate = isoOverride;
  } else {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    isoDate = fmt.format(new Date()); // en-CA formats as YYYY-MM-DD
  }
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { day, isoDate, daysInMonth };
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
  if (!admin) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Payday automation not configured (missing SUPABASE_SERVICE_ROLE_KEY).",
    });
  }

  const url = new URL(request.url);
  // Testing aids — never needed by the real cron: `date` simulates "today" is
  // some other WIB date (e.g. tomorrow's payday, tested a day early), `dryRun`
  // computes and reports what would happen without writing anything.
  const dateOverride = url.searchParams.get("date");
  const dryRun = url.searchParams.get("dryRun") === "true";
  const { day: todayDay, isoDate: todayIso, daysInMonth } = jakartaDateParts(dateOverride);
  const executionMonth = `${todayIso.slice(0, 7)}-01`;

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, payday_day")
    .eq("profile_type", "karyawan")
    .not("payday_day", "is", null);

  if (profilesError) {
    return NextResponse.json({ ok: false, error: profilesError.message }, { status: 500 });
  }

  // A payday set past the end of a short month (e.g. 31 in February) lands
  // on that month's last day instead of silently never firing.
  const dueUsers = (profiles || []).filter((p) => Math.min(Number(p.payday_day), daysInMonth) === todayDay);

  let usersProcessed = 0;
  let usersSkippedAlreadyRun = 0;
  let incomesCreated = 0;
  let expensesCreated = 0;
  const errors: string[] = [];

  for (const p of dueUsers) {
    const userId = p.id;

    if (!dryRun) {
      // Claim this user+month first (unique constraint) — if it already
      // exists, the automation already ran for them this month, skip.
      const { error: claimError } = await admin
        .from("payday_executions")
        .insert({ user_id: userId, execution_month: executionMonth });
      if (claimError) {
        // 23505 = unique_violation — the automation genuinely already ran for
        // this user this month, which is the expected/common case. Any other
        // error (connection issue, schema problem, etc.) is a real failure
        // and must not be silently folded into the same "already ran" count.
        if (claimError.code === "23505") {
          usersSkippedAlreadyRun++;
        } else {
          errors.push(`claim failed for user ${userId}: ${claimError.message}`);
        }
        continue;
      }
    } else {
      const { data: already } = await admin
        .from("payday_executions")
        .select("id")
        .eq("user_id", userId)
        .eq("execution_month", executionMonth)
        .maybeSingle();
      if (already) {
        usersSkippedAlreadyRun++;
        continue;
      }
    }

    const [{ data: recIncomes }, { data: recExpenses }] = await Promise.all([
      admin.from("recurring_incomes").select("label, amount, account_holding_id").eq("user_id", userId),
      admin.from("recurring_expenses").select("label, amount, account_holding_id").eq("user_id", userId),
    ]);

    let userIncomesCreated = 0;
    let userExpensesCreated = 0;

    for (const r of recIncomes || []) {
      const amount = Number(r.amount);
      if (amount <= 0) continue;
      if (dryRun) {
        userIncomesCreated++;
        continue;
      }
      const { error } = await admin.from("incomes").insert({
        user_id: userId,
        income_date: todayIso,
        category: "Gaji",
        amount,
        description: r.label,
        account_holding_id: r.account_holding_id,
        is_auto_recurring: true,
      });
      if (error) {
        errors.push(`income insert failed for user ${userId} (${r.label}): ${error.message}`);
        continue;
      }
      userIncomesCreated++;
      await adjustCashBalance(admin, userId, r.account_holding_id, amount);
    }

    for (const r of recExpenses || []) {
      const amount = Number(r.amount);
      if (amount <= 0) continue;
      if (dryRun) {
        userExpensesCreated++;
        continue;
      }
      const { error } = await admin.from("expenses").insert({
        user_id: userId,
        expense_date: todayIso,
        category: "Tagihan",
        amount,
        description: r.label,
        account_holding_id: r.account_holding_id,
        is_auto_recurring: true,
      });
      if (error) {
        errors.push(`expense insert failed for user ${userId} (${r.label}): ${error.message}`);
        continue;
      }
      userExpensesCreated++;
      await adjustCashBalance(admin, userId, r.account_holding_id, -amount);
    }

    if (!dryRun && (userIncomesCreated > 0 || userExpensesCreated > 0)) {
      await admin
        .from("payday_executions")
        .update({ incomes_created: userIncomesCreated, expenses_created: userExpensesCreated })
        .eq("user_id", userId)
        .eq("execution_month", executionMonth);
    }

    incomesCreated += userIncomesCreated;
    expensesCreated += userExpensesCreated;
    usersProcessed++;
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    date: todayIso,
    usersDue: dueUsers.length,
    usersProcessed,
    usersSkippedAlreadyRun,
    incomesCreated,
    expensesCreated,
    ...(errors.length ? { errors } : {}),
  });
}
