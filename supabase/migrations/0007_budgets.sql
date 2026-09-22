-- Uangku — monthly budget limit per expense category.
--
-- One row per user per category (fixed or custom). A limit of 0 means "no
-- budget set" for that category — the dashboard card only shows categories
-- with a limit > 0. Recurring by design (no per-month history), same pattern
-- as recurring_incomes/recurring_expenses.

create table if not exists public.budgets (
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  monthly_limit numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

alter table public.budgets enable row level security;

drop policy if exists "budgets_all_own" on public.budgets;
create policy "budgets_all_own" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.budgets;
create trigger set_updated_at before update on public.budgets
  for each row execute procedure public.set_updated_at();
