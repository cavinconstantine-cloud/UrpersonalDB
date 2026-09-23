-- Uangku — Split Bill (Beta): itemized GoPay-style bill splitting.
--
-- Only the bill-creator's own assigned item-share ever becomes a real
-- `expenses` row (via the existing Sumber Dana/adjustCashBalance flow,
-- wired from the server action, not from this migration). Every other
-- participant's share is informational only — recorded here so a public,
-- no-auth share link can show "siapa bayar berapa," but it never touches
-- anyone's asset/liquidity numbers. There is deliberately no
-- payment-confirmation ("mark as paid") tracking.

-- ---------------------------------------------------------------------------
-- bill_splits: one row per created split. share_token is the public,
-- unguessable handle used by the no-auth /split/[token] page — a separate
-- column from id so the share link never doubles as the row's primary key.
-- ---------------------------------------------------------------------------
create table if not exists public.bill_splits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  merchant text,
  receipt_image_path text,
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  service numeric not null default 0,
  total numeric not null default 0,
  share_token text not null unique default encode(gen_random_bytes(9), 'hex'),
  account_holding_id uuid references public.asset_holdings (id) on delete set null,
  creator_expense_id uuid references public.expenses (id) on delete set null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create index if not exists bill_splits_user_idx on public.bill_splits (user_id);

alter table public.bill_splits enable row level security;

drop policy if exists "bill_splits_select_own_or_public" on public.bill_splits;
create policy "bill_splits_select_own_or_public" on public.bill_splits
  for select using (auth.uid() = user_id or status = 'active');

drop policy if exists "bill_splits_insert_own" on public.bill_splits;
create policy "bill_splits_insert_own" on public.bill_splits
  for insert with check (auth.uid() = user_id);

drop policy if exists "bill_splits_update_own" on public.bill_splits;
create policy "bill_splits_update_own" on public.bill_splits
  for update using (auth.uid() = user_id);

drop policy if exists "bill_splits_delete_own" on public.bill_splits;
create policy "bill_splits_delete_own" on public.bill_splits
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- bill_split_participants / bill_split_items / bill_split_item_assignments:
-- selectable by anyone (needed for the public share page — none of this is
-- sensitive beyond what the creator already chose to share), but only
-- writable by the owning split's creator.
-- ---------------------------------------------------------------------------
create table if not exists public.bill_split_participants (
  id uuid primary key default gen_random_uuid(),
  bill_split_id uuid not null references public.bill_splits (id) on delete cascade,
  name text not null,
  is_creator boolean not null default false,
  sort_order int not null default 0
);

create index if not exists bill_split_participants_split_idx on public.bill_split_participants (bill_split_id);

alter table public.bill_split_participants enable row level security;

drop policy if exists "bill_split_participants_select_all" on public.bill_split_participants;
create policy "bill_split_participants_select_all" on public.bill_split_participants
  for select using (true);

drop policy if exists "bill_split_participants_write_own" on public.bill_split_participants;
create policy "bill_split_participants_write_own" on public.bill_split_participants
  for all using (
    exists (select 1 from public.bill_splits bs where bs.id = bill_split_id and bs.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.bill_splits bs where bs.id = bill_split_id and bs.user_id = auth.uid())
  );

create table if not exists public.bill_split_items (
  id uuid primary key default gen_random_uuid(),
  bill_split_id uuid not null references public.bill_splits (id) on delete cascade,
  name text not null,
  qty int not null default 1,
  unit_price numeric not null default 0,
  sort_order int not null default 0
);

create index if not exists bill_split_items_split_idx on public.bill_split_items (bill_split_id);

alter table public.bill_split_items enable row level security;

drop policy if exists "bill_split_items_select_all" on public.bill_split_items;
create policy "bill_split_items_select_all" on public.bill_split_items
  for select using (true);

drop policy if exists "bill_split_items_write_own" on public.bill_split_items;
create policy "bill_split_items_write_own" on public.bill_split_items
  for all using (
    exists (select 1 from public.bill_splits bs where bs.id = bill_split_id and bs.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.bill_splits bs where bs.id = bill_split_id and bs.user_id = auth.uid())
  );

create table if not exists public.bill_split_item_assignments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.bill_split_items (id) on delete cascade,
  participant_id uuid not null references public.bill_split_participants (id) on delete cascade,
  units int not null default 0,
  unique (item_id, participant_id)
);

create index if not exists bill_split_item_assignments_item_idx on public.bill_split_item_assignments (item_id);
create index if not exists bill_split_item_assignments_participant_idx on public.bill_split_item_assignments (participant_id);

alter table public.bill_split_item_assignments enable row level security;

drop policy if exists "bill_split_item_assignments_select_all" on public.bill_split_item_assignments;
create policy "bill_split_item_assignments_select_all" on public.bill_split_item_assignments
  for select using (true);

drop policy if exists "bill_split_item_assignments_write_own" on public.bill_split_item_assignments;
create policy "bill_split_item_assignments_write_own" on public.bill_split_item_assignments
  for all using (
    exists (
      select 1 from public.bill_split_items bi
      join public.bill_splits bs on bs.id = bi.bill_split_id
      where bi.id = item_id and bs.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.bill_split_items bi
      join public.bill_splits bs on bs.id = bi.bill_split_id
      where bi.id = item_id and bs.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- bill_split_misreads: standalone log of "struk salah dibaca" reports —
-- deliberately separate from bill_splits so a failed/abandoned scan (no
-- split ever created) still gets logged for future accuracy review.
-- ---------------------------------------------------------------------------
create table if not exists public.bill_split_misreads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bill_split_id uuid references public.bill_splits (id) on delete set null,
  image_path text,
  note text,
  created_at timestamptz not null default now()
);

alter table public.bill_split_misreads enable row level security;

drop policy if exists "bill_split_misreads_select_own" on public.bill_split_misreads;
create policy "bill_split_misreads_select_own" on public.bill_split_misreads
  for select using (auth.uid() = user_id);

drop policy if exists "bill_split_misreads_insert_own" on public.bill_split_misreads;
create policy "bill_split_misreads_insert_own" on public.bill_split_misreads
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: private 'receipts' bucket, one folder per user (`{user_id}/...`),
-- readable/writable only by that user — the public share page never shows
-- the photo itself, only the reviewed/edited item data above.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "receipts_owner_select" on storage.objects;
create policy "receipts_owner_select" on storage.objects
  for select using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "receipts_owner_insert" on storage.objects;
create policy "receipts_owner_insert" on storage.objects
  for insert with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "receipts_owner_delete" on storage.objects;
create policy "receipts_owner_delete" on storage.objects
  for delete using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
