-- Uangku — required "Sumber Dana" (source account) on fixed income/expense items.
--
-- Mirrors 0009_transaction_account.sql for recurring_incomes/recurring_expenses:
-- points each fixed item at the Cash holding it flows through. The app UI
-- requires picking one (new items can't be added without it, existing items
-- missing one are flagged until fixed) — the column itself stays nullable so
-- rows created before this migration don't get rejected outright.
-- ON DELETE SET NULL: deleting the holding un-tags the item rather than
-- deleting the recurring item itself.

alter table public.recurring_incomes
  add column if not exists account_holding_id uuid references public.asset_holdings (id) on delete set null;

alter table public.recurring_expenses
  add column if not exists account_holding_id uuid references public.asset_holdings (id) on delete set null;

create index if not exists recurring_incomes_account_holding_idx on public.recurring_incomes (account_holding_id);
create index if not exists recurring_expenses_account_holding_idx on public.recurring_expenses (account_holding_id);
