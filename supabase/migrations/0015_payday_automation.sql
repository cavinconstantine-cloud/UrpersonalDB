-- Payday automation — on a Karyawan's chosen `payday_day`, a cron job turns
-- every recurring_incomes/recurring_expenses row into a real incomes/expenses
-- transaction (so it shows up in Transaksi history and updates real Sumber
-- Dana cash balances the same way a manually-entered transaction would).
--
-- FCF is already fed by the flat cashflow.income/fixed_expense planning
-- totals (kept in sync from recurring_incomes/recurring_expenses on every
-- CRUD edit — see cashflow-actions.ts). Auto-generated transactions are
-- tagged is_auto_recurring so the FCF-feeding month-total queries can
-- exclude them and avoid double-counting; every other read (Transaksi
-- history, daily recap, Summary charts) leaves them in, since they're real
-- money movements.

alter table public.expenses
  add column if not exists is_auto_recurring boolean not null default false;
alter table public.incomes
  add column if not exists is_auto_recurring boolean not null default false;

-- One row per user per calendar month the automation has run for — the
-- idempotency guard so a retried or re-triggered cron run never double-debits.
create table if not exists public.payday_executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  execution_month date not null,
  incomes_created integer not null default 0,
  expenses_created integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, execution_month)
);

alter table public.payday_executions enable row level security;

drop policy if exists "payday_executions_select_own" on public.payday_executions;
create policy "payday_executions_select_own" on public.payday_executions
  for select using (auth.uid() = user_id);
