"use server";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adjustCashBalance } from "@/app/app/assets/account-sync";
import { revalidatePath } from "next/cache";
import {
  allocateSplit,
  isFullyAssigned,
  type SplitAssignments,
  type SplitItem,
  type SplitParticipant,
  type SplitSharedMode,
  type SplitSharedWith,
} from "@/lib/finance/split";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi berakhir — silakan masuk kembali.");
  return { supabase, user };
}

const ExtractedReceiptSchema = z.object({
  merchant: z.string().describe("Nama toko/restoran di struk, atau string kosong jika tidak terbaca"),
  items: z.array(
    z.object({
      name: z.string(),
      qty: z.number().int().min(1),
      unitPrice: z.number().min(0).describe("Harga per satu unit, dalam Rupiah"),
    }),
  ),
  subtotal: z.number().min(0),
  tax: z.number().min(0).describe("Pajak/PPN, 0 jika tidak ada"),
  service: z.number().min(0).describe("Service charge, 0 jika tidak ada"),
  total: z.number().min(0),
});

export interface ExtractedReceipt {
  merchant: string;
  items: { name: string; qty: number; unitPrice: number }[];
  subtotal: number;
  tax: number;
  service: number;
  total: number;
}

export interface ExtractReceiptResult {
  ok: boolean;
  imagePath?: string;
  extraction?: ExtractedReceipt;
  error?: string;
}

/**
 * Uploads the receipt photo to the user's private Storage folder, then asks
 * Claude to read it into structured line items. The result is always shown
 * to the user for review/edit before anything is saved — extraction
 * accuracy is inherently imperfect (this is still Beta), so nothing here is
 * trusted blindly.
 */
export async function extractReceipt(base64: string, mediaType: string): Promise<ExtractReceiptResult> {
  const { supabase, user } = await requireUser();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Fitur baca struk belum dikonfigurasi. Tambahkan ANTHROPIC_API_KEY di environment." };
  }

  const ext = mediaType.split("/")[1] || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(base64, "base64");
  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(path, bytes, { contentType: mediaType, upsert: false });
  if (uploadError) {
    return { ok: false, error: "Gagal mengunggah foto struk. Coba lagi." };
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const validMediaType = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mediaType)
      ? (mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif")
      : "image/jpeg";
    const response = await anthropic.messages.parse({
      // Sonnet instead of Opus — struk-reading is a bounded OCR/extraction
      // task, not deep reasoning, and every extraction already goes through
      // a mandatory user review step before it's saved, so Sonnet's vision
      // accuracy is more than enough here at a fraction of the cost.
      model: "claude-sonnet-5",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: validMediaType, data: base64 } },
            {
              type: "text",
              text: "Baca struk belanja/restoran ini. Ekstrak nama toko, setiap item beserta qty dan harga per unit, subtotal, pajak, service charge, dan total. Jika suatu angka tidak ada di struk, isi dengan 0. Semua angka dalam Rupiah, tanpa titik/koma pemisah.",
            },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(ExtractedReceiptSchema) },
    });

    const extraction = response.parsed_output;
    if (!extraction) {
      return { ok: false, imagePath: path, error: "AI tidak berhasil membaca struk ini. Coba foto ulang atau isi manual." };
    }
    return { ok: true, imagePath: path, extraction };
  } catch (err) {
    console.error("extractReceipt: Anthropic call failed:", err);
    if (err instanceof Anthropic.AuthenticationError) {
      return { ok: false, imagePath: path, error: "ANTHROPIC_API_KEY tidak valid — cek kembali key-nya di Vercel." };
    }
    if (err instanceof Anthropic.PermissionDeniedError) {
      return {
        ok: false,
        imagePath: path,
        error: "Akun Anthropic belum punya akses ke model ini, atau billing/credit belum aktif di console.anthropic.com.",
      };
    }
    if (err instanceof Anthropic.RateLimitError) {
      return { ok: false, imagePath: path, error: "Terlalu banyak request ke AI sekaligus. Tunggu sebentar lalu coba lagi." };
    }
    if (err instanceof Anthropic.BadRequestError) {
      // Surfacing the raw API message here (temporarily, while this Beta feature is
      // still being diagnosed) — it's only ever shown to the authenticated user
      // testing their own upload, never on the public share page.
      return { ok: false, imagePath: path, error: `Ditolak Claude API: ${err.message}` };
    }
    if (err instanceof Error) {
      return { ok: false, imagePath: path, error: `Terjadi kendala saat membaca struk: ${err.message}` };
    }
    return { ok: false, imagePath: path, error: "Terjadi kendala saat membaca struk. Coba lagi sebentar lagi." };
  }
}

export async function reportMisread(imagePath: string | null, note: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("bill_split_misreads").insert({
    user_id: user.id,
    image_path: imagePath,
    note: note || null,
  });
}

export interface CreateBillSplitInput {
  title: string;
  merchant: string | null;
  receiptImagePath: string | null;
  items: SplitItem[];
  participants: SplitParticipant[];
  assignments: SplitAssignments;
  sharedMode: SplitSharedMode;
  sharedWith: SplitSharedWith;
  tax: number;
  service: number;
  accountHoldingId: string | null;
}

export interface CreateBillSplitResult {
  ok: boolean;
  shareToken?: string;
  error?: string;
}

/**
 * Persists a reviewed, fully-assigned split. Only the creator's own
 * assigned share becomes a real `expenses` row (debiting Sumber Dana via
 * the same adjustCashBalance path every other transaction uses) — every
 * other participant's share is written for display on the public share
 * link only, and never touches anyone's asset/liquidity numbers. There is
 * no payment-confirmation tracking here by design.
 */
export async function createBillSplit(input: CreateBillSplitInput): Promise<CreateBillSplitResult> {
  const { supabase, user } = await requireUser();

  if (input.items.length === 0) return { ok: false, error: "Belum ada item." };
  if (input.participants.length === 0) return { ok: false, error: "Belum ada orang yang ikut split." };
  // Re-validate server-side — the client only disables "Lanjut" on an
  // incomplete assignment, it doesn't stop a request from being sent. Without
  // this, an unassigned item's cost gets silently folded into the largest
  // share by allocateSplit's rounding-reconciliation step, overcharging
  // whoever that participant is.
  if (!isFullyAssigned(input.items, input.assignments, input.sharedMode, input.sharedWith)) {
    return { ok: false, error: "Masih ada item yang belum di-assign ke seseorang." };
  }

  const result = allocateSplit(
    input.items,
    input.participants,
    input.assignments,
    input.tax,
    input.service,
    input.sharedMode,
    input.sharedWith,
  );
  const creator = result.perParticipant.find((p) => p.isCreator);

  const { data: bill, error: billError } = await supabase
    .from("bill_splits")
    .insert({
      user_id: user.id,
      title: input.title,
      merchant: input.merchant,
      receipt_image_path: input.receiptImagePath,
      subtotal: result.itemsSubtotal,
      tax: input.tax,
      service: input.service,
      total: result.grandTotal,
      account_holding_id: input.accountHoldingId,
      status: "active",
    })
    .select("id, share_token")
    .single();
  if (billError || !bill) return { ok: false, error: "Gagal membuat split. Coba lagi." };

  // Insert participants/items one-at-a-time (Promise.all, paired by array
  // index regardless of completion order) so each returned id can be
  // matched back to its original client-side id unambiguously — a bulk
  // insert + select doesn't guarantee row order matches input order.
  // Participants and items don't depend on each other, so both batches run
  // concurrently rather than one after the other.
  const [participantResults, itemResults] = await Promise.all([
    Promise.all(
      input.participants.map((p, i) =>
        supabase
          .from("bill_split_participants")
          .insert({ bill_split_id: bill.id, name: p.name, is_creator: p.isCreator, sort_order: i })
          .select("id")
          .single(),
      ),
    ),
    Promise.all(
      input.items.map((it, i) =>
        supabase
          .from("bill_split_items")
          .insert({ bill_split_id: bill.id, name: it.name, qty: it.qty, unit_price: it.unitPrice, sort_order: i })
          .select("id")
          .single(),
      ),
    ),
  ]);
  if (participantResults.some((r) => r.error || !r.data) || itemResults.some((r) => r.error || !r.data)) {
    await supabase.from("bill_splits").delete().eq("id", bill.id);
    return { ok: false, error: "Gagal menyimpan peserta/item split." };
  }
  const participantIdByOriginal = new Map(
    input.participants.map((p, i) => [p.id, participantResults[i].data!.id]),
  );
  const itemIdByOriginal = new Map(input.items.map((it, i) => [it.id, itemResults[i].data!.id]));

  const assignmentRows: { item_id: string; participant_id: string; units: number; shared: boolean }[] = [];
  for (const item of input.items) {
    const insertedItemId = itemIdByOriginal.get(item.id);
    if (!insertedItemId) continue;

    if (input.sharedMode[item.id]) {
      for (const participantOriginalId of input.sharedWith[item.id] ?? []) {
        const participantId = participantIdByOriginal.get(participantOriginalId);
        if (!participantId) continue;
        assignmentRows.push({ item_id: insertedItemId, participant_id: participantId, units: 0, shared: true });
      }
      continue;
    }

    const forItem = input.assignments[item.id] ?? {};
    for (const [participantOriginalId, units] of Object.entries(forItem)) {
      if (units <= 0) continue;
      const participantId = participantIdByOriginal.get(participantOriginalId);
      if (!participantId) continue;
      assignmentRows.push({ item_id: insertedItemId, participant_id: participantId, units, shared: false });
    }
  }
  if (assignmentRows.length > 0) {
    const { error: assignError } = await supabase.from("bill_split_item_assignments").insert(assignmentRows);
    if (assignError) {
      await supabase.from("bill_splits").delete().eq("id", bill.id);
      return { ok: false, error: "Gagal menyimpan pembagian item split." };
    }
  }

  if (creator && creator.total > 0) {
    const { data: expense } = await supabase
      .from("expenses")
      .insert({
        user_id: user.id,
        expense_date: new Date().toISOString().slice(0, 10),
        category: "Makan & Minum",
        amount: creator.total,
        description: `Split Bill: ${input.title}`,
        account_holding_id: input.accountHoldingId,
      })
      .select("id")
      .single();
    if (expense) {
      await Promise.all([
        adjustCashBalance(supabase, user.id, input.accountHoldingId, -creator.total),
        supabase.from("bill_splits").update({ creator_expense_id: expense.id }).eq("id", bill.id),
      ]);
    }
  }

  revalidatePath("/app");
  revalidatePath("/app/expenses");
  return { ok: true, shareToken: bill.share_token };
}

export interface PublicBillSplit {
  title: string;
  merchant: string | null;
  createdAt: string;
  creatorName: string;
  result: ReturnType<typeof allocateSplit>;
}

/** Public, no-auth lookup for the /split/[token] share page — RLS allows anyone to read an active split by token. */
export async function getBillSplitByToken(token: string): Promise<PublicBillSplit | null> {
  const supabase = await createClient();

  const { data: bill } = await supabase
    .from("bill_splits")
    .select("id, title, merchant, tax, service, created_at, status")
    .eq("share_token", token)
    .eq("status", "active")
    .maybeSingle();
  if (!bill) return null;

  const [{ data: participants }, { data: items }] = await Promise.all([
    supabase
      .from("bill_split_participants")
      .select("id, name, is_creator, sort_order")
      .eq("bill_split_id", bill.id)
      .order("sort_order"),
    supabase
      .from("bill_split_items")
      .select("id, name, qty, unit_price, sort_order")
      .eq("bill_split_id", bill.id)
      .order("sort_order"),
  ]);
  if (!participants || !items) return null;

  const { data: assignmentRows } = await supabase
    .from("bill_split_item_assignments")
    .select("item_id, participant_id, units, shared")
    .in("item_id", items.map((it) => it.id));

  const assignments: SplitAssignments = {};
  const sharedMode: SplitSharedMode = {};
  const sharedWith: SplitSharedWith = {};
  for (const row of assignmentRows ?? []) {
    if (row.shared) {
      sharedMode[row.item_id] = true;
      (sharedWith[row.item_id] ??= []).push(row.participant_id);
    } else {
      assignments[row.item_id] ??= {};
      assignments[row.item_id][row.participant_id] = row.units;
    }
  }

  const splitItems: SplitItem[] = items.map((it) => ({ id: it.id, name: it.name, qty: it.qty, unitPrice: it.unit_price }));
  const splitParticipants: SplitParticipant[] = participants.map((p) => ({
    id: p.id,
    name: p.name,
    isCreator: p.is_creator,
  }));
  const result = allocateSplit(splitItems, splitParticipants, assignments, bill.tax, bill.service, sharedMode, sharedWith);

  return {
    title: bill.title,
    merchant: bill.merchant,
    createdAt: bill.created_at,
    creatorName: participants.find((p) => p.is_creator)?.name ?? "Kamu",
    result,
  };
}
