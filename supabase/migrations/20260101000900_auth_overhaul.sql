-- ============================================================================
-- Auth overhaul:
-- 1. profiles.email always mirrors the real auth email (fixes username login
--    when a member's contact email differs from their auth email).
-- 2. get_email_for_user_id resolves the true Supabase Auth email so members can
--    log in with username without leaking passwords or other profile data.
-- 3. admin_set_member_role is restricted to super_admin only (normal admins can
--    edit members but cannot promote people to admin).
-- 4. Realtime for meetings / videos / donation_info so admin edits appear on
--    public pages instantly.
-- ============================================================================

-- 1. Profile auto-creation now stores the actual auth email -------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  new_user_id text := coalesce(nullif(meta->>'user_id', ''), coalesce(nullif(meta->>'username',''), split_part(coalesce(new.email, ''), '@', 1)));
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
    nullif(new.email, ''),
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

-- Backfill any profiles whose email does not match their auth email ------------
update public.profiles p
set email = au.email
from auth.users au
where p.auth_user_id = au.id
  and (p.email is null or p.email <> au.email);

-- 2. Secure username -> email resolution --------------------------------------
-- Returns ONLY the single auth email needed for signInWithPassword. No
-- passwords, no phone, no address, no role leakage.
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
  where p.user_id = candidate and p.is_active = true
  limit 1
$$;

grant execute on function public.get_email_for_user_id(text) to anon, authenticated;

-- 3. Only super_admin can change roles ---------------------------------------

create or replace function public.admin_set_member_role(target_profile_id uuid, new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can change member roles.';
  end if;
  if not exists (select 1 from public.profiles where id = target_profile_id) then
    raise exception 'Member not found.';
  end if;
  update public.profiles set role = new_role where id = target_profile_id;
end;
$$;

grant execute on function public.admin_set_member_role(uuid, public.user_role) to authenticated;

-- 4. Realtime for remaining public content ------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.videos;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.meetings;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.gallery;
exception
  when duplicate_object then null;
end $$;