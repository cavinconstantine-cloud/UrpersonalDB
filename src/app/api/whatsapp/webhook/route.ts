import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adjustCashBalance } from "@/app/app/assets/account-sync";
import { touchStreak } from "@/lib/finance/streak-sync";
import { sendWhatsAppMessage } from "@/lib/whatsapp/adapter";
import { parseWhatsAppTransaction, type ParsedTransaction } from "@/lib/whatsapp/parse-transaction";
import { fmtRp } from "@/lib/finance/format";
import type { HoldingData } from "@/lib/finance/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type AdminClient = ReturnType<typeof createAdminClient>;

interface InboundMessage {
  from: string;
  text: string;
  imageBase64?: string;
  imageMediaType?: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}

interface CashAccount {
  id: string;
  label: string;
}

// A pending ask-back (which Sumber Dana?) goes stale after this long — an
// old reply like a bare "1" showing up hours later shouldn't silently latch
// onto a half-remembered transaction.
const PENDING_TTL_MS = 10 * 60 * 1000;

/** "0812..." / "+62 812..." / "62812..." all normalize to "62812...". */
function normalizePhoneDigits(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

/**
 * Normalizes the gateway's raw webhook body into a plain shape the rest of
 * this route can work with. The field names below (sender/message/member) are
 * a best-effort guess at Fonnte/Wablas-style payloads — NOT verified against
 * a real account. Once you've signed up and can see a real inbound webhook
 * payload, adjust this one function to match; nothing else in this file
 * needs to change.
 */
function normalizeInboundMessage(body: Record<string, unknown>): InboundMessage | null {
  const from = normalizePhoneDigits(String(body.sender || body.from || body.phone || ""));
  if (!from) return null;
  const text = String(body.message || body.text || "").trim();
  const imageUrl = typeof body.image === "string" ? body.image : undefined;
  // Most gateways deliver an image as a URL, not inline base64 — fetching it
  // is left as a follow-up once we know the real payload shape (marked here
  // rather than guessed at, since a wrong assumption would silently drop
  // every receipt photo sent in).
  void imageUrl;
  return { from, text };
}

/** Closed-testing gate — see WHATSAPP_TEST_NUMBERS in .env.example. */
function isAllowedTester(from: string): boolean {
  const raw = process.env.WHATSAPP_TEST_NUMBERS;
  if (!raw || !raw.trim()) return true; // gate off = open to everyone already paired
  const allowed = raw
    .split(",")
    .map((n) => normalizePhoneDigits(n.trim()))
    .filter(Boolean);
  return allowed.includes(from);
}

async function findOrLinkProfile(admin: AdminClient, msg: InboundMessage) {
  if (!admin) return null;

  const { data: linked } = await admin.from("profiles").select("id").eq("whatsapp_number", msg.from).maybeSingle();
  if (linked) return linked.id;

  const code = msg.text.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) return null;

  const { data: pending } = await admin
    .from("profiles")
    .select("id")
    .eq("whatsapp_pairing_code", code)
    .maybeSingle();
  if (!pending) return null;

  await admin
    .from("profiles")
    .update({ whatsapp_number: msg.from, whatsapp_pairing_code: null, whatsapp_linked_at: new Date().toISOString() })
    .eq("id", pending.id);

  await sendWhatsAppMessage(
    msg.from,
    "✅ WhatsApp kamu terhubung ke Uangku! Sekarang tinggal chat aja, mis. \"makan siang 35rb\".",
  );
  return null; // just linked — don't also try to parse the pairing code as a transaction
}

async function getCashAccounts(admin: AdminClient, userId: string): Promise<CashAccount[]> {
  if (!admin) return [];
  const { data } = await admin.from("asset_holdings").select("id, data").eq("user_id", userId).eq("category", "Cash");
  return (data || []).map((h) => ({ id: h.id, label: String((h.data as HoldingData)?.label || "Rekening") }));
}

function numberedAccountList(accounts: CashAccount[]): string {
  return accounts.map((a, i) => `${i + 1}) ${a.label}`).join("\n");
}

function accountChoiceMessage(accounts: CashAccount[], type: "expense" | "income"): string {
  const question =
    type === "income" ? "Baik, penerimaan ini mau di catat ke rekening mana?" : "Baik, bayarnya pakai rekening mana nih?";
  return `${question} 💳\n${numberedAccountList(accounts)}\n\n(bisa diedit lagi di app kok 😉)`;
}

function todayIsoJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Inserts the transaction, syncs the Sumber Dana balance/streak, and replies. */
async function finalizeTransaction(
  admin: AdminClient,
  userId: string,
  from: string,
  parsed: ParsedTransaction,
  accountHoldingId: string | null,
  accountLabel: string | null,
) {
  if (!admin) return;

  const { error } =
    parsed.type === "expense"
      ? await admin.from("expenses").insert({
          user_id: userId,
          expense_date: todayIsoJakarta(),
          category: parsed.category,
          amount: parsed.amount,
          description: parsed.description,
          account_holding_id: accountHoldingId,
        })
      : await admin.from("incomes").insert({
          user_id: userId,
          income_date: todayIsoJakarta(),
          category: parsed.category,
          amount: parsed.amount,
          description: parsed.description,
          account_holding_id: accountHoldingId,
        });

  if (error) {
    await sendWhatsAppMessage(from, "Waduh, gagal nyimpen transaksinya 😥 Coba kirim lagi ya.");
    return;
  }

  await Promise.all([
    adjustCashBalance(admin, userId, accountHoldingId, parsed.type === "expense" ? -parsed.amount : parsed.amount),
    touchStreak(admin, userId),
  ]);

  const emoji = parsed.type === "expense" ? "💸" : "💰";
  const accountPart = accountLabel ? `, dari ${accountLabel}` : "";
  await sendWhatsAppMessage(
    from,
    `${emoji} Sip, tercatat: ${parsed.description}, ${fmtRp(parsed.amount)} — kategori ${parsed.category}${accountPart}.\nSalah? Edit langsung di app ya 🙌`,
  );
}

/**
 * Decides how (or whether) to ask which Sumber Dana this transaction belongs
 * to, preserving the existing account-linking feature instead of silently
 * dropping it for WhatsApp-logged transactions:
 *  - 0 accounts: nothing to link, save right away.
 *  - 1 account: only one place it could be, use it without asking.
 *  - 2+ accounts: try to auto-match a label mentioned in the text; only ask
 *    back when it's genuinely ambiguous.
 */
async function resolveAccountAndFinalize(admin: AdminClient, userId: string, msg: InboundMessage, parsed: ParsedTransaction) {
  if (!admin) return;
  const accounts = await getCashAccounts(admin, userId);

  if (accounts.length === 0) {
    await finalizeTransaction(admin, userId, msg.from, parsed, null, null);
    return;
  }
  if (accounts.length === 1) {
    await finalizeTransaction(admin, userId, msg.from, parsed, accounts[0].id, accounts[0].label);
    return;
  }

  const textLower = msg.text.toLowerCase();
  const matches = accounts.filter((a) => textLower.includes(a.label.toLowerCase()));
  if (matches.length === 1) {
    await finalizeTransaction(admin, userId, msg.from, parsed, matches[0].id, matches[0].label);
    return;
  }

  // Upsert (not insert) keyed on whatsapp_number: a second ambiguous message
  // arriving before the first pending question is answered replaces it
  // in-place instead of leaving the earlier row orphaned forever (nothing
  // else can ever look it up, since only the account_choices from the LATEST
  // question map to the numbers the user is asked to reply with).
  await admin.from("whatsapp_pending_transactions").upsert(
    {
      user_id: userId,
      whatsapp_number: msg.from,
      type: parsed.type,
      amount: parsed.amount,
      category: parsed.category,
      description: parsed.description,
      account_choices: accounts.map((a) => a.id),
      created_at: new Date().toISOString(),
    },
    { onConflict: "whatsapp_number" },
  );
  await sendWhatsAppMessage(msg.from, accountChoiceMessage(accounts, parsed.type));
}

/**
 * A reply while a transaction is pending account selection is expected to be
 * a bare number ("1", "2", ...) picking from the list we just sent. Returns
 * true if it handled the message (resolved, re-asked, or expired-and-fell-
 * through-to-nothing), false if the caller should treat `msg` as a fresh
 * message instead.
 */
async function tryResolvePendingSelection(admin: AdminClient, userId: string, msg: InboundMessage): Promise<boolean> {
  if (!admin) return false;

  // Best-effort housekeeping: purge anything past its TTL on every inbound
  // message (there's no separate cron sweep for this table), so a question
  // nobody ever answers doesn't sit around forever.
  await admin
    .from("whatsapp_pending_transactions")
    .delete()
    .lt("created_at", new Date(Date.now() - PENDING_TTL_MS).toISOString());

  const { data: pending } = await admin
    .from("whatsapp_pending_transactions")
    .select("id, type, amount, category, description, account_choices, created_at")
    .eq("whatsapp_number", msg.from)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!pending) return false; // nothing pending (or it just aged out above) — parse this message fresh

  const accounts = await getCashAccounts(admin, userId);
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const choices = pending.account_choices
    .map((id) => byId.get(id))
    .filter((a): a is CashAccount => Boolean(a));

  const pick = Number(msg.text.trim());
  const chosen = Number.isInteger(pick) && pick >= 1 && pick <= choices.length ? choices[pick - 1] : undefined;

  if (!chosen) {
    await sendWhatsAppMessage(msg.from, `Hmm, aku belum ngerti 🙏 Balas angkanya aja ya:\n${numberedAccountList(choices)}`);
    return true;
  }

  // Claim the row before finalizing: if two replies for the same pending
  // selection arrive close together (gateway retry/double-delivery), only
  // the one that actually deletes a row proceeds to insert the transaction —
  // the other finds nothing left to delete and backs off, instead of both
  // inserting the same transaction and double-adjusting the balance.
  const { data: claimed } = await admin
    .from("whatsapp_pending_transactions")
    .delete()
    .eq("id", pending.id)
    .select("id");
  if (!claimed || claimed.length === 0) return true;

  await finalizeTransaction(
    admin,
    userId,
    msg.from,
    { type: pending.type as "expense" | "income", amount: Number(pending.amount), category: pending.category, description: pending.description, understood: true },
    chosen.id,
    chosen.label,
  );
  return true;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (webhookSecret) {
    const url = new URL(request.url);
    if (url.searchParams.get("secret") !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Missing SUPABASE_SERVICE_ROLE_KEY." });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const msg = normalizeInboundMessage(body);
  if (!msg || !msg.text) {
    return NextResponse.json({ ok: true, skipped: true, reason: "No text/sender in payload." });
  }

  if (!isAllowedTester(msg.from)) {
    // Closed testing — numbers outside the allowlist are treated the same
    // as an unknown/unpaired number: ignored, no reply (avoids becoming a
    // spam target for random numbers texting the business account).
    return NextResponse.json({ ok: true, skipped: true, reason: "Not in closed-testing allowlist." });
  }

  const userId = await findOrLinkProfile(admin, msg);
  if (!userId) {
    return NextResponse.json({ ok: true });
  }

  const handledAsPendingReply = await tryResolvePendingSelection(admin, userId, msg);
  if (handledAsPendingReply) {
    return NextResponse.json({ ok: true, pendingResolved: true });
  }

  const parsed = await parseWhatsAppTransaction(msg.text);
  if (!parsed || !parsed.understood) {
    await sendWhatsAppMessage(
      msg.from,
      "🤔 Nggak nangkep ini sebagai transaksi. Coba format simpel, mis. \"makan siang 35rb\" atau \"gaji 5jt\".",
    );
    return NextResponse.json({ ok: true, understood: false });
  }

  await resolveAccountAndFinalize(admin, userId, msg, parsed);
  return NextResponse.json({ ok: true, understood: true, type: parsed.type, amount: parsed.amount });
}
