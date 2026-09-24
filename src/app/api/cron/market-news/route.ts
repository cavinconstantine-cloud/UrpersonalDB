import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Curated set of trusted, citable outlets for economic/market/geopolitical
// coverage relevant to reksadana/saham/obligasi in Indonesia — the model is
// restricted to searching only these domains, so every citation it returns
// can be traced back to a real, reputable source rather than fabricated.
//
// reuters.com, apnews.com, ft.com, and wsj.com block Anthropic's web-search
// crawler via robots.txt — including any of them in `allowed_domains` makes
// the ENTIRE web_search call fail with a 400 (not just those sites being
// skipped), which was silently killing every cron run. Keep this list to
// domains that are actually crawlable.
const TRUSTED_DOMAINS = [
  "bloomberg.com",
  "cnbcindonesia.com",
  "kontan.co.id",
  "bisnis.com",
  "katadata.co.id",
  "kompas.com",
  "idx.co.id",
  "bi.go.id",
  "ojk.go.id",
  "imf.org",
  "worldbank.org",
];

interface NewsSource {
  title: string;
  url: string;
  publisher: string;
}

interface NewsItem {
  headline: string;
  summary: string;
  sources: NewsSource[];
}

function extractJson(text: string): NewsItem[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (item): item is NewsItem =>
        item &&
        typeof item.headline === "string" &&
        typeof item.summary === "string" &&
        Array.isArray(item.sources) &&
        item.sources.every((s: unknown) => {
          const src = s as Partial<NewsSource>;
          return typeof src?.url === "string" && typeof src?.title === "string";
        }),
    );
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const admin = createAdminClient();
  if (!apiKey || !admin) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Market news not configured (missing ANTHROPIC_API_KEY or SUPABASE_SERVICE_ROLE_KEY).",
    });
  }

  const anthropic = new Anthropic({ apiKey });

  let message;
  try {
    // Streamed rather than a plain create() — a handful of real web
    // searches plus synthesis can take a while, and streaming avoids
    // hitting an idle-connection timeout while nothing but the final
    // response is being awaited.
    message = await anthropic.messages
      .stream({
        model: "claude-sonnet-5",
        // Generous headroom — the web_search tool's own result blocks
        // (search queries + returned snippets) count against this budget
        // before the model ever gets to write its final JSON text, so a
        // tight limit can exhaust it with zero text output.
        max_tokens: 8000,
        tools: [
          {
            type: "web_search_20260209",
            name: "web_search",
            max_uses: 4,
            allowed_domains: TRUSTED_DOMAINS,
          },
        ],
        messages: [
          {
            role: "user",
            content: `Cari berita ekonomi dan isu geopolitik TERBARU (dalam 48 jam terakhir jika memungkinkan) yang berdampak — langsung atau tidak langsung — terhadap pasar reksadana, saham, dan obligasi di Indonesia. Gunakan web search untuk menemukan berita nyata dari sumber-sumber yang diizinkan.

Pilih 3-5 berita paling relevan dan penting. Untuk masing-masing, tulis analisis singkat dalam Bahasa Indonesia (bukan sekadar terjemahan/ringkasan mentah) yang menjelaskan APA yang terjadi dan MENGAPA ini relevan untuk investor reksadana/saham/obligasi di Indonesia.

Setelah selesai mencari, balas HANYA dengan sebuah JSON array (tanpa markdown code fence, tanpa teks lain) dengan struktur persis seperti ini:
[
  {
    "headline": "judul singkat berita dalam Bahasa Indonesia",
    "summary": "analisa AI 2-4 kalimat dalam Bahasa Indonesia, jelaskan dampaknya ke pasar Indonesia",
    "sources": [
      { "title": "judul artikel asli", "url": "https://url-asli-dari-hasil-pencarian", "publisher": "nama media" }
    ]
  }
]

Setiap item HARUS punya minimal satu source dengan url ASLI dari hasil web search (jangan pernah mengarang URL). Jangan sertakan penjelasan lain di luar JSON array ini.`,
          },
        ],
      })
      .finalMessage();
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Anthropic request failed" }, { status: 500 });
  }

  const finalText = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const items = extractJson(finalText);
  if (!items || items.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "AI did not return parseable news JSON.",
        raw: finalText.slice(0, 500),
        stopReason: message.stop_reason,
        contentBlockTypes: message.content.map((b) => b.type),
      },
      { status: 502 },
    );
  }

  let upserted = 0;
  for (const item of items) {
    const { error } = await admin.from("market_news").upsert(
      {
        headline: item.headline,
        summary: item.summary,
        sources: item.sources as unknown as Json,
        published_at: new Date().toISOString().slice(0, 10),
      },
      { onConflict: "headline" },
    );
    if (!error) upserted++;
  }

  return NextResponse.json({ ok: true, found: items.length, upserted });
}
