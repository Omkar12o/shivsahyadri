-- ============================================================================
-- Admin Panel v2 - schema additions
-- SAFE TO RUN ON EXISTING DATABASE (idempotent): paste into Supabase SQL editor
-- 1. cloudinary_public_id columns (so Hard Delete can remove the remote file)
-- 2. Announcement popup + date range supports
-- 3. Only Admin + Member model: existing super_admin -> admin
-- 4. Admin member-profile RPCs accept cloudinary_public_id
-- ============================================================================

alter table public.site_settings add column if not exists logo_public_id text;
alter table public.site_settings add column if not exists ganpati_public_id text;
alter table public.gallery add column if not exists cloudinary_public_id text;
alter table public.profiles add column if not exists cloudinary_public_id text;
alter table public.programs add column if not exists image_public_id text;
alter table public.aartis add column if not exists audio_public_id text;
alter table public.announcements add column if not exists image_public_id text;
alter table public.announcements add column if not exists popup_enabled boolean not null default false;
alter table public.announcements add column if not exists start_date date;
alter table public.announcements add column if not exists end_date date;
alter table public.donation_info add column if not exists upi_qr_public_id text;

-- ============================================================================
-- Only Admin + Member role model
-- ============================================================================

update public.profiles set role = 'admin' where role = 'super_admin';

-- Permit admins to change member roles (only Admin/Member values are exposed)
create or replace function public.admin_set_member_role(target_profile_id uuid, new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can change member roles.';
  end if;
  if target_profile_id = public.current_profile_id() then
    raise exception 'You cannot change your own role.';
  end if;
  update public.profiles set role = new_role where id = target_profile_id;
end;
$$;

grant execute on function public.admin_set_member_role(uuid, public.user_role) to authenticated;

-- Hard delete available to admins (only Admin + Member model)
create or replace function public.admin_hard_delete_member(target_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user uuid;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can permanently delete members.';
  end if;
  if target_profile_id = public.current_profile_id() then
    raise exception 'You cannot delete your own account.';
  end if;

  select auth_user_id into v_auth_user
  from public.profiles
  where id = target_profile_id;

  if not found then
    raise exception 'Member not found.';
  end if;

  if v_auth_user is not null then
    delete from auth.users where id = v_auth_user;
  else
    delete from public.profiles where id = target_profile_id;
  end if;
end;
$$;

grant execute on function public.admin_hard_delete_member(uuid) to authenticated;

-- ============================================================================
-- admin_update_member now also saves the photo public_id (Cloudinary)
-- ============================================================================

create or replace function public.admin_update_member(target_profile_id uuid, fields jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed text[] := array['full_name', 'mobile', 'village', 'position', 'bio', 'profile_photo_url', 'display_order', 'cloudinary_public_id'];
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
    display_order = case when fields ? 'display_order' then coalesce((fields->>'display_order')::integer, display_order) else display_order end,
    cloudinary_public_id = case when fields ? 'cloudinary_public_id' then nullif(fields->>'cloudinary_public_id', '') else cloudinary_public_id end
  where id = target_profile_id;
end;
$$;

grant execute on function public.admin_update_member(uuid, jsonb) to authenticated;