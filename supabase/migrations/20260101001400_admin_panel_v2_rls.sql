-- ============================================================================
-- Admin Panel v2 - idempotent RLS / storage / realtime
-- SAFE TO RUN ON EXISTING DATABASE: every policy is created only if missing,
-- so pasting this file (or the whole 0013 file) repeatedly will NOT error.
-- ============================================================================

-- Profile photo public_id is exposed to admins via the member directory view
create or replace view public.public_member_directory
with (security_barrier = true) as
select id, full_name, user_id, village, profile_photo_url, position, display_order, role
from public.profiles
where is_active = true
order by display_order asc, full_name asc;

grant select on public.public_member_directory to anon, authenticated;

-- ============================================================================
-- RLS policies (content tables)
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gallery' and policyname = 'gallery_select_published') then
    create policy "gallery_select_published" on public.gallery for select using (is_published = true or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gallery' and policyname = 'gallery_insert_admin') then
    create policy "gallery_insert_admin" on public.gallery for insert with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gallery' and policyname = 'gallery_update_admin') then
    create policy "gallery_update_admin" on public.gallery for update using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gallery' and policyname = 'gallery_delete_admin') then
    create policy "gallery_delete_admin" on public.gallery for delete using (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'aartis' and policyname = 'aartis_select_published') then
    create policy "aartis_select_published" on public.aartis for select using (is_published = true or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'aartis' and policyname = 'aartis_insert_admin') then
    create policy "aartis_insert_admin" on public.aartis for insert with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'aartis' and policyname = 'aartis_update_admin') then
    create policy "aartis_update_admin" on public.aartis for update using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'aartis' and policyname = 'aartis_delete_admin') then
    create policy "aartis_delete_admin" on public.aartis for delete using (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'programs' and policyname = 'programs_select_published') then
    create policy "programs_select_published" on public.programs for select using (is_published = true or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'programs' and policyname = 'programs_insert_admin') then
    create policy "programs_insert_admin" on public.programs for insert with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'programs' and policyname = 'programs_update_admin') then
    create policy "programs_update_admin" on public.programs for update using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'programs' and policyname = 'programs_delete_admin') then
    create policy "programs_delete_admin" on public.programs for delete using (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'announcements' and policyname = 'announcements_select_published') then
    create policy "announcements_select_published" on public.announcements for select using (is_published = true or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'announcements' and policyname = 'announcements_insert_admin') then
    create policy "announcements_insert_admin" on public.announcements for insert with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'announcements' and policyname = 'announcements_update_admin') then
    create policy "announcements_update_admin" on public.announcements for update using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'announcements' and policyname = 'announcements_delete_admin') then
    create policy "announcements_delete_admin" on public.announcements for delete using (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'videos' and policyname = 'videos_select_published') then
    create policy "videos_select_published" on public.videos for select using (is_published = true or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'videos' and policyname = 'videos_insert_admin') then
    create policy "videos_insert_admin" on public.videos for insert with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'videos' and policyname = 'videos_update_admin') then
    create policy "videos_update_admin" on public.videos for update using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'videos' and policyname = 'videos_delete_admin') then
    create policy "videos_delete_admin" on public.videos for delete using (public.is_admin());
  end if;
end $$;

-- ============================================================================
-- RLS (settings / notifications)
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'donation_info' and policyname = 'donation_select_public') then
    create policy "donation_select_public" on public.donation_info for select using (is_active = true or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'donation_info' and policyname = 'donation_insert_admin') then
    create policy "donation_insert_admin" on public.donation_info for insert with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'donation_info' and policyname = 'donation_update_admin') then
    create policy "donation_update_admin" on public.donation_info for update using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'donation_info' and policyname = 'donation_delete_admin') then
    create policy "donation_delete_admin" on public.donation_info for delete using (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'site_settings' and policyname = 'site_settings_select_public') then
    create policy "site_settings_select_public" on public.site_settings for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'site_settings' and policyname = 'site_settings_insert_admin') then
    create policy "site_settings_insert_admin" on public.site_settings for insert with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'site_settings' and policyname = 'site_settings_update_admin') then
    create policy "site_settings_update_admin" on public.site_settings for update using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'mandal_info' and policyname = 'mandal_select_public') then
    create policy "mandal_select_public" on public.mandal_info for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'mandal_info' and policyname = 'mandal_write_admin') then
    create policy "mandal_write_admin" on public.mandal_info for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'admin_settings' and policyname = 'admin_settings_select_admin') then
    create policy "admin_settings_select_admin" on public.admin_settings for select using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'admin_settings' and policyname = 'admin_settings_insert_admin') then
    create policy "admin_settings_insert_admin" on public.admin_settings for insert with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'admin_settings' and policyname = 'admin_settings_update_admin') then
    create policy "admin_settings_update_admin" on public.admin_settings for update using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_select_member_or_admin') then
    create policy "notifications_select_member_or_admin" on public.notifications for select using (public.is_active_member() or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_insert_admin') then
    create policy "notifications_insert_admin" on public.notifications for insert with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_delete_admin') then
    create policy "notifications_delete_admin" on public.notifications for delete using (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notification_reads' and policyname = 'reads_select_own') then
    create policy "reads_select_own" on public.notification_reads for select using (user_id = public.current_profile_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notification_reads' and policyname = 'reads_insert_own') then
    create policy "reads_insert_own" on public.notification_reads for insert with check (user_id = public.current_profile_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notification_reads' and policyname = 'reads_delete_own') then
    create policy "reads_delete_own" on public.notification_reads for delete using (user_id = public.current_profile_id());
  end if;
end $$;

-- ============================================================================
-- Storage buckets + policies (safe to re-run)
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-photos', 'profile-photos', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('gallery', 'gallery', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('aarti-audio', 'aarti-audio', true, 20971520, array['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/m4a','audio/x-m4a']),
  ('program-images', 'program-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('announcement-images', 'announcement-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('video-thumbnails', 'video-thumbnails', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('site-logos', 'site-logos', true, 5242880, array['image/jpeg','image/png','image/webp','image/svg+xml','image/gif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'content_buckets_select') then
    create policy "content_buckets_select" on storage.objects
      for select using (bucket_id in ('gallery', 'aarti-audio', 'program-images', 'announcement-images', 'video-thumbnails'));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'content_buckets_write_admin') then
    create policy "content_buckets_write_admin" on storage.objects
      for insert to authenticated
      with check (bucket_id in ('gallery', 'aarti-audio', 'program-images', 'announcement-images', 'video-thumbnails') and public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'content_buckets_update_admin') then
    create policy "content_buckets_update_admin" on storage.objects
      for update to authenticated
      using (bucket_id in ('gallery', 'aarti-audio', 'program-images', 'announcement-images', 'video-thumbnails') and public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'content_buckets_delete_admin') then
    create policy "content_buckets_delete_admin" on storage.objects
      for delete to authenticated
      using (bucket_id in ('gallery', 'aarti-audio', 'program-images', 'announcement-images', 'video-thumbnails') and public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'site_logos_select') then
    create policy "site_logos_select" on storage.objects for select using (bucket_id = 'site-logos');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'site_logos_write_admin') then
    create policy "site_logos_write_admin" on storage.objects for insert to authenticated with check (bucket_id = 'site-logos' and public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'site_logos_delete_admin') then
    create policy "site_logos_delete_admin" on storage.objects for delete to authenticated using (bucket_id = 'site-logos' and public.is_admin());
  end if;
end $$;

-- ============================================================================
-- Realtime for everything the admin edits (safe to re-run)
-- ============================================================================

do $$
declare t text;
begin
  foreach t in array array['profiles','mandal_info','donation_info','site_settings','programs','aartis','announcements','gallery','videos','notifications','meetings','festival_years','festival_transactions']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
    end;
  end loop;
end $$;