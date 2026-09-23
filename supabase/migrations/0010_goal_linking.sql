-- Uangku — link Cash/Deposito/Obligasi/Reksadana holdings to a goal, so
-- their value (and, for Deposito/Obligasi, their interest/coupon payouts)
-- counts toward that goal's progress automatically. One holding can only
-- point at one goal at a time (a single nullable column enforces this
-- naturally); a goal can have many holdings pointing at it.

alter table public.asset_holdings
  add column if not exists goal_id uuid references public.goals (id) on delete set null;

create index if not exists asset_holdings_goal_idx on public.asset_holdings (goal_id);

-- ---------------------------------------------------------------------------
-- goal_interest_credits: append-only ledger of interest/coupon payouts
-- credited to a goal from a linked Deposito/Obligasi. Recorded once per
-- holding per payout date by the daily cron (the unique constraint below
-- makes the insert idempotent), rather than computed live from the
-- holding's rate/tenor — so a goal's credited-so-far total survives the
-- holding later being edited, unlinked, or deleted, and never drifts or
-- double-counts. holding_id carries no FK for the same reason
-- asset_holding_snapshots doesn't: a credit is a frozen record of a
-- payout that already happened.
-- ---------------------------------------------------------------------------
create table if not exists public.goal_interest_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  holding_id uuid not null,
  credit_date date not null default current_date,
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (holding_id, credit_date)
);

create index if not exists goal_interest_credits_goal_idx on public.goal_interest_credits (goal_id);

alter table public.goal_interest_credits enable row level security;

drop policy if exists "goal_interest_credits_select_own" on public.goal_interest_credits;
create policy "goal_interest_credits_select_own" on public.goal_interest_credits
  for select using (auth.uid() = user_id);

-- No insert/update/delete policy for regular users — only the daily cron's
-- service-role key (which bypasses RLS) writes to this table.

-- ---------------------------------------------------------------------------
-- goal_maturity_reminders_sent: dedupe table for the H-7 "jatuh tempo" email
-- reminder sent for a goal-linked Deposito/Obligasi, same pattern as
-- billing_reminders_sent. No RLS policies defined — cron-only via service
-- role, zero access for regular users.
-- ---------------------------------------------------------------------------
create table if not exists public.goal_maturity_reminders_sent (
  holding_id uuid not null,
  sent_date date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (holding_id, sent_date)
);

alter table public.goal_maturity_reminders_sent enable row level security;
