-- Uangku — daily asset value snapshots, per HOLDING (not per category).
--
-- One row per holding per day. A category total for a given day is just
-- SUM(value) GROUP BY category over this table — no separate
-- category-level table needed, so there's nothing to keep in sync. This
-- is what lets the Summary review answer "which specific stock/fund grew
-- the most this month" (e.g. BBCA vs BBRI within Saham), not just the
-- category aggregate.
--
-- holding_id intentionally carries NO foreign key to asset_holdings: a
-- snapshot is a frozen record of what a position was worth on a given
-- day, and must survive that holding later being edited or deleted.
-- label/category are copied in at snapshot time for the same reason —
-- so history reads correctly even if the live holding no longer exists
-- or was renamed.

create table if not exists public.asset_holding_snapshots (
  user_id uuid not null references auth.users (id) on delete cascade,
  snapshot_date date not null default current_date,
  holding_id uuid not null,
  category text not null,
  label text not null default '',
  value numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, snapshot_date, holding_id)
);

create index if not exists asset_holding_snapshots_user_date_idx
  on public.asset_holding_snapshots (user_id, snapshot_date);

alter table public.asset_holding_snapshots enable row level security;

drop policy if exists "asset_holding_snapshots_all_own" on public.asset_holding_snapshots;
create policy "asset_holding_snapshots_all_own" on public.asset_holding_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.asset_holding_snapshots;
create trigger set_updated_at before update on public.asset_holding_snapshots
  for each row execute procedure public.set_updated_at();
