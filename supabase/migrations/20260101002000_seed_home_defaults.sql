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