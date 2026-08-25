<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This is a single Next.js 16 app (`oboya`), package manager is npm. Dependencies are refreshed automatically on startup (`npm install`).

### Running the app
- Dev server: `npm run dev` (Next.js + Turbopack) on http://localhost:3000. Root `/` redirects to `/en`.
- Other scripts live in `package.json`: `build`, `start`, `lint`, `test:cms-smoke`, `seed:map`, `seed:products`.
- Lint currently reports pre-existing errors/warnings in the repo; `npm run lint` itself works. Do not assume a clean lint baseline.

### Supabase is optional locally
- No Supabase env vars are set by default, so the app runs in local file-backed mode: admin auth is skipped and `/admin` redirects straight to `/admin/dashboard`. This is expected, not a bug.
- To exercise the production-like auth/Postgres path, set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and `SUPABASE_SERVICE_ROLE_KEY` for seed/admin scripts) per `.env.example` and follow `docs/SUPABASE.md`.

### CMS content persistence gotchas (non-obvious)
- Admin saves write to gitignored runtime JSON under `data/cms/` (e.g. `homepage-settings.json`, `blog-posts.json`) — see the "Runtime CMS content" block in `.gitignore`. These files are generated on first save; a fresh checkout won't have them and the app falls back to seeded defaults.
- Content is served through in-memory caches in `src/lib/cms/repositories/*`, with disk as the shared source of truth across RSC/API bundles (see `src/lib/cms/server/content.server.ts`). If you edit or delete a `data/cms/*.json` file manually, restart the dev server so the change is picked up.
- To reset CMS content to defaults, delete the generated file under `data/cms/` and restart the dev server.
