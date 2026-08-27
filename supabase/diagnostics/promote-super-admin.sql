-- Promote YOUR login to super_admin (run in Supabase SQL Editor)
-- Replace the email below with the account you use on /admin/login

update public.cms_user_profiles p
set
  role = 'super_admin',
  status = 'active',
  must_change_password = false,
  updated_at = now()
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('admin@oboya.cc');

-- Confirm
select u.email, p.role, p.status, p.must_change_password
from public.cms_user_profiles p
join auth.users u on u.id = p.id
order by u.created_at;
