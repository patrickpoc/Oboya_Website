-- Storefront display color: `__default__` or a color_variants id shown first and preselected.

alter table public.cms_products
  add column if not exists featured_color_id text not null default '';
