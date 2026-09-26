-- Fix any remaining NULL sort_order values from the previous migration
-- by assigning them based on created_at order per user+category

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

-- Ensure all remaining rows have a valid sort_order value
-- For any rows that still have NULL (shouldn't happen after above), assign based on created_at
with all_ranked as (
  select
    id,
    row_number() over (partition by user_id, category order by created_at) - 1 as rn
  from asset_holdings
  where sort_order is null
)
update asset_holdings ah
set sort_order = all_ranked.rn
from all_ranked
where all_ranked.id = ah.id;
