-- ============================================================================
-- Make member signup -> login instant (idempotent, safe to re-run).
--
-- Problem: with Supabase email confirmation ON (the default), a member who
-- fills the Create Account form is BLOCKED from logging in until they open a
-- verification link. This migration turns on auto-confirm so the account is
-- usable immediately, and confirms any accounts that are already stuck.
--
-- Equivalent dashboard setting (if you prefer clicking instead):
--   Supabase Dashboard -> Authentication -> Sign In / Up -> Email
--   -> turn OFF "Confirm email" -> Save.
-- ============================================================================

-- 1. Turn on auto-confirm (GoTrue reads auth.config live) --------------------
do $$
declare
  v_type text;
begin
  if to_regclass('auth.config') is null then
    raise notice 'auth.config not found - skip auto-confirm';
    return;
  end if;

  select data_type into v_type
  from information_schema.columns
  where table_schema = 'auth'
    and table_name   = 'config'
    and column_name  = 'mailer_autoconfirm';

  if v_type is null then
    raise notice 'auth.config.mailer_autoconfirm not found - skip';
  elsif v_type = 'boolean' then
    execute 'update auth.config set mailer_autoconfirm = true';
    raise notice 'mailer_autoconfirm set to true (boolean)';
  else
    execute 'update auth.config set mailer_autoconfirm = ''on''';
    raise notice 'mailer_autoconfirm set to ''on'' (text)';
  end if;
end $$;

-- 2. Confirm every account that is stuck waiting for the email link ---------
--    (accounts already created before this fix). Note: auth.users.confirmed_at
--    is a GENERATED column in newer Supabase - it is derived automatically, so
--    we only set email_confirmed_at here.
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;
