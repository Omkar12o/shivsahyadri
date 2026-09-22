-- =============================================================================
-- COMBINED MISSING MIGRATIONS - apply in order in Supabase Dashboard -> SQL Editor
-- Migrations 00016 - 00022 (member management, homepage manager, community chat
-- / calendar tables, auth-gate RLS, homepage defaults, and instant login).
-- All statements are idempotent - safe to run even if some were already applied.
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
create index if not exists push_subscriptions_auth_user_idx on public.push_subscriptions (auth_user_id) where active = true;

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
create index if not exists chat_messages_created_idx on public.chat_messages (created_at desc);

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
create index if not exists calendar_events_start_idx on public.calendar_events (start_datetime);

drop index if exists calendar_events_type_idx;
create index if not exists calendar_events_type_idx on public.calendar_events (event_type, status, is_public);

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
drop policy if exists "aartis_select_authenticated" on public.aartis;
create policy "aartis_select_authenticated" on public.aartis
  for select using (auth.uid() is not null and (is_published = true or public.is_admin()));

alter table public.programs enable row level security;
drop policy if exists "programs_select_published" on public.programs;
drop policy if exists "programs_select_authenticated" on public.programs;
create policy "programs_select_authenticated" on public.programs
  for select using (auth.uid() is not null and (is_published = true or public.is_admin()));

alter table public.announcements enable row level security;
drop policy if exists "announcements_select_published" on public.announcements;
drop policy if exists "announcements_select_authenticated" on public.announcements;
create policy "announcements_select_authenticated" on public.announcements
  for select using (auth.uid() is not null and (is_published = true or public.is_admin()));

alter table public.gallery enable row level security;
drop policy if exists "gallery_select_published" on public.gallery;
drop policy if exists "gallery_select_authenticated" on public.gallery;
create policy "gallery_select_authenticated" on public.gallery
  for select using (auth.uid() is not null and (is_published = true or public.is_admin()));

alter table public.videos enable row level security;
drop policy if exists "videos_select_published" on public.videos;
drop policy if exists "videos_select_authenticated" on public.videos;
create policy "videos_select_authenticated" on public.videos
  for select using (auth.uid() is not null and (is_published = true or public.is_admin()));

-- Donation info ------------------------------------------------------------

alter table public.donation_info enable row level security;
drop policy if exists "donation_select_public" on public.donation_info;
drop policy if exists "donation_select_authenticated" on public.donation_info;
create policy "donation_select_authenticated" on public.donation_info
  for select using (auth.uid() is not null and (is_active = true or public.is_admin()));

-- Settings / mandal info ----------------------------------------------------

alter table public.site_settings enable row level security;
drop policy if exists "site_settings_select_public" on public.site_settings;
drop policy if exists "site_settings_select_authenticated" on public.site_settings;
create policy "site_settings_select_authenticated" on public.site_settings
  for select using (auth.uid() is not null);

alter table public.mandal_info enable row level security;
drop policy if exists "mandal_select_public" on public.mandal_info;
drop policy if exists "mandal_select_authenticated" on public.mandal_info;
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


-- ============================================================
-- FILE: 20260101002100_disable_email_confirmation.sql
-- ============================================================

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


-- ============================================================
-- FILE: 20260101002200_member_auth_fix.sql
-- ============================================================

-- ============================================================================
-- Member authentication reliability fixes (idempotent, safe to re-run)
--
-- 1. get_email_for_user_id: username OR email lookup, case-insensitive, so a
--    member can always log in with their username regardless of capitalisation
--    (e.g. "Rahul123" typed as "rahul123") and also with their full email.
-- 2. is_user_id_taken: case-insensitive availability check so nobody can
--    register a username that only differs from an existing one by case.
-- ============================================================================

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