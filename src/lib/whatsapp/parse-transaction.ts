import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { EXPENSE_CATS, INCOME_CATS } from "@/lib/finance/constants";

const ParsedTransactionSchema = z.object({
  understood: z.boolean().describe("false kalau pesan ini bukan catatan transaksi keuangan sama sekali"),
  type: z.enum(["expense", "income"]),
  amount: z.number().min(0),
  category: z.string(),
  description: z.string().describe("Deskripsi singkat, mis. 'Makan siang' atau 'Bensin'"),
});

export interface ParsedTransaction {
  understood: boolean;
  type: "expense" | "income";
  amount: number;
  category: string;
  description: string;
}

/**
 * Turns a free-text WhatsApp message (and optionally a receipt photo) into a
 * structured transaction — same model/pattern as the Split Bill receipt
 * reader. Category is coerced back onto the app's own category list if the
 * model returns something close-but-not-exact (e.g. "Makanan" -> "Makan & Minum").
 */
export async function parseWhatsAppTransaction(
  text: string,
  image?: { base64: string; mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" },
): Promise<ParsedTransaction | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const anthropic = new Anthropic({ apiKey });
  const content = [];
  if (image) {
    content.push({
      type: "image" as const,
      source: { type: "base64" as const, media_type: image.mediaType, data: image.base64 },
    });
  }
  content.push({
    type: "text" as const,
    text: [
      "Pesan WhatsApp dari user buat catat transaksi keuangan pribadi (bisa teks, bisa foto struk).",
      "Tentukan apakah ini pengeluaran atau pemasukan, nominalnya, kategori, dan deskripsi singkat.",
      `Kategori pengeluaran yang tersedia: ${EXPENSE_CATS.join(", ")}.`,
      `Kategori pemasukan yang tersedia: ${INCOME_CATS.join(", ")}.`,
      "Pilih kategori yang paling cocok dari daftar itu — kalau tidak ada yang cocok, pakai 'Lainnya'.",
      "Kalau pesan ini bukan tentang transaksi keuangan sama sekali, set understood=false.",
      "",
      `Pesan: "${text}"`,
    ].join("\n"),
  });

  const response = await anthropic.messages.parse({
    model: "claude-sonnet-5",
    max_tokens: 500,
    messages: [{ role: "user", content }],
    output_config: { format: zodOutputFormat(ParsedTransactionSchema) },
  });

  const parsed = response.parsed_output;
  if (!parsed) return null;

  const cats = parsed.type === "expense" ? EXPENSE_CATS : INCOME_CATS;
  const category = (cats as readonly string[]).includes(parsed.category) ? parsed.category : "Lainnya";

  return { ...parsed, category };
}
