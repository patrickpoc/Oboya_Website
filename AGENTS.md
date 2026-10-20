<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:oboya-brand-palette -->
# Oboya Brand Palette

Canonical tokens live in `src/styles/tokens.css` and `.cursor/rules/oboya-brand-palette.mdc`.

| Name | HEX | CSS token |
|------|-----|-----------|
| Orange Red | `#ea5744` | `--oboya-orange` |
| Main Blue | `#004F7C` | `--oboya-blue` |
| Light Blue | `#009CD4` | `--oboya-blue-light` |
| Main Green | `#4DAF4E` | `--oboya-green` |
| Light Green | `#75C566` | `--oboya-green-light` |
| Dark Blue | `#01203F` | `--oboya-blue-dark` |
| Light Yellow | `#DBE64C` | `--oboya-yellow-light` |
| Dark Yellow | `#909B03` | `--oboya-yellow-dark` |
| Soft White | `#F1F5F1` | `--oboya-soft-white` |

Use these for accents and collapsed UI strips; do not invent off-brand colors when a palette swatch fits.
<!-- END:oboya-brand-palette -->

# i18n

UI copy lives in `messages/{locale}/{namespace}.json` for `en`, `pt-BR`, `es`, and `zh-CN`. `messages/{locale}/index.ts` assembles those files. Do not recreate the monolithic `messages/{locale}.json`.

To add a key, put the same path in all four locales, keep ICU placeholders identical (`{count}`, `{id}`, and the argument of `plural` / `select`), then run `npm run i18n:check`. `node scripts/i18n-split.mjs join` rebuilds a single JSON, and `split` reverses it.

<!-- BEGIN:oboya-agent-workflow -->
# Project map

Next.js 16 (App Router) · React 19 · next-intl (en, pt-BR, es, zh-CN) · Supabase · Tailwind 4 · shadcn/base-ui · Vercel.

| Area | Paths | Owner agent |
|------|-------|-------------|
| Public site | `src/app/[locale]/**` (except shop/checkout), `src/components/{sections,about,solutions,blog,news,case-studies,timeline,contact,faqs,legal,privacy,work-with-us,layout,layouts,brand}`, `src/content`, `src/styles` | `builder-site` |
| Shop / RFQ / checkout | `src/app/[locale]/{shop,checkout}/**`, `src/components/{shop,checkout}`, `src/contexts/ShopContext.tsx`, `src/contexts/shop/**`, `src/lib/shop`, `src/app/api/shop/**`, `data/shop` | `builder-shop` |
| Admin CMS | `src/app/admin/**`, `src/components/admin/**`, `src/app/api/cms/**`, `src/lib/cms/**`, `data/cms` | `builder-admin` |
| Translations | `messages/{locale}/*.json` | `i18n` (only agent allowed to edit non-`en` files) |
| Database / security | `supabase/**`, `src/lib/supabase`, `src/lib/security`, `src/app/auth`, `src/app/api/cron` | any builder, but always triggers `security-reviewer` |
| Shared UI | `src/components/ui`, `src/hooks`, `src/types` | one builder at a time — declare in the plan |

# Commands

- `npm run lint` · `npm run i18n:check` · `npm test` (vitest) · `npm run build` · `npm run test:e2e` (Playwright smoke)
- A task is done only when lint + i18n:check + test + build pass (e2e when routes or UI changed).

# Rules for every agent

1. Stay inside the paths of your area. Touching another area = stop and report.
2. New/changed copy: builders edit **only** `messages/en/<namespace>.json`. The `i18n` agent mirrors keys to `pt-BR`, `es`, `zh-CN` at the end (see the i18n section).
3. Colors: brand tokens only (`oboya-*`), see palette above.
4. No new dependency without stating why in the report.
5. Never read or print `.env*`. Never prefix server secrets with `NEXT_PUBLIC_`.
6. Supabase: schema changes only via a new file in `supabase/migrations/` (`YYYYMMDD_name.sql`), never edit old migrations. RLS stays on.
7. Large or shared files — one agent at a time: `src/app/admin/(dashboard)/marketplace/filters/page.tsx`, `src/app/admin/(dashboard)/media/page.tsx`, `BulkProductTable.tsx`, `MapLocationEditor.tsx`, `RichTextEditor.tsx`, `faqs-repository.ts`, `src/contexts/shop/useShopCommands.ts`, the same `messages` namespace.
8. Final report in ≤5 lines: what changed, files, checks run, open risks.
<!-- END:oboya-agent-workflow -->
