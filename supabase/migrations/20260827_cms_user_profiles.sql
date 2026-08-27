-- Admin user profiles: create table if missing + first-login password change + admin policies
-- Safe to run even if supabase/cms-schema.sql was not applied yet.

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
  add column if not exists must_change_password boolean not null default true;

alter table public.cms_user_profiles
  add column if not exists job_title text;

alter table public.cms_user_profiles enable row level security;

drop policy if exists "Users read own profile" on public.cms_user_profiles;
create policy "Users read own profile"
  on public.cms_user_profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.cms_user_profiles;
create policy "Users update own profile"
  on public.cms_user_profiles for update
  to authenticated
  using (auth.uid() = id);

-- Allow authenticated admins (super_admin / admin) to manage all profiles
drop policy if exists "Admins manage all profiles" on public.cms_user_profiles;
create policy "Admins manage all profiles"
  on public.cms_user_profiles for all
  to authenticated
  using (
    exists (
      select 1
      from public.cms_user_profiles me
      where me.id = auth.uid()
        and me.role in ('super_admin', 'admin')
        and me.status = 'active'
    )
  )
  with check (
    exists (
      select 1
      from public.cms_user_profiles me
      where me.id = auth.uid()
        and me.role in ('super_admin', 'admin')
        and me.status = 'active'
    )
  );

-- Users can insert their own profile row on first sync
drop policy if exists "Users insert own profile" on public.cms_user_profiles;
create policy "Users insert own profile"
  on public.cms_user_profiles for insert
  to authenticated
  with check (auth.uid() = id);
