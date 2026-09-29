-- Maker-checker approval workflow: held CMS changes awaiting a manager decision.

create table if not exists public.cms_change_requests (
  id uuid primary key default gen_random_uuid(),
  change_type text not null,
  module text not null,
  entity_type text not null,
  entity_id text not null,
  entity_label text not null default '',
  action text not null,
  requested_by uuid,
  requested_by_name text not null default '',
  requested_at timestamptz not null default now(),
  payload_proposed jsonb not null default '{}'::jsonb,
  snapshot_before jsonb,
  diff jsonb not null default '{}'::jsonb,
  summary text not null default '',
  status text not null default 'pending',
  reviewer_id uuid,
  reviewer_name text,
  reviewed_at timestamptz,
  review_comment text,
  in_review_by uuid,
  in_review_by_name text,
  applied_at timestamptz,
  apply_error text,
  updated_at timestamptz not null default now()
);

create index if not exists cms_change_requests_status_idx
  on public.cms_change_requests (status);
create index if not exists cms_change_requests_entity_idx
  on public.cms_change_requests (entity_type, entity_id);
create index if not exists cms_change_requests_requested_by_idx
  on public.cms_change_requests (requested_by);

alter table public.cms_change_requests enable row level security;

drop policy if exists "Staff manage change requests" on public.cms_change_requests;
create policy "Staff manage change requests"
  on public.cms_change_requests for all
  to authenticated
  using (public.is_active_cms_user())
  with check (public.is_active_cms_user());
