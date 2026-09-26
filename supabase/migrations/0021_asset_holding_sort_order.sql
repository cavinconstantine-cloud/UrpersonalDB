-- Lets customers reorder the holdings inside an asset category (e.g. move
-- their main Cash account to the top) instead of always seeing them in the
-- order they were first added.

alter table asset_holdings add column if not exists sort_order integer;

-- Backfill existing rows with their current (created_at) order per user+category
-- so nothing visibly reshuffles the first time this ships.
with ranked as (
  select id, row_number() over (partition by user_id, category order by created_at) - 1 as rn
  from asset_holdings
  where sort_order is null
)
update asset_holdings ah
set sort_order = ranked.rn
from ranked
where ranked.id = ah.id;

alter table asset_holdings alter column sort_order set default 0;
alter table asset_holdings alter column sort_order set not null;

create index if not exists asset_holdings_user_category_sort_idx
  on asset_holdings (user_id, category, sort_order);
