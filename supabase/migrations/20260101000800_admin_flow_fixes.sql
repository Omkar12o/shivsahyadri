-- ============================================================================
-- Admin flow fixes:
-- 1. Member directory fields on profiles (position, bio, display_order)
-- 2. Public member directory view with the new fields
-- 3. SECURITY DEFINER RPC so admins can update the new (non-granted) columns
-- 4. Realtime for the public content tables so admin edits appear instantly
-- ============================================================================

-- 1. New member directory columns -------------------------------------------

alter table public.profiles add column if not exists position text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists display_order integer not null default 0;

create index if not exists idx_profiles_display_order on public.profiles (display_order);

-- 2. Public member directory view (never exposes email/mobile/address/DOB) --

create or replace view public.public_member_directory
with (security_barrier = true) as
select id, full_name, user_id, village, profile_photo_url, position, display_order, role
from public.profiles
where is_active = true
order by display_order asc, full_name asc;

grant select on public.public_member_directory to anon, authenticated;

-- 3. Admin update RPC ---------------------------------------------------------
-- Column-level grants only allow members to update their own basic columns, and
-- the new directory columns are not granted at all. This RPC is the only way to
-- update them, gated behind is_admin().

create or replace function public.admin_update_member(target_profile_id uuid, fields jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed text[] := array['full_name', 'mobile', 'village', 'position', 'bio', 'profile_photo_url', 'display_order'];
  k text;
begin
  if not public.is_admin() then
    raise exception 'Insufficient permissions.';
  end if;

  if not exists (select 1 from public.profiles where id = target_profile_id) then
    raise exception 'Member not found.';
  end if;

  for k in select jsonb_object_keys(fields)
  loop
    if not k = any(allowed) then
      raise exception 'Field "%" is not allowed.', k;
    end if;
  end loop;

  update public.profiles set
    full_name = coalesce(nullif(fields->>'full_name', ''), full_name),
    mobile = case when fields ? 'mobile' then nullif(fields->>'mobile', '') else mobile end,
    village = case when fields ? 'village' then nullif(fields->>'village', '') else village end,
    position = case when fields ? 'position' then nullif(fields->>'position', '') else position end,
    bio = case when fields ? 'bio' then nullif(fields->>'bio', '') else bio end,
    profile_photo_url = case when fields ? 'profile_photo_url' then nullif(fields->>'profile_photo_url', '') else profile_photo_url end,
    display_order = case when fields ? 'display_order' then coalesce((fields->>'display_order')::integer, display_order) else display_order end
  where id = target_profile_id;
end;
$$;

grant execute on function public.admin_update_member(uuid, jsonb) to authenticated;

-- 4. Realtime for public content tables ---------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.programs;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.aartis;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.announcements;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.site_settings;
exception
  when duplicate_object then null;
end $$;