-- Phase 1 of brand removal: code stops reading/writing brand_id, so new rows
-- must not depend on a client-supplied value. Non-destructive: the column,
-- its NOT NULL constraint, its index and existing data stay as they are.
-- Apply BEFORE deploying the code that omits brand_id from product upserts.
alter table public.cms_products alter column brand_id set default '';
