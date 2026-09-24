-- Aggregate sellable unit counts for admin products table (parent + color variants).
-- Avoids shipping full color_variants JSON to the app for stats-only reads.

create or replace function public.cms_product_unit_stats()
returns table (
  total bigint,
  active bigint,
  draft bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(
      sum(1 + coalesce(jsonb_array_length(color_variants), 0)),
      0
    )::bigint as total,
    coalesce(
      sum(1 + coalesce(jsonb_array_length(color_variants), 0))
        filter (where status = 'published'),
      0
    )::bigint as active,
    coalesce(
      sum(1 + coalesce(jsonb_array_length(color_variants), 0))
        filter (where status is distinct from 'published'),
      0
    )::bigint as draft
  from public.cms_products
  where deleted_at is null
    and status is distinct from 'archived';
$$;

revoke all on function public.cms_product_unit_stats() from public;
grant execute on function public.cms_product_unit_stats() to authenticated;
grant execute on function public.cms_product_unit_stats() to service_role;
