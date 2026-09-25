import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { IDX_TICKERS } from "@/lib/finance/idx-tickers";

const KNOWN_TICKERS = new Set(IDX_TICKERS.map((t) => t.ticker));
import type { HoldingData } from "@/lib/finance/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const IHSG_TICKER = "^JKSE";
const IHSG_NAME = "IHSG — Indeks Harga Saham Gabungan";

interface FetchedPrice {
  ticker: string;
  price: number;
  prevClose: number;
}

/**
 * Yahoo Finance's public chart endpoint — unofficial (no key, no SLA). The
 * batched v7 `finance/quote` endpoint this used to call now requires a
 * "crumb" + cookie handshake for non-browser callers (Yahoo locked it down
 * against scraping in 2024) and simply rejects a plain server-side request —
 * which is why every ticker was coming back empty. The per-symbol v8
 * `finance/chart` endpoint (what most chart widgets use) has stayed open
 * without that handshake, at the cost of one request per symbol instead of
 * one batched call — fired in parallel here, well within the route's 60s
 * budget for ~50 tickers.
 */
async function fetchYahooQuote(symbol: string): Promise<{ ticker: string; result?: FetchedPrice; error?: string }> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; UangkuBot/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ticker: symbol, error: `HTTP ${res.status}` };
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    const price = typeof meta?.regularMarketPrice === "number" ? meta.regularMarketPrice : null;
    const prevClose =
      typeof meta?.previousClose === "number"
        ? meta.previousClose
        : typeof meta?.chartPreviousClose === "number"
          ? meta.chartPreviousClose
          : null;
    if (price === null || prevClose === null) {
      return { ticker: symbol, error: `missing price/prevClose in response (keys: ${Object.keys(meta || {}).join(",")})` };
    }
    return { ticker: symbol, result: { ticker: symbol, price, prevClose } };
  } catch (err) {
    return { ticker: symbol, error: err instanceof Error ? err.message : "fetch failed" };
  }
}

async function fetchYahooQuotes(symbols: string[]): Promise<{ quotes: Map<string, FetchedPrice>; sampleErrors: string[] }> {
  const quotes = new Map<string, FetchedPrice>();
  const sampleErrors: string[] = [];
  const settled = await Promise.all(symbols.map((s) => fetchYahooQuote(s)));
  for (const r of settled) {
    if (r.result) quotes.set(r.ticker, r.result);
    else if (r.error && sampleErrors.length < 3) sampleErrors.push(`${r.ticker}: ${r.error}`);
  }
  return { quotes, sampleErrors };
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
      reason: "Stock price job not configured (missing SUPABASE_SERVICE_ROLE_KEY).",
    });
  }

  const isoToday = new Date().toISOString().slice(0, 10);
  const results = new Map<string, FetchedPrice>();

  const symbols = [...IDX_TICKERS.map((t) => `${t.ticker}.JK`), IHSG_TICKER];
  const { quotes, sampleErrors } = await fetchYahooQuotes(symbols);

  for (const t of IDX_TICKERS) {
    const fetched = quotes.get(`${t.ticker}.JK`);
    if (fetched) results.set(t.ticker, { ...fetched, ticker: t.ticker });
  }
  const ihsg = quotes.get(IHSG_TICKER) ?? null;
  if (ihsg) results.set(IHSG_TICKER, ihsg);

  const priceRows = IDX_TICKERS.filter((t) => results.has(t.ticker)).map((t) => {
    const fetched = results.get(t.ticker)!;
    const changePct = fetched.prevClose > 0 ? ((fetched.price - fetched.prevClose) / fetched.prevClose) * 100 : 0;
    return {
      ticker: t.ticker,
      company_name: t.name,
      price: fetched.price,
      prev_close: fetched.prevClose,
      change_pct: changePct,
      currency: "IDR",
      as_of: isoToday,
    };
  });
  if (ihsg) {
    const changePct = ihsg.prevClose > 0 ? ((ihsg.price - ihsg.prevClose) / ihsg.prevClose) * 100 : 0;
    priceRows.push({
      ticker: IHSG_TICKER,
      company_name: IHSG_NAME,
      price: ihsg.price,
      prev_close: ihsg.prevClose,
      change_pct: changePct,
      currency: "IDR",
      as_of: isoToday,
    });
  }
  // One batched upsert instead of one round trip per ticker (~50+) — the
  // route has a 60s budget and this was the single biggest chunk of it.
  let upserted = 0;
  if (priceRows.length > 0) {
    const { error } = await admin.from("stock_prices").upsert(priceRows);
    if (!error) upserted = priceRows.filter((r) => r.ticker !== IHSG_TICKER).length;
  }

  // Write-through: sync every held Saham holding's curPrice to the ticker it's
  // linked to, so the existing value()/gain calculations (which just read
  // curPrice off the holding) pick up the new price with no other code changes.
  const { data: sahamHoldings } = await admin
    .from("asset_holdings")
    .select("id, data")
    .eq("category", "Saham");

  let holdingsBackfilled = 0;
  const holdingUpdates: Promise<boolean>[] = [];
  for (const h of sahamHoldings || []) {
    const data = (h.data as HoldingData) || {};
    let ticker = typeof data.ticker === "string" ? data.ticker : null;

    // Holdings added before ticker search existed only ever stored a
    // free-text label (the old field was literally "mis. BBCA") — no
    // `ticker` key at all. Recover it from the label so those users never
    // have to re-enter anything: if it matches a known code exactly, adopt
    // it as the ticker and persist that below alongside the price.
    if (!ticker) {
      const labelUpper = typeof data.label === "string" ? data.label.trim().toUpperCase() : "";
      if (KNOWN_TICKERS.has(labelUpper)) {
        ticker = labelUpper;
        holdingsBackfilled++;
      }
    }
    if (!ticker) continue;

    const fetched = results.get(ticker);
    if (!fetched) continue;
    holdingUpdates.push(
      (async () => {
        const { error } = await admin
          .from("asset_holdings")
          .update({ data: { ...data, ticker, curPrice: fetched.price, priceAsOf: isoToday } })
          .eq("id", h.id);
        return !error;
      })(),
    );
  }
  // One round trip per holding is unavoidable (each writes a different row),
  // but they're independent of each other — running them concurrently
  // instead of sequentially keeps this well inside the route's time budget
  // as the number of tracked holdings grows.
  const holdingResults = await Promise.all(holdingUpdates);
  const holdingsUpdated = holdingResults.filter(Boolean).length;

  // Tickers Yahoo failed to return today keep yesterday's curPrice/priceAsOf
  // on any holding that references them (no write happens for them above) —
  // surfaced here for monitoring, since the UI has no other signal that a
  // given holding's price may be a day or more stale.
  const staleTickers = IDX_TICKERS.map((t) => t.ticker).filter((t) => !results.has(t));

  return NextResponse.json({
    ok: true,
    tickersFetched: results.size,
    tickersAttempted: IDX_TICKERS.length + 1,
    upserted,
    holdingsUpdated,
    holdingsBackfilled,
    ihsg: ihsg ? { price: ihsg.price, prevClose: ihsg.prevClose } : null,
    ...(staleTickers.length ? { staleTickers } : {}),
    ...(results.size === 0 ? { sampleErrors } : {}),
  });
}
