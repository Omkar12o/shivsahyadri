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