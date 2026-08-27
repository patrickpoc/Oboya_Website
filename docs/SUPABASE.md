# Supabase + Vercel

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. In **SQL Editor**, run the contents of [`supabase/schema.sql`](./supabase/schema.sql).
3. Then run marketplace products migration:
   - [`supabase/migrations/20260819_marketplace_products.sql`](../supabase/migrations/20260819_marketplace_products.sql)
4. Then run CMS media storage migration (required for admin video/image uploads on Vercel):
   - [`supabase/migrations/20260827_cms_media_storage.sql`](../supabase/migrations/20260827_cms_media_storage.sql)
5. Also run the extended CMS schema if you have not already (homepage + media DB tables):
   - [`supabase/cms-schema.sql`](../supabase/cms-schema.sql)  
   (idempotent — safe to re-run)
6. Prefer the one-shot users repair instead of stacking partial migrations:
   - Diagnostic (copy results back if something is wrong): [`supabase/diagnostics/check-cms-users.sql`](../supabase/diagnostics/check-cms-users.sql)
   - Fix (safe to re-run): [`supabase/diagnostics/fix-cms-users.sql`](../supabase/diagnostics/fix-cms-users.sql)
7. Create/reset the first admin user:

```bash
node scripts/create-admin-user.mjs
```

Default credentials: `admin@oboya.cc` / `Oboya2026` (override with `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

New users created in **Users & Permissions** also start with temporary password `Oboya2026` and must change it on first login.

## 2. Environment variables

Copy [`.env.example`](./.env.example) to `.env.local` and fill in:

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page (anon public key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page (server-only — used for seeding and Users & Permissions APIs) |

On **Vercel**, add the two `NEXT_PUBLIC_*` variables **and** `SUPABASE_SERVICE_ROLE_KEY` as a **server-only** secret (never prefix with `NEXT_PUBLIC_`). Required for creating/editing/deleting admin users.

## Live checklist (Vercel + Supabase)

If **Users** stays empty after “Loading users…” or **Media Library** is empty in production:

1. **Supabase → SQL Editor** run [`diagnostics/fix-from-check-20260827.sql`](../supabase/diagnostics/fix-from-check-20260827.sql) (creates `cms_media` / `cms_documents` and promotes a `super_admin`).
2. **Vercel → Project → Settings → Environment Variables** (Production + Preview):

| Variable | Required |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes** for Users create/edit/delete/list emails |

3. **Redeploy** after adding env vars (env changes do not apply to old deployments).
4. Log out / log in to the admin so the session picks up the `super_admin` profile.

`SUPABASE_SERVICE_ROLE_KEY` is server-only — never prefix with `NEXT_PUBLIC_`.

## 3. Seed data

After running the SQL schema:

```bash
npm run seed:map
npm run seed:products
```

This uploads:
- `data/map-locations.json` to `map_locations_config`
- `data/shop/products.json` to `cms_products`

## 4. Deploy on Vercel

1. Connect the Git repository.
2. Set root directory to `oboya` (if the repo root is the parent folder).
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploy.

## Behaviour

| Environment | Map reads | Admin save | Auth |
|---|---|---|---|
| Local without `.env.local` | `data/map-locations.json` | Writes to JSON file | Open |
| Local / Vercel with Supabase | Supabase (fallback JSON if empty) | Supabase | Login required |

- Public site: reads map from Supabase (anon key, public RLS).
- `/admin/map`: requires login when Supabase is configured.
- `/admin/login`: email/password via Supabase Auth.

## Auth callback URL

In Supabase → Authentication → URL Configuration, set:

- **Site URL**: `https://oboya.cc` (or your Vercel preview URL)
- **Redirect URLs**: `https://oboya.cc/auth/callback`, `http://localhost:3000/auth/callback`
