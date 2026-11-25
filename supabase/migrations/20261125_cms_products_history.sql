-- Change history for public.cms_products, filled by trigger (covers SQL editor and service role).
-- Retention: automatic, 180 days, via public.cms_products_history_purge() called daily by /api/cron/purge-product-history.
-- Read (SQL editor / service role):
--   select h.changed_at, h.op, h.product_id, h.sku, h.changed_columns, h.old_values, h.new_values,
--          coalesce(u.email, case when h.jwt_role is null then 'SQL editor (' || h.db_session_user || ')' else h.jwt_role end) as actor,
--          h.tx_id
--   from public.cms_products_history h left join auth.users u on u.id = h.actor_uid
--   where h.product_id = 'X' or h.sku = 'X' order by h.changed_at desc, h.id desc limit 100;
-- Idempotent.
begin;
set local lock_timeout = '5s';

create table if not exists public.cms_products_history (
  id bigint generated always as identity primary key,
  product_id text not null,
  sku text,
  op text not null check (op in ('UPDATE', 'DELETE')),
  changed_columns text[] not null,
  old_values jsonb,
  new_values jsonb,
  actor_uid uuid,
  jwt_role text,
  db_session_user text,
  tx_id bigint default txid_current(),
  changed_at timestamptz not null default now()
);

create index if not exists cms_products_history_product_idx
  on public.cms_products_history (product_id, changed_at desc);
create index if not exists cms_products_history_changed_at_idx
  on public.cms_products_history (changed_at desc);
create index if not exists cms_products_updated_at_id_idx
  on public.cms_products (updated_at desc, id);

create or replace function public.cms_products_record_history()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  o jsonb;
  n jsonb;
  k text;
  cols text[] := '{}';
  old_v jsonb := '{}'::jsonb;
  new_v jsonb := '{}'::jsonb;
begin
  o := to_jsonb(old);
    if o ? 'description' then
      o := jsonb_set(o, '{description}', jsonb_build_object(
        'md5', md5(o->>'description'), 'len', length(o->>'description')));
    end if;

    if tg_op = 'UPDATE' then
      n := to_jsonb(new);
      if n ? 'description' then
        n := jsonb_set(n, '{description}', jsonb_build_object(
          'md5', md5(n->>'description'), 'len', length(n->>'description')));
      end if;
      for k in select key from jsonb_each(n) loop
        if k <> 'updated_at' and (o->k) is distinct from (n->k) then
          cols := cols || k;
          old_v := old_v || jsonb_build_object(k, o->k);
          new_v := new_v || jsonb_build_object(k, n->k);
        end if;
      end loop;
      if cardinality(cols) = 0 then
        return null;
      end if;
    end if;

    insert into public.cms_products_history (
      product_id, sku, op, changed_columns, old_values, new_values,
      actor_uid, jwt_role, db_session_user
    ) values (
      old.id, old.sku, tg_op, cols,
      case when tg_op = 'UPDATE' then old_v else o end,
      case when tg_op = 'UPDATE' then new_v else null end,
      auth.uid(),
      case when coalesce(current_setting('request.jwt.claims', true), '') ~ '^\s*\{'
        then current_setting('request.jwt.claims', true)::jsonb ->> 'role' end,
      session_user
    );
  return null;
end;
$$;

revoke all on function public.cms_products_record_history() from public, anon, authenticated;

drop trigger if exists cms_products_history_update on public.cms_products;
create trigger cms_products_history_update
  after update on public.cms_products
  for each row
  execute function public.cms_products_record_history();

drop trigger if exists cms_products_history_delete on public.cms_products;
create trigger cms_products_history_delete
  after delete on public.cms_products
  for each row
  execute function public.cms_products_record_history();

alter table public.cms_products_history enable row level security;
revoke all on public.cms_products_history from anon, authenticated, public;
grant select on public.cms_products_history to authenticated;
revoke insert, update, delete, truncate on public.cms_products_history from service_role;

drop policy if exists cms_products_history_select on public.cms_products_history;
create policy cms_products_history_select on public.cms_products_history
  for select to authenticated
  using (public.cms_has_role(array['super_admin', 'admin']));

create or replace function public.cms_products_history_purge(retention_days int default 180)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  removed int;
begin
  delete from public.cms_products_history
  where changed_at < now() - make_interval(days => least(greatest(coalesce(retention_days, 180), 30), 3650));
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.cms_products_history_purge(int) from public, anon, authenticated;
grant execute on function public.cms_products_history_purge(int) to service_role;

commit;
