-- ============================================================================
-- Storage buckets and policies
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-photos', 'profile-photos', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('gallery', 'gallery', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('aarti-audio', 'aarti-audio', true, 20971520, array['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/m4a','audio/x-m4a']),
  ('program-images', 'program-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('announcement-images', 'announcement-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('video-thumbnails', 'video-thumbnails', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- profile-photos ------------------------------------------------------------

create policy "profile_photos_select" on storage.objects
  for select using (bucket_id = 'profile-photos');

create policy "profile_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile_photos_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Content buckets (admin-managed) -------------------------------------------

create policy "content_buckets_select" on storage.objects
  for select using (
    bucket_id in ('gallery', 'aarti-audio', 'program-images', 'announcement-images', 'video-thumbnails')
  );

create policy "content_buckets_write_admin" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('gallery', 'aarti-audio', 'program-images', 'announcement-images', 'video-thumbnails')
    and public.is_admin()
  );

create policy "content_buckets_update_admin" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('gallery', 'aarti-audio', 'program-images', 'announcement-images', 'video-thumbnails')
    and public.is_admin()
  );

create policy "content_buckets_delete_admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('gallery', 'aarti-audio', 'program-images', 'announcement-images', 'video-thumbnails')
    and public.is_admin()
  );