-- =============================================================================
-- DIAGNOSTIC: CMS users / profiles / auth
-- Run in Supabase → SQL Editor (read-only). Copy ALL result grids back.
-- =============================================================================

-- 1) Core CMS tables exist?
select
  t.table_name,
  case when c.relrowsecurity then 'RLS on' else 'RLS off' end as rls
from information_schema.tables t
left join pg_class c
  on c.relname = t.table_name
 and c.relnamespace = (select oid from pg_namespace where nspname = 'public')
where t.table_schema = 'public'
  and t.table_name in (
    'cms_user_profiles',
    'cms_documents',
    'cms_media',
    'cms_form_submissions',
    'cms_audit_logs',
    'cms_settings'
  )
order by t.table_name;

-- 2) cms_user_profiles columns
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'cms_user_profiles'
order by ordinal_position;

-- 3) Policies on cms_user_profiles (duplicates show as multiple rows with same name)
select
  pol.polname as policy_name,
  pol.polcmd as command, -- r=select, a=insert, w=update, d=delete, *=all
  pol.polpermissive as permissive,
  roles.rolname as role_name,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr
from pg_policy pol
join pg_class cls on cls.oid = pol.polrelid
join pg_namespace nsp on nsp.oid = cls.relnamespace
left join lateral unnest(pol.polroles) as role_oid on true
left join pg_roles roles on roles.oid = role_oid
where nsp.nspname = 'public'
  and cls.relname = 'cms_user_profiles'
order by pol.polname, roles.rolname;

-- 4) Policy name counts ( >1 = duplication problem )
select
  pol.polname as policy_name,
  count(*) as instances
from pg_policy pol
join pg_class cls on cls.oid = pol.polrelid
join pg_namespace nsp on nsp.oid = cls.relnamespace
where nsp.nspname = 'public'
  and cls.relname = 'cms_user_profiles'
group by pol.polname
order by instances desc, pol.polname;

-- 5) Auth users vs profiles (orphans / missing profiles)
select
  u.id as auth_user_id,
  u.email,
  u.created_at as auth_created_at,
  u.banned_until,
  u.raw_user_meta_data ->> 'must_change_password' as meta_must_change_password,
  u.raw_user_meta_data ->> 'name' as meta_name,
  p.id is not null as has_profile,
  p.name as profile_name,
  p.role,
  p.status,
  p.must_change_password as profile_must_change_password,
  p.job_title,
  p.locale
from auth.users u
left join public.cms_user_profiles p on p.id = u.id
order by u.created_at;

-- 6) Profiles without matching auth user (should be 0)
select p.*
from public.cms_user_profiles p
left join auth.users u on u.id = p.id
where u.id is null;

-- 7) Role / status distribution
select
  coalesce(role, '(null)') as role,
  coalesce(status, '(null)') as status,
  count(*) as total
from public.cms_user_profiles
group by role, status
order by role, status;

-- 8) Required pieces checklist
select
  'cms_user_profiles table' as check_item,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'cms_user_profiles'
  ) as ok
union all
select
  'column must_change_password',
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cms_user_profiles'
      and column_name = 'must_change_password'
  )
union all
select
  'column job_title',
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cms_user_profiles'
      and column_name = 'job_title'
  )
union all
select
  'policy Users read own profile',
  exists (
    select 1
    from pg_policy pol
    join pg_class cls on cls.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'cms_user_profiles'
      and pol.polname = 'Users read own profile'
  )
union all
select
  'policy Users update own profile',
  exists (
    select 1
    from pg_policy pol
    join pg_class cls on cls.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'cms_user_profiles'
      and pol.polname = 'Users update own profile'
  )
union all
select
  'policy Users insert own profile',
  exists (
    select 1
    from pg_policy pol
    join pg_class cls on cls.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'cms_user_profiles'
      and pol.polname = 'Users insert own profile'
  )
union all
select
  'policy Admins manage all profiles',
  exists (
    select 1
    from pg_policy pol
    join pg_class cls on cls.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'cms_user_profiles'
      and pol.polname = 'Admins manage all profiles'
  )
union all
select
  'at least one super_admin/admin profile',
  exists (
    select 1 from public.cms_user_profiles
    where role in ('super_admin', 'admin')
      and status = 'active'
  )
union all
select
  'cms_media table',
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'cms_media'
  )
union all
select
  'cms_documents table',
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'cms_documents'
  )
order by check_item;
