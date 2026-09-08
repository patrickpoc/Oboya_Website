-- Color variants embedded on marketplace products (jsonb array).
-- Backward compatible: default empty array = no color UI.

alter table public.cms_products
  add column if not exists color_variants jsonb not null default '[]'::jsonb;
