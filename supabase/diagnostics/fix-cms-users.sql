-- =============================================================================
-- FIX (idempotent): CMS user profiles for Admin Users & Permissions
-- Safe to run many times. Never errors on "policy already exists".
--
-- What this does:
-- 1) Creates cms_user_profiles if missing
-- 2) Adds missing columns
-- 3) Recreates RLS policies cleanly (drop + create)
-- 4) Backfills a profile row for every auth.users without one
-- 5) Promotes the oldest auth user to super_admin if no admin exists
-- =============================================================================

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

alter table public.cms_user_profiles
  add column if not exists name text not null default '';

alter table public.cms_user_profiles
  add column if not exists role text not null default 'viewer';

alter table public.cms_user_profiles
  add column if not exists locale text not null default 'en';

alter table public.cms_user_profiles
  add column if not exists status text not null default 'active';

alter table public.cms_user_profiles
  add column if not exists created_at timestamptz not null default now();

alter table public.cms_user_profiles
  add column if not exists updated_at timestamptz not null default now();

alter table public.cms_user_profiles enable row level security;

-- Drop ALL known profile policies (covers duplicates from cms-schema + migration)
drop policy if exists "Users read own profile" on public.cms_user_profiles;
drop policy if exists "Users update own profile" on public.cms_user_profiles;
drop policy if exists "Users insert own profile" on public.cms_user_profiles;
drop policy if exists "Admins manage all profiles" on public.cms_user_profiles;

-- Recreate canonical policies
create policy "Users read own profile"
  on public.cms_user_profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.cms_user_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users insert own profile"
  on public.cms_user_profiles for insert
  to authenticated
  with check (auth.uid() = id);

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

-- Backfill profiles for every auth user missing a row
insert into public.cms_user_profiles (
  id,
  name,
  job_title,
  role,
  locale,
  status,
  must_change_password,
  created_at,
  updated_at
)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(u.email, 'user'), '@', 1),
    'Admin'
  ),
  null,
  'viewer',
  'en',
  'active',
  coalesce((u.raw_user_meta_data ->> 'must_change_password')::boolean, false),
  coalesce(u.created_at, now()),
  now()
from auth.users u
left join public.cms_user_profiles p on p.id = u.id
where p.id is null;

-- Ensure at least one active super_admin (oldest auth user).
-- Always promote the oldest user when no active admin/super_admin exists,
-- OR when profiles only exist as viewer (common after partial setup).
update public.cms_user_profiles p
set
  role = 'super_admin',
  status = 'active',
  must_change_password = false,
  updated_at = now()
where p.id = (
  select u.id from auth.users u order by u.created_at asc nulls last limit 1
)
and not exists (
  select 1
  from public.cms_user_profiles x
  where x.role in ('super_admin', 'admin')
    and x.status = 'active'
);

-- Verification summary
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.cms_user_profiles) as profiles,
  (select count(*) from public.cms_user_profiles where role = 'super_admin') as super_admins,
  (select count(*) from public.cms_user_profiles where role = 'admin') as admins,
  (
    select count(*)
    from pg_policy pol
    join pg_class cls on cls.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'cms_user_profiles'
  ) as profile_policies;
