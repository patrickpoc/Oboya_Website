# Supabase + Vercel

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. In **SQL Editor**, run the contents of [`supabase/schema.sql`](./supabase/schema.sql).
3. In **Authentication → Users**, create an admin user (email + password).

## 2. Environment variables

Copy [`.env.example`](./.env.example) to `.env.local` and fill in:

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page (anon public key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page (local seed only — **never** add to Vercel) |

On **Vercel**, add only the two `NEXT_PUBLIC_*` variables.

## 3. Seed map data

After running the SQL schema:

```bash
npm run seed:map
```

This uploads `data/map-locations.json` to the `map_locations_config` table.

## 4. Deploy on Vercel

1. Connect the Git repository.
2. Set root directory to `oboya` (if the repo root is the parent folder).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
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
