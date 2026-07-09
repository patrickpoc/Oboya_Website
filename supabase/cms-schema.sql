-- Extended CMS schema for Oboya Admin
-- Run after the base schema in supabase/schema.sql

-- User roles (extends Supabase auth.users)
create table if not exists public.cms_user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  job_title text,
  role text not null default 'viewer',
  locale text not null default 'en',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Generic CMS content store (JSON documents)
create table if not exists public.cms_documents (
  id text primary key,
  module text not null,
  data jsonb not null,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_documents_module_idx on public.cms_documents(module);

-- Form submissions
create table if not exists public.cms_form_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  status text not null default 'new',
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- Media assets
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

-- Audit logs
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

-- Site settings (singleton)
create table if not exists public.cms_settings (
  id text primary key default 'general',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.cms_user_profiles enable row level security;
alter table public.cms_documents enable row level security;
alter table public.cms_form_submissions enable row level security;
alter table public.cms_media enable row level security;
alter table public.cms_audit_logs enable row level security;
alter table public.cms_settings enable row level security;

-- Public read for published documents
create policy "Public read published cms documents"
  on public.cms_documents for select
  to anon, authenticated
  using (status = 'published');

-- Authenticated CMS access (refine with role checks in app layer)
create policy "Authenticated manage cms documents"
  on public.cms_documents for all
  to authenticated
  using (true) with check (true);

create policy "Authenticated manage form submissions"
  on public.cms_form_submissions for all
  to authenticated
  using (true) with check (true);

create policy "Authenticated manage media"
  on public.cms_media for all
  to authenticated
  using (true) with check (true);

create policy "Authenticated read audit logs"
  on public.cms_audit_logs for select
  to authenticated
  using (true);

create policy "Authenticated manage settings"
  on public.cms_settings for all
  to authenticated
  using (true) with check (true);

create policy "Users read own profile"
  on public.cms_user_profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.cms_user_profiles for update
  to authenticated
  using (auth.uid() = id);
