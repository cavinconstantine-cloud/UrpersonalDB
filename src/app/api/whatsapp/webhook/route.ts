import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adjustCashBalance } from "@/app/app/assets/account-sync";
import { touchStreak } from "@/lib/finance/streak-sync";
import { sendWhatsAppMessage } from "@/lib/whatsapp/adapter";
import { parseWhatsAppTransaction } from "@/lib/whatsapp/parse-transaction";
import { fmtRp } from "@/lib/finance/format";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface InboundMessage {
  from: string;
  text: string;
  imageBase64?: string;
  imageMediaType?: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
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
  const from = String(body.sender || body.from || body.phone || "").replace(/[^0-9]/g, "");
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

async function findOrLinkProfile(admin: ReturnType<typeof createAdminClient>, msg: InboundMessage) {
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

  await sendWhatsAppMessage(msg.from, "✅ WhatsApp kamu terhubung ke Uangku! Sekarang tinggal chat aja, mis. \"makan siang 35rb\".");
  return null; // just linked — don't also try to parse the pairing code as a transaction
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

  const userId = await findOrLinkProfile(admin, msg);
  if (!userId) {
    // Either just linked (handled above), or genuinely unknown — for an
    // unknown number we deliberately don't reply, to avoid becoming a spam
    // target for random numbers texting the business account.
    return NextResponse.json({ ok: true });
  }

  const parsed = await parseWhatsAppTransaction(msg.text);
  if (!parsed || !parsed.understood) {
    await sendWhatsAppMessage(
      msg.from,
      "Nggak nangkep ini sebagai transaksi. Coba format simpel, mis. \"makan siang 35rb\" atau \"gaji 5jt\".",
    );
    return NextResponse.json({ ok: true, understood: false });
  }

  const todayIso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const { error } =
    parsed.type === "expense"
      ? await admin.from("expenses").insert({
          user_id: userId,
          expense_date: todayIso,
          category: parsed.category,
          amount: parsed.amount,
          description: parsed.description,
        })
      : await admin.from("incomes").insert({
          user_id: userId,
          income_date: todayIso,
          category: parsed.category,
          amount: parsed.amount,
          description: parsed.description,
        });

  if (error) {
    await sendWhatsAppMessage(msg.from, "Gagal nyimpen transaksinya, coba lagi ya.");
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  await adjustCashBalance(admin, userId, null, parsed.type === "expense" ? -parsed.amount : parsed.amount);
  await touchStreak(admin, userId);

  const emoji = parsed.type === "expense" ? "💸" : "💰";
  await sendWhatsAppMessage(
    msg.from,
    `${emoji} Tercatat: ${parsed.description}, ${fmtRp(parsed.amount)} — kategori ${parsed.category}.\nSalah? Edit langsung di app Uangku.`,
  );

  return NextResponse.json({ ok: true, understood: true, type: parsed.type, amount: parsed.amount });
}
