-- ============================================================================
-- Fix: allow admin-created users (Dashboard "Add user", admin API) to succeed
-- The previous handle_new_user() raised an exception when raw_user_meta_data
-- had no full_name (i.e. when an account is created from the Dashboard or
-- via admin API), which aborted auth user creation with
-- "Database error creating new user". Now full_name/user_id fall back to the
-- local part of the email so the profile is still created.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  new_user_id text := coalesce(nullif(meta->>'user_id', ''), coalesce(nullif(meta->>'username',''), split_part(coalesce(new.email, ''), '@', 1)));
  new_full_name text := coalesce(nullif(meta->>'full_name', ''), split_part(coalesce(new.email, ''), '@', 1));
begin
  if new_user_id <> '' and exists (select 1 from public.profiles where user_id = new_user_id) then
    raise exception using
      message = 'User ID already exists. Please choose another User ID.',
      errcode = '23505';
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
    new_full_name,
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