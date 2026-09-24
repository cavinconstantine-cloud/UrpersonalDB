-- Uangku — AI-analyzed market news ("Berita Pasar").
--
-- Curated manually via /app/admin/market-news (admin-only, service-role
-- client) — an admin drops in news they've already picked, and Claude only
-- writes the headline/impact analysis from that text; it never searches or
-- sources anything on its own. Content is global — not per-user — so
-- regular users get read-only access; only the service-role key (which
-- bypasses RLS) may insert/update/delete.

create table if not exists public.market_news (
  id uuid primary key default gen_random_uuid(),
  headline text not null unique,
  summary text not null,
  sources jsonb not null default '[]',
  published_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists market_news_published_at_idx on public.market_news (published_at desc, created_at desc);

alter table public.market_news enable row level security;

drop policy if exists "market_news_select_authenticated" on public.market_news;
create policy "market_news_select_authenticated" on public.market_news
  for select to authenticated using (true);

-- No insert/update/delete policy for anon/authenticated — only the cron
-- route's service-role client (which bypasses RLS entirely) writes here.
