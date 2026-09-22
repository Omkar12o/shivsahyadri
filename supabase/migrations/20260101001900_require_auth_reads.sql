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