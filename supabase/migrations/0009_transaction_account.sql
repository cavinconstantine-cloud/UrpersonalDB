-- Uangku — optional "Sumber Dana" (source account) on each transaction.
--
-- Points an expense/income at the Cash holding (bank account / e-wallet)
-- it was paid from or landed in. Reuses the existing asset_holdings /
-- Cash category rather than introducing a separate accounts table — the
-- account list a user already maintains under Assets → Cash IS the
-- account list transactions need. ON DELETE SET NULL: deleting the
-- holding un-tags past transactions rather than deleting their history.

alter table public.expenses
  add column if not exists account_holding_id uuid references public.asset_holdings (id) on delete set null;

alter table public.incomes
  add column if not exists account_holding_id uuid references public.asset_holdings (id) on delete set null;

create index if not exists expenses_account_holding_idx on public.expenses (account_holding_id);
create index if not exists incomes_account_holding_idx on public.incomes (account_holding_id);
