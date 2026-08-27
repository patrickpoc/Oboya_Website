-- =============================================================================
-- UNLOCK Users & Permissions (run once in Supabase SQL Editor)
-- 1) Promotes the oldest auth user to super_admin
-- 2) Adds a secure bootstrap function the app can call when no admin exists
-- =============================================================================

-- Ensure table/columns exist
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

-- Backfill missing profiles
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

-- FORCE: oldest auth user becomes active super_admin
update public.cms_user_profiles p
set
  role = 'super_admin',
  status = 'active',
  must_change_password = false,
  updated_at = now()
where p.id = (
  select u.id from auth.users u order by u.created_at asc nulls last limit 1
);

-- App helper: if zero admins, promote the currently logged-in user
create or replace function public.ensure_cms_super_admin()
returns public.cms_user_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  admin_count integer;
  result public.cms_user_profiles;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select count(*)::integer into admin_count
  from public.cms_user_profiles
  where role in ('super_admin', 'admin')
    and status = 'active';

  if coalesce(admin_count, 0) = 0 then
    update public.cms_user_profiles
    set
      role = 'super_admin',
      status = 'active',
      must_change_password = false,
      updated_at = now()
    where id = uid
    returning * into result;

    if result.id is null then
      insert into public.cms_user_profiles (
        id, name, role, locale, status, must_change_password
      ) values (
        uid,
        'Admin',
        'super_admin',
        'en',
        'active',
        false
      )
      returning * into result;
    end if;
  else
    select * into result
    from public.cms_user_profiles
    where id = uid;
  end if;

  return result;
end;
$$;

revoke all on function public.ensure_cms_super_admin() from public;
grant execute on function public.ensure_cms_super_admin() to authenticated;

-- Show who is admin now
select
  u.email,
  p.role,
  p.status,
  p.must_change_password
from public.cms_user_profiles p
join auth.users u on u.id = p.id
order by
  case when p.role in ('super_admin', 'admin') then 0 else 1 end,
  u.created_at;
