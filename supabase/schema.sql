-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.map_locations_config (
  id text primary key default 'default',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.map_locations_config enable row level security;

create policy "Public read map config"
  on public.map_locations_config
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated update map config"
  on public.map_locations_config
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated insert map config"
  on public.map_locations_config
  for insert
  to authenticated
  with check (true);

-- Optional: seed from existing JSON (run scripts/seed-map-locations.mjs after creating a user)
