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