-- Default / standard product color (first swatch when additional colors exist).

alter table public.cms_products
  add column if not exists default_color text not null default '';

alter table public.cms_products
  add column if not exists default_color_name jsonb not null default '{"en":"","pt-BR":"","es":"","zh-CN":""}'::jsonb;
