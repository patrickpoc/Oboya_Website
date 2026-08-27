-- =============================================================================
-- FIX from diagnostic (2026-08-27)
-- Failures found:
--   ✗ at least one super_admin/admin profile
--   ✗ cms_documents table
--   ✗ cms_media table
-- Safe to run multiple times (idempotent).
-- =============================================================================

-- 1) Missing CMS tables
create table if not exists public.cms_documents (
  id text primary key,
  module text not null,
  data jsonb not null,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_documents_module_idx on public.cms_documents(module);

create table if not exists public.cms_media (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  type text not null,
  mime_type text not null,
  size bigint not null default 0,
  folder text not null default 'general',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_form_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  status text not null default 'new',
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cms_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  user_name text not null,
  action text not null,
  module text not null,
  resource_id text,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists public.cms_settings (
  id text primary key default 'general',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  job_title text,
  role text not null default 'viewer',
  locale text not null default 'en',
  status text not null default 'active',
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cms_user_profiles
  add column if not exists job_title text;
alter table public.cms_user_profiles
  add column if not exists must_change_password boolean not null default true;

-- 2) RLS
alter table public.cms_user_profiles enable row level security;
alter table public.cms_documents enable row level security;
alter table public.cms_media enable row level security;
alter table public.cms_form_submissions enable row level security;
alter table public.cms_audit_logs enable row level security;
alter table public.cms_settings enable row level security;

-- 3) Policies (drop + create = no "already exists")
drop policy if exists "Public read published cms documents" on public.cms_documents;
create policy "Public read published cms documents"
  on public.cms_documents for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Authenticated manage cms documents" on public.cms_documents;
create policy "Authenticated manage cms documents"
  on public.cms_documents for all
  to authenticated
  using (true) with check (true);

drop policy if exists "Authenticated manage media" on public.cms_media;
create policy "Authenticated manage media"
  on public.cms_media for all
  to authenticated
  using (true) with check (true);

drop policy if exists "Authenticated manage form submissions" on public.cms_form_submissions;
create policy "Authenticated manage form submissions"
  on public.cms_form_submissions for all
  to authenticated
  using (true) with check (true);

drop policy if exists "Authenticated read audit logs" on public.cms_audit_logs;
create policy "Authenticated read audit logs"
  on public.cms_audit_logs for select
  to authenticated
  using (true);

drop policy if exists "Authenticated manage settings" on public.cms_settings;
create policy "Authenticated manage settings"
  on public.cms_settings for all
  to authenticated
  using (true) with check (true);

drop policy if exists "Users read own profile" on public.cms_user_profiles;
create policy "Users read own profile"
  on public.cms_user_profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.cms_user_profiles;
create policy "Users update own profile"
  on public.cms_user_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.cms_user_profiles;
create policy "Users insert own profile"
  on public.cms_user_profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Admins manage all profiles" on public.cms_user_profiles;
create policy "Admins manage all profiles"
  on public.cms_user_profiles for all
  to authenticated
  using (
    exists (
      select 1 from public.cms_user_profiles me
      where me.id = auth.uid()
        and me.role in ('super_admin', 'admin')
        and me.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.cms_user_profiles me
      where me.id = auth.uid()
        and me.role in ('super_admin', 'admin')
        and me.status = 'active'
    )
  );

-- 4) Backfill profiles for auth users missing a row
insert into public.cms_user_profiles (
  id, name, role, locale, status, must_change_password, created_at, updated_at
)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(u.email, 'user'), '@', 1),
    'Admin'
  ),
  'viewer',
  'en',
  'active',
  false,
  coalesce(u.created_at, now()),
  now()
from auth.users u
left join public.cms_user_profiles p on p.id = u.id
where p.id is null;

-- 5) Force at least one active super_admin (oldest auth user)
--    This is why Users & Permissions was broken: profiles existed as viewer only.
update public.cms_user_profiles p
set
  role = 'super_admin',
  status = 'active',
  must_change_password = false,
  updated_at = now()
where p.id = (
  select u.id from auth.users u order by u.created_at asc nulls last limit 1
);

-- 6) Re-check the 3 failed items
select
  'at least one super_admin/admin profile' as check_item,
  exists (
    select 1 from public.cms_user_profiles
    where role in ('super_admin', 'admin') and status = 'active'
  ) as ok
union all
select
  'cms_documents table',
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'cms_documents'
  )
union all
select
  'cms_media table',
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'cms_media'
  )
order by check_item;
