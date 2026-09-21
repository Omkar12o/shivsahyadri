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