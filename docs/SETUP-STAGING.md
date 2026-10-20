# Staging setup (manual checklist)

Staging is a separate Supabase project plus a Vercel Preview environment. It lets
agents and reviewers test changes without touching production data. Nothing in
this checklist is automated; tick each item by hand.

See [SUPABASE.md](./SUPABASE.md) for the production setup this mirrors.

## 1. Supabase project

- [ ] Create a new Supabase project named `oboya-staging` (never reuse production).
- [ ] In **SQL Editor**, run in this order:
  1. [ ] `supabase/schema.sql`
  2. [ ] `supabase/cms-schema.sql` (idempotent)
  3. [ ] Each file in `supabase/migrations/` in filename order:
     - [ ] `20260819_marketplace_products.sql`
     - [ ] `20260827_cms_forms_audit_policies.sql`
     - [ ] `20260827_cms_media_storage.sql`
     - [ ] `20260827_cms_user_profiles.sql`
     - [ ] `20260828_product_description_media_folder.sql`
     - [ ] `20260908_product_color_variants.sql`
     - [ ] `20260908_product_default_color.sql`
     - [ ] `20260908_product_image_color_ids.sql`
     - [ ] `20260914_cms_form_rfq_reference.sql`
     - [ ] `20260914_cms_rls_hardening.sql`
     - [ ] `20260924_cms_product_unit_stats.sql`
     - [ ] `20260925_cms_permission_overrides.sql`
     - [ ] `20260929_cms_change_requests.sql`
     - [ ] `20261001_cms_form_crm.sql`
     - [ ] `20261007_product_featured_color.sql`
- [ ] Run `supabase/diagnostics/check-cms-users.sql` and confirm the results look sane.

> **Do not** re-run `20260827_cms_forms_audit_policies.sql` after
> `20260914_cms_rls_hardening.sql`: it recreates the permissive anon insert
> policies that the hardening migration removes.
>
> **Do not** run `supabase/diagnostics/force-all-super-admin.sql` on staging or
> production: it promotes every profile to `super_admin`. Use
> `promote-super-admin.sql` for a single account instead.

## 2. Admin user

- [ ] Create the first admin with `scripts/create-admin-user.mjs`, pointing at the
      staging project (see SUPABASE.md, step 7). Use a password that is not used
      anywhere else.
- [ ] Log in at `/admin/login` on the staging deploy and confirm the dashboard loads.

## 3. Seed data (optional)

- [ ] `npm run seed:map`
- [ ] `npm run seed:products`

Run these only with the staging keys loaded, never the production ones.

## 4. Vercel Preview environment

- [ ] In **Vercel → Project → Settings → Environment Variables**, set for the
      **Preview** environment only:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` (staging)
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (staging)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (staging, server-only)
  - [ ] `CRON_SECRET` (a staging-only value)
- [ ] Confirm Production still points at the production project.
- [ ] In Supabase **Auth → URL Configuration**, add the Vercel preview URL pattern
      to the redirect allow list.

## 5. Local worktrees

Every git worktree needs its own `.env.local`; it is untracked and not shared
between worktrees.

- [ ] Copy `.env.example` to `.env.local` in each worktree and fill in the
      **staging** values.
- [ ] Never commit `.env*` files or paste their values into issues, PRs or chats.
- [ ] Leave the Supabase variables unset to work against the local JSON in `data/`
      (this is what CI does).

## 6. GitHub branch protection

- [ ] **Settings → Branches → Add rule** for `main`:
  - [ ] Require a pull request before merging.
  - [ ] Require review from Code Owners (uses `.github/CODEOWNERS`).
  - [ ] Require status checks to pass: **CI / Lint, test and build**.
  - [ ] Require branches to be up to date before merging.
  - [ ] Block force pushes and deletions.
