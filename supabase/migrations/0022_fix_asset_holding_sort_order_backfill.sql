-- Add sort_order column if it doesn't exist, then backfill all values

alter table asset_holdings add column if not exists sort_order integer;

-- Backfill sort_order for all rows based on created_at order per user+category
with ranked as (
  select
    id,
    row_number() over (partition by user_id, category order by created_at) - 1 as rn
  from asset_holdings
  where sort_order is null
)
update asset_holdings ah
set sort_order = ranked.rn
from ranked
where ranked.id = ah.id;

-- Set default value for new rows
alter table asset_holdings alter column sort_order set default 0;

-- Make not null (safe now that all rows have values)
alter table asset_holdings alter column sort_order set not null;

-- Create index for better query performance
create index if not exists asset_holdings_user_category_sort_idx
  on asset_holdings (user_id, category, sort_order);
