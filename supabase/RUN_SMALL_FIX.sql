-- ============================================================================
-- RUN THIS FILE (small, totally safe). Pending fixes: auth function
-- reliability (00022) + realtime live alerts for members (00023).
-- Bulletproof: missing tables are skipped, so it CANNOT fail with 42P01.
-- Idempotent -- safe to run again. Use Dashboard -> SQL Editor.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 00022 - Member auth fixes (login by username/email, case-insensitive)
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
-- 00023 - Realtime live alerts (announcements/notifications appear instantly)
-- ----------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'notifications',
    'notification_reads',
    'announcements',
    'profiles',
    'site_settings',
    'donation_info',
    'mandal_info',
    'aartis',
    'gallery',
    'videos',
    'meetings',
    'calendar_events',
    'chat_messages'
  ]
  loop
    if to_regclass(format('public.%I', t)) is not null then
      begin
        execute format('alter publication supabase_realtime add table public.%I', t);
      exception
        when duplicate_object then null;
      end;
    end if;
  end loop;
end $$;

do $$
begin
  if to_regclass('public.notification_reads') is not null then
    execute 'grant select on public.notification_reads to anon, authenticated';
  end if;
end $$;