-- ============================================================================
-- SHIVSAYDRI GANESH MANDAL - ALL IN ONE MIGRATION
-- Combines: 20260101000000_init.sql + 20260101000100_rls.sql
--         + 20260101000200_storage.sql + 20260101000300_functions.sql
-- Run this as a SINGLE migration on a fresh Supabase database.
-- Order is critical - DO NOT reorder sections.
-- ============================================================================

-- ############################################################################
-- SECTION 1: Initial schema - Enums, tables, constraints, indexes, timestamps, auth trigger
-- (from 20260101000000_init.sql)
-- ############################################################################

-- Enums ---------------------------------------------------------------

create type public.user_role as enum ('super_admin', 'admin', 'member');
create type public.aarti_category as enum ('morning', 'afternoon', 'evening', 'night', 'special');
create type public.announcement_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.notification_type as enum ('birthday', 'announcement', 'program', 'aarti', 'system');

-- updated_at helper ----------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles -------------------------------------------------------------

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete cascade,
  full_name text not null,
  user_id text not null unique check (char_length(user_id) >= 3),
  email text unique,
  mobile text unique,
  village text,
  address text,
  date_of_birth date,
  birthday_time time,
birthday_visibility boolean not null default true,
  profile_photo_url text,
  position text,
  bio text,
  display_order integer not null default 0,
  role public.user_role not null default 'member',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles (role);
create index idx_profiles_is_active on public.profiles (is_active);
create index idx_profiles_village on public.profiles (village);
create index idx_profiles_date_of_birth on public.profiles (date_of_birth);
create index idx_profiles_auth_user_id on public.profiles (auth_user_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- aartis ---------------------------------------------------------------

create table public.aartis (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category public.aarti_category not null default 'morning',
  time text not null,
  lyrics text not null default '',
  audio_url text,
  description text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_aartis_is_published on public.aartis (is_published);
create index idx_aartis_category on public.aartis (category);

create trigger aartis_set_updated_at
  before update on public.aartis
  for each row execute function public.set_updated_at();

-- programs -------------------------------------------------------------

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  start_time text not null,
  end_time text,
  description text,
  location text,
  image_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_programs_event_date on public.programs (event_date);
create index idx_programs_is_published on public.programs (is_published);

create trigger programs_set_updated_at
  before update on public.programs
  for each row execute function public.set_updated_at();

-- announcements ----------------------------------------------------------

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null default '',
  image_url text,
  priority public.announcement_priority not null default 'medium',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_announcements_is_published on public.announcements (is_published);
create index idx_announcements_priority on public.announcements (priority);

create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

-- gallery ----------------------------------------------------------------

create table public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  category text not null default 'ganpati',
  event_date date,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_gallery_is_published on public.gallery (is_published);
create index idx_gallery_category on public.gallery (category);

-- videos ------------------------------------------------------------------

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  video_url text not null,
  thumbnail_url text,
  category text not null default 'ganpati',
  description text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_videos_is_published on public.videos (is_published);

create trigger videos_set_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

-- notifications -------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null default '',
  type public.notification_type not null default 'system',
  related_member_id uuid references public.profiles (id) on delete set null,
  related_program_id uuid references public.programs (id) on delete set null,
  birthday_date date,
  created_at timestamptz not null default now()
);

create index idx_notifications_created_at on public.notifications (created_at desc);
create index idx_notifications_type on public.notifications (type);
create index idx_notifications_related_member on public.notifications (related_member_id);

-- One birthday notification per member per date (duplicate prevention)
create unique index idx_notifications_birthday_unique
  on public.notifications (type, birthday_date, related_member_id)
  where type = 'birthday';

-- notification_reads ----------------------------------------------------------

create table public.notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (notification_id, user_id)
);

create index idx_notification_reads_user on public.notification_reads (user_id);

-- donation_info ----------------------------------------------------------------

create table public.donation_info (
  id uuid primary key default gen_random_uuid(),
  mandal_name text not null,
  upi_id text not null,
  upi_qr_url text,
  bank_name text,
  account_number text,
  ifsc_code text,
  account_holder text,
  instructions text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger donation_info_set_updated_at
  before update on public.donation_info
  for each row execute function public.set_updated_at();

-- mandal_info -------------------------------------------------------------------

create table public.mandal_info (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  village text not null,
  established_year integer,
  history text,
  objectives text,
  social_activities text,
  community_activities text,
  previous_years_info text,
  contact_phone text,
  contact_whatsapp text,
  contact_email text,
  address text,
  map_embed_url text,
  social_media jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger mandal_info_set_updated_at
  before update on public.mandal_info
  for each row execute function public.set_updated_at();

-- site_settings -----------------------------------------------------------------

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  ganpati_image_url text,
  countdown_target timestamptz,
  hero_welcome text,
  hero_message text,
  announcements_title text,
  programs_title text,
  gallery_title text,
  birthday_title text,
  donation_title text,
  updated_at timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- admin_settings ----------------------------------------------------------------

create table public.admin_settings (
  id uuid primary key default gen_random_uuid(),
  notification_birthday_enabled boolean not null default true,
  notification_announcement_enabled boolean not null default true,
  member_listing_enabled boolean not null default true,
  gallery_enabled boolean not null default true,
  donations_enabled boolean not null default true,
  birthday_cron_schedule text,
  updated_at timestamptz not null default now()
);

create trigger admin_settings_set_updated_at
  before update on public.admin_settings
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user signs up.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  new_user_id text := coalesce(nullif(meta->>'user_id', ''), split_part(coalesce(new.email, ''), '@', 1));
begin
  if new_user_id <> '' and exists (select 1 from public.profiles where user_id = new_user_id) then
    raise exception using
      message = 'User ID already exists. Please choose another User ID.',
      errcode = '23505';
  end if;

  if meta->>'full_name' is null or meta->>'full_name' = '' then
    raise exception 'full_name is required for registration';
  end if;

  insert into public.profiles (
    auth_user_id,
    full_name,
    user_id,
    email,
    mobile,
    village,
    address,
    date_of_birth,
    birthday_time,
    birthday_visibility,
    profile_photo_url,
    role,
    is_active
  )
  values (
    new.id,
    meta->>'full_name',
    new_user_id,
    nullif(meta->>'contact_email', ''),
    nullif(meta->>'mobile', ''),
    nullif(meta->>'village', ''),
    nullif(meta->>'address', ''),
    case when meta->>'date_of_birth' is not null and meta->>'date_of_birth' <> '' then (meta->>'date_of_birth')::date else null end,
    case when meta->>'birthday_time' is not null and meta->>'birthday_time' <> '' then (meta->>'birthday_time')::time else null end,
    coalesce((meta->>'birthday_visibility')::boolean, true),
    nullif(meta->>'profile_photo_url', ''),
    'member',
    true
  )
  on conflict (auth_user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ############################################################################
-- SECTION 2: Row Level Security - helper functions, policies, column grants, public views
-- (from 20260101000100_rls.sql)
-- ############################################################################

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


-- ############################################################################
-- SECTION 3: Storage buckets and policies
-- (from 20260101000200_storage.sql)
-- ############################################################################

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


-- ############################################################################
-- SECTION 4: Server-side application functions
-- (from 20260101000300_functions.sql)
-- ############################################################################

-- Birthday notification generator -------------------------------------------

create or replace function public.create_birthday_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Kolkata')::date;
  birthday_count integer := 0;
  m record;
begin
  for m in
    select id, full_name
    from public.profiles
    where is_active = true
      and birthday_visibility = true
      and date_of_birth is not null
      and to_char(date_of_birth, 'MM-DD') = to_char(today, 'MM-DD')
  loop
    insert into public.notifications (title, message, type, related_member_id, birthday_date)
    values (
      '🎂 Today''s Birthday',
      'Today is ' || split_part(m.full_name, ' ', 1) || '''s birthday! "Ganesh Mandal Family wishes '
        || split_part(m.full_name, ' ', 1) || ' a very Happy Birthday! 🎉🙏"',
      'birthday',
      m.id,
      today
    )
    on conflict do nothing;

    if found then
      birthday_count := birthday_count + 1;
    end if;
  end loop;

  return birthday_count;
end;
$$;

grant execute on function public.create_birthday_notifications() to service_role;

-- Admin / Edge Function entry point ------------------------------------------

create or replace function public.run_birthday_check()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  result integer;
begin
  if not exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid() and role in ('admin', 'super_admin')
  ) then
    raise exception 'Insufficient permissions to run birthday check.';
  end if;

  select public.create_birthday_notifications() into result;
  return result;
end;
$$;

grant execute on function public.run_birthday_check() to authenticated;

-- Admin member management RPCs -------------------------------------------------

create or replace function public.admin_set_member_active(target_profile_id uuid, active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Insufficient permissions.';
  end if;
  update public.profiles set is_active = active where id = target_profile_id;
end;
$$;

create or replace function public.admin_set_member_role(target_profile_id uuid, new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only a super admin can change member roles.';
  end if;
  if target_profile_id = public.current_profile_id() then
    raise exception 'You cannot change your own role.';
  end if;
  update public.profiles set role = new_role where id = target_profile_id;
end;
$$;

grant execute on function public.admin_set_member_active(uuid, boolean) to authenticated;
grant execute on function public.admin_set_member_role(uuid, public.user_role) to authenticated;

-- Announcements -> member notifications ---------------------------------------

create or replace function public.announcement_created_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_published and new.priority in ('high', 'urgent') then
    insert into public.notifications (title, message, type)
    values (new.title, coalesce(new.message, ''), 'announcement');
  end if;
  return new;
end;
$$;

create trigger announcements_notify_after_insert
  after insert on public.announcements
  for each row execute function public.announcement_created_notification();

create trigger announcements_notify_after_update
  after update on public.announcements
  for each row
  when (new.is_published is distinct from old.is_published
     or new.priority is distinct from old.priority)
  execute function public.announcement_created_notification();

-- ############################################################################
-- SECTION 5: Meetings - Mandal meetings / Committee meetings
-- (from 20260101000400_meetings.sql)
-- ############################################################################

create type public.meeting_status as enum ('scheduled', 'completed', 'cancelled');

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  agenda text,
  meeting_date date not null,
  start_time text not null,
  end_time text,
  location text,
  status public.meeting_status not null default 'scheduled',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_meetings_meeting_date on public.meetings (meeting_date);
create index idx_meetings_is_published on public.meetings (is_published);
create index idx_meetings_status on public.meetings (status);

create trigger meetings_set_updated_at
  before update on public.meetings
  for each row execute function public.set_updated_at();

alter table public.meetings enable row level security;

create policy "meetings_select_published" on public.meetings
  for select using (is_published = true or public.is_admin());
create policy "meetings_insert_admin" on public.meetings
  for insert with check (public.is_admin());
create policy "meetings_update_admin" on public.meetings
  for update using (public.is_admin()) with check (public.is_admin());
create policy "meetings_delete_admin" on public.meetings
  for delete using (public.is_admin());

-- ############################################################################
-- SECTION 6: 2026 Ganpati Festival - Year archive, finance sheet, final pooja
-- (from 20260101000500_festival_2026.sql)
-- ############################################################################

-- ============================================================================
-- 2026 Ganpati Festival - Year archive, finance sheet, final pooja persons
-- ============================================================================

create type public.transaction_type as enum ('income', 'expense');

create table public.festival_years (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique check (year >= 2000 and year <= 2100),
  title text not null,
  theme text,
  description text,
  decoration_theme text,
  final_pooja_person1 text,
  final_pooja_person2 text,
  is_active boolean not null default true,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_festival_years_year on public.festival_years (year desc);
create index idx_festival_years_is_published on public.festival_years (is_published);

create trigger festival_years_set_updated_at
  before update on public.festival_years
  for each row execute function public.set_updated_at();

create table public.festival_transactions (
  id uuid primary key default gen_random_uuid(),
  festival_year_id uuid not null references public.festival_years (id) on delete cascade,
  type public.transaction_type not null,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  description text,
  transaction_date date not null default current_date,
  receipt_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_festival_transactions_year on public.festival_transactions (festival_year_id);
create index idx_festival_transactions_type on public.festival_transactions (type);
create index idx_festival_transactions_date on public.festival_transactions (transaction_date);

create trigger festival_transactions_set_updated_at
  before update on public.festival_transactions
  for each row execute function public.set_updated_at();

-- Finance summary view ---------------------------------------------------

create or replace view public.festival_finance_summary
with (security_invoker = true) as
select
  fy.id as festival_year_id,
  fy.year,
  coalesce(sum(case when ft.type = 'income' then ft.amount else 0 end), 0) as total_income,
  coalesce(sum(case when ft.type = 'expense' then ft.amount else 0 end), 0) as total_expense,
  coalesce(sum(case when ft.type = 'income' then ft.amount else -ft.amount end), 0) as remaining
from public.festival_years fy
left join public.festival_transactions ft on ft.festival_year_id = fy.id
group by fy.id, fy.year;

grant select on public.festival_finance_summary to anon, authenticated;

-- RLS ---------------------------------------------------------------------

alter table public.festival_years enable row level security;
alter table public.festival_transactions enable row level security;

create policy "festival_years_select_published" on public.festival_years
  for select using (is_published = true or public.is_admin());
create policy "festival_years_insert_admin" on public.festival_years
  for insert with check (public.is_admin());
create policy "festival_years_update_admin" on public.festival_years
  for update using (public.is_admin()) with check (public.is_admin());
create policy "festival_years_delete_admin" on public.festival_years
  for delete using (public.is_admin());

create policy "festival_transactions_select_published" on public.festival_transactions
  for select using (
    exists (select 1 from public.festival_years fy where fy.id = festival_year_id and (fy.is_published = true or public.is_admin()))
  );
create policy "festival_transactions_insert_admin" on public.festival_transactions
  for insert with check (public.is_admin());
create policy "festival_transactions_update_admin" on public.festival_transactions
  for update using (public.is_admin()) with check (public.is_admin());
create policy "festival_transactions_delete_admin" on public.festival_transactions
  for delete using (public.is_admin());

-- Seed 2026 year ----------------------------------------------------------

insert into public.festival_years (year, title, theme, description, decoration_theme, is_active, is_published)
values (2026, 'Ganpati Festival 2026', 'Shivsaydri 2026', 'Official 2026 Ganpati festival - Made in 2026', 'Traditional Maharashtra', true, true)
on conflict (year) do nothing;

-- ############################################################################
-- SECTION 7: Realtime Live - gallery, meetings, festival auto-show
-- (from 20260101000600_realtime_live.sql)
-- ############################################################################

do $$ begin alter publication supabase_realtime add table public.gallery; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.meetings; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.festival_years; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.festival_transactions; exception when duplicate_object then null; end $$;
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


-- =============================================================================
-- APPENDED: LATEST MIGRATIONS 00016-00020 (member management, homepage manager,
-- community chat / calendar tables + realtime, auth-gate RLS, homepage defaults)
-- =============================================================================

-- ============================================================
-- FILE: 20260101001600_member_management.sql
-- ============================================================

-- ============================================================================
-- Member Management - admin insert RPC + public directory view upgrade
-- SAFE TO RE-RUN: functions are create-or-replace, view is recreate + grants
-- ============================================================================

-- Admin adds a public Mandal member record directly (no auth login required,
-- so ADMIN ACCOUNT is kept separate from MANDAL MEMBER PROFILE).
create or replace function public.admin_insert_member(
  p_full_name text,
  p_user_id text,
  p_position text,
  p_bio text,
  p_profile_photo_url text,
  p_cloudinary_public_id text,
  p_display_order integer,
  p_is_active boolean
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_base text;
  v_user_id text;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can add members.';
  end if;

  if p_full_name is null or trim(p_full_name) = '' then
    raise exception 'Full name is required.';
  end if;

  -- Prefer an admin-supplied username; otherwise derive one from the name.
  if p_user_id is null or trim(p_user_id) = '' then
    v_base := lower(regexp_replace(trim(p_full_name), '[^a-z0-9]+', '_', 'g'));
  else
    v_base := lower(trim(p_user_id));
  end if;
  -- user_id column requires at least 3 chars
  if char_length(v_base) < 3 then
    v_base := v_base || '_m';
  end if;

  v_slug := v_base;
  v_user_id := v_slug;
  while exists (select 1 from public.profiles where user_id = v_user_id) loop
    v_user_id := v_slug || '_' || substring(gen_random_uuid()::text from 1 for 6);
  end loop;

  insert into public.profiles (
    full_name,
    user_id,
    position,
    bio,
    profile_photo_url,
    cloudinary_public_id,
    display_order,
    is_active,
    role
  ) values (
    trim(p_full_name),
    v_user_id,
    nullif(p_position, ''),
    nullif(p_bio, ''),
    nullif(p_profile_photo_url, ''),
    nullif(p_cloudinary_public_id, ''),
    coalesce(p_display_order, 0),
    coalesce(p_is_active, true),
    'member'
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.admin_insert_member(text, text, text, text, text, text, integer, boolean) to authenticated;

-- ----------------------------------------------------------------------------
-- Public member directory view: expose ONLY the safe, public-facing fields
-- (no email / mobile / address / DOB), ordered display_order -> created_at.
-- Admin accounts are excluded so folders stay separate from public members.
-- ----------------------------------------------------------------------------
-- NOT create-or-replace: replacing an existing view whose columns differ
-- errors with "cannot change name of view column", so drop and recreate.
drop view if exists public.public_member_directory cascade;
create view public.public_member_directory
with (security_barrier = true) as
select id, full_name, user_id, village, profile_photo_url, position, bio, display_order, created_at, role
from public.profiles
where is_active = true and role = 'member'
order by display_order asc, created_at asc;

grant select on public.public_member_directory to anon, authenticated;


-- ============================================================
-- FILE: 20260101001700_homepage_manager.sql
-- ============================================================

-- ============================================================================
-- Homepage Manager - extend site_settings for administered homepage content
-- SAFE TO RE-RUN: all statements are idempotent (add column if not exists).
-- ============================================================================

-- Hero image: reuse existing ganpati_image_url / ganpati_public_id columns
-- (the Ganpati hero image). No duplicate hero_image_url column is created.

alter table public.site_settings add column if not exists about_heading text;
alter table public.site_settings add column if not exists about_description text;
alter table public.site_settings add column if not exists about_image_url text;
alter table public.site_settings add column if not exists about_image_public_id text;
alter table public.site_settings add column if not exists about_button_text text;
alter table public.site_settings add column if not exists about_button_link text;
alter table public.site_settings add column if not exists about_show boolean not null default true;

alter table public.site_settings add column if not exists banner_title text;
alter table public.site_settings add column if not exists banner_subtitle text;
alter table public.site_settings add column if not exists banner_description text;
alter table public.site_settings add column if not exists banner_button_text text;
alter table public.site_settings add column if not exists banner_button_link text;
alter table public.site_settings add column if not exists banner_show boolean not null default true;

alter table public.site_settings add column if not exists members_preview_show boolean not null default true;
alter table public.site_settings add column if not exists members_preview_count integer not null default 4;
alter table public.site_settings add column if not exists gallery_preview_show boolean not null default true;
alter table public.site_settings add column if not exists gallery_preview_count integer not null default 6;

alter table public.site_settings add column if not exists donation_show boolean not null default true;

-- Quick action buttons (Aarti / Programs / Gallery / Donation):
-- stored as jsonb array [ { id, label, icon, order, enabled, destination } ]
alter table public.site_settings add column if not exists quick_actions jsonb;

update public.site_settings
set quick_actions = coalesce(quick_actions, (
  select jsonb_agg(x order by v.ord)
  from (
    values
      ('aarti'::text, 'Aarti'::text, 'music'::text, 0::int, true::bool, '/aarti'::text),
      ('programs', 'Programs', 'calendar', 1, true, '/programs'),
      ('gallery', 'Gallery', 'image', 2, true, '/gallery'),
      ('donation', 'Donation', 'heart', 3, true, '/donation')
  ) as v(id, label, icon, ord, enabled, destination),
  lateral (
    select jsonb_build_object(
      'id', v.id,
      'label', v.label,
      'icon', v.icon,
      'order', v.ord,
      'enabled', v.enabled,
      'destination', v.destination
    ) as x
  ) as _
))
where quick_actions is null;

-- Real-time broadcast is already enabled for site_settings
-- (supabase_realtime publication), so admin changes stream to public pages.

-- RLS: site_settings already has public select + admin-only insert/update
-- policies; the new columns inherit them, no change required.


-- ============================================================
-- FILE: 20260101001800_community_mandal.sql
-- ============================================================

-- ============================================================================
-- Community features - push subscriptions, community chat, calendar events
-- SAFE TO RUN ON EXISTING DATABASE: tables/policies created only if missing.
-- ============================================================================

-- ============================================================================
-- 1. push_subscriptions (web-push / VAPID)
-- One member can have many devices. Invalid subscriptions become inactive
-- (no hard delete, so the history remains for statistics).
-- ============================================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  device_type text not null default 'unknown',
  browser text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.push_subscriptions is
  'Web Push subscriptions per device. Endpoint is unique; devices are deactivated (not deleted) when they stop working.';

drop index if exists push_subscriptions_auth_user_idx;
create index push_subscriptions_auth_user_idx on public.push_subscriptions (auth_user_id) where active = true;

-- ============================================================================
-- 2. chat_messages (member community chat - text only)
-- ============================================================================

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null
);

comment on table public.chat_messages is
  'Text-only member community chat. Admin deletes are soft deletes (deleted_at); only super_admin can hard delete.';

drop index if exists chat_messages_created_idx;
create index chat_messages_created_idx on public.chat_messages (created_at desc);

-- ============================================================================
-- 3. calendar_events (Mandal calendar; programs/meetings are also merged in
-- the calendar UI from their own tables - no duplication)
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'calendar_event_type') then
    create type public.calendar_event_type as enum
      ('aarti', 'program', 'meeting', 'festival', 'announcement', 'donation', 'cultural', 'other');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'calendar_event_status') then
    create type public.calendar_event_status as enum ('scheduled', 'cancelled', 'completed');
  end if;
end $$;

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text,
  event_type public.calendar_event_type not null default 'other',
  start_datetime timestamptz not null,
  end_datetime timestamptz,
  all_day boolean not null default false,
  location text,
  status public.calendar_event_status not null default 'scheduled',
  is_public boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.calendar_events is
  'Admin-managed calendar events. Times are stored as timestamptz and displayed in Asia/Kolkata.';

drop index if exists calendar_events_start_idx;
create index calendar_events_start_idx on public.calendar_events (start_datetime);

drop index if exists calendar_events_type_idx;
create index calendar_events_type_idx on public.calendar_events (event_type, status, is_public);

-- ============================================================================
-- Triggers: keep updated_at fresh
-- ============================================================================

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists set_chat_messages_updated_at on public.chat_messages;
create trigger set_chat_messages_updated_at
  before update on public.chat_messages
  for each row execute function public.set_updated_at();

drop trigger if exists set_calendar_events_updated_at on public.calendar_events;
create trigger set_calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS toggle
-- ============================================================================

alter table public.push_subscriptions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.calendar_events enable row level security;

-- ============================================================================
-- RLS policies
-- ============================================================================

-- push_subscriptions: a member manages only their own subscriptions.
-- (The push sender runs with the service role and bypasses RLS.)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_sub_select_own') then
    create policy "push_sub_select_own" on public.push_subscriptions
      for select to authenticated using (auth_user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_sub_insert_own') then
    create policy "push_sub_insert_own" on public.push_subscriptions
      for insert to authenticated with check (auth_user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_sub_update_own') then
    create policy "push_sub_update_own" on public.push_subscriptions
      for update to authenticated using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_sub_delete_own') then
    create policy "push_sub_delete_own" on public.push_subscriptions
      for delete to authenticated using (auth_user_id = auth.uid());
  end if;
end $$;

-- chat_messages: all authenticated members read + send; admin soft-deletes;
-- super_admin hard-deletes.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_select_member') then
    create policy "chat_select_member" on public.chat_messages
      for select to authenticated using (deleted_at is null);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_insert_member') then
    create policy "chat_insert_member" on public.chat_messages
      for insert to authenticated with check (public.is_active_member() and user_id = public.current_profile_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_soft_delete_admin') then
    create policy "chat_soft_delete_admin" on public.chat_messages
      for update to authenticated using (public.is_admin() and deleted_at is null) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_hard_delete_super') then
    create policy "chat_hard_delete_super" on public.chat_messages
      for delete to authenticated using (public.is_super_admin());
  end if;
end $$;

-- calendar_events: public reads public events; admins manage everything.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'calendar_events' and policyname = 'cal_select_public') then
    create policy "cal_select_public" on public.calendar_events
      for select using (is_public = true or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'calendar_events' and policyname = 'cal_insert_admin') then
    create policy "cal_insert_admin" on public.calendar_events
      for insert with check (public.is_admin() and created_by = public.current_profile_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'calendar_events' and policyname = 'cal_update_admin') then
    create policy "cal_update_admin" on public.calendar_events
      for update using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'calendar_events' and policyname = 'cal_delete_admin') then
    create policy "cal_delete_admin" on public.calendar_events
      for delete using (public.is_admin());
  end if;
end $$;

-- ============================================================================
-- RPC: deactivate a push subscription by endpoint (server-side push sender)
-- ============================================================================

create or replace function public.deactivate_push_subscription(p_endpoint text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.push_subscriptions
  set active = false, updated_at = now()
  where endpoint = p_endpoint;
$$;

revoke all on function public.deactivate_push_subscription(text) from public;
grant execute on function public.deactivate_push_subscription(text) to service_role;

-- ============================================================================
-- Realtime publication
-- ============================================================================

do $$
declare t text;
begin
  foreach t in array array['push_subscriptions','chat_messages','calendar_events']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
    end;
  end loop;
end $$;

grant select on public.push_subscriptions, public.chat_messages, public.calendar_events to anon, authenticated;


-- ============================================================
-- FILE: 20260101001900_require_auth_reads.sql
-- ============================================================

-- ============================================================================
-- Require authentication for ALL Mandal content reads (private app).
--
-- The website is now a private Ganesh Mandal app: the install/login screens are
-- the only public pages. This migration seals the database so unauthenticated
-- (anon) users can NEVER read content, settings or member data.
--
-- Admins (and super admins) still have full access. Idempotent / safe to re-run.
-- ============================================================================

-- Content tables: reads require an authenticated session -------------------
-- (aartis, programs, announcements, gallery, videos)

alter table public.aartis enable row level security;
drop policy if exists "aartis_select_published" on public.aartis;
create policy "aartis_select_authenticated" on public.aartis
  for select using (auth.uid() is not null and (is_published = true or public.is_admin()));

alter table public.programs enable row level security;
drop policy if exists "programs_select_published" on public.programs;
create policy "programs_select_authenticated" on public.programs
  for select using (auth.uid() is not null and (is_published = true or public.is_admin()));

alter table public.announcements enable row level security;
drop policy if exists "announcements_select_published" on public.announcements;
create policy "announcements_select_authenticated" on public.announcements
  for select using (auth.uid() is not null and (is_published = true or public.is_admin()));

alter table public.gallery enable row level security;
drop policy if exists "gallery_select_published" on public.gallery;
create policy "gallery_select_authenticated" on public.gallery
  for select using (auth.uid() is not null and (is_published = true or public.is_admin()));

alter table public.videos enable row level security;
drop policy if exists "videos_select_published" on public.videos;
create policy "videos_select_authenticated" on public.videos
  for select using (auth.uid() is not null and (is_published = true or public.is_admin()));

-- Donation info ------------------------------------------------------------

alter table public.donation_info enable row level security;
drop policy if exists "donation_select_public" on public.donation_info;
create policy "donation_select_authenticated" on public.donation_info
  for select using (auth.uid() is not null and (is_active = true or public.is_admin()));

-- Settings / mandal info ----------------------------------------------------

alter table public.site_settings enable row level security;
drop policy if exists "site_settings_select_public" on public.site_settings;
create policy "site_settings_select_authenticated" on public.site_settings
  for select using (auth.uid() is not null);

alter table public.mandal_info enable row level security;
drop policy if exists "mandal_select_public" on public.mandal_info;
create policy "mandal_select_authenticated" on public.mandal_info
  for select using (auth.uid() is not null);

-- Member directory view -----------------------------------------------------
-- The deliberately public-safe view (name/user_id/village only) still exists but
-- reads now ALSO require an authenticated session.
revoke select on public.public_member_directory from anon;
grant select on public.public_member_directory to authenticated;

-- Festival finance summary (aggregate) --------------------------------------
revoke select on public.festival_finance_summary from anon;
grant select on public.festival_finance_summary to authenticated;


-- ============================================================
-- FILE: 20260101002000_seed_home_defaults.sql
-- ============================================================

-- ============================================================================
-- Seed default homepage / mandal / donation data (idempotent, safe to re-run).
--
-- The Home page is fully dynamic (site_settings / mandal_info / donation_info +
-- realtime), but on a fresh database those tables are empty, so the page shows
-- hardcoded fallbacks and "looks static". This migration inserts sensible
-- defaults once so the homepage populates from the database immediately and
-- reacts to admin edits in real time.
-- ============================================================================

-- site_settings ---------------------------------------------------------------
insert into public.site_settings (
  hero_welcome,
  hero_message,
  announcements_title,
  programs_title,
  gallery_title,
  donation_title,
  banner_title,
  banner_subtitle,
  banner_description,
  banner_button_text,
  banner_button_link,
  about_heading,
  about_description,
  about_button_text,
  about_button_link,
  gallery_preview_count,
  quick_actions
)
select
  '॥ श्री गणेशाय नमः ॥',
  'Welcome to Shivsaydri Ganesh Mandal, Umarkhanchan',
  'Recent Announcements',
  'Today''s Program',
  'Latest Memories',
  'Support Our Mandal',
  'Ganesh Chaturthi Festival',
  'Celebrating 2026 with devotion and joy',
  'Join us for aartis, cultural programs and seva during the festival season.',
  'View 2026 →',
  '/festival/2026',
  'About our Mandal',
  'We are a community of devotees celebrating Ganesh Chaturthi together every year with aartis, cultural programs and community seva.',
  'Learn More',
  '/contact',
  6,
  '[{"id":"aarti","label":"Aarti","icon":"music","order":0,"enabled":true,"destination":"/aarti"},{"id":"programs","label":"Programs","icon":"calendar","order":1,"enabled":true,"destination":"/programs"},{"id":"gallery","label":"Gallery","icon":"image","order":2,"enabled":true,"destination":"/gallery"},{"id":"donation","label":"Donation","icon":"heart","order":3,"enabled":true,"destination":"/donation"}]'::jsonb
where not exists (select 1 from public.site_settings);

-- mandal_info -----------------------------------------------------------------
insert into public.mandal_info (name, village, contact_phone, contact_email, address)
select 'Shivsaydri Ganesh Mandal', 'Umarkhanchan', null, null, null
where not exists (select 1 from public.mandal_info);

-- donation_info ---------------------------------------------------------------
-- upi_id is empty by default so the Donate section stays hidden until an admin
-- enters their real UPI id / QR code from the Admin panel.
insert into public.donation_info (mandal_name, upi_id)
select 'Shivsaydri Ganesh Mandal', ''
where not exists (select 1 from public.donation_info);




-- =============================================================================
-- APPENDED: 20260101002100_disable_email_confirmation.sql (instant member login)
-- =============================================================================

-- ============================================================================
-- Make member signup -> login instant (idempotent, safe to re-run).
--
-- Problem: with Supabase email confirmation ON (the default), a member who
-- fills the Create Account form is BLOCKED from logging in until they open a
-- verification link. This migration turns on auto-confirm so the account is
-- usable immediately, and confirms any accounts that are already stuck.
--
-- Equivalent dashboard setting (if you prefer clicking instead):
--   Supabase Dashboard -> Authentication -> Sign In / Up -> Email
--   -> turn OFF "Confirm email" -> Save.
-- ============================================================================

-- 1. Turn on auto-confirm (GoTrue reads auth.config live) --------------------
do $$
declare
  v_type text;
begin
  if to_regclass('auth.config') is null then
    raise notice 'auth.config not found - skip auto-confirm';
    return;
  end if;

  select data_type into v_type
  from information_schema.columns
  where table_schema = 'auth'
    and table_name   = 'config'
    and column_name  = 'mailer_autoconfirm';

  if v_type is null then
    raise notice 'auth.config.mailer_autoconfirm not found - skip';
  elsif v_type = 'boolean' then
    execute 'update auth.config set mailer_autoconfirm = true';
    raise notice 'mailer_autoconfirm set to true (boolean)';
  else
    execute 'update auth.config set mailer_autoconfirm = ''on''';
    raise notice 'mailer_autoconfirm set to ''on'' (text)';
  end if;
end $$;

-- 2. Confirm every account that is stuck waiting for the email link ---------
--    (accounts already created before this fix). Note: auth.users.confirmed_at
--    is a GENERATED column in newer Supabase - it is derived automatically, so
--    we only set email_confirmed_at here.
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;

-- ############################################################################
-- SECTION 23: Member authentication reliability fixes
-- (from 20260101002200_member_auth_fix.sql)
-- ############################################################################

create or replace function public.get_email_for_user_id(candidate text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select au.email from auth.users au where au.id = p.auth_user_id),
    p.email,
    p.user_id || '@members.shivsaydri.local'
  )
  from public.profiles p
  where (lower(p.user_id) = lower(candidate) or lower(p.email) = lower(candidate))
    and p.is_active = true
  order by (p.email is not null) desc
  limit 1
$$;

grant execute on function public.get_email_for_user_id(text) to anon, authenticated;

create or replace function public.is_user_id_taken(candidate text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where lower(user_id) = lower(candidate)
  )
$$;

grant execute on function public.is_user_id_taken(text) to anon, authenticated;


-- ============================================================================
-- ============================================================================
-- FILE: 20260101002300_realtime_member_alerts.sql
--
-- Guarantees that admin announcements & notifications reach members in real
-- time (within seconds). Ensures every table the member app listens to is in
-- the SUPABASE_REALTIME publication.
--
-- BULLETPROOF: this script cannot fail. Every table name is checked with
-- to_regclass() before being added, so a name that does not exist (for example
-- "chat_rooms") is simply skipped instead of raising 42P01. It is fully
-- idempotent and safe to re-run.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'notifications',
    'notification_reads',
    'announcements',
    'profiles',
    'site_settings',
    'donation_info',
    'mandal_info',
    'aartis',
    'gallery',
    'videos',
    'meetings',
    'calendar_events',
    'chat_messages'
  ]
  loop
    if to_regclass(format('public.%I', t)) is not null then
      begin
        execute format('alter publication supabase_realtime add table public.%I', t);
      exception
        when duplicate_object then null;
      end;
    end if;
  end loop;
end $$;

do $$
begin
  if to_regclass('public.notification_reads') is not null then
    execute 'grant select on public.notification_reads to anon, authenticated';
  end if;
end $$;

-- ============================================================================
-- ============================================================================
-- FILE: 20260101002400_chat_permissions.sql
--
-- Member community chat permissions:
--   * members READ all messages incl. soft-deleted (deleted placeholder)
--   * members may only SOFT-DELETE their OWN message (content is cleared)
--   * admins keep soft-delete of any message, super admins keep hard delete
--   * chat_messages.message drops NOT NULL so deleted content is purged
--   * a trigger blocks any OTHER kind of UPDATE (no text editing)
-- Idempotent: safe to re-run.
-- ============================================================================

do $$
begin
  alter table public.chat_messages alter column message drop not null;
exception
  when undefined_table then null;
end $$;

drop policy if exists "chat_select_member" on public.chat_messages;
create policy "chat_select_member"
  on public.chat_messages for select
  to authenticated
  using (true);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_messages'
      and policyname = 'chat_update_own'
  ) then
    create policy "chat_update_own"
      on public.chat_messages for update
      to authenticated
      using (user_id = public.current_profile_id())
      with check (user_id = public.current_profile_id());
  end if;
end $$;

create or replace function public.chat_message_soft_delete_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.deleted_at is null then
    raise exception 'chat: only soft-delete updates are allowed';
  end if;
  if old.deleted_at is not null then
    raise exception 'chat: message was already deleted';
  end if;
  return new;
end;
$$;

drop trigger if exists chat_messages_soft_delete_guard on public.chat_messages;
create trigger chat_messages_soft_delete_guard
  before update on public.chat_messages
  for each row execute function public.chat_message_soft_delete_guard();