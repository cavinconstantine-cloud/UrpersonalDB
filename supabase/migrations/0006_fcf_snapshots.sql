-- Uangku — monthly Free Cash Flow snapshots.
--
-- One row per user per calendar month (keyed by the 1st of that month), kept
-- up to date live throughout the month whenever the dashboard is viewed —
-- mirrors the net_worth_snapshots pattern. Once a month ends, its row stops
-- being touched and becomes frozen history, giving a natural month-to-month
-- FCF trend without any manual "reset" step.

create table if not exists public.fcf_snapshots (
  user_id uuid not null references auth.users (id) on delete cascade,
  snapshot_month date not null, -- always the 1st of the month
  income numeric not null default 0,
  fixed_expense numeric not null default 0,
  lifestyle_expense numeric not null default 0,
  invest numeric not null default 0,
  fcf numeric not null default 0,
  saving_rate numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, snapshot_month)
);

alter table public.fcf_snapshots enable row level security;

drop policy if exists "fcf_snapshots_all_own" on public.fcf_snapshots;
create policy "fcf_snapshots_all_own" on public.fcf_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.fcf_snapshots;
create trigger set_updated_at before update on public.fcf_snapshots
  for each row execute procedure public.set_updated_at();
