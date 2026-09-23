-- Uangku — daily asset value snapshots, per HOLDING (not per category).
--
-- Supersedes 0008's asset_category_snapshots: that only kept a category
-- total per day, which can't answer "which specific stock/holding in
-- Saham grew the most this month" (e.g. BBCA vs BBRI) — only the
-- category-wide number. Storing one row per holding per day lets the
-- Summary review compute both the category total AND the best/worst
-- individual holding by aggregating this table with SQL, so there is a
-- single source of truth instead of two snapshot tables that could drift
-- out of sync with each other.
--
-- holding_id intentionally carries NO foreign key to asset_holdings: a
-- snapshot is a frozen record of what a position was worth on a given
-- day, and must survive that holding later being edited or deleted.
-- label/category are copied in at snapshot time for the same reason —
-- so history reads correctly even if the live holding no longer exists
-- or was renamed.

drop table if exists public.asset_category_snapshots;

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
