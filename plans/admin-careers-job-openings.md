# Admin Careers: Job Openings, Applications (with CV upload) and Recruiter role

- status: done
- requested: 2026-10-20 · by: Patrick Oliveira

## Goal
Replace the two `ComingSoon` placeholders under `/admin/careers` with a full ATS-lite module. This covers openings CRUD with localized content, a status lifecycle, duplicate, close/reopen, archive/delete and per-opening application counts. It also covers an applications pipeline with complete candidate data, a CV upload to a private Supabase bucket (signed URLs), notes, rating and an activity timeline. A new built-in **Recruiter** role gets only Dashboard and Careers. All DB work ships as one idempotent migration that the user can paste into the Supabase SQL Editor. The schema is ready for a later public "apply" form, but this plan does not build that form.

## Design decisions (from codebase reading)
- **Storage model.** Relational tables, not `cms_documents` JSON (blog/case studies use JSON). Applications are PII and need filters, counts and FKs. Locally, use a JSON fallback in `data/cms/careers-*.json` when Supabase is not configured, the same way `forms.server.ts` does it.
- **Access model.** Follow `cms_form_submissions` / `20260914_cms_rls_hardening.sql`. RLS is ON with **no** `anon`/`authenticated` policies. All reads and writes go through `src/app/api/cms/careers/**` after `cmsGuard("careers", action)`, using the service role. The future public form will also use a server route with the service role plus a server-issued signed upload URL. No anon table or storage policy is needed, so we keep the "no anon inserts" hardening.
- **Enums.** Use `text` + `CHECK` constraints, not PG enums. This matches existing tables (`status text`) and makes later changes a simple `ALTER`.
- **Roles.** `cms_user_profiles.role` is free text, and the matrix lives in `cms_documents` id `cms-access-control`. `normalizeDoc()` in `access-control.server.ts` already auto-adds missing built-in roles and matrix rows. So the app change is enough: add `recruiter` to `SYSTEM_ROLE_IDS` + `BUILTIN_MATRIX`. The migration also seeds the stored doc idempotently so the Roles page shows it before anyone saves.
- **Localization.** Opening content fields are `LocalizedString` jsonb, edited with `LocaleFieldTabs` + `RichTextEditor`, the same as blog. Application data is not localized. The candidate's `locale` is stored.
- **Approvals.** Opening create/edit/status-changes go through `submitOrApply` with `careers.upsert`, and delete goes through `careers.delete`. Both are flipped to `available: true` and get appliers, mirroring blog. The default policy is `requiresApproval: false`, so nothing changes until a Super Admin enables it. Applications are **not** gated, same as forms/CRM (operational PII).
- **Recruiter matrix row.**
  - `dashboard: ["view"]`
  - `careers: ["view","create","edit","publish"]`
  - every other module: `"none"`
  - Profile and change-password are already ungated (`admin-path-module.ts`).
  - Tier: `analyst`. Order: after `hr_analyst`, before `viewer`.
  - No `delete` by default (see Open questions).
- **Delete semantics.**
  - An opening with applications cannot be hard-deleted (FK `on delete restrict` → API 409). The UI offers Archive instead.
  - Deleting or anonymizing an application also removes its CV object.
- **CV upload.** Direct-to-storage via `createSignedUploadUrl`, as in `media-upload.server.ts`, which avoids the Vercel 4 MB body limit.
  - Bucket: `careers-cv`, private, 10 MB, `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
  - Object path: `applications/<applicationId>/cv-<uuid>.<pdf|doc|docx>`, validated by regex on the server.
  - After upload, the server checks object size/mime with storage metadata before saving `cv_*` columns.
  - Download: signed URL with 60 s TTL from an API route, `noStoreHeaders`.
- **Next.js 16.** Route handler `context.params` is a `Promise` (see `src/app/api/cms/forms/[id]/activities/route.ts`). Builders must check `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` before writing routes.

## Schema (`supabase/migrations/20261020_cms_careers.sql`)
Everything is idempotent (`create ... if not exists`, `drop policy if exists`, `on conflict`), safe to re-run, and runnable as-is in the Supabase SQL Editor.

1. **Function `public.cms_touch_updated_at()`**: generic `before update` trigger function that sets `updated_at = now()`. Create with `create or replace`, `set search_path = public`.
2. **`public.cms_job_openings`**
   - `id uuid pk default gen_random_uuid()`
   - `slug text not null unique`
   - Localized jsonb, default `'{}'`: `title` (not null), `summary`, `description`, `responsibilities`, `requirements`, `nice_to_have`, `benefits`
   - `department text`, `country_code char(2)`, `city text`
   - `work_model` check in (`onsite`,`hybrid`,`remote`)
   - `employment_type` check in (`full_time`,`part_time`,`contract`,`temporary`,`internship`,`apprenticeship`)
   - `seniority` check in (`intern`,`junior`,`mid`,`senior`,`lead`,`manager`,`director`,`executive`)
   - `positions int not null default 1 check (positions >= 1)`
   - Salary: `salary_min numeric(12,2)`, `salary_max numeric(12,2)`, `salary_currency char(3)`, `salary_period` check in (`hour`,`month`,`year`), `show_salary boolean not null default false`
   - `status text not null default 'draft'` check in (`draft`,`published`,`closed`,`archived`)
   - Dates: `publish_at`, `close_at`, `published_at`, `closed_at` (all timestamptz)
   - Owners: `hiring_manager_id text`, `hiring_manager_name text`, `recruiter_id text`, `recruiter_name text` (text ids, same as `cms_form_submissions.assignee_id`)
   - `seo jsonb default '{}'`, `created_by text`, `updated_by text`, `created_at`, `updated_at`
   - Checks: `salary_max >= salary_min` when both are set; `close_at > publish_at` when both are set
   - Indexes: `(status, updated_at desc)`, `(department)`, `(country_code)`
   - Trigger: `updated_at`
3. **`public.cms_job_applications`**
   - Keys and link: `id uuid pk`, `opening_id uuid null references cms_job_openings(id) on delete restrict` (null = spontaneous/talent pool)
   - Candidate: `full_name text not null`, `email text not null`, `phone`, `country_code char(2)`, `city`, `linkedin_url`, `portfolio_url`, `current_company`, `current_title`
   - Experience: `years_experience numeric(4,1) check 0..70`
   - Salary expectation: `salary_expectation numeric(12,2)`, `salary_currency char(3)`, `salary_period` (same check as openings)
   - Availability: `availability_date date`, `notice_period_days int check >= 0`
   - Work status: `work_authorization` check in (`citizen`,`permanent_resident`,`work_visa`,`needs_sponsorship`,`other`), `willing_to_relocate boolean`, `remote_preference` (same values as `work_model`)
   - `languages jsonb not null default '[]'` (`[{code, level}]`, level in A1..C2/native)
   - Message and source: `cover_letter text`, `source` check in (`website`,`linkedin`,`referral`,`job_board`,`agency`,`event`,`manual`,`other`), `source_detail text`, `referrer_name text`, `locale text`
   - Consent: `consent_privacy boolean not null check (consent_privacy)`, `consent_privacy_at timestamptz not null default now()`, `consent_version text`, `consent_talent_pool boolean not null default false`
   - CV: `cv_path text`, `cv_filename text`, `cv_mime text`, `cv_size int`
   - Pipeline: `status text not null default 'new'` check in (`new`,`screening`,`interview`,`offer`,`hired`,`rejected`,`withdrawn`), `rating smallint check 1..5`, `tags text[] not null default '{}'`, `assignee_id text`, `assignee_name text`, `rejection_reason text`
   - Tracking: `read_at`, `last_activity_at`, `anonymized_at` (timestamptz)
   - `extra jsonb not null default '{}'` (custom answers for the future public form)
   - Audit: `created_by text` (null = public), `created_at`, `updated_at`
   - Indexes: `(opening_id, status, created_at desc)`, `(status, created_at desc)`, `(lower(email))`
   - Trigger: `updated_at`
4. **`public.cms_job_application_activities`**
   - `id uuid pk`, `application_id uuid not null references cms_job_applications(id) on delete cascade`
   - `kind` check in (`created`,`note`,`status_change`,`rating`,`cv_uploaded`,`cv_removed`,`updated`,`anonymized`)
   - `body text`, `meta jsonb default '{}'`, `actor_id text`, `actor_name text`, `created_at`
   - Index: `(application_id, created_at desc)`
5. **View `public.cms_job_opening_stats`** (`with (security_invoker = true)`): `opening_id`, `total`, one count column per pipeline status, `last_applied_at`.
6. **RLS.** `enable row level security` on all 3 tables, with no client policies (comment that the service role is the only path). `revoke all on table ... from anon, authenticated` on all 3 tables and the view.
7. **Storage.** Insert into `storage.buckets` id `careers-cv`, `public = false`, `file_size_limit = 10485760`, the 3 MIME types, `on conflict (id) do update`. No `storage.objects` policies for this bucket. Add a comment explaining that signed URLs come from the service role. Also drop any `careers-cv` policies if they exist.
8. **Recruiter seed.** If the `cms_documents` row `cms-access-control` exists and has no role `recruiter`:
   - append `{id:"recruiter",label:"Recruiter",system:true,active:true,sortOrder:<len>}` to `data->'roles'`
   - set `data->'matrix'->'recruiter'` to the matrix row above
   - bump `updated_at`
   - If the row does not exist, do nothing (the app's builtin defaults apply).
9. Footer comment: verification queries (see AC) and a note that the file is safe to re-run.

## Tasks
| # | Task | Agent | Files | parallel |
|---|------|-------|-------|----------|
| 1 | Write the migration exactly as in **Schema** above. No edits to old migrations. | builder-admin (triggers security-reviewer) | `supabase/migrations/20261020_cms_careers.sql` | yes (with 2, 3) |
| 2 | Careers domain lib (pure, client-safe). (a) Types: `JobOpening`, `JobApplication`, `JobApplicationActivity`, status/option constant arrays mirroring the SQL checks. (b) Validation: `normalizeOpening`, `validateOpening` (title.en required, slug via `slugify`, salary range, dates, positions), `normalizeApplication`, `validateApplication` (name, email, consent, URLs, years range), `validateCvFile(mime,size)`, `isValidCvObjectPath`, `CV_MAX_BYTES`, `CV_MIME_TYPES`. (c) Lifecycle: `nextOpeningStatus(action)` for close/reopen/archive/publish, `duplicateOpening` (new id, `-copy` slug, status draft, cleared dates). (d) Filters: `matchesOpeningFilters`, `matchesApplicationFilters`, `countByPipelineStatus`, `applicationsToCsv`. (e) Vitest tests, same style as `forms/__tests__/crm.test.ts`. | builder-admin | `src/lib/cms/careers/{types,validation,lifecycle,filters}.ts`, `src/lib/cms/careers/__tests__/{validation,lifecycle,filters}.test.ts` | yes (with 1, 3) |
| 3 | Recruiter role. Add `"recruiter"` to `SYSTEM_ROLE_IDS` (before `viewer`). Add label, `BUILTIN_MATRIX.recruiter`, `BUILTIN_ROLE_TIER.recruiter = "analyst"`. Add the role to the local `data/cms/cms-access-control.json` (role + matrix row). Add i18n keys `admin.roles.recruiter` and `admin.rolesPage.roleShort.recruiter`. Add tests: recruiter can view/create/edit/publish careers, cannot delete careers, cannot view forms/users/marketplace/media/settings; `normalizeDoc` adds recruiter to an old stored doc (pure part via `buildDefaultAccessControlDoc`). | builder-admin | `src/lib/cms/types/index.ts`, `src/lib/cms/permissions/defaults.ts`, `data/cms/cms-access-control.json`, `messages/en/admin.json`, `src/lib/cms/permissions/__tests__/recruiter.test.ts` | yes (with 1, 2) |
| 4 | Server layer + API. **Server files:** (a) `careers-openings.server.ts`: list with stats join, get, upsert (sets published_at/closed_at on transitions, unique-slug check), delete (409 when applications exist), local JSON fallback. (b) `careers-applications.server.ts`: list with filters, get, create (`source='manual'`, `created_by`), patch (status/rating/notes/fields; logs activities), delete (removes CV), anonymize (nulls PII + CV, sets `anonymized_at`), activities, local JSON fallback. (c) `careers-cv.server.ts`: bucket const, `createCvUploadUrl`, `verifyCvObject`, `createCvDownloadUrl` (60 s), `removeCvObject`. All server files require the service role on hosted (`isServiceRoleConfigured`), else 503. **Routes:** openings `GET`/`POST` (body `action`: `upsert`, `duplicate`, `close`, `reopen`, `archive`, `publish`, all via `submitOrApply("careers.upsert")`) and `DELETE` (`careers.delete`); `openings/[id]` GET; applications GET (`?opening=&status=&q=&source=`), POST (create); `applications/[id]` GET/PATCH/DELETE (`careers` `view`/`edit`/`delete`), POST `{action:"anonymize"}` (`delete`); `applications/[id]/activities` GET/POST; `applications/[id]/cv` POST (signed upload URL, `edit`), PUT (confirm + verify + save metadata), GET (signed download URL, `view`), DELETE (`edit`); `applications/export` GET CSV (`view`). All with `noStoreHeaders`, `dynamic = "force-dynamic"`. **Approvals:** set `careers.upsert`/`careers.delete` to `available: true`; add appliers + `currentVsProposed` cases mirroring blog. | builder-admin (triggers security-reviewer: `src/app/api/**`) | `src/lib/cms/server/careers-{openings,applications,cv}.server.ts`, `src/app/api/cms/careers/openings/route.ts`, `src/app/api/cms/careers/openings/[id]/route.ts`, `src/app/api/cms/careers/applications/route.ts`, `src/app/api/cms/careers/applications/[id]/route.ts`, `src/app/api/cms/careers/applications/[id]/activities/route.ts`, `src/app/api/cms/careers/applications/[id]/cv/route.ts`, `src/app/api/cms/careers/applications/export/route.ts`, `src/lib/cms/approvals/change-types.ts`, `src/lib/cms/server/approval-appliers.server.ts`, `data/cms/careers-openings.json`, `data/cms/careers-applications.json` | no (after 1, 2) |
| 5 | Openings UI. **List page:** search; filters (status, department, country, work model); status pills; columns incl. application count linking to `/admin/careers/applications?opening=<id>`; row actions (edit, duplicate, close/reopen, archive, delete), each hidden or disabled via `<Can>` per action; confirm dialogs; empty state; `PendingChangeBanner` / `usePendingApprovalNotice` when an approval is pending. **Editor** `[id]` (`new` = create): sections Basics, Location & model, Content (LocaleFieldTabs + RichTextEditor per rich field), Compensation, Publishing (status, publish/close dates, positions), Ownership (hiring manager / recruiter select from CMS users with careers access); unsaved-changes guard; client validation from Task 2. Reuse `FilterBar`, `StatusPill`, `AdminPageHeader`, `EditorGuard`. Only consume `RichTextEditor.tsx`, do not edit it. | builder-admin | `src/app/admin/(dashboard)/careers/openings/page.tsx`, `src/app/admin/(dashboard)/careers/openings/[id]/page.tsx`, `src/components/admin/careers/{OpeningsTable,OpeningForm,OpeningStatusPill,OpeningRowActions}.tsx`, `src/components/admin/careers/api.ts`, `messages/en/admin.json` | no (after 3, 4; owns `admin.json` while running) |
| 6 | Applications UI. **List page:** filters (opening, status, source; `?opening=` prefill), search name/email, pipeline counts tabs, columns, CSV export button, "New application". **Detail** `[id]` (`new` = manual create): every candidate field from the Schema, grouped Candidate / Professional / Preferences / Consent (manual create requires a "candidate gave consent" checkbox + version) / CV / Pipeline (status select, rating 1-5, assignee, rejection reason) / Notes and activity timeline. **CV field:** client-side type/size check, then signed upload, then confirm; download via signed URL; replace/remove. Danger zone: anonymize, delete. Duplicate-email warning (same opening). | builder-admin | `src/app/admin/(dashboard)/careers/applications/page.tsx`, `src/app/admin/(dashboard)/careers/applications/[id]/page.tsx`, `src/components/admin/careers/{ApplicationsTable,ApplicationForm,ApplicationPipeline,CvUploadField,ApplicationTimeline}.tsx`, `messages/en/admin.json` | no (after 5: shares `admin.json` and `components/admin/careers/api.ts`) |
| 7 | Mirror the new `admin` keys to `pt-BR`, `es`, `zh-CN`; run `npm run i18n:check`. | i18n | `messages/{pt-BR,es,zh-CN}/admin.json` | no (after 3–6) |
| 8 | Review; security review of migration, API routes, CV storage, PII handling. | reviewer, security-reviewer | read-only | no (after 7) |

## i18n
New/changed keys in `messages/en/admin.json`. The `admin.careers.openings.title|description` and `admin.careers.applications.title|description` keys already exist and are unchanged.

- `admin.roles.recruiter`
- `admin.rolesPage.roleShort.recruiter`
- `admin.careers.common.status.{draft,published,closed,archived}`
- `admin.careers.common.workModel.{onsite,hybrid,remote}`
- `admin.careers.common.employmentType.{full_time,part_time,contract,temporary,internship,apprenticeship}`
- `admin.careers.common.seniority.{intern,junior,mid,senior,lead,manager,director,executive}`
- `admin.careers.common.salaryPeriod.{hour,month,year}`
- `admin.careers.common.pipeline.{new,screening,interview,offer,hired,rejected,withdrawn}`
- `admin.careers.common.source.{website,linkedin,referral,job_board,agency,event,manual,other}`
- `admin.careers.common.workAuthorization.{citizen,permanent_resident,work_visa,needs_sponsorship,other}`
- `admin.careers.common.languageLevel.{A1,A2,B1,B2,C1,C2,native}`
- `admin.careers.common.{save,saving,cancel,back,loadFailed,saveFailed,notFound,pendingApproval}`
- `admin.careers.openings.{newOpening,searchPlaceholder,applicationsCount}` (`applicationsCount` uses `{count, plural, ...}`)
- `admin.careers.openings.filters.{status,department,country,workModel,all}`
- `admin.careers.openings.columns.{title,department,location,workModel,status,applications,publishedAt,updatedAt,actions}`
- `admin.careers.openings.actions.{edit,duplicate,close,reopen,archive,publish,delete,viewApplications}`
- `admin.careers.openings.confirm.{delete,archive,close}` (with `{title}`)
- `admin.careers.openings.toasts.{saved,duplicated,closed,reopened,archived,published,deleted,deleteBlocked}`
- `admin.careers.openings.empty.{title,description}`
- `admin.careers.openings.editor.{titleNew,titleEdit}`
- `admin.careers.openings.editor.sections.{basics,location,content,compensation,publishing,ownership}`
- `admin.careers.openings.editor.fields.{title,slug,department,country,city,workModel,employmentType,seniority,positions,summary,description,responsibilities,requirements,niceToHave,benefits,salaryMin,salaryMax,salaryCurrency,salaryPeriod,showSalary,status,publishAt,closeAt,hiringManager,recruiter}`
- `admin.careers.openings.editor.validation.{titleRequired,slugTaken,salaryRange,closeBeforePublish,positionsMin}`
- `admin.careers.applications.{newApplication,searchPlaceholder,exportCsv,duplicateEmailWarning}`
- `admin.careers.applications.filters.{opening,status,source,allOpenings,allStatuses,allSources,talentPool}`
- `admin.careers.applications.columns.{candidate,opening,status,rating,source,appliedAt}`
- `admin.careers.applications.empty.{title,description}`
- `admin.careers.applications.toasts.{created,updated,deleted,anonymized,cvUploaded,cvRemoved,cvUploadFailed}`
- `admin.careers.applications.confirm.{delete,anonymize,removeCv}` (with `{name}`)
- `admin.careers.applications.detail.{titleNew,titleEdit}`
- `admin.careers.applications.detail.sections.{candidate,professional,preferences,consent,cv,pipeline,notes,dangerZone}`
- `admin.careers.applications.detail.fields.{opening,fullName,email,phone,country,city,linkedinUrl,portfolioUrl,currentCompany,currentTitle,yearsExperience,salaryExpectation,salaryCurrency,salaryPeriod,availabilityDate,noticePeriodDays,workAuthorization,willingToRelocate,remotePreference,languages,addLanguage,coverLetter,source,sourceDetail,referrerName,consentPrivacy,consentVersion,consentAt,consentTalentPool,rating,assignee,rejectionReason,tags}`
- `admin.careers.applications.detail.cv.{upload,replace,download,remove,hint,invalidType,tooLarge,none}`
- `admin.careers.applications.detail.notes.{placeholder,add,empty}`
- `admin.careers.applications.detail.timeline.{created,note,status_change,rating,cv_uploaded,cv_removed,updated,anonymized}`
- `admin.careers.applications.detail.actions.{anonymize,delete}`
- `admin.careers.applications.detail.validation.{nameRequired,emailInvalid,urlInvalid,consentRequired,yearsRange}`

Builders may add keys under these same subtrees and must list them in their report. Keep ICU placeholders identical across locales.

## Acceptance criteria
**Database**
- [ ] `supabase/migrations/20261020_cms_careers.sql` runs without error twice in a row on a fresh project that already has the previous migrations (idempotent).
- [ ] After running it, these all succeed:
  - `select relrowsecurity from pg_class where relname in ('cms_job_openings','cms_job_applications','cms_job_application_activities')` returns 3 × `true`
  - `select public, file_size_limit from storage.buckets where id='careers-cv'` returns `false, 10485760`
  - `select data->'matrix'->'recruiter' from cms_documents where id='cms-access-control'` is non-null (when that row exists)
- [ ] With the anon key or an authenticated user JWT, `select`/`insert` on the 3 tables and `storage.objects` in `careers-cv` is denied or returns 0 rows.
- [ ] Inserting an application with `consent_privacy=false`, `rating=6`, or a status outside the list fails with a check violation.
- [ ] Deleting an opening that has applications fails (FK restrict).

**Permissions**
- [ ] A user with role `recruiter` sees only Dashboard and Careers (Job Openings, Applications) in the sidebar.
- [ ] `/admin/forms`, `/admin/users`, `/admin/marketplace` show Access Denied for a recruiter.
- [ ] As a recruiter, `DELETE` on the careers APIs returns 403.
- [ ] Recruiter appears in Users > role select and in the Roles & Permissions matrix with the defined row.

**Openings**
- [ ] Create a draft with en title only, then publish: `published_at` is set. Close: `closed_at` is set and status is `closed`. Reopen: status is `published`.
- [ ] Duplicate creates a draft whose slug ends in `-copy`, with no dates set. Archive hides the opening from the default "active" filter.
- [ ] Delete works with 0 applications and shows the `deleteBlocked` toast (409) otherwise.
- [ ] A duplicate slug is rejected with `slugTaken`. `salary_max < salary_min` is rejected client-side and server-side.
- [ ] The list shows the correct application count per opening, and the count link opens the applications list pre-filtered.
- [ ] With the `careers.upsert` policy set to requires-approval, an `hr_analyst` edit creates a pending change request and does not change the live row. Approving it applies the change.

**Applications**
- [ ] Manual create with all fields saves and reloads identically. Missing consent, an invalid email, or an invalid URL is rejected.
- [ ] CV: uploading a PDF/DOC/DOCX ≤ 10 MB succeeds. A `.png` or a file > 10 MB is rejected in the client and by the bucket/server. The download link is a signed URL that expires (≈60 s). Replace removes the old object.
- [ ] A status change, a rating and a note each add a timeline entry with actor and time.
- [ ] Anonymize clears name/email/phone/URLs/cover letter/CV (object removed) and sets `anonymized_at`. Delete removes the row and the CV object.
- [ ] The opening/status/source/search filters and the CSV export respect the active filters.

**Checks**
- [ ] New vitest suites pass: `src/lib/cms/careers/__tests__/*`, `src/lib/cms/permissions/__tests__/recruiter.test.ts`.
- [ ] `npm run lint && npm run i18n:check && npm test && npm run build` pass, and `npm run test:e2e` passes (UI changed).
- [ ] The orchestrator's final report gives the user exact DB steps:
  1. Supabase Dashboard > SQL Editor > New query
  2. Paste the full contents of `supabase/migrations/20261020_cms_careers.sql` > Run
  3. Run the verification queries above
  4. Confirm `SUPABASE_SERVICE_ROLE_KEY` is set (server-only) in Vercel for Preview and Production
  5. Deploy
  6. Admin > Users: assign role "Recruiter"
  7. Admin > Access Control > Roles: confirm the Recruiter row

## Risks / notes
- **Security-review triggers.** `supabase/**` (new tables, bucket, cms_documents seed), `src/app/api/cms/careers/**` (new API routes), and the PII/CV storage path. `security-reviewer` must run.
- **PII / LGPD-GDPR.** Applications hold personal data and CVs.
  - Keep `noStoreHeaders` on every careers response.
  - Never log candidate fields.
  - Export is gated by `careers.view`. Consider gating it with `edit` (see Open questions).
  - Signed download URLs must be short-lived and created only after `cmsGuard`.
  - Anonymize/delete must also remove the storage object.
  - No retention job is in scope. A follow-up could add a cron under `src/app/api/cron` to auto-anonymize after N months.
- **Service role is required.** With RLS on and no client policies, careers works on hosted only when `SUPABASE_SERVICE_ROLE_KEY` is set. Without it, the API returns 503. Never prefix it with `NEXT_PUBLIC_`.
- **Upload trust.** Direct-to-storage uploads skip server body parsing. The bucket enforces MIME/size, and the server re-verifies object metadata before attaching it. Supabase has no malware scanning, so note this to the user. CVs are only downloaded, never rendered inline.
- **Approvals coupling.** Flipping `careers.upsert/delete` to `available: true` shows careers on Access Control > Approvals (existing `REQUEST_MODULES` already includes `careers`; `approvals.changeTypes.careers_upsert` label exists). Check that a `careers_delete` label exists; add it under `admin.approvals...` if not, and list it in the Task 5 report.
- **Shared files.** `messages/en/admin.json` is edited by Tasks 3, 5 and 6 in sequence only. `RichTextEditor.tsx` is consumed, not edited. `src/lib/cms/types/index.ts` is touched only by Task 3.
- **Old access-control doc.** Production already has a saved `cms-access-control` doc. `normalizeDoc` adds the recruiter row at read time, and the migration seed persists it. If an admin saves the matrix before the deploy, nothing breaks.
- **Follow-up (out of scope).** Public listing at `/[locale]/work-with-us` and an apply form (builder-site), plus a public API route, e.g. `src/app/api/careers/apply` with rate limit + captcha + honeypot. That route should create the application with the service role and return a signed CV upload URL. The schema already supports it (`source='website'`, `created_by null`, `locale`, `extra`, `consent_*`). No anon RLS or storage policy is needed. Published openings will then need public read helpers and revalidation tags.

## Open questions for the user
1. Should **Recruiter** be able to **delete** openings/applications (needed to fulfil LGPD erasure requests directly), or only archive/anonymize while HR Manager/Admin delete? The default in this plan is no delete. Anonymize also requires `delete` under the current module-level guard, so with the default a recruiter cannot anonymize either.
2. Should **Recruiter** see only openings/applications they own (`recruiter_id`), or all of them? The default is all. Per-owner scoping needs extra server filtering.
3. CV size limit of 10 MB and formats PDF/DOC/DOCX: OK? Should we also accept other attachments (portfolio PDF, cover-letter file), or only one CV per application?

## User decisions (2026-10-20)
- Recruiter: no delete (and therefore no anonymize) on careers — confirmed.
- Recruiter sees all openings and applications — confirmed.
- One CV per application, 10 MB, PDF/DOC/DOCX — confirmed.
