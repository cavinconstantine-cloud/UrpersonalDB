-- Engagement features: WhatsApp quick-log linking, Web Push subscriptions,
-- and daily-logging streaks. These are the "killer feature" set aimed at
-- retention — see product discussion in the app's build history.

-- WhatsApp linking: a user pairs their number by sending a one-time code
-- (generated here, shown in Settings) to the Uangku WhatsApp number. Once
-- matched, whatsapp_number is set and the pairing code is cleared.
alter table public.profiles
  add column if not exists whatsapp_number text,
  add column if not exists whatsapp_pairing_code text,
  add column if not exists whatsapp_linked_at timestamptz,
  add column if not exists push_enabled boolean not null default false;

create unique index if not exists profiles_whatsapp_number_idx
  on public.profiles (whatsapp_number) where whatsapp_number is not null;

-- Web Push subscriptions — a user can have multiple (one per device/browser).
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_all_own" on public.push_subscriptions;
create policy "push_subscriptions_all_own" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Daily-logging streak — one row per user, updated whenever a transaction
-- (expense or income, from the app or WhatsApp) is recorded.
create table if not exists public.logging_streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_logged_date date,
  updated_at timestamptz not null default now()
);

alter table public.logging_streaks enable row level security;

drop policy if exists "logging_streaks_select_own" on public.logging_streaks;
create policy "logging_streaks_select_own" on public.logging_streaks
  for select using (auth.uid() = user_id);
