-- Split Bill: "Bagi Rata" — an item can now be split evenly across a chosen
-- subset of participants instead of per-unit assignment. A row here with
-- shared = true means that participant is one of the people sharing the
-- item evenly (its `units` value is unused/irrelevant in that case, kept 0
-- for clarity); the actual even-split amount is recomputed from the item's
-- price the same way the client did (allocateSplit()), never stored, so it
-- always matches the item's price if that's ever corrected.
alter table public.bill_split_item_assignments
  add column if not exists shared boolean not null default false;
