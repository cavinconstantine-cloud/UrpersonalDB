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
 * Yahoo Finance's public quote endpoint — unofficial (no key, no SLA; the
 * same one the `yfinance` library wraps). Unlike the chart/candle endpoint
 * (built for rendering charts, not day-over-day change), this one returns
 * `regularMarketPrice` and `regularMarketPreviousClose` directly — Yahoo
 * computes "yesterday's close" itself, the same way every finance app does,
 * so there's no need to infer it from a daily-candle array. Takes a batch
 * of symbols in one request. A symbol missing from the response (delisted,
 * no data) is simply absent from the returned map — not fatal to the run.
 */
async function fetchYahooQuotes(symbols: string[]): Promise<Map<string, FetchedPrice>> {
  const out = new Map<string, FetchedPrice>();
  if (symbols.length === 0) return out;
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(","))}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; UangkuBot/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return out;
    const json = await res.json();
    const quotes: unknown[] = json?.quoteResponse?.result ?? [];
    for (const q of quotes) {
      const quote = q as Record<string, unknown>;
      const symbol = typeof quote.symbol === "string" ? quote.symbol : null;
      const price = typeof quote.regularMarketPrice === "number" ? quote.regularMarketPrice : null;
      const prevClose =
        typeof quote.regularMarketPreviousClose === "number" ? quote.regularMarketPreviousClose : null;
      if (symbol && price !== null && prevClose !== null) {
        out.set(symbol, { ticker: symbol, price, prevClose });
      }
    }
  } catch {
    // leave out empty/partial — a failed batch is skipped, not fatal
  }
  return out;
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
  const quotes = await fetchYahooQuotes(symbols);

  for (const t of IDX_TICKERS) {
    const fetched = quotes.get(`${t.ticker}.JK`);
    if (fetched) results.set(t.ticker, { ...fetched, ticker: t.ticker });
  }
  const ihsg = quotes.get(IHSG_TICKER) ?? null;
  if (ihsg) results.set(IHSG_TICKER, ihsg);

  let upserted = 0;
  for (const t of IDX_TICKERS) {
    const fetched = results.get(t.ticker);
    if (!fetched) continue;
    const changePct = fetched.prevClose > 0 ? ((fetched.price - fetched.prevClose) / fetched.prevClose) * 100 : 0;
    const { error } = await admin.from("stock_prices").upsert({
      ticker: t.ticker,
      company_name: t.name,
      price: fetched.price,
      prev_close: fetched.prevClose,
      change_pct: changePct,
      currency: "IDR",
      as_of: isoToday,
    });
    if (!error) upserted++;
  }

  if (ihsg) {
    const changePct = ihsg.prevClose > 0 ? ((ihsg.price - ihsg.prevClose) / ihsg.prevClose) * 100 : 0;
    await admin.from("stock_prices").upsert({
      ticker: IHSG_TICKER,
      company_name: IHSG_NAME,
      price: ihsg.price,
      prev_close: ihsg.prevClose,
      change_pct: changePct,
      currency: "IDR",
      as_of: isoToday,
    });
  }

  // Write-through: sync every held Saham holding's curPrice to the ticker it's
  // linked to, so the existing value()/gain calculations (which just read
  // curPrice off the holding) pick up the new price with no other code changes.
  const { data: sahamHoldings } = await admin
    .from("asset_holdings")
    .select("id, data")
    .eq("category", "Saham");

  let holdingsUpdated = 0;
  let holdingsBackfilled = 0;
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
    const { error } = await admin
      .from("asset_holdings")
      .update({ data: { ...data, ticker, curPrice: fetched.price, priceAsOf: isoToday } })
      .eq("id", h.id);
    if (!error) holdingsUpdated++;
  }

  return NextResponse.json({
    ok: true,
    tickersFetched: results.size,
    tickersAttempted: IDX_TICKERS.length + 1,
    upserted,
    holdingsUpdated,
    holdingsBackfilled,
    ihsg: ihsg ? { price: ihsg.price, prevClose: ihsg.prevClose } : null,
  });
}
