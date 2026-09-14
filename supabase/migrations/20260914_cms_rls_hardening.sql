-- Harden CMS RLS: staff-only writes, no anon form inserts, freeze self-role updates.
-- Apply on the production Supabase project together with the app deploy.

create or replace function public.is_active_cms_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cms_user_profiles
    where id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.cms_has_role(allowed text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cms_user_profiles
    where id = auth.uid()
      and status = 'active'
      and role = any (allowed)
  );
$$;

revoke all on function public.is_active_cms_user() from public;
revoke all on function public.cms_has_role(text[]) from public;
grant execute on function public.is_active_cms_user() to authenticated;
grant execute on function public.cms_has_role(text[]) to authenticated;

-- Documents
drop policy if exists "Authenticated manage cms documents" on public.cms_documents;
create policy "Staff manage cms documents"
  on public.cms_documents for all
  to authenticated
  using (public.is_active_cms_user())
  with check (public.is_active_cms_user());

-- Media
drop policy if exists "Authenticated manage media" on public.cms_media;
create policy "Staff manage media"
  on public.cms_media for all
  to authenticated
  using (public.is_active_cms_user())
  with check (public.is_active_cms_user());

-- Settings
drop policy if exists "Authenticated manage settings" on public.cms_settings;
create policy "Staff manage settings"
  on public.cms_settings for all
  to authenticated
  using (public.is_active_cms_user())
  with check (public.is_active_cms_user());

-- Products
drop policy if exists "Authenticated manage products" on public.cms_products;
create policy "Staff manage products"
  on public.cms_products for all
  to authenticated
  using (public.is_active_cms_user())
  with check (public.is_active_cms_user());

-- Forms: no client JWT access. API uses service role.
drop policy if exists "Authenticated manage form submissions" on public.cms_form_submissions;
drop policy if exists "Public insert form submissions" on public.cms_form_submissions;

-- Audit logs
drop policy if exists "Authenticated read audit logs" on public.cms_audit_logs;
drop policy if exists "Authenticated insert audit logs" on public.cms_audit_logs;
create policy "Staff read audit logs"
  on public.cms_audit_logs for select
  to authenticated
  using (public.is_active_cms_user());
create policy "Staff insert audit logs"
  on public.cms_audit_logs for insert
  to authenticated
  with check (public.is_active_cms_user());

-- Map config writes
drop policy if exists "Authenticated update map config" on public.map_locations_config;
drop policy if exists "Authenticated insert map config" on public.map_locations_config;
create policy "Staff update map config"
  on public.map_locations_config for update
  to authenticated
  using (public.is_active_cms_user())
  with check (public.is_active_cms_user());
create policy "Staff insert map config"
  on public.map_locations_config for insert
  to authenticated
  with check (public.is_active_cms_user());

-- Storage writes
drop policy if exists "Authenticated upload cms-media" on storage.objects;
drop policy if exists "Authenticated update cms-media" on storage.objects;
drop policy if exists "Authenticated delete cms-media" on storage.objects;
create policy "Staff upload cms-media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cms-media' and public.is_active_cms_user());
create policy "Staff update cms-media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cms-media' and public.is_active_cms_user())
  with check (bucket_id = 'cms-media' and public.is_active_cms_user());
create policy "Staff delete cms-media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cms-media' and public.is_active_cms_user());

-- Profile: self-insert as viewer only; freeze role/status for self-updates
drop policy if exists "Users insert own profile" on public.cms_user_profiles;
create policy "Users insert own profile"
  on public.cms_user_profiles for insert
  to authenticated
  with check (
    auth.uid() = id
    and role = 'viewer'
    and status = 'active'
  );

drop policy if exists "Users update own profile" on public.cms_user_profiles;
create policy "Users update own profile"
  on public.cms_user_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.cms_protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return NEW;
  end if;

  if TG_OP = 'UPDATE' and NEW.id = auth.uid() then
    if (NEW.role is distinct from OLD.role)
      or (NEW.status is distinct from OLD.status) then
      if not public.cms_has_role(array['super_admin', 'admin']) then
        NEW.role := OLD.role;
        NEW.status := OLD.status;
      end if;
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_cms_protect_profile_columns on public.cms_user_profiles;
create trigger trg_cms_protect_profile_columns
before update on public.cms_user_profiles
for each row
execute function public.cms_protect_profile_columns();

-- Lock the bootstrap RPC to service role only (if the function exists)
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'ensure_cms_super_admin'
  ) then
    revoke all on function public.ensure_cms_super_admin() from public;
    revoke all on function public.ensure_cms_super_admin() from authenticated;
    grant execute on function public.ensure_cms_super_admin() to service_role;
  end if;
end $$;
