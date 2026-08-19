-- Marketplace products persistence (Postgres / Supabase)
-- Prepared migration: products now persist in JSON file at runtime.
-- This schema is the next step to move persistence to database.

create table if not exists public.cms_products (
  id text primary key,
  sku text not null unique,
  moq integer not null default 1,
  brand_id text not null,
  category_id text not null,
  subcategory_id text not null,
  images jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  availability jsonb not null default '{}'::jsonb,
  enabled_countries jsonb not null default '{}'::jsonb,
  prices jsonb not null default '{}'::jsonb,
  application jsonb not null default '[]'::jsonb,
  cultures jsonb not null default '[]'::jsonb,
  certifications jsonb not null default '[]'::jsonb,
  country_of_origin text not null default '',
  stock_status text not null default 'in_stock',
  stock_quantity integer,
  unlimited_stock boolean not null default true,
  specs jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  related_product_ids jsonb not null default '[]'::jsonb,
  name jsonb not null default '{}'::jsonb,
  short_description jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  seo jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  purge_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cms_products_status on public.cms_products(status);
create index if not exists idx_cms_products_deleted_at on public.cms_products(deleted_at);
create index if not exists idx_cms_products_category on public.cms_products(category_id);
create index if not exists idx_cms_products_brand on public.cms_products(brand_id);

create or replace function public.touch_cms_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_cms_products_updated_at on public.cms_products;
create trigger trg_touch_cms_products_updated_at
before update on public.cms_products
for each row
execute function public.touch_cms_products_updated_at();

alter table public.cms_products enable row level security;

drop policy if exists "Anon read published products" on public.cms_products;
create policy "Anon read published products"
  on public.cms_products
  for select
  to anon
  using (status = 'published' and deleted_at is null);

drop policy if exists "Authenticated manage products" on public.cms_products;
create policy "Authenticated manage products"
  on public.cms_products
  for all
  to authenticated
  using (true)
  with check (true);

