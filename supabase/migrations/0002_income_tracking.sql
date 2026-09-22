-- Uangku — Income tracking
-- Adds a parallel table to `expenses` for logging money coming in (salary,
-- transfers from friends, side income/hustle, etc.), so the dashboard can
-- show a same-day net (income vs. expense) and liquid-asset context.

create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  income_date date not null default current_date,
  category text not null,
  amount numeric not null default 0,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists incomes_user_date_idx on public.incomes (user_id, income_date desc);

alter table public.incomes enable row level security;

drop policy if exists "incomes_all_own" on public.incomes;
create policy "incomes_all_own" on public.incomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.custom_income_categories (
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, name)
);

alter table public.custom_income_categories enable row level security;

drop policy if exists "custom_income_categories_all_own" on public.custom_income_categories;
create policy "custom_income_categories_all_own" on public.custom_income_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
