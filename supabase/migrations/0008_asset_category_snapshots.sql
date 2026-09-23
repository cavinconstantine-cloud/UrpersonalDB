-- Uangku — daily asset value snapshots, per category.
--
-- One row per user per calendar day per asset category (Cash, Deposito,
-- Saham, Reksadana, Obligasi, ...), kept up to date live whenever the
-- dashboard is viewed — mirrors the net_worth_snapshots / fcf_snapshots
-- pattern. This is the historical data the monthly/yearly Summary review
-- needs to show "Pergerakan Investasi" per category over time; without it
-- only the current value is known, with no way to see last month's.

create table if not exists public.asset_category_snapshots (
  user_id uuid not null references auth.users (id) on delete cascade,
  snapshot_date date not null default current_date,
  category text not null,
  total_value numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, snapshot_date, category)
);

create index if not exists asset_category_snapshots_user_date_idx
  on public.asset_category_snapshots (user_id, snapshot_date);

alter table public.asset_category_snapshots enable row level security;

drop policy if exists "asset_category_snapshots_all_own" on public.asset_category_snapshots;
create policy "asset_category_snapshots_all_own" on public.asset_category_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.asset_category_snapshots;
create trigger set_updated_at before update on public.asset_category_snapshots
  for each row execute procedure public.set_updated_at();
