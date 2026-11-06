-- Verification for 20261105_cms_profile_privilege_guard.sql
--
-- FOR A TEST DATABASE ONLY (a throwaway Supabase project or local `supabase start`).
-- Do NOT run it against production. Everything runs inside one transaction that
-- ends with ROLLBACK, but it still deletes rows from auth.users and takes locks,
-- and it needs a role that can SET ROLE (postgres / supabase_admin).
--
-- Before running:
--   1. Apply the migration to the test database.
--   2. Create FIVE users in auth.users on that database and replace the
--      <PLACEHOLDER> uuids below. They need no profile; the script writes them.
--   3. Run:  psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/diagnostics/verify_cms_privilege_guard.sql
-- Each check prints "PASS: ..." as a NOTICE and the first failure aborts with "FAIL: ...".
-- Expected SQLSTATE 42501 = insufficient_privilege (trigger raise or RLS violation).
-- "rows=0" = the row was hidden by RLS (no policy allows it), "rows=1" = it was changed.

begin;

-- ---------------------------------------------------------------- placeholders
select set_config('t.super',   '<SUPER_ADMIN_USER_UUID>', true);
select set_config('t.admin',   '<ADMIN_USER_UUID>',       true);
select set_config('t.viewer',  '<VIEWER_USER_UUID>',      true);
select set_config('t.victim',  '<VICTIM_USER_UUID>',      true);  -- gets deleted by the script
select set_config('t.other',   '<OTHER_VIEWER_USER_UUID>', true);
-- Fails right here with "invalid input syntax for type uuid" if a placeholder is left.
select current_setting('t.super')::uuid, current_setting('t.admin')::uuid,
       current_setting('t.viewer')::uuid, current_setting('t.victim')::uuid,
       current_setting('t.other')::uuid;

-- ---------------------------------------------------------------- helpers (rolled back with the rest)
create function public.zz_as(uid uuid, jwt_role text) returns void
language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims',
    case when jwt_role is null then '' else json_build_object('sub', uid, 'role', jwt_role)::text end, true);
  perform set_config('request.jwt.claim.sub',  coalesce(uid::text, ''), true);
  perform set_config('request.jwt.claim.role', coalesce(jwt_role, ''), true);
  if jwt_role is not null then
    execute format('set local role %I', jwt_role);
  end if;
end $$;

-- Runs one statement as the current role: 'rows=N' on success, the SQLSTATE on error.
create function public.zz_try(stmt text) returns text
language plpgsql as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return 'rows=' || n;
exception when others then
  return sqlstate;
end $$;

create function public.zz_val(stmt text) returns text
language plpgsql as $$
declare v text;
begin
  execute stmt into v;
  return v;
end $$;

create function public.zz_expect(label text, got text, want text) returns void
language plpgsql as $$
begin
  if got is distinct from want then
    raise exception 'FAIL: % (got %, wanted %)', label, got, want;
  end if;
  raise notice 'PASS: %', label;
end $$;

-- ---------------------------------------------------------------- fixtures (no JWT = bypass)
select public.zz_as(null, null);
insert into public.cms_user_profiles (id, name, role, status, permission_overrides) values
  (current_setting('t.super')::uuid,  'zz super',  'super_admin', 'active', '{}'),
  (current_setting('t.admin')::uuid,   'zz admin',  'admin',       'active', '{}'),
  (current_setting('t.viewer')::uuid,  'zz viewer', 'viewer',      'active', '{}'),
  (current_setting('t.victim')::uuid,  'zz victim', 'viewer',      'active', '{}'),
  (current_setting('t.other')::uuid,   'zz other',  'viewer',      'active', '{}')
on conflict (id) do update
  set role = excluded.role, status = excluded.status, permission_overrides = '{}'::jsonb, name = excluded.name;
insert into public.cms_documents (id, module, data, status) values
  ('cms-access-control',    'users', '{"roles":[],"matrix":{}}', 'published'),
  ('cms-approval-policies', 'users', '{"policies":[]}',          'published')
on conflict (id) do nothing;
insert into public.cms_documents (id, module, data, status) values
  ('zz-published-doc', 'website', '{}', 'published')
on conflict (id) do update set status = 'published';

-- ---------------------------------------------------------------- self select / self update still work
select public.zz_as(current_setting('t.viewer')::uuid, 'authenticated');
select public.zz_expect('viewer reads only their own profile',
  public.zz_val('select count(*) from public.cms_user_profiles'), '1');
select public.zz_expect('viewer can update own name',
  public.zz_try(format('update public.cms_user_profiles set name = %L where id = %L', 'zz viewer 2', current_setting('t.viewer'))),
  'rows=1');
select public.zz_expect('viewer cannot update someone else',
  public.zz_try(format('update public.cms_user_profiles set name = %L where id = %L', 'hacked', current_setting('t.other'))),
  'rows=0');
select public.zz_expect('viewer can update own locale and must_change_password',
  public.zz_try(format('update public.cms_user_profiles set locale = %L, must_change_password = false where id = %L', 'pt-BR', current_setting('t.viewer'))),
  'rows=1');
select public.zz_expect('provisioning upsert on an existing row does nothing (on conflict do nothing)',
  public.zz_try(format('insert into public.cms_user_profiles (id, name, role, status) values (%L, %L, %L, %L) on conflict (id) do nothing',
    current_setting('t.viewer'), 'zz viewer', 'viewer', 'active')),
  'rows=0');

-- ---------------------------------------------------------------- admin reads all, writes nothing directly (S2)
select public.zz_as(current_setting('t.admin')::uuid, 'authenticated');
select public.zz_expect('admin can read all profiles (non-recursive select policy)',
  public.zz_val('select (count(*) >= 5)::text from public.cms_user_profiles'), 'true');
select public.zz_expect('admin cannot write other profiles via the API (policy removed)',
  public.zz_try(format('update public.cms_user_profiles set role = %L where id = %L', 'admin', current_setting('t.viewer'))),
  'rows=0');
select public.zz_expect('admin cannot delete other profiles via the API',
  public.zz_try(format('delete from public.cms_user_profiles where id = %L', current_setting('t.other'))),
  'rows=0');

-- ---------------------------------------------------------------- permission overrides
select public.zz_as(current_setting('t.viewer')::uuid, 'authenticated');
select public.zz_expect('viewer cannot grant themselves overrides (raises)',
  public.zz_try(format('update public.cms_user_profiles set permission_overrides = %L where id = %L',
    '{"grants":{"users":["edit"]}}', current_setting('t.viewer'))), '42501');
select public.zz_as(current_setting('t.admin')::uuid, 'authenticated');
select public.zz_expect('admin cannot edit own overrides',
  public.zz_try(format('update public.cms_user_profiles set permission_overrides = %L where id = %L',
    '{"grants":{"users":["edit"]}}', current_setting('t.admin'))), '42501');
select public.zz_as(current_setting('t.super')::uuid, 'authenticated');
select public.zz_expect('super admin cannot edit own overrides',
  public.zz_try(format('update public.cms_user_profiles set permission_overrides = %L where id = %L',
    '{"grants":{"users":["edit"]}}', current_setting('t.super'))), '42501');

-- ---------------------------------------------------------------- role / status changes on own row
select public.zz_as(current_setting('t.viewer')::uuid, 'authenticated');
select public.zz_expect('viewer cannot promote self to admin',
  public.zz_try(format('update public.cms_user_profiles set role = %L where id = %L', 'admin', current_setting('t.viewer'))), '42501');
select public.zz_expect('viewer cannot promote self to super_admin',
  public.zz_try(format('update public.cms_user_profiles set role = %L where id = %L', 'super_admin', current_setting('t.viewer'))), '42501');
select public.zz_as(current_setting('t.admin')::uuid, 'authenticated');
select public.zz_expect('admin cannot promote self to super_admin',
  public.zz_try(format('update public.cms_user_profiles set role = %L where id = %L', 'super_admin', current_setting('t.admin'))), '42501');
select public.zz_expect('admin cannot move self to cto (own role is frozen for admins too)',
  public.zz_try(format('update public.cms_user_profiles set role = %L where id = %L', 'cto', current_setting('t.admin'))), '42501');
select public.zz_as(current_setting('t.super')::uuid, 'authenticated');
select public.zz_expect('super admin cannot demote self',
  public.zz_try(format('update public.cms_user_profiles set role = %L where id = %L', 'admin', current_setting('t.super'))), '42501');
select public.zz_as(current_setting('t.admin')::uuid, 'authenticated');
select public.zz_expect('admin cannot deactivate a super admin',
  public.zz_try(format('update public.cms_user_profiles set status = %L where id = %L', 'inactive', current_setting('t.super'))), 'rows=0');

-- ---------------------------------------------------------------- id swap must not bypass the freeze
select public.zz_as(current_setting('t.viewer')::uuid, 'authenticated');
select public.zz_expect('id swap + role=super_admin still raises',
  public.zz_try(format('update public.cms_user_profiles set id = %L, role = %L where id = %L',
    current_setting('t.victim'), 'super_admin', current_setting('t.viewer'))), '42501');
select public.zz_expect('id swap alone is neutralised (id reset to OLD.id)',
  public.zz_try(format('update public.cms_user_profiles set id = %L, name = %L where id = %L',
    current_setting('t.victim'), 'swap', current_setting('t.viewer'))), 'rows=1');
select public.zz_as(null, null);
select public.zz_expect('viewer row kept its id', public.zz_val(format(
  'select count(*) from public.cms_user_profiles where id = %L and name = %L', current_setting('t.viewer'), 'swap')), '1');
select public.zz_expect('victim row untouched', public.zz_val(format(
  'select name from public.cms_user_profiles where id = %L', current_setting('t.victim'))), 'zz victim');

-- ---------------------------------------------------------------- service role: delete must really delete (B1)
select public.zz_as(null, 'service_role');
select public.zz_expect('service role delete returns OLD (row is deleted, not cancelled)',
  public.zz_try(format('delete from public.cms_user_profiles where id = %L', current_setting('t.victim'))), 'rows=1');
select public.zz_expect('service role may change role and overrides',
  public.zz_try(format('update public.cms_user_profiles set role = %L, permission_overrides = %L where id = %L',
    'viewer', '{"grants":{"blog":["view"]}}', current_setting('t.other'))), 'rows=1');
select public.zz_as(null, null);
update public.cms_user_profiles set permission_overrides = '{}'::jsonb where id = current_setting('t.other')::uuid;

-- ---------------------------------------------------------------- inactive user cannot reactivate via upsert
update public.cms_user_profiles set status = 'inactive' where id = current_setting('t.other')::uuid;
select public.zz_as(current_setting('t.other')::uuid, 'authenticated');
select public.zz_expect('inactive user cannot reactivate themselves through upsert',
  public.zz_try(format('insert into public.cms_user_profiles (id, name, role, status) values (%L, %L, %L, %L) on conflict (id) do update set status = excluded.status',
    current_setting('t.other'), 'zz other', 'viewer', 'active')), '42501');
select public.zz_as(null, null);
update public.cms_user_profiles set status = 'active' where id = current_setting('t.other')::uuid;

-- ---------------------------------------------------------------- self-insert rules (victim now has no profile)
select public.zz_as(current_setting('t.victim')::uuid, 'authenticated');
select public.zz_expect('self-insert as admin is rejected',
  public.zz_try(format('insert into public.cms_user_profiles (id, name, role, status) values (%L, %L, %L, %L)',
    current_setting('t.victim'), 'v', 'admin', 'active')), '42501');
select public.zz_expect('self-insert with overrides is rejected',
  public.zz_try(format('insert into public.cms_user_profiles (id, name, role, status, permission_overrides) values (%L, %L, %L, %L, %L)',
    current_setting('t.victim'), 'v', 'viewer', 'active', '{"grants":{"users":["edit"]}}')), '42501');
select public.zz_expect('self-insert as inactive viewer is rejected',
  public.zz_try(format('insert into public.cms_user_profiles (id, name, role, status) values (%L, %L, %L, %L)',
    current_setting('t.victim'), 'v', 'viewer', 'inactive')), '42501');
select public.zz_expect('self-insert as active viewer with no overrides works',
  public.zz_try(format('insert into public.cms_user_profiles (id, name, role, status) values (%L, %L, %L, %L)',
    current_setting('t.victim'), 'v', 'viewer', 'active')), 'rows=1');

-- ---------------------------------------------------------------- protected documents (B3)
select public.zz_as(current_setting('t.admin')::uuid, 'authenticated');
select public.zz_expect('admin cannot update cms-access-control',
  public.zz_try($q$update public.cms_documents set data = data where id = 'cms-access-control'$q$), 'rows=0');
select public.zz_expect('admin cannot delete cms-approval-policies',
  public.zz_try($q$delete from public.cms_documents where id = 'cms-approval-policies'$q$), 'rows=0');
select public.zz_expect('admin cannot insert a protected doc',
  public.zz_try($q$insert into public.cms_documents (id, module, data) values ('cms-access-control', 'users', '{}') on conflict (id) do update set data = excluded.data$q$), '42501');
select public.zz_expect('admin can still write an ordinary doc',
  public.zz_try($q$insert into public.cms_documents (id, module, data) values ('zz-other-doc', 'website', '{}')$q$), 'rows=1');
select public.zz_expect('staff upsert of an ordinary doc works',
  public.zz_try($q$insert into public.cms_documents (id, module, data) values ('zz-other-doc', 'website', '{"v":2}') on conflict (id) do update set data = excluded.data$q$), 'rows=1');
select public.zz_as(current_setting('t.super')::uuid, 'authenticated');
select public.zz_expect('super admin can update cms-access-control',
  public.zz_try($q$update public.cms_documents set data = data where id = 'cms-access-control'$q$), 'rows=1');
select public.zz_expect('super admin can upsert cms-approval-policies',
  public.zz_try($q$insert into public.cms_documents (id, module, data) values ('cms-approval-policies', 'users', '{"policies":[]}') on conflict (id) do update set data = excluded.data$q$), 'rows=1');
select public.zz_as(null, 'service_role');
select public.zz_expect('service role is unaffected by the restrictive policies',
  public.zz_try($q$update public.cms_documents set data = data where id = 'cms-access-control'$q$), 'rows=1');
select public.zz_as(null, 'anon');
select public.zz_expect('anon can still read a published doc',
  public.zz_val($q$select count(*) from public.cms_documents where id = 'zz-published-doc'$q$), '1');

-- ---------------------------------------------------------------- auth cascade + audit FK (B1, audit)
select public.zz_as(null, null);
select public.zz_expect('cms_audit_logs.user_id is nullable', public.zz_val(
  $q$select is_nullable from information_schema.columns where table_schema = 'public' and table_name = 'cms_audit_logs' and column_name = 'user_id'$q$), 'YES');
select public.zz_expect('audit FK to auth.users is ON DELETE SET NULL', public.zz_val(
  $q$select string_agg(confdeltype::text, ',') from pg_constraint where conrelid = 'public.cms_audit_logs'::regclass and contype = 'f' and confrelid = 'auth.users'::regclass$q$), 'n');
insert into public.cms_audit_logs (user_id, user_name, action, module)
  values (current_setting('t.victim')::uuid, 'zz victim', 'zz.verify', 'users');
delete from auth.users where id = current_setting('t.victim')::uuid;   -- succeeds only with SET NULL
select public.zz_expect('auth user deletion cascaded to the profile (trigger returned OLD)', public.zz_val(format(
  'select count(*) from public.cms_user_profiles where id = %L', current_setting('t.victim'))), '0');
select public.zz_expect('audit history kept with user_id set to null', public.zz_val(
  $q$select count(*) from public.cms_audit_logs where action = 'zz.verify' and user_id is null$q$), '1');

select 'ALL CHECKS PASSED - rolling back' as result;
rollback;
