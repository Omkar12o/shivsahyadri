-- ============================================================================
-- Community features - push subscriptions, community chat, calendar events
-- SAFE TO RUN ON EXISTING DATABASE: tables/policies created only if missing.
-- ============================================================================

-- ============================================================================
-- 1. push_subscriptions (web-push / VAPID)
-- One member can have many devices. Invalid subscriptions become inactive
-- (no hard delete, so the history remains for statistics).
-- ============================================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  device_type text not null default 'unknown',
  browser text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.push_subscriptions is
  'Web Push subscriptions per device. Endpoint is unique; devices are deactivated (not deleted) when they stop working.';

drop index if exists push_subscriptions_auth_user_idx;
create index push_subscriptions_auth_user_idx on public.push_subscriptions (auth_user_id) where active = true;

-- ============================================================================
-- 2. chat_messages (member community chat - text only)
-- ============================================================================

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null
);

comment on table public.chat_messages is
  'Text-only member community chat. Admin deletes are soft deletes (deleted_at); only super_admin can hard delete.';

drop index if exists chat_messages_created_idx;
create index chat_messages_created_idx on public.chat_messages (created_at desc);

-- ============================================================================
-- 3. calendar_events (Mandal calendar; programs/meetings are also merged in
-- the calendar UI from their own tables - no duplication)
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'calendar_event_type') then
    create type public.calendar_event_type as enum
      ('aarti', 'program', 'meeting', 'festival', 'announcement', 'donation', 'cultural', 'other');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'calendar_event_status') then
    create type public.calendar_event_status as enum ('scheduled', 'cancelled', 'completed');
  end if;
end $$;

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text,
  event_type public.calendar_event_type not null default 'other',
  start_datetime timestamptz not null,
  end_datetime timestamptz,
  all_day boolean not null default false,
  location text,
  status public.calendar_event_status not null default 'scheduled',
  is_public boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.calendar_events is
  'Admin-managed calendar events. Times are stored as timestamptz and displayed in Asia/Kolkata.';

drop index if exists calendar_events_start_idx;
create index calendar_events_start_idx on public.calendar_events (start_datetime);

drop index if exists calendar_events_type_idx;
create index calendar_events_type_idx on public.calendar_events (event_type, status, is_public);

-- ============================================================================
-- Triggers: keep updated_at fresh
-- ============================================================================

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists set_chat_messages_updated_at on public.chat_messages;
create trigger set_chat_messages_updated_at
  before update on public.chat_messages
  for each row execute function public.set_updated_at();

drop trigger if exists set_calendar_events_updated_at on public.calendar_events;
create trigger set_calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS toggle
-- ============================================================================

alter table public.push_subscriptions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.calendar_events enable row level security;

-- ============================================================================
-- RLS policies
-- ============================================================================

-- push_subscriptions: a member manages only their own subscriptions.
-- (The push sender runs with the service role and bypasses RLS.)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_sub_select_own') then
    create policy "push_sub_select_own" on public.push_subscriptions
      for select to authenticated using (auth_user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_sub_insert_own') then
    create policy "push_sub_insert_own" on public.push_subscriptions
      for insert to authenticated with check (auth_user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_sub_update_own') then
    create policy "push_sub_update_own" on public.push_subscriptions
      for update to authenticated using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_sub_delete_own') then
    create policy "push_sub_delete_own" on public.push_subscriptions
      for delete to authenticated using (auth_user_id = auth.uid());
  end if;
end $$;

-- chat_messages: all authenticated members read + send; admin soft-deletes;
-- super_admin hard-deletes.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_select_member') then
    create policy "chat_select_member" on public.chat_messages
      for select to authenticated using (deleted_at is null);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_insert_member') then
    create policy "chat_insert_member" on public.chat_messages
      for insert to authenticated with check (public.is_active_member() and user_id = public.current_profile_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_soft_delete_admin') then
    create policy "chat_soft_delete_admin" on public.chat_messages
      for update to authenticated using (public.is_admin() and deleted_at is null) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_hard_delete_super') then
    create policy "chat_hard_delete_super" on public.chat_messages
      for delete to authenticated using (public.is_super_admin());
  end if;
end $$;

-- calendar_events: public reads public events; admins manage everything.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'calendar_events' and policyname = 'cal_select_public') then
    create policy "cal_select_public" on public.calendar_events
      for select using (is_public = true or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'calendar_events' and policyname = 'cal_insert_admin') then
    create policy "cal_insert_admin" on public.calendar_events
      for insert with check (public.is_admin() and created_by = public.current_profile_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'calendar_events' and policyname = 'cal_update_admin') then
    create policy "cal_update_admin" on public.calendar_events
      for update using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'calendar_events' and policyname = 'cal_delete_admin') then
    create policy "cal_delete_admin" on public.calendar_events
      for delete using (public.is_admin());
  end if;
end $$;

-- ============================================================================
-- RPC: deactivate a push subscription by endpoint (server-side push sender)
-- ============================================================================

create or replace function public.deactivate_push_subscription(p_endpoint text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.push_subscriptions
  set active = false, updated_at = now()
  where endpoint = p_endpoint;
$$;

revoke all on function public.deactivate_push_subscription(text) from public;
grant execute on function public.deactivate_push_subscription(text) to service_role;

-- ============================================================================
-- Realtime publication
-- ============================================================================

do $$
declare t text;
begin
  foreach t in array array['push_subscriptions','chat_messages','calendar_events']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
    end;
  end loop;
end $$;

grant select on public.push_subscriptions, public.chat_messages, public.calendar_events to anon, authenticated;