-- Uangku — auto-updated stock prices (IDX tickers + IHSG index).
-- Shared reference data (not per-user): one row per ticker, refreshed daily by
-- the /api/cron/stock-prices job from a free public end-of-day price source.
-- The IHSG composite index is stored as ticker '^JKSE' in the same table.

create table if not exists public.stock_prices (
  ticker text primary key,
  company_name text not null,
  price numeric not null default 0,
  prev_close numeric not null default 0,
  change_pct numeric not null default 0,
  currency text not null default 'IDR',
  as_of date not null default current_date,
  updated_at timestamptz not null default now()
);

alter table public.stock_prices enable row level security;

-- Read-only reference data for any signed-in user — only the cron job
-- (service-role client, which bypasses RLS) writes to it.
drop policy if exists "stock_prices_select_authenticated" on public.stock_prices;
create policy "stock_prices_select_authenticated" on public.stock_prices
  for select using (auth.role() = 'authenticated');
