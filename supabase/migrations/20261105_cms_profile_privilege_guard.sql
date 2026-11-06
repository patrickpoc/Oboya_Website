-- CMS profile privilege guard.
--
-- Problem: cms_user_profiles lets every user UPDATE their own row via RLS, and
-- the trigger from 20260914 only froze role/status (silently). permission_overrides
-- (added in 20260925) was unprotected, so an active viewer could grant
-- themselves permissions through PostgREST. The "Admins manage all profiles"
-- policy also let an admin write role = 'super_admin' directly, and its
-- self-referencing subquery was a recursion risk.
--
-- Rules enforced by the trigger (anything else raises SQLSTATE 42501):
--   * Bypass ONLY when the JWT role is null (migrations, SQL editor, GoTrue
--     cascades) or 'service_role', and the Postgres role is not anon/authenticated.
--     The app writes roles and overrides through the service-role client.
--   * id and created_at are never client-editable (reset first, so an id swap
--     cannot slip past the checks below, which use OLD.id).
--   * permission_overrides: only an active super_admin may change it, and
--     never on their own row.
--   * role = 'super_admin': only an active super_admin may grant it, remove it,
--     change status of a super_admin row, or delete one.
--   * Nobody may change their own role or status from a user session, admins and
--     super admins included (service role / SQL editor are the only way).
--   * INSERT: admin/super_admin, or a viewer row that is active with empty overrides.
--   * DELETE always returns OLD (returning NEW would silently cancel the delete).
--
-- Also here:
--   * "Admins manage all profiles" (FOR ALL) is replaced by a non-recursive
--     SELECT-only policy. Admin profile writes go through the service-role client.
--   * Restrictive policies keep cms-access-control / cms-approval-policies
--     writable only by super_admin sessions (service role bypasses RLS).
--   * cms_audit_logs.user_id becomes ON DELETE SET NULL, so deleting a user who
--     has audit history succeeds and the history is kept.
--   * public.ensure_cms_super_admin() is dropped: nothing in the app calls it, and the
--     copy from diagnostics/unlock-users-admin.sql was granted to authenticated.
-- Idempotent: safe to run more than once. Wrapped in one transaction with a 5s
-- lock_timeout so it fails fast instead of queueing behind long-running queries.

begin;
set local lock_timeout = '5s';

create or replace function public.cms_protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := auth.role();
  db_role text := coalesce(current_setting('role', true), 'none');
  caller_super boolean;
  caller_admin boolean;
begin
  if (jwt_role is null or jwt_role = 'service_role')
     and db_role not in ('anon', 'authenticated') then
    if TG_OP = 'DELETE' then
      return OLD;
    end if;
    return NEW;
  end if;

  caller_super := public.cms_has_role(array['super_admin']);
  caller_admin := public.cms_has_role(array['super_admin', 'admin']);

  if TG_OP = 'DELETE' then
    if OLD.role = 'super_admin' and not caller_super then
      raise exception 'Only a super admin can delete a super admin profile'
        using errcode = '42501';
    end if;
    return OLD;
  end if;

  if TG_OP = 'INSERT' then
    if NEW.role = 'super_admin' and not caller_super then
      raise exception 'Only a super admin can assign the super_admin role'
        using errcode = '42501';
    end if;
    if NEW.permission_overrides is distinct from '{}'::jsonb and not caller_super then
      raise exception 'Only a super admin can set permission overrides'
        using errcode = '42501';
    end if;
    if not caller_admin and not (NEW.role = 'viewer' and NEW.status = 'active') then
      raise exception 'Only an admin can create a profile that is not an active viewer'
        using errcode = '42501';
    end if;
    return NEW;
  end if;

  -- UPDATE. Identity columns first: later checks rely on OLD.id.
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;

  if (NEW.role is distinct from OLD.role or NEW.status is distinct from OLD.status)
     and (OLD.role = 'super_admin' or NEW.role = 'super_admin')
     and not caller_super then
    raise exception 'Only a super admin can change the super_admin role or status'
      using errcode = '42501';
  end if;

  -- Overrides: super admins may edit other users, nobody edits their own.
  if NEW.permission_overrides is distinct from OLD.permission_overrides
     and (not caller_super or OLD.id = auth.uid()) then
    raise exception 'Permission overrides can only be changed by a super admin on another user'
      using errcode = '42501';
  end if;

  -- Nobody (admins and super admins included) changes their own role/status
  -- through a user session; the app does that through the service-role client.
  if OLD.id = auth.uid()
     and (NEW.role is distinct from OLD.role or NEW.status is distinct from OLD.status) then
    raise exception 'You cannot change your own role or status'
      using errcode = '42501';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_cms_protect_profile_columns on public.cms_user_profiles;
create trigger trg_cms_protect_profile_columns
before insert or update or delete on public.cms_user_profiles
for each row
execute function public.cms_protect_profile_columns();

-- Self-insert: viewer, active, no overrides.
drop policy if exists "Users insert own profile" on public.cms_user_profiles;
create policy "Users insert own profile"
  on public.cms_user_profiles for insert
  to authenticated
  with check (
    auth.uid() = id
    and role = 'viewer'
    and status = 'active'
    and permission_overrides = '{}'::jsonb
  );

-- Admins may read every profile (listing users without the service role).
-- cms_has_role is SECURITY DEFINER, so the policy does not recurse. Writes are
-- service-role only; "Users read own profile" / "Users update own profile" stay.
drop policy if exists "Admins manage all profiles" on public.cms_user_profiles;
drop policy if exists "Admins read all profiles" on public.cms_user_profiles;
create policy "Admins read all profiles"
  on public.cms_user_profiles for select
  to authenticated
  using (public.cms_has_role(array['super_admin', 'admin']));

-- Access-control and approval-policy documents: super_admin sessions only.
-- Restrictive policies are ANDed with the existing "Staff manage cms documents".
drop policy if exists "Super admin only protected docs insert" on public.cms_documents;
create policy "Super admin only protected docs insert"
  on public.cms_documents as restrictive for insert
  to authenticated
  with check (
    id not in ('cms-access-control', 'cms-approval-policies')
    or public.cms_has_role(array['super_admin'])
  );

drop policy if exists "Super admin only protected docs update" on public.cms_documents;
create policy "Super admin only protected docs update"
  on public.cms_documents as restrictive for update
  to authenticated
  using (
    id not in ('cms-access-control', 'cms-approval-policies')
    or public.cms_has_role(array['super_admin'])
  )
  with check (
    id not in ('cms-access-control', 'cms-approval-policies')
    or public.cms_has_role(array['super_admin'])
  );

drop policy if exists "Super admin only protected docs delete" on public.cms_documents;
create policy "Super admin only protected docs delete"
  on public.cms_documents as restrictive for delete
  to authenticated
  using (
    id not in ('cms-access-control', 'cms-approval-policies')
    or public.cms_has_role(array['super_admin'])
  );

-- Audit FK: keep history when the user is deleted. The constraint name is looked up.
do $$
declare
  con record;
  uid_attnum smallint;
begin
  if to_regclass('public.cms_audit_logs') is null then
    return;
  end if;

  select attnum into uid_attnum
  from pg_attribute
  where attrelid = 'public.cms_audit_logs'::regclass
    and attname = 'user_id'
    and not attisdropped;
  if uid_attnum is null then
    return;
  end if;

  -- SET NULL needs a nullable column.
  alter table public.cms_audit_logs alter column user_id drop not null;

  for con in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.cms_audit_logs'::regclass
      and c.contype = 'f'
      and c.confrelid = 'auth.users'::regclass
      and c.conkey = array[uid_attnum]
      and c.confdeltype <> 'n'
  loop
    execute format('alter table public.cms_audit_logs drop constraint %I', con.conname);
    execute format(
      'alter table public.cms_audit_logs add constraint %I foreign key (user_id) references auth.users(id) on delete set null',
      con.conname
    );
  end loop;
end
$$;

-- Bootstrap helper no longer used by the app (see header).
drop function if exists public.ensure_cms_super_admin();

commit;
