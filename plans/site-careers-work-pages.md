# Public careers pages: `/work`, `/work/[slug]`, apply flow, drawer entry

- status: done
- requested: 2026-10-20 · by: Patrick Oliveira

## Goal
Replace the static `work-with-us` page (hard-coded fake openings plus a spontaneous form that posts to `/api/cms/forms` as `contact`) with a real recruiting site on top of the admin Careers module (`plans/admin-careers-job-openings.md`, done). The site gets:
- `/[locale]/work`: a hero in the Contact-page style, a short "Why Oboya" block, an openings board with a **country** filter (plus keyword, department, work model and type, all synced to the URL), a "how we hire" section and a short FAQ.
- `/[locale]/work/[slug]`: the full opening, with a sticky apply card, share buttons, other openings, metadata and JobPosting JSON-LD.
- `/[locale]/work/[slug]/apply`: a dedicated application step, Gupy-style, with a required CV upload.
- `/[locale]/work/apply`: a talent-pool (spontaneous) application with `opening_id = null`.

Submissions go through a new anonymous API (`/api/careers/apply` + `/confirm`) that writes `cms_job_applications` with the service role. A "Work with us" entry is added to the drawer menu right below "Shop" (drawer only). The old `/work-with-us` URL redirects to `/work`.

## Design decisions (from codebase reading)
- **Routes.** Static segments `src/app/[locale]/work/**` take priority over the catch-all `src/app/[locale]/[...slug]/page.tsx`. Remove `"work-with-us"` from `pageRegistry` (`src/constants/pages.ts`), the `workWithUs` template branch in the catch-all, and the `"workWithUs"` `PageTemplate` member. Delete `src/components/work-with-us/WorkWithUsPageContent.tsx`. `pages.workWithUs.*` messages stay and are reused for titles.
- **Static segment `apply` vs dynamic `[slug]`.** `/work/apply` shadows an opening whose slug is `apply`. Add `RESERVED_OPENING_SLUGS = ["apply"]` to the careers validation so admin rejects that slug (`slugReserved`).
- **Locale prefix.** `localePrefix: "always"` (`src/i18n/routing.ts`). URLs are `/en/work/vaga1`, `/pt-BR/work/vaga1` and so on. A bare `/work/vaga1` is redirected to a locale by the next-intl proxy (`src/proxy.ts`). The `work` path is English in every locale, as the user asked.
- **Old slug redirect.** In `next.config.ts` `redirects()`, add `/${localePattern}/work-with-us` → `/:locale/work` with `permanent: true`, next to the existing shop redirects (docs: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md`). Config redirects run before the proxy. A bare `/work-with-us` gets locale-prefixed by the proxy first and then redirected, which is 2 hops but acceptable. Footer `company` link: change the href to `/work` (the link already exists, so this adds no new placement).
- **Drawer only.** `getMainNavigation()` feeds both the top bar and the drawer (`Navbar.tsx` → `MobileNavSheetContent` / `HeroMenuButton`). So do **not** touch `getMainNavigation`. In `MobileNavSheetContent` (`src/components/layouts/navbar/MobileNav.tsx`), build `drawerItems` by inserting `{ label: t("nav.workWithUs"), href: "/work" }` right after the item whose `href === "/shop"`. If `/shop` is missing, append at the end. This covers every drawer instance: the default, storytelling and home navbars, plus the always-visible `HeroMenuButton` on the homepage.
- **Public data path (server-only, service role).** New `src/lib/cms/server/careers-public.server.ts` (`import "server-only"`):
  - It queries `cms_job_openings` with an **explicit column list**: no `hiring_manager_*`, `recruiter_*`, `created_by`, `updated_by` or `seo` internals, and salary columns only to be dropped later if `show_salary` is false.
  - It filters `.eq("status","published")`. The local JSON fallback works through `careersClient()`.
  - It maps rows to a client-safe DTO through pure functions in `src/lib/cms/careers/public.ts`.
- **Visibility rule.** `isOpeningPublic(o, now)` is true only when all of these hold: `status === "published"`, and (`publishAt` is empty or `<= now`), and (`closeAt` is empty or `> now`). `publish_at` works as an embargo on an already-published row. It **never** auto-publishes a draft. Anything else returns 404, including `closed` and `archived`: the simplest secure option, and Google treats a 404 as "job expired". There is no "closed" banner.
- **DTO `PublicJobOpening`.**
  - Fields: `slug, title, summary, descriptionHtml, responsibilitiesHtml, requirementsHtml, niceToHaveHtml, benefitsHtml, department?, countryCode?, city?, workModel?, employmentType?, seniority?, positions, salary? {min?, max?, currency, period}` (only when `showSalary`), `postedAt` (= `publishedAt ?? createdAt`), `closeAt?`, `updatedAt`.
  - Localized with `pickLocalized(value, locale)`, falling back to `en`.
  - Rich HTML is re-sanitized on read with `sanitizeLocalizedRichHtml` / `sanitize-rich-html.server` (defense in depth; it was already sanitized on save). It is rendered by a **server** component with `dangerouslySetInnerHTML`. The `id`, owners, stats and status are never exposed.
- **Caching / revalidation.**
  - Pages are ISR. Root layout `revalidate = 86400`. `/work` and `/work/[slug]` set `export const revalidate = 3600` (a literal) to bound `publish_at`/`close_at` staleness.
  - `generateStaticParams` on `[slug]` returns public slugs per locale (`dynamicParams` stays true).
  - Reads use React `cache()` so `generateMetadata` and the page share one lookup (same as `readBlogPostBySlug`).
  - On-demand: add `revalidateCareersPages(slugs: string[])` to `src/lib/cms/revalidate-site.ts`. It covers `/${l}/work`, `/${l}/work/${slug}` and `/${l}/work/${slug}/apply` for every locale, plus `/sitemap.xml`.
  - Call it best-effort (try/catch, log the code only) at the end of `saveOpening` (current and previous slug) and `deleteOpening` in `careers-openings.server.ts`. Both the API route and the approval applier (`approval-appliers.server.ts` → `saveOpening`/`deleteOpening`) go through those functions, so one place covers both.
- **Listing filters (client, URL-synced).**
  - The server page reads all public openings for the locale (a small set) and passes the DTOs to a client `OpeningsBoard`.
  - The board reads `useSearchParams()` (`country`, `q`, `department`, `workModel`, `type`) and writes with `router.replace(..., { scroll: false })` from `@/i18n/navigation`.
  - The page must **not** read `searchParams` (that keeps it static). Wrap the board in `<Suspense>`, with a fallback that renders the unfiltered card list server-side for SEO and no-JS (see `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`).
  - Filtering and facets are pure functions in `public.ts`: `filterPublicOpenings` and `countryFacets`, sorted by localized country name with counts.
  - Country names use `Intl.DisplayNames(locale, { type: "region" })`. Flags use `CountryFlag` (`src/components/ui/country-flag.tsx`, consumed only).
  - "Posted X ago" is rendered on the client after mount (`useFormatter().relativeTime`), with the absolute date as SSR text, to avoid ISR/hydration mismatch.
- **Visual structure (Contact page reference: `src/components/contact/ContactPageContent.tsx`).**
  - The listing hero is `bg-oboya-blue-dark`, centered eyebrow + h1 + description, `pb-36`. An overlapping white card (`-mt-20 md:-mt-36`, `shadow-[var(--shadow-card)]`, `rounded-sm`) holds an Indeed-style search bar: keyword input, country select, "Search". Below it come the filter chips row, the result count and the card list. The whole page sits on `bg-oboya-soft-white`.
  - The detail page uses the same dark hero with breadcrumb, title and meta chips. Below it is a 2-column layout: content on the left; on the right, a sticky apply card (`lg:sticky lg:top-28`) with key facts and the CTA. A fixed bottom CTA bar appears on mobile (`lg:hidden`, safe-area padding).
  - The apply page uses the Contact card layout directly: a left `aside` with an opening summary and the "what happens next" steps, and the right form side with `underlineField` controls. It reuses `CountrySelect`, `PhoneCountrySelect`, `CharCount` and `underlineField` from `ContactFieldControls.tsx` (consumed only).
  - Brand tokens only (`oboya-*`).
- **Apply flow (anonymous write path → security-reviewer).** The schema already supports it (`source='website'`, `created_by null`, `locale`, `consent_*`, `extra`). No RLS or storage policy changes, so **no migration**.
  1. The client validates fields and the CV (type/size via `validateCvFile`). It then POSTs `/api/careers/apply` with JSON `{ openingSlug | null, fields…, cv: { name, mime, size }, website: "" (honeypot), startedAt (ms), locale }`.
  2. The server runs these checks in order, then creates the row and the upload URL:
     - 503 if Supabase is configured without the service role.
     - `Origin` host must equal the request host (else 403).
     - Body read as text, rejected if > 32 KB (413), then JSON-parsed.
     - Honeypot non-empty, or `Date.now() - startedAt < 3000`: return a fake `200 { ok: true }` and persist nothing.
     - **Explicit field allowlist** through the pure `parsePublicApplication()`. `status`, `rating`, `tags`, `assignee*`, `source`, `createdBy`, `cv*` and `extra` from the client are ignored.
     - `validateApplication` plus public rules: phone and country required, cover letter ≤ 5000 chars, CV metadata required.
     - Opening resolved by slug with `getPublicOpeningBySlug` and a **live, uncached** read. Not public → 404 `openingClosed`.
     - `assertCareersApplyRateLimit({ email, ipHash })`: max 5 per IP hash and 3 per email in 10 min, counted on `cms_job_applications` where `source='website'`. Plus a global brake: 429 above 300 website applications in 10 min. The same email + opening within 24 h is NOT rejected: the new row is created and flagged with `extra.duplicateOf = <existing id>` (unconfirmed `cvPending` rows are ignored).
     - `createPublicApplication(...)` writes `source='website'`, `created_by=null`, `locale`, `consent_version=CAREERS_PRIVACY_NOTICE_VERSION`, `consent_privacy_at=now`, `consent_talent_pool` as chosen, and `source_detail` = "how did you hear" (+ `referrer_name`). `extra` gets `{ meta: { ipHash }, cvPending: true, cvTicketHash: sha256(ticket), cvTicketExp }`. It logs a `created` activity with a null actor.
     - `createCvUploadUrl({ applicationId, mime, size })` creates the signed URL.
     - Response: `{ applicationId, uploadUrl, path, ticket }`, where `ticket` is 32 random bytes in base64url and only its hash is stored. `noStoreHeaders`.
  3. The client `PUT`s the file to `uploadUrl`, the same way as `src/components/admin/careers/api.ts:140`.
  4. The client POSTs `/api/careers/apply/confirm` `{ applicationId, path, ticket }`. The server checks:
     - UUID valid, row exists, `extra.cvPending === true`.
     - Ticket matches (`timingSafeEqual` on hashes) and has not expired (2 h).
     - `verifyCvObject(applicationId, path)`: path binding, size/mime and magic bytes.

     It then calls `setApplicationCv(..., null)`, clears `cvTicketHash`/`cvTicketExp`/`cvPending`, and returns `{ ok: true }`. Ticket errors (bad, expired or reused) return 400 `invalidTicket`.
  5. The client shows the success state (in-page, with focus moved to the heading).

  If step 3 or 4 fails, the client offers a retry for the upload and confirm (same ticket) while the ticket is valid. If the candidate abandons, the row remains with `cvPending: true`. Recruiters still see it: a real candidate with no CV.
- **Bot protection.** The public Contact form (`src/app/api/cms/forms/route.ts`) uses only a DB-counted rate limit (`assertFormRateLimit`, `ipHash` from `client-ip.ts`). The repo has no captcha, Turnstile or honeypot. The minimal secure equivalent used here is: the same rate-limit style on the careers table, plus a honeypot, a minimum fill time, an Origin check, body size limits and the field allowlist. Turnstile is an open question (new dependency + secret).
- **Error responses.** Use `careersErrorResponse` (stable codes, no PII, message-only logs). Never log the request body, email, name or IP.
- **i18n namespace.** Extend the existing `workWithUsPage` namespace instead of creating a new one. A new namespace would require editing `messages/{locale}/index.ts` in all 4 locales. Old keys used only by the deleted component are removed.
- **SEO.**
  - `generateMetadata` on all `/work` pages: title, description, `alternates.canonical` `/${locale}/work[/slug]`, `alternates.languages` for all locales (same pattern as `case-studies/[slug]`), and `openGraph` (title, description, url, type `website`).
  - The apply pages get `robots: { index: false, follow: true }`.
  - JobPosting JSON-LD (`node_modules/next/dist/docs/01-app/02-guides/json-ld.md`, a native `<script type="application/ld+json">` with `JSON.stringify(...).replace(/</g, "\\u003c")`) is built by the pure `buildJobPostingJsonLd(dto, { url, orgName, orgUrl, logoUrl })`:
    - Text fields: `title`, `description` (description + responsibilities + requirements HTML), `datePosted`, `validThrough` (only if `closeAt`).
    - `employmentType` mapping: FULL_TIME, PART_TIME, CONTRACTOR, TEMPORARY, INTERN, apprenticeship→OTHER.
    - Organization and location: `hiringOrganization`, `jobLocation.address { addressLocality, addressCountry }`. When remote: `jobLocationType: "TELECOMMUTE"` + `applicantLocationRequirements { @type: Country, name }`.
    - Salary and the rest: `baseSalary` only when `salary` exists (MonetaryAmount, unitText HOUR/MONTH/YEAR), `directApply: true`, `identifier`.
- **Sitemap.** In `src/app/sitemap.ts`, the `work-with-us` entry disappears with the registry change. Add `/${l}/work` (priority 0.8, weekly) and `/${l}/work/${slug}` for each public opening (`lastModified: updatedAt`, priority 0.7). Do not add the apply pages.
- **E2E.** Playwright runs on local JSON (`playwright.config.ts` blanks the Supabase env). Seed `data/cms/careers-openings.json` with one **published** sample opening (slug `sample-greenhouse-technician`, BR / São Paulo, hybrid, full_time, `en` content only) so the smoke test can reach the detail and apply pages. Production reads Supabase, so the seed never shows there.

## Tasks
| # | Task | Agent | Files | parallel |
|---|------|-------|-------|----------|
| 1 | **Public domain lib (pure, client-safe) + reserved slug + seed.** (a) `public.ts`: `PublicJobOpening` type; `isOpeningPublic(o, now)`; `toPublicOpening(o, locale, sanitizeHtml)`, which takes the sanitizer as a parameter so the file stays client-safe and drops salary unless `showSalary`; `filterPublicOpenings(list, { country, q, department, workModel, type })`, where `q` matches title/summary/department/city case- and accent-insensitive; `countryFacets(list)` → `[{ code, count }]`; `departmentFacets`; `buildJobPostingJsonLd(dto, org)`. (b) `public-apply.ts`: `PUBLIC_APPLY_LIMITS` (body 32 KB, cover letter 5000, min fill 3000 ms, ticket TTL 2 h); `HEARD_FROM_OPTIONS = ["linkedin","job_board","referral","event","search","social","other"]`; `parsePublicApplication(raw)`, which returns `{ ok, value \| errors }` using only allowlisted fields and runs `normalizeApplication` + `validateApplication` + public rules (phone, country, CV meta required). (c) `validation.ts`: `RESERVED_OPENING_SLUGS = ["apply"]`, and `validateOpening` pushes `slugReserved`. (d) Seed one published opening in `data/cms/careers-openings.json`. (e) Vitest: visibility matrix (draft with past `publishAt` stays hidden; future `publishAt` is hidden; past `closeAt` is hidden; closed/archived are hidden), DTO strips owner/stat fields and salary, filters/facets, JSON-LD shape plus `<` escaping by the caller, allowlist ignores `status`/`rating`/`source`/`extra`, reserved slug. | builder-admin | `src/lib/cms/careers/public.ts`, `src/lib/cms/careers/public-apply.ts`, `src/lib/cms/careers/validation.ts`, `src/lib/cms/careers/__tests__/public.test.ts`, `src/lib/cms/careers/__tests__/public-apply.test.ts`, `src/lib/cms/careers/__tests__/validation.test.ts`, `data/cms/careers-openings.json`, `messages/en/admin.json` | no (first) |
| 2 | **Server read + anonymous apply API + revalidation.** (a) `careers-public.server.ts` (`server-only`): `listPublicOpenings(locale)` and `getPublicOpeningBySlug(slug, locale)` wrapped in React `cache()`, plus `getPublicOpeningLive(slug)` (uncached, for the API). Explicit column select with `.eq("status","published")`, then `isOpeningPublic`, then the DTO with server sanitize. On `CareersError`/DB error, return `[]`/`null` and log the code only. (b) `careers-public-apply.server.ts`: `createPublicApplication(parsed, { opening, locale, ipHash })` → `{ applicationId, uploadUrl, path, ticket }`; `confirmPublicCv({ applicationId, path, ticket })`; `findRecentDuplicate(email, openingId, 24h)` (sets `extra.duplicateOf`, never rejects). (c) `careers-applications.server.ts`: `setApplicationCv` accepts `actor: CareersActor \| null`, and a new `patchApplicationExtra(id, extra)` helper; no other behavior changes. (d) `rate-limit.ts`: add `assertCareersApplyRateLimit` (same window and limits, table `cms_job_applications`, `source='website'`, reads `email`, `extra->meta->ipHash`). (e) `privacy-notice.ts`: add `CAREERS_PRIVACY_NOTICE_VERSION = "2026-10-20"`. (f) Routes `POST /api/careers/apply` and `POST /api/careers/apply/confirm`: `dynamic = "force-dynamic"`, `revalidate = 0`, `noStoreHeaders`, every check from the Design "Apply flow" step 2/4 in order, `context.params` not used (check `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`). (g) `revalidate-site.ts`: `revalidateCareersPages(slugs)`; call it best-effort in `saveOpening` (new + previous slug) and `deleteOpening`. (h) Vitest: the rate-limit counting (mock service client); `confirmPublicCv` rejects a wrong, expired or reused ticket and a path bound to another id; the route rejects a missing Origin match, a > 32 KB body, an unpublished slug; the honeypot returns 200 without a write. | builder-admin (**security-reviewer**: `src/app/api/**`, `src/lib/security`, anonymous PII write) | `src/lib/cms/server/careers-public.server.ts`, `src/lib/cms/server/careers-public-apply.server.ts`, `src/lib/cms/server/careers-applications.server.ts`, `src/lib/cms/server/careers-openings.server.ts`, `src/lib/security/rate-limit.ts`, `src/lib/security/privacy-notice.ts`, `src/lib/cms/revalidate-site.ts`, `src/app/api/careers/apply/route.ts`, `src/app/api/careers/apply/confirm/route.ts`, `src/lib/cms/server/__tests__/careers-public-apply.test.ts`, `src/app/api/careers/apply/__tests__/route.test.ts` | no (after 1) |
| 3 | **Drawer, redirect, catch-all cleanup, sitemap.** Insert "Work with us" after Shop in `MobileNavSheetContent` only (see Design). Add `nav.workWithUs`. Footer company href `/work-with-us` → `/work`. Remove `work-with-us` from `pageRegistry`, the `workWithUs` template type and branch, and the `WorkWithUsPageContent` import in the catch-all. Delete `WorkWithUsPageContent.tsx`. Add the permanent redirect in `next.config.ts`. Sitemap: add `/work` + public openings via `listPublicOpenings("en")` (slugs are locale-independent). | builder-site (declares `src/constants`, `next.config.ts`, `src/app/sitemap.ts`, which have no area owner) | `src/components/layouts/navbar/MobileNav.tsx`, `src/constants/navigation.ts`, `src/constants/pages.ts`, `src/app/[locale]/[...slug]/page.tsx`, `src/components/work-with-us/WorkWithUsPageContent.tsx` (delete), `next.config.ts`, `src/app/sitemap.ts`, `messages/en/nav.json` | yes (with 4) |
| 4 | **Careers pages + components.** **Routes:** `work/page.tsx` (listing, `revalidate = 3600`, metadata); `work/loading.tsx` (skeleton cards); `work/error.tsx` (client, retry + link to contact); `work/[slug]/page.tsx` (detail, `generateStaticParams`, `generateMetadata`, JSON-LD, `notFound()` when not public, `revalidate = 3600`); `work/[slug]/not-found.tsx` (friendly "opening no longer available" + link to `/work`); `work/[slug]/apply/page.tsx`; `work/apply/page.tsx` (talent pool, `opening = null`, noindex). **Components** in `src/components/work-with-us/`: `CareersHero`, `CareersAbout` (mission + global presence highlights, reusing `workWithUsPage.benefits.*` + the countries stat), `OpeningsBoard` (client; URL sync; Suspense with SSR fallback list), `OpeningSearchBar`, `OpeningFilters` (country select with flags + counts, department, work model, employment type, clear all, active chips), `OpeningCard` (title, summary clamp 2 lines, department, flag + city/country, work model, type, seniority chips, posted date, whole card is a link to `/work/<slug>`), `OpeningsEmptyState` (country-specific message + "clear filters" + talent pool CTA), `HiringProcess` (4 steps), `CareersFaq` (uses `ui/accordion`, consumed only), `OpeningDetail`, `OpeningMetaChips`, `OpeningRichSection` (server, renders sanitized HTML with prose styles; hides empty sections), `ApplyCard` (sticky desktop) + `MobileApplyBar`, `ShareButtons` (copy link via `navigator.clipboard` with an `aria-live` "copied" message, and a LinkedIn share URL `https://www.linkedin.com/sharing/share-offsite/?url=`), `OtherOpenings` (up to 3, same country first), `ApplicationForm` (client; all fields in the i18n `apply.fields` list grouped by `apply.sections`; languages repeater ≤ 10; CV dropzone + input with client type/size check; honeypot input visually hidden with `tabIndex=-1` `autoComplete="off"`; `startedAt` captured on mount; three-phase status submitting → uploading → confirming with retry; per-field errors mapped from server codes; success state), `JobPostingJsonLd`, `opening-format.ts` (label keys, location string, salary formatting via `Intl.NumberFormat`). **A11y:** labelled controls, `aria-describedby` errors, `role="alert"` for form errors, visible focus, filters keyboard-operable, `<nav aria-label>` breadcrumb. | builder-site | `src/app/[locale]/work/page.tsx`, `src/app/[locale]/work/loading.tsx`, `src/app/[locale]/work/error.tsx`, `src/app/[locale]/work/[slug]/page.tsx`, `src/app/[locale]/work/[slug]/not-found.tsx`, `src/app/[locale]/work/[slug]/apply/page.tsx`, `src/app/[locale]/work/apply/page.tsx`, `src/components/work-with-us/*.tsx` (new files listed), `src/components/work-with-us/opening-format.ts`, `messages/en/workWithUsPage.json` | yes (with 3) |
| 5 | **E2E smoke additions** (see AC). | builder-site | `e2e/smoke.spec.ts` | no (after 3, 4) |
| 6 | Mirror `workWithUsPage` + `nav` changes (adds and removals) to `pt-BR`, `es`, `zh-CN`; also mirror the `slugReserved` admin key; run `npm run i18n:check`. | i18n | `messages/{pt-BR,es,zh-CN}/{workWithUsPage,nav,admin}.json` | no (after 1–5) |
| 7 | Review + security review (apply API, rate limit, ticket, CV verification, public DTO leakage, JSON-LD/HTML injection, redirect). | reviewer, security-reviewer | read-only | no (after 6) |

Notes on ownership:
- Tasks 3 and 4 share no files. Task 3 owns `nav.json` and Task 4 owns `workWithUsPage.json`.
- Task 1 also adds the admin message `admin.careers.openings.editor.validation.slugReserved` in `messages/en/admin.json`. No other task edits `admin.json`, so add that file to Task 1's file list.
- Task 4 only consumes these shared files and does not edit them: `ContactFieldControls.tsx`, `ui/*`, `CountryFlag`, `world-countries`.

## i18n
New/changed keys in `messages/en/`. Builders may add keys under these subtrees and must list them in their report. ICU placeholders must be identical across locales.

**Added**
- `nav.workWithUs`
- `admin.careers.openings.editor.validation.slugReserved`
- `workWithUsPage.meta.{listTitle,listDescription,applyTitle,talentPoolTitle}` (`applyTitle` uses `{title}`)
- `workWithUsPage.hero.{eyebrow,title,description,openingsCount,countriesCount,ctaTalentPool}` (`openingsCount` uses `{count, plural, ...}`, `countriesCount` uses `{count}`)
- `workWithUsPage.about.{title,body,highlightsTitle}` (the existing `workWithUsPage.benefits.{b1,b2,b3,b4}.{title,description}` are kept unchanged)
- `workWithUsPage.process.{title,description}`
- `workWithUsPage.process.steps.{s1,s2,s3,s4}.{title,description}`
- `workWithUsPage.faq.title`
- `workWithUsPage.faq.items.{q1,q2,q3,q4}.{question,answer}`
- `workWithUsPage.board.{title,resultCount,searchLabel,searchPlaceholder,searchSubmit,clearFilters,activeFilters,removeFilter,loadError}` (`resultCount` uses `{count, plural, ...}`, `removeFilter` uses `{label}`)
- `workWithUsPage.board.filters.{country,allCountries,countryOption,department,allDepartments,workModel,employmentType,any}` (`countryOption` uses `{country}` and `{count}`)
- `workWithUsPage.board.empty.{title,description,countryTitle,clearFilters,talentPoolCta}` (`countryTitle` uses `{country}`)
- `workWithUsPage.card.{viewOpening,posted,positions}` (`posted` uses `{date}`, `positions` uses `{count, plural, ...}`)
- `workWithUsPage.labels.workModel.{onsite,hybrid,remote}`
- `workWithUsPage.labels.employmentType.{full_time,part_time,contract,temporary,internship,apprenticeship}`
- `workWithUsPage.labels.seniority.{intern,junior,mid,senior,lead,manager,director,executive}`
- `workWithUsPage.labels.salaryPeriod.{hour,month,year}`
- `workWithUsPage.labels.workAuthorization.{citizen,permanent_resident,work_visa,needs_sponsorship,other}`
- `workWithUsPage.labels.languageLevel.{A1,A2,B1,B2,C1,C2,native}`
- `workWithUsPage.detail.{breadcrumbLabel,breadcrumbHome,breadcrumbWork,backToOpenings,posted,closes,positions,department,location,workModel,employmentType,seniority,salary,salaryRange,salaryFrom,salaryUpTo}`
  - `posted` and `closes` use `{date}`; `positions` uses `{count, plural, ...}`
  - `salaryRange` uses `{min}` `{max}` `{period}`; `salaryFrom` uses `{min}` `{period}`; `salaryUpTo` uses `{max}` `{period}`
- `workWithUsPage.detail.sections.{summary,description,responsibilities,requirements,niceToHave,benefits}`
- `workWithUsPage.detail.apply.{title,description,cta,mobileCta}`
- `workWithUsPage.detail.share.{title,copyLink,copied,linkedin}`
- `workWithUsPage.detail.other.{title,viewAll}`
- `workWithUsPage.detail.notFound.{title,description,cta}`
- `workWithUsPage.apply.{title,subtitle,talentPoolTitle,talentPoolSubtitle,backToOpening,applyingFor,nextStepsTitle,submit}` (`applyingFor` uses `{title}`)
- `workWithUsPage.apply.sections.{personal,professional,preferences,languages,documents,consent}`
- `workWithUsPage.apply.fields.{fullName,email,phone,phoneCountry,country,city,linkedinUrl,portfolioUrl,currentCompany,currentTitle,yearsExperience,salaryExpectation,salaryCurrency,salaryPeriod,availabilityDate,noticePeriodDays,workAuthorization,willingToRelocate,remotePreference,languages,addLanguage,removeLanguage,languageCode,languageLevel,coverLetter,heardFrom,referrerName,cv,cvHint,cvDrop,cvReplace,cvSelected,consentPrivacy,consentTalentPool,privacyNotice,privacyLink,optional,yes,no}`
  - `cvHint` uses `{size}`; `cvSelected` uses `{name}` and `{size}`
- `workWithUsPage.apply.heardFrom.{linkedin,job_board,referral,event,search,social,other}`
- `workWithUsPage.apply.validation.{required,emailInvalid,urlInvalid,yearsRange,noticeRange,dateInvalid,cvRequired,cvType,cvTooLarge,consentRequired}`
- `workWithUsPage.apply.status.{submitting,uploading,confirming,retryUpload}`
- `workWithUsPage.apply.errors.{generic,rateLimited,openingClosed,uploadFailed,invalidTicket}`
- `workWithUsPage.apply.success.{title,description,talentPoolNote,backToOpenings}`

**Unchanged, reused:** `pages.workWithUs.{title,eyebrow,description}`, `footer.workWithUs`, `contact.{country,countryPlaceholder,countrySearch,countryEmpty,countryOther,phoneCountry,phoneCountrySearch,phoneCountryEmpty,phoneLocalPlaceholder}`.

**Removed** (used only by the deleted `WorkWithUsPageContent.tsx`):
- `workWithUsPage.intro` (its copy moves to `about.body`)
- `workWithUsPage.openings.{title,o1,o2,o3}.*`
- `workWithUsPage.application.{title,description,name,email,message,submit,success}`

## Acceptance criteria
**Navigation / routes**
- [ ] In the drawer (mobile navbar on `/en/about`, and the hamburger on the homepage at desktop width), "Work with us" appears directly after "Shop" and links to `/{locale}/work`. The desktop top bar and the footer columns gain no new item. The footer's existing "Work with us" link points to `/{locale}/work`.
- [ ] `GET /en/work-with-us` returns 308 to `/en/work` (all 4 locales). `/work` without a locale ends on `/en/work`.
- [ ] `/en/work`, `/pt-BR/work`, `/es/work` and `/zh-CN/work` return 200 with an `h1`, with no console errors.
- [ ] `/en/work/sample-greenhouse-technician` returns 200 (local seed). `/en/work/does-not-exist` returns 404. An opening that is draft, closed, archived, past `close_at`, or published with a future `publish_at` returns 404 on the detail and apply pages and is absent from the listing and the sitemap.
- [ ] Admin cannot save an opening with slug `apply` (`slugReserved`).

**Listing**
- [ ] The country select lists only countries that have public openings, with counts and flags. Choosing BR updates the URL to `?country=BR`. Reloading or sharing that URL keeps the filter. Combined `?country=BR&q=green&workModel=hybrid&type=full_time&department=…` filters correctly, and the result count matches.
- [ ] With no JS, or before hydration, the page HTML contains all public opening cards (SSR fallback). The page build output marks `/[locale]/work` as static/ISR, not dynamic.
- [ ] Empty filter result shows the country-specific message, "clear filters", and a link to `/work/apply`.
- [ ] Each card shows title, 2-line summary, department, flag + city/country, work model, employment type, seniority and posted date, and links to `/{locale}/work/<slug>`.

**Detail**
- [ ] Breadcrumb, meta chips, and only non-empty sections are rendered. Salary is shown only when `show_salary` is true. The page HTML has no owner names or ids, stats, `status` or opening `id` (grep the HTML response).
- [ ] Rich HTML containing `<script>` or `onerror=` stored in the DB is not executed or rendered.
- [ ] The apply card is sticky on desktop (≥ lg). The bottom CTA bar shows on mobile. Both link to `/work/<slug>/apply`. Copy link copies the canonical URL and announces "copied". The LinkedIn share opens the share-offsite URL.
- [ ] `<head>` has title, description, canonical `/{locale}/work/<slug>`, hreflang for the 4 locales and OG tags. The JSON-LD `JobPosting` passes the Google Rich Results Test (manual check on preview). `validThrough` is present only when `close_at` is set. `baseSalary` is present only when salary is shown. `<` is escaped.
- [ ] Saving or closing an opening in admin makes the change visible on `/work` and `/work/<slug>` immediately (on-demand revalidation), without waiting for the 1 h ISR.

**Apply (hosted / Supabase preview)**
- [ ] A valid submission with a PDF ≤ 10 MB creates exactly one `cms_job_applications` row with:
  - `source='website'`, `created_by is null`, `opening_id` = the opening
  - `locale` = the page locale, `consent_version='2026-10-20'`, `consent_privacy_at` set
  - `cv_*` set, `extra.cvPending` absent/false, and no `cvTicketHash`

  The admin Applications list shows it with a downloadable CV.
- [ ] `/work/apply` (talent pool) creates a row with `opening_id null` and `consent_talent_pool` as chosen.
- [ ] Rejections:
  - `.png` or > 10 MB is blocked in the client. A renamed `.exe` → `.pdf` is rejected at confirm (magic bytes) and its object is removed.
  - Injecting `status:"hired"`, `rating:5`, `source:"manual"` or `extra` in the POST body has no effect.
  - A body > 32 KB returns 413. A foreign `Origin` returns 403.
  - A filled honeypot or a submit < 3 s returns 200 and creates no row.
  - The 6th POST from the same IP within 10 min returns 429. The same email + opening twice within 24 h is accepted and the second row carries `extra.duplicateOf`.
  - Applying to a closed opening returns 404 `openingClosed`.
  - Confirm with a wrong, expired or reused ticket, or a path for another application id, returns 400.
- [ ] Server logs for the apply routes never contain the email, name, phone, IP or body (inspect Vercel logs on preview).
- [ ] Without `SUPABASE_SERVICE_ROLE_KEY` on hosted, the apply returns 503 and `/work` renders the empty/error state instead of crashing.

**E2E (`e2e/smoke.spec.ts`)**
- [ ] Add `{ path: "/work", heading: "h1" }` and `{ path: "/work/sample-greenhouse-technician", heading: "h1" }` to `routes`, for all 4 locales.
- [ ] Add tests that check:
  - `/en/work-with-us` ends on `/en/work`.
  - `/en/work/does-not-exist` returns 404.
  - `/en/work?country=BR` shows ≥ 1 card, and `?country=SE` shows the empty state.
  - `/en/work/sample-greenhouse-technician/apply` renders the form with the CV input and consent checkbox, without submitting.
  - At a 390×844 viewport on `/en/about`, opening the menu shows "Work with us" immediately after "Shop".

**Checks**
- [ ] New vitest suites pass: `src/lib/cms/careers/__tests__/{public,public-apply,validation}.test.ts`, `src/lib/cms/server/__tests__/careers-public-apply.test.ts`, `src/app/api/careers/apply/__tests__/route.test.ts`.
- [ ] `npm run lint && npm run i18n:check && npm test && npm run build` pass, and `npm run test:e2e` passes.

## Risks / notes
- **Security review required.** It is triggered by `src/app/api/careers/**` (new **anonymous** write endpoints that accept PII and files), `src/lib/security/rate-limit.ts` and `privacy-notice.ts`, and use of the service role from a public path. The reviewer must specifically check:
  - the field allowlist (no mass-assignment of pipeline fields)
  - that ticket hashing and expiry are single-use
  - that `verifyCvObject` runs before any CV metadata is saved
  - that the public read selects no internal columns
  - JSON-LD and rich HTML escaping
  - that error responses carry no DB messages
- **No migration / RLS change.** Everything goes through the service role, and the tables keep RLS on with no client policies. The `careers-cv` bucket stays private. The browser receives only a single-path signed upload URL.
- **Abuse surface.** The rate limit is DB-counted (same as Contact), which is not a WAF. Abandoned uploads leave rows with `cvPending: true` plus possibly orphan objects. A follow-up cron under `src/app/api/cron` could purge `cvPending` rows older than 24 h together with their folder (out of scope). Supabase has no malware scanning, and CVs are only downloaded, never rendered inline (unchanged from the admin plan).
- **`x-forwarded-for` trust.** The IP comes from the first `x-forwarded-for` hop (`client-ip.ts`). That is correct on Vercel but spoofable elsewhere. The email limit still applies.
- **ISR staleness.** `publish_at`/`close_at` transitions without an admin save become visible within ≤ 1 h (`revalidate = 3600`). The apply API always checks live, so applications to an expired opening are refused immediately.
- **`useSearchParams` + static.** The board must sit under `<Suspense>`, or the build fails or the route turns dynamic. The SSR fallback keeps the cards indexable.
- **Unowned paths** declared by Task 3: `src/constants/*`, `next.config.ts`, `src/app/sitemap.ts`, `e2e/`. Unowned paths declared by Task 2: `src/app/api/careers/**`. AGENTS.md lists `src/components/layout`, but the drawer lives in `src/components/layouts/navbar/` (also builder-site).
- **Revalidation in server functions.** `revalidatePath` throws outside a request scope, so wrap it in try/catch to keep the vitest and approval paths safe.
- **Behavior change.** The old spontaneous form (a contact-type submission to `/api/cms/forms` with subject "Work with us") is removed. Spontaneous candidates now land in Careers > Applications as talent pool (`opening_id null`) instead of Forms/CRM.
- **Privacy copy.** The candidate consent text links to `/privacy`. The privacy page may not yet describe recruitment data processing or retention (see Open questions).

## Open questions for the user
1. **Captcha.** The plan matches the Contact form's protection: rate limit, plus honeypot, minimum fill time and an Origin check, with no captcha. Do you want Cloudflare Turnstile on the apply form? It needs a new dependency and a site key/secret in Vercel.
2. **Candidate privacy / retention.** Should the Privacy page gain a recruitment section with a retention period for CVs (e.g. 12 months, or 24 months for talent-pool consent)? The default is no copy change in this plan, and the consent checkbox links to the existing `/privacy`. LGPD/GDPR normally expects this to be stated.

## User decisions (2026-10-20)
- No captcha for now (rate limit + honeypot + min fill time + Origin check, same as Contact). Turnstile may come later.
- Privacy page gets a recruitment section: CV/application data retained 12 months; talent-pool consent 24 months. Added as **Task 3b** (builder-site, `messages/en/legalPage.json` privacy content only, parallel with 3 and 4). Apply-form consent links to that section.
- The old spontaneous form (Forms/CRM) is replaced by the talent pool in Careers > Applications — confirmed.
