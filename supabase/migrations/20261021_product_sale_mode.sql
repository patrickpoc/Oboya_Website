-- Sale mode: 'stock' = priced, add-to-cart; 'quote' = no price shown, request-a-quote only.

alter table public.cms_products
  add column if not exists sale_mode text not null default 'stock';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cms_products_sale_mode_check'
      and conrelid = 'public.cms_products'::regclass
  ) then
    alter table public.cms_products
      add constraint cms_products_sale_mode_check
      check (sale_mode in ('stock', 'quote'));
  end if;
end
$$;
