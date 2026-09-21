-- Logo upload for site header
alter table public.site_settings add column if not exists logo_url text;

-- bucket for site logos (public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-logos', 'site-logos', true, 5242880, array['image/jpeg','image/png','image/webp','image/svg+xml','image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "site_logos_select" on storage.objects for select using (bucket_id = 'site-logos');
create policy "site_logos_write_admin" on storage.objects for insert to authenticated with check (bucket_id = 'site-logos' and public.is_admin());
create policy "site_logos_update_admin" on storage.objects for update to authenticated using (bucket_id = 'site-logos' and public.is_admin());
create policy "site_logos_delete_admin" on storage.objects for delete to authenticated using (bucket_id = 'site-logos' and public.is_admin());
