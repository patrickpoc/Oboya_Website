-- Per-gallery-slot color bindings (parallel to images[]).
-- Empty array per slot = visible for all colors.

alter table public.cms_products
  add column if not exists image_color_ids jsonb not null default '[]'::jsonb;
