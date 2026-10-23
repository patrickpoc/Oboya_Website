-- Careers module: job openings, applications (with private CV storage) and
-- activity timeline, plus the built-in "recruiter" role seed.
-- Idempotent: safe to paste into the Supabase SQL Editor and re-run.
--
-- Access model (same as cms_form_submissions / 20260914_cms_rls_hardening.sql):
-- RLS is ON with NO anon/authenticated policies. Only the service role (admin
-- API after cmsGuard) can read or write these tables and the careers-cv bucket.

-- ── 1. Generic updated_at trigger function ──────────────────────────────────

create or replace function public.cms_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 2. Job openings ─────────────────────────────────────────────────────────

create table if not exists public.cms_job_openings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  responsibilities jsonb not null default '{}'::jsonb,
  requirements jsonb not null default '{}'::jsonb,
  nice_to_have jsonb not null default '{}'::jsonb,
  benefits jsonb not null default '{}'::jsonb,
  department text,
  country_code char(2),
  city text,
  work_model text check (work_model in ('onsite', 'hybrid', 'remote')),
  employment_type text check (employment_type in
    ('full_time', 'part_time', 'contract', 'temporary', 'internship', 'apprenticeship')),
  seniority text check (seniority in
    ('intern', 'junior', 'mid', 'senior', 'lead', 'manager', 'director', 'executive')),
  positions int not null default 1 check (positions >= 1),
  salary_min numeric(12, 2),
  salary_max numeric(12, 2),
  salary_currency char(3),
  salary_period text check (salary_period in ('hour', 'month', 'year')),
  show_salary boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'closed', 'archived')),
  publish_at timestamptz,
  close_at timestamptz,
  published_at timestamptz,
  closed_at timestamptz,
  hiring_manager_id text,
  hiring_manager_name text,
  recruiter_id text,
  recruiter_name text,
  seo jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_job_openings_salary_range_chk
    check (salary_min is null or salary_max is null or salary_max >= salary_min),
  constraint cms_job_openings_dates_chk
    check (publish_at is null or close_at is null or close_at > publish_at)
);

create index if not exists cms_job_openings_status_idx
  on public.cms_job_openings (status, updated_at desc);
create index if not exists cms_job_openings_department_idx
  on public.cms_job_openings (department);
create index if not exists cms_job_openings_country_idx
  on public.cms_job_openings (country_code);

drop trigger if exists cms_job_openings_touch_updated_at on public.cms_job_openings;
create trigger cms_job_openings_touch_updated_at
  before update on public.cms_job_openings
  for each row execute function public.cms_touch_updated_at();

-- ── 3. Job applications ─────────────────────────────────────────────────────

create table if not exists public.cms_job_applications (
  id uuid primary key default gen_random_uuid(),
  -- null opening_id = spontaneous application / talent pool
  opening_id uuid references public.cms_job_openings(id) on delete restrict,

  full_name text not null,
  email text not null,
  phone text,
  country_code char(2),
  city text,
  linkedin_url text,
  portfolio_url text,
  current_company text,
  current_title text,

  years_experience numeric(4, 1) check (years_experience between 0 and 70),

  salary_expectation numeric(12, 2),
  salary_currency char(3),
  salary_period text check (salary_period in ('hour', 'month', 'year')),

  availability_date date,
  notice_period_days int check (notice_period_days >= 0),

  work_authorization text check (work_authorization in
    ('citizen', 'permanent_resident', 'work_visa', 'needs_sponsorship', 'other')),
  willing_to_relocate boolean,
  remote_preference text check (remote_preference in ('onsite', 'hybrid', 'remote')),

  -- [{ "code": "en", "level": "A1".."C2" | "native" }]
  languages jsonb not null default '[]'::jsonb,

  cover_letter text,
  source text check (source in
    ('website', 'linkedin', 'referral', 'job_board', 'agency', 'event', 'manual', 'other')),
  source_detail text,
  referrer_name text,
  locale text,

  consent_privacy boolean not null check (consent_privacy),
  consent_privacy_at timestamptz not null default now(),
  consent_version text,
  consent_talent_pool boolean not null default false,

  cv_path text,
  cv_filename text,
  cv_mime text,
  cv_size int,

  status text not null default 'new'
    check (status in ('new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')),
  rating smallint check (rating between 1 and 5),
  tags text[] not null default '{}',
  assignee_id text,
  assignee_name text,
  rejection_reason text,

  read_at timestamptz,
  last_activity_at timestamptz,
  anonymized_at timestamptz,

  -- custom answers for the future public apply form
  extra jsonb not null default '{}'::jsonb,

  created_by text, -- null = public submission
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_job_applications_opening_idx
  on public.cms_job_applications (opening_id, status, created_at desc);
create index if not exists cms_job_applications_status_idx
  on public.cms_job_applications (status, created_at desc);
create index if not exists cms_job_applications_email_idx
  on public.cms_job_applications ((lower(email)));

drop trigger if exists cms_job_applications_touch_updated_at on public.cms_job_applications;
create trigger cms_job_applications_touch_updated_at
  before update on public.cms_job_applications
  for each row execute function public.cms_touch_updated_at();

-- ── 4. Application activity timeline ────────────────────────────────────────

create table if not exists public.cms_job_application_activities (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null
    references public.cms_job_applications(id) on delete cascade,
  kind text not null check (kind in
    ('created', 'note', 'status_change', 'rating', 'cv_uploaded', 'cv_removed', 'updated', 'anonymized')),
  body text,
  meta jsonb not null default '{}'::jsonb,
  actor_id text,
  actor_name text,
  created_at timestamptz not null default now()
);

create index if not exists cms_job_application_activities_app_idx
  on public.cms_job_application_activities (application_id, created_at desc);

-- ── 5. Per-opening stats view ───────────────────────────────────────────────

create or replace view public.cms_job_opening_stats
with (security_invoker = true) as
select
  opening_id,
  count(*)::int as total,
  count(*) filter (where status = 'new')::int as new_count,
  count(*) filter (where status = 'screening')::int as screening_count,
  count(*) filter (where status = 'interview')::int as interview_count,
  count(*) filter (where status = 'offer')::int as offer_count,
  count(*) filter (where status = 'hired')::int as hired_count,
  count(*) filter (where status = 'rejected')::int as rejected_count,
  count(*) filter (where status = 'withdrawn')::int as withdrawn_count,
  max(created_at) as last_applied_at
from public.cms_job_applications
where opening_id is not null
group by opening_id;

-- ── 6. RLS: on, no client policies (service role is the only path) ──────────

alter table public.cms_job_openings enable row level security;
alter table public.cms_job_applications enable row level security;
alter table public.cms_job_application_activities enable row level security;

revoke all on table public.cms_job_openings from anon, authenticated;
revoke all on table public.cms_job_applications from anon, authenticated;
revoke all on table public.cms_job_application_activities from anon, authenticated;
revoke all on table public.cms_job_opening_stats from anon, authenticated;

-- ── 7. Private CV bucket ────────────────────────────────────────────────────
-- No storage.objects policies: uploads and downloads use signed URLs issued by
-- the admin API with the service role.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'careers-cv',
  'careers-cv',
  false,
  10485760, -- 10MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Drop any policy on storage.objects that targets this bucket.
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (coalesce(qual, '') like '%careers-cv%' or coalesce(with_check, '') like '%careers-cv%')
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end
$$;

-- ── 8. Recruiter role seed (only if the access-control doc already exists) ──

update public.cms_documents
set data = jsonb_set(
      jsonb_set(
        data,
        '{roles}',
        coalesce(data->'roles', '[]'::jsonb) || jsonb_build_array(
          jsonb_build_object(
            'id', 'recruiter',
            'label', 'Recruiter',
            'system', true,
            'active', true,
            'sortOrder', jsonb_array_length(coalesce(data->'roles', '[]'::jsonb))
          )
        )
      ),
      '{matrix,recruiter}',
      jsonb_build_object(
        'dashboard', jsonb_build_array('view'),
        'website', 'none',
        'marketplace', 'none',
        'global_presence', 'none',
        'case_studies', 'none',
        'blog', 'none',
        'careers', jsonb_build_array('view', 'create', 'edit', 'publish'),
        'media', 'none',
        'forms', 'none',
        'users', 'none',
        'settings', 'none',
        'analytics', 'none',
        'audit_logs', 'none'
      ),
      true
    ),
    updated_at = now()
where id = 'cms-access-control'
  and not exists (
    select 1
    from jsonb_array_elements(coalesce(data->'roles', '[]'::jsonb)) r
    where r->>'id' = 'recruiter'
  );

-- ── 9. Verification (run after; safe to re-run this whole file) ─────────────
-- select relname, relrowsecurity from pg_class
--   where relname in ('cms_job_openings','cms_job_applications','cms_job_application_activities');
-- select public, file_size_limit from storage.buckets where id = 'careers-cv';
-- select data->'matrix'->'recruiter' from public.cms_documents where id = 'cms-access-control';
