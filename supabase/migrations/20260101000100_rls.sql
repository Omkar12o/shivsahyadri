-- ============================================================================
-- Row Level Security - helper functions, policies, column grants, public views
-- ============================================================================

-- Helper functions -------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid() and role in ('admin', 'super_admin') and is_active
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid() and role = 'super_admin' and is_active
  );
$$;

create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid() and is_active
  );
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid()
$$;

create or replace function public.is_user_id_taken(candidate text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where user_id = candidate)
$$;

-- Resolve the auth email used for password sign-in from a User ID.
-- Used so members can log in with their User ID instead of email.
create or replace function public.get_email_for_user_id(candidate text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(email, user_id || '@members.shivsaydri.local')
  from public.profiles
  where user_id = candidate and is_active = true
  limit 1
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;
grant execute on function public.is_active_member() to anon, authenticated;
grant execute on function public.current_profile_id() to anon, authenticated;
grant execute on function public.is_user_id_taken(text) to anon, authenticated;
grant execute on function public.get_email_for_user_id(text) to anon, authenticated;

-- public_member_directory view -------------------------------------------
-- Exposes ONLY non-private fields of active members. Never includes email,
-- mobile, address, or date_of_birth.

create or replace view public.public_member_directory
with (security_barrier = true) as
select id, full_name, user_id, village, profile_photo_url, position, display_order, role
from public.profiles
where is_active = true
order by display_order asc, full_name asc;

grant select on public.public_member_directory to anon, authenticated;

-- RLS on profiles --------------------------------------------------------

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles
  for select
  using (auth.uid() = auth_user_id or public.is_admin());

create policy "profiles_insert_own" on public.profiles
  for insert
  with check (auth.uid() = auth_user_id);

create policy "profiles_update_own_row" on public.profiles
  for update
  using (auth.uid() = auth_user_id or public.is_admin())
  with check (auth.uid() = auth_user_id or public.is_admin());

create policy "profiles_delete_admin" on public.profiles
  for delete
  using (public.is_admin());

-- Members must never change their own role/status/user_id (column-level).
revoke update on public.profiles from anon, authenticated;
grant update (full_name, email, mobile, village, address, date_of_birth, birthday_time, birthday_visibility, profile_photo_url) on public.profiles to authenticated;

-- RLS on content tables --------------------------------------------------

alter table public.aartis enable row level security;
alter table public.programs enable row level security;
alter table public.announcements enable row level security;
alter table public.gallery enable row level security;
alter table public.videos enable row level security;

create policy "aartis_select_published" on public.aartis
  for select using (is_published = true or public.is_admin());
create policy "aartis_insert_admin" on public.aartis
  for insert with check (public.is_admin());
create policy "aartis_update_admin" on public.aartis
  for update using (public.is_admin()) with check (public.is_admin());
create policy "aartis_delete_admin" on public.aartis
  for delete using (public.is_admin());

create policy "programs_select_published" on public.programs
  for select using (is_published = true or public.is_admin());
create policy "programs_insert_admin" on public.programs
  for insert with check (public.is_admin());
create policy "programs_update_admin" on public.programs
  for update using (public.is_admin()) with check (public.is_admin());
create policy "programs_delete_admin" on public.programs
  for delete using (public.is_admin());

create policy "announcements_select_published" on public.announcements
  for select using (is_published = true or public.is_admin());
create policy "announcements_insert_admin" on public.announcements
  for insert with check (public.is_admin());
create policy "announcements_update_admin" on public.announcements
  for update using (public.is_admin()) with check (public.is_admin());
create policy "announcements_delete_admin" on public.announcements
  for delete using (public.is_admin());

create policy "gallery_select_published" on public.gallery
  for select using (is_published = true or public.is_admin());
create policy "gallery_insert_admin" on public.gallery
  for insert with check (public.is_admin());
create policy "gallery_update_admin" on public.gallery
  for update using (public.is_admin()) with check (public.is_admin());
create policy "gallery_delete_admin" on public.gallery
  for delete using (public.is_admin());

create policy "videos_select_published" on public.videos
  for select using (is_published = true or public.is_admin());
create policy "videos_insert_admin" on public.videos
  for insert with check (public.is_admin());
create policy "videos_update_admin" on public.videos
  for update using (public.is_admin()) with check (public.is_admin());
create policy "videos_delete_admin" on public.videos
  for delete using (public.is_admin());

-- RLS on notifications / notification_reads ------------------------------

alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;

create policy "notifications_select_member_or_admin" on public.notifications
  for select using (public.is_active_member() or public.is_admin());
create policy "notifications_insert_admin" on public.notifications
  for insert with check (public.is_admin());
create policy "notifications_update_admin" on public.notifications
  for update using (public.is_admin()) with check (public.is_admin());
create policy "notifications_delete_admin" on public.notifications
  for delete using (public.is_admin());

create policy "reads_select_own" on public.notification_reads
  for select using (user_id = public.current_profile_id()); 
create policy "reads_insert_own" on public.notification_reads
  for insert with check (user_id = public.current_profile_id());
create policy "reads_update_own" on public.notification_reads
  for update using (user_id = public.current_profile_id()) with check (user_id = public.current_profile_id());
create policy "reads_delete_own" on public.notification_reads
  for delete using (user_id = public.current_profile_id());

-- RLS on settings --------------------------------------------------------

alter table public.donation_info enable row level security;
alter table public.mandal_info enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_settings enable row level security;

create policy "donation_select_public" on public.donation_info
  for select using (is_active = true or public.is_admin());
create policy "donation_insert_admin" on public.donation_info
  for insert with check (public.is_admin());
create policy "donation_update_admin" on public.donation_info
  for update using (public.is_admin()) with check (public.is_admin());
create policy "donation_delete_admin" on public.donation_info
  for delete using (public.is_admin());

create policy "mandal_select_public" on public.mandal_info
  for select using (true);
create policy "mandal_write_admin" on public.mandal_info
  for all using (public.is_admin()) with check (public.is_admin());

create policy "site_settings_select_public" on public.site_settings
  for select using (true);
create policy "site_settings_insert_super_admin" on public.site_settings
  for insert with check (public.is_super_admin() or public.is_admin());
create policy "site_settings_update_super_admin" on public.site_settings
  for update using (public.is_super_admin() or public.is_admin()) with check (public.is_super_admin() or public.is_admin());

create policy "admin_settings_select_admin" on public.admin_settings
  for select using (public.is_admin());
create policy "admin_settings_insert_admin" on public.admin_settings
  for insert with check (public.is_admin());
create policy "admin_settings_update_admin" on public.admin_settings
  for update using (public.is_admin()) with check (public.is_admin());

-- Realtime for notifications ---------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;