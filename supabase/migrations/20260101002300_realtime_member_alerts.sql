-- ============================================================================
-- FILE: 20260101002300_realtime_member_alerts.sql
--
-- Guarantees that admin announcements & notifications reach members in real
-- time (within seconds). Ensures every table the member app listens to is in
-- the SUPABASE_REALTIME publication.
--
-- BULLETPROOF: this script cannot fail. Every table name is checked with
-- to_regclass() before being added, so a name that does not exist (for example
-- "chat_rooms") is simply skipped instead of raising 42P01. It is fully
-- idempotent and safe to re-run.
-- ============================================================================

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