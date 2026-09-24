"use server";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) throw new Error("Tidak punya akses ke halaman ini.");
  return user;
}

export interface MarketNewsRow {
  id: string;
  headline: string;
  summary: string;
  sources: { title: string; url: string; publisher: string }[];
  publishedAt: string;
}

export async function listMarketNews(): Promise<MarketNewsRow[]> {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diset.");

  const { data, error } = await admin
    .from("market_news")
    .select("id, headline, summary, sources, published_at")
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data || []).map((n) => ({
    id: n.id,
    headline: n.headline,
    summary: n.summary,
    sources: (Array.isArray(n.sources) ? n.sources : []) as MarketNewsRow["sources"],
    publishedAt: n.published_at,
  }));
}

const AnalysisSchema = z.object({
  headline: z.string().describe("Judul singkat berita, dalam Bahasa Indonesia"),
  summary: z
    .string()
    .describe(
      "Analisa 2-4 kalimat dalam Bahasa Indonesia yang menjelaskan apa yang terjadi dan mengapa ini relevan buat investor reksadana/saham/obligasi di Indonesia",
    ),
});

export interface SubmitMarketNewsInput {
  rawContent: string;
  sourceUrl: string;
  sourceTitle: string;
  sourcePublisher: string;
}

export interface SubmitMarketNewsResult {
  ok: boolean;
  error?: string;
}

/**
 * The admin (a real person working in the financial sector) drops in a news
 * item they've already vetted — Claude only writes the headline/analysis
 * from that text, it never searches or sources anything on its own. This
 * replaces the old auto-search cron, which kept failing (blocked crawler
 * domains, then timeouts) and cost real money per web search regardless.
 */
export async function submitMarketNews(input: SubmitMarketNewsInput): Promise<SubmitMarketNewsResult> {
  await requireAdmin();

  const rawContent = input.rawContent.trim();
  const sourceUrl = input.sourceUrl.trim();
  if (!rawContent) return { ok: false, error: "Isi berita/ringkasannya dulu." };
  if (!sourceUrl) return { ok: false, error: "Link sumber berita wajib diisi." };

  let publisherFallback = "";
  try {
    publisherFallback = new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return { ok: false, error: "Link sumber tidak valid — pastikan formatnya lengkap (mis. https://...)." };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "ANTHROPIC_API_KEY belum diset di environment." };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY belum diset di environment." };

  const anthropic = new Anthropic({ apiKey });

  let parsed;
  try {
    const response = await anthropic.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Kamu nulis ringkasan berita pasar buat kartu "Berita Pasar" di aplikasi keuangan pribadi Uangku. Ini berita/isu yang sudah dipilih oleh admin:\n\n${rawContent}\n\nTulis judul singkat (headline) dan analisa 2-4 kalimat dalam Bahasa Indonesia yang menjelaskan APA yang terjadi dan MENGAPA ini relevan buat investor reksadana/saham/obligasi di Indonesia. Bukan sekadar terjemahan/ringkasan mentah — kasih insight dampaknya.`,
        },
      ],
      output_config: { format: zodOutputFormat(AnalysisSchema) },
    });
    parsed = response.parsed_output;
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "ANTHROPIC_API_KEY tidak valid — cek kembali key-nya di Vercel." };
    }
    if (err instanceof Anthropic.PermissionDeniedError) {
      return { ok: false, error: "Akun Anthropic belum punya akses, atau billing/credit belum aktif di console.anthropic.com." };
    }
    if (err instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "Terlalu banyak request ke AI sekaligus. Tunggu sebentar lalu coba lagi." };
    }
    return { ok: false, error: err instanceof Error ? `Gagal menganalisa berita: ${err.message}` : "Gagal menganalisa berita." };
  }
  if (!parsed) return { ok: false, error: "AI tidak berhasil menganalisa berita ini. Coba tambahkan lebih banyak konteks." };

  const { error } = await admin.from("market_news").upsert(
    {
      headline: parsed.headline,
      summary: parsed.summary,
      sources: [
        {
          title: input.sourceTitle.trim() || parsed.headline,
          url: sourceUrl,
          publisher: input.sourcePublisher.trim() || publisherFallback,
        },
      ],
      published_at: new Date().toISOString().slice(0, 10),
    },
    { onConflict: "headline" },
  );
  if (error) return { ok: false, error: `Gagal menyimpan: ${error.message}` };

  revalidatePath("/app");
  revalidatePath("/app/admin/market-news");
  return { ok: true };
}

export async function deleteMarketNews(id: string): Promise<SubmitMarketNewsResult> {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY belum diset di environment." };

  const { error } = await admin.from("market_news").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/admin/market-news");
  return { ok: true };
}
