-- Uangku — multiple holdings per liability category (e.g. several credit
-- cards under "Kartu Kredit"), plus a dedupe table for daily billing-date
-- email reminders sent by the cron route.

-- `liabilities` was one row per (user_id, category). Switch its primary key
-- to a generated id so a user can have several rows in the same category.
alter table public.liabilities add column if not exists id uuid default gen_random_uuid();
update public.liabilities set id = gen_random_uuid() where id is null;
alter table public.liabilities alter column id set not null;

alter table public.liabilities drop constraint if exists liabilities_pkey;
alter table public.liabilities add primary key (id);

create index if not exists liabilities_user_category_idx on public.liabilities (user_id, category);

-- ---------------------------------------------------------------------------
-- billing_reminders_sent: one row per liability per day a reminder email was
-- sent, so the daily cron never double-sends even if it runs more than once.
-- No RLS policies are defined — regular users get zero access to this table;
-- only the cron route's service-role key (which bypasses RLS) reads/writes it.
-- ---------------------------------------------------------------------------
create table if not exists public.billing_reminders_sent (
  liability_id uuid not null references public.liabilities (id) on delete cascade,
  sent_date date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (liability_id, sent_date)
);

alter table public.billing_reminders_sent enable row level security;
