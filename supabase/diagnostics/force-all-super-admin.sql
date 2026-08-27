-- =============================================================================
-- FORCE: make EVERY profile an active super_admin
-- Use this when login email was not the one promoted by "oldest user" scripts.
-- Safe for early setup with a handful of trusted accounts.
-- =============================================================================

-- Show current state FIRST (check Results)
select u.email, p.role, p.status, p.id
from public.cms_user_profiles p
join auth.users u on u.id = p.id
order by u.created_at;

-- Promote everyone
update public.cms_user_profiles
set
  role = 'super_admin',
  status = 'active',
  must_change_password = false,
  updated_at = now();

-- Create profiles for auth users that still don't have one
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
  'super_admin',
  'en',
  'active',
  false,
  coalesce(u.created_at, now()),
  now()
from auth.users u
left join public.cms_user_profiles p on p.id = u.id
where p.id is null;

-- Confirm: every row must be super_admin / active
select u.email, p.role, p.status
from public.cms_user_profiles p
join auth.users u on u.id = p.id
order by u.email;
