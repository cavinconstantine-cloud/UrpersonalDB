-- Closed-testing gate + account-selection follow-up for WhatsApp quick-log.
-- The webhook runs as the service role, so no client-facing RLS policy is
-- needed — this table is never read/written from the browser.

-- Holds a parsed-but-unfinalized transaction while we wait for the user to
-- reply with which Sumber Dana (Cash account) to debit/credit, when it
-- couldn't be resolved automatically (0/1 accounts, or a text match).
create table if not exists public.whatsapp_pending_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  whatsapp_number text not null,
  type text not null check (type in ('expense', 'income')),
  amount numeric not null,
  category text not null,
  description text not null,
  -- account holding ids offered in the ask-back message, in the order shown
  -- (so "1"/"2"/"3" replies map back to the right one).
  account_choices uuid[] not null,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_pending_transactions_number_idx
  on public.whatsapp_pending_transactions (whatsapp_number, created_at desc);

alter table public.whatsapp_pending_transactions enable row level security;
