# Production security runbook

Canonical site: `https://www.oboya-horticulture.com`.

Apply this checklist at deploy time. Code patches alone do not close RLS findings if the SQL is not applied to the live Supabase project.

## 1. Supabase Authentication

- Disable public signups (Authentication → Providers → Email → **Confirm email** as needed; turn **off** “Allow new users to sign up”).
- Keep **email** as the only provider unless a new provider is explicitly approved.
- Enable **CAPTCHA** (hCaptcha or Cloudflare Turnstile) on Auth.
- Require **MFA (Authenticator)** for `super_admin` and `admin`. After MFA is enrolled for those accounts, set `CMS_REQUIRE_MFA=true` on Vercel so `requireCmsAuth` demands AAL2.

## 2. Passwords

- Rotate every Auth password. No account may use the old default `Oboya2026`.
- New CMS users receive a one-time random password from the admin UI; they must change it on first login (`app_metadata.must_change_password`).
- Bootstrap an admin only with `ADMIN_PASSWORD` (scripts) / `CMS_BOOTSTRAP_ADMIN_EMAIL` (first profile). Never document a default password.

## 3. Database (RLS)

Apply, in order, on the project linked to Vercel:

- `supabase/migrations/20260914_cms_rls_hardening.sql`
- `supabase/migrations/20260914_cms_form_rfq_reference.sql`

Confirm:

- Anonymous REST insert into `cms_form_submissions` returns 401/403.
- Authenticated non-staff JWTs cannot `SELECT` form submissions.
- Users cannot self-promote `role` or `status` on `cms_user_profiles`.

## 4. Vercel

- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.
- Optional: `CMS_REQUIRE_MFA=true`, `CMS_BOOTSTRAP_ADMIN_EMAIL`, `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- Firewall / WAF: rate-limit `POST /api/shop/rfq` and `POST /api/cms/forms`. Enable Attack Challenge if those paths flood.
- Daily cron `GET /api/cron/purge-forms` is defined in `vercel.json` (Authorization: `Bearer CRON_SECRET`).

## 5. Smoke tests after deploy

- Next.js version on the deployment is **≥ 16.3.3** (this repo pins 16.3.4).
- `GET /api/cms/users` unauthenticated → 401 `{ "error": "Unauthorized" }` with **no** `debug` / `serviceRole` fields.
- `GET /api/cms/dashboard` unauthenticated → 401.
- `POST` contact/RFQ without privacy acknowledgement → 400.
- Response headers on `/admin/login`: `X-Content-Type-Options: nosniff`, `Content-Security-Policy` includes `frame-ancestors`.
- `robots.txt` disallows `/admin` and `/api`.
- Image remote host is the project’s Supabase hostname, not `*.supabase.co`.

## 6. LGPD operations

- Privacy contact: `info@oboya.cc` until a dedicated mailbox exists.
- Inquiry/RFQ rows without a contract are purged after 12 months (cron) or via Admin → Forms → Delete / Anonymize.
- Cookie notice records consent in `oboya_cookie_consent` (necessary + optional analytics). Vercel Analytics loads only if analytics is accepted. Details are in the Privacy Policy.
- Portuguese (`pt-BR`) privacy policy is the LGPD controlling version alongside English.
