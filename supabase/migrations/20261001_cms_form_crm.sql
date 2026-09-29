-- Lead handling (CRM) for form submissions: ownership, tags, priority,
-- unread tracking and an activity timeline (notes, status changes, replies).

alter table public.cms_form_submissions
  add column if not exists assignee_id text,
  add column if not exists assignee_name text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists priority text not null default 'normal',
  add column if not exists read_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists last_activity_at timestamptz;

-- Legacy "read" becomes "in_progress"; the read timestamp keeps unread state.
update public.cms_form_submissions
  set status = 'in_progress',
      read_at = coalesce(read_at, created_at)
  where status = 'read';

update public.cms_form_submissions
  set read_at = coalesce(read_at, created_at)
  where status in ('replied', 'archived') and read_at is null;

create index if not exists cms_form_submissions_type_status_idx
  on public.cms_form_submissions (type, status, created_at desc);

create index if not exists cms_form_submissions_assignee_idx
  on public.cms_form_submissions (assignee_id)
  where assignee_id is not null;

create index if not exists cms_form_submissions_email_idx
  on public.cms_form_submissions ((lower(data->>'email')));

create table if not exists public.cms_form_activities (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.cms_form_submissions(id) on delete cascade,
  kind text not null,
  body text,
  meta jsonb not null default '{}'::jsonb,
  actor_id text,
  actor_name text,
  created_at timestamptz not null default now()
);

create index if not exists cms_form_activities_submission_idx
  on public.cms_form_activities (submission_id, created_at desc);

-- Same model as cms_form_submissions: no client JWT access, the admin API
-- reads/writes through the service role after cmsGuard checks.
alter table public.cms_form_activities enable row level security;
