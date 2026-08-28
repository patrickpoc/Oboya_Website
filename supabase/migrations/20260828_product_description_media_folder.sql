-- Product rich description — Supabase seed (idempotent)
--
-- What this feature needs:
--   • cms_products.short_description / description (JSONB) — already in 20260819_marketplace_products.sql
--   • cms-media storage bucket (images) — already in 20260827_cms_media_storage.sql
--   • Media Library folder "Product Descriptions" (folder-product-descriptions)
--
-- The app merges this folder at runtime via mergeWithDefaults(), but running this
-- SQL ensures the folder exists in cms_documents for all environments immediately.
--
-- Safe to re-run.

-- ── 1. Guard: cms_products columns (no-op if migration 20260819 already applied) ──

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

-- ── 2. Seed canonical media folder tree (insert if missing) ──

insert into public.cms_documents (id, module, data, status, updated_at)
values (
  'media-folders',
  'media',
  jsonb_build_object(
    'folders',
    jsonb_build_array(
      jsonb_build_object(
        'id', 'folder-root',
        'name', 'Root',
        'parentId', null,
        'createdAt', '2026-01-01T00:00:00.000Z'
      ),
      jsonb_build_object(
        'id', 'folder-website-files',
        'name', 'Website Files',
        'parentId', 'folder-root',
        'createdAt', '2026-01-01T00:00:00.000Z'
      ),
      jsonb_build_object(
        'id', 'folder-products',
        'name', 'Products',
        'parentId', 'folder-root',
        'createdAt', '2026-01-01T00:00:00.000Z'
      ),
      jsonb_build_object(
        'id', 'folder-ecovaso-products',
        'name', 'Ecovaso Products',
        'parentId', 'folder-products',
        'createdAt', '2026-01-01T00:00:00.000Z'
      ),
      jsonb_build_object(
        'id', 'folder-product-descriptions',
        'name', 'Product Descriptions',
        'parentId', 'folder-products',
        'createdAt', '2026-01-01T00:00:00.000Z'
      )
    )
  ),
  'published',
  now()
)
on conflict (id) do nothing;

-- ── 3. Merge folder-product-descriptions into existing media-folders doc ──

update public.cms_documents
set
  data = jsonb_set(
    data,
    '{folders}',
    coalesce(data->'folders', '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'id', 'folder-product-descriptions',
        'name', 'Product Descriptions',
        'parentId', 'folder-products',
        'createdAt', '2026-01-01T00:00:00.000Z'
      )
    )
  ),
  updated_at = now()
where id = 'media-folders'
  and not exists (
    select 1
    from jsonb_array_elements(coalesce(data->'folders', '[]'::jsonb)) AS folder
    where folder->>'id' = 'folder-product-descriptions'
  );

-- ── 4. Ensure parent folder "folder-products" exists when doc was partial ──

update public.cms_documents
set
  data = jsonb_set(
    data,
    '{folders}',
    coalesce(data->'folders', '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'id', 'folder-products',
        'name', 'Products',
        'parentId', 'folder-root',
        'createdAt', '2026-01-01T00:00:00.000Z'
      )
    )
  ),
  updated_at = now()
where id = 'media-folders'
  and exists (
    select 1
    from jsonb_array_elements(coalesce(data->'folders', '[]'::jsonb)) AS folder
    where folder->>'id' = 'folder-product-descriptions'
  )
  and not exists (
    select 1
    from jsonb_array_elements(coalesce(data->'folders', '[]'::jsonb)) AS folder
    where folder->>'id' = 'folder-products'
  );
