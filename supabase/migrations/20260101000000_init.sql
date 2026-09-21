-- ============================================================================
-- Shivsaydri Ganesh Mandal - Initial schema
-- Enums, tables, constraints, indexes, timestamps, auth trigger
-- ============================================================================

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

-- ============================================================================
-- Auto-create a profile row when a new auth user signs up.
-- All registration fields travel through raw_user_meta_data so the profile
-- is created reliably even when email confirmation is enabled.
-- ============================================================================

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