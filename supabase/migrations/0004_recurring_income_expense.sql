-- Uangku — recurring (fixed) income & expense line items.
-- Lets a user break "Income" and "Fixed expense" in Cash Flow down into
-- named items (gaji, sewa properti, cicilan sekolah, dll) instead of one
-- lump number. cashflow.income / cashflow.fixed_expense stay as the source
-- of truth read by the rest of the app — every add/edit/delete here just
-- re-syncs their sum into those columns, so no other query needs to change.

create table if not exists public.recurring_incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recurring_incomes_user_idx on public.recurring_incomes (user_id);

alter table public.recurring_incomes enable row level security;

drop policy if exists "recurring_incomes_all_own" on public.recurring_incomes;
create policy "recurring_incomes_all_own" on public.recurring_incomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recurring_expenses_user_idx on public.recurring_expenses (user_id);

alter table public.recurring_expenses enable row level security;

drop policy if exists "recurring_expenses_all_own" on public.recurring_expenses;
create policy "recurring_expenses_all_own" on public.recurring_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Backfill: turn each existing lump-sum income/fixed_expense into one
-- starter line item, so nobody's Free Cash Flow / DBR numbers change the
-- moment this migration runs. Safe to re-run — only inserts when the user
-- has no recurring items yet.
-- ---------------------------------------------------------------------------
insert into public.recurring_incomes (user_id, label, amount)
select c.user_id, 'Pemasukan', c.income
from public.cashflow c
where c.income > 0
  and not exists (select 1 from public.recurring_incomes ri where ri.user_id = c.user_id);

insert into public.recurring_expenses (user_id, label, amount)
select c.user_id, 'Pengeluaran tetap', c.fixed_expense
from public.cashflow c
where c.fixed_expense > 0
  and not exists (select 1 from public.recurring_expenses re where re.user_id = c.user_id);
