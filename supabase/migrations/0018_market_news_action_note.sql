-- Adds a short, punchy "what should I actually do" takeaway to each market
-- news card — the analysis alone explained what happened; this is the
-- action-oriented closer readers asked for. Nullable/backfill-free since
-- existing rows just render without it until re-submitted.
alter table public.market_news
  add column if not exists action_note text;
