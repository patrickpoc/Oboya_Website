-- Public CMS media bucket for admin uploads (hero video, images, etc.)
-- Run in Supabase SQL Editor after cms-schema.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-media',
  'cms-media',
  true,
  52428800, -- 50MB
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read cms-media" on storage.objects;
create policy "Public read cms-media"
  on storage.objects for select
  to public
  using (bucket_id = 'cms-media');

drop policy if exists "Authenticated upload cms-media" on storage.objects;
create policy "Authenticated upload cms-media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cms-media');

drop policy if exists "Authenticated update cms-media" on storage.objects;
create policy "Authenticated update cms-media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cms-media')
  with check (bucket_id = 'cms-media');

drop policy if exists "Authenticated delete cms-media" on storage.objects;
create policy "Authenticated delete cms-media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cms-media');
