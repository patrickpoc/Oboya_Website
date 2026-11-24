-- Product listing boost (0–100, default 0). Idempotent.
begin;
set local lock_timeout = '5s';

alter table public.cms_products
  add column if not exists boost integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cms_products_boost_check'
      and conrelid = 'public.cms_products'::regclass
  ) then
    alter table public.cms_products
      add constraint cms_products_boost_check check (boost between 0 and 100);
  end if;
end
$$;

commit;
