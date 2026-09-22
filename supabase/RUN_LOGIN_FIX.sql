-- ============================================================================
-- RUN_LOGIN_FIX.sql
--
-- Run ONCE in the Supabase Dashboard SQL editor to make MEMBER LOGIN work
-- instantly (no email confirmation dance). Bulletproof + idempotent: every
-- step is guarded, safe to re-run. Paste the FULL contents below.
--
-- What it fixes:
--   1. Auto-confirms EVERY new account the moment it is created, so a member
--      can log in the second they finish the Create Account form. This does
--      NOT depend on the Dashboard "Confirm email" toggle, so it always works.
--   2. Confirms any EXISTING accounts that are still stuck waiting.
--   3. Re-creates the username->email resolver (get_email_for_user_id) and the
--      username availability check so login by USERNAME or EMAIL works even if
--      an older script was never run in this project.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Auto-confirm new signups (instant member login)
-- ----------------------------------------------------------------------------
create or replace function public.autoconfirm_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- email_confirmed_at might not exist on some Supabase versions -> ignore.
  begin
    new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  exception
    when others then null;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_autoconfirm on auth.users;
create trigger on_auth_user_autoconfirm
  before insert on auth.users
  for each row execute function public.autoconfirm_new_user();

-- ----------------------------------------------------------------------------
-- 2) Confirm accounts that are currently stuck waiting for an email link
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('auth.users') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'auth' and table_name = 'users' and column_name = 'email_confirmed_at'
     ) then
    execute 'update auth.users
             set email_confirmed_at = coalesce(email_confirmed_at, now())
             where email_confirmed_at is null';
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 3) Login by USERNAME or EMAIL (case-insensitive) - reliably present
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 4) VERIFY IT WORKED (run the two queries below - they are harmless)
--    a) The auto-confirm trigger must be present:
--       SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass
--       AND tgname = 'on_auth_user_autoconfirm';
--       -> should print 1 row: on_auth_user_autoconfirm
--    b) No accounts may remain unconfirmed:
--       SELECT count(*) AS unconfirmed FROM auth.users
--       WHERE email_confirmed_at IS NULL;
--       -> should print 0
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- ALTERNATIVE (equally reliable, click-only):
--   Supabase Dashboard -> Authentication -> Sign In / Providers -> Email
--   -> turn OFF "Confirm email" -> Save.
-- ----------------------------------------------------------------------------