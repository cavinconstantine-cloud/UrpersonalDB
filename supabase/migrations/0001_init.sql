-- Uangku — Personal Financial Dashboard
-- Initial schema: one row of "truth" per user, protected by Row Level Security
-- so every person who signs up only ever sees their own financial data.

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user, created automatically on signup.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  onboarding_step text not null default 'account', -- account | assets | liabilities | cashflow | goals | done
  asset_categories text[] not null default '{}',
  liability_categories text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create a profile row the moment someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- cashflow: one row per user holding the monthly averages.
-- ---------------------------------------------------------------------------
create table if not exists public.cashflow (
  user_id uuid primary key references auth.users (id) on delete cascade,
  income numeric not null default 0,
  fixed_expense numeric not null default 0,
  lifestyle_expense numeric not null default 0,
  invest numeric not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.cashflow enable row level security;

create policy "cashflow_all_own" on public.cashflow
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- asset_holdings: many holdings per category per user (e.g. several mutual
-- funds under "Reksadana"). category-specific fields live in `data` jsonb.
-- ---------------------------------------------------------------------------
create table if not exists public.asset_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists asset_holdings_user_idx on public.asset_holdings (user_id);

alter table public.asset_holdings enable row level security;

create policy "asset_holdings_all_own" on public.asset_holdings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- liabilities: one row per user per category (mirrors the onboarding flow).
-- ---------------------------------------------------------------------------
create table if not exists public.liabilities (
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

alter table public.liabilities enable row level security;

create policy "liabilities_all_own" on public.liabilities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target numeric not null default 0,
  current numeric not null default 0,
  target_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_user_idx on public.goals (user_id);

alter table public.goals enable row level security;

create policy "goals_all_own" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expense_date date not null default current_date,
  category text not null,
  amount numeric not null default 0,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_date_idx on public.expenses (user_id, expense_date desc);

alter table public.expenses enable row level security;

create policy "expenses_all_own" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- custom_expense_categories
-- ---------------------------------------------------------------------------
create table if not exists public.custom_expense_categories (
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, name)
);

alter table public.custom_expense_categories enable row level security;

create policy "custom_expense_categories_all_own" on public.custom_expense_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- net_worth_snapshots: one row per user per day, upserted whenever the
-- dashboard is viewed, so we can chart net worth over time.
-- ---------------------------------------------------------------------------
create table if not exists public.net_worth_snapshots (
  user_id uuid not null references auth.users (id) on delete cascade,
  snapshot_date date not null default current_date,
  net_worth numeric not null default 0,
  total_assets numeric not null default 0,
  total_liabilities numeric not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, snapshot_date)
);

alter table public.net_worth_snapshots enable row level security;

create policy "net_worth_snapshots_all_own" on public.net_worth_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at bookkeeping
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.cashflow;
create trigger set_updated_at before update on public.cashflow
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.asset_holdings;
create trigger set_updated_at before update on public.asset_holdings
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.liabilities;
create trigger set_updated_at before update on public.liabilities
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.goals;
create trigger set_updated_at before update on public.goals
  for each row execute procedure public.set_updated_at();
