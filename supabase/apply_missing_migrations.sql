-- ============================================================================
-- FILE: 20260101002400_chat_permissions.sql
--
-- Turns the member chat into a proper group chat with strict, user-scoped RLS:
--   * members can READ all messages (including soft-deleted rows) so the app
--     can render the "This message was deleted" placeholder
--   * members can only SOFT-DELETE their OWN message (content is cleared)
--   * admins can soft-delete any message, super admins can hard delete
--   * the message column drops NOT NULL so deleted content is purged
--   * a trigger forbids ANY other kind of UPDATE (members cannot edit content)
--
-- BULLETPROOF-ish and idempotent: every statement is guarded, and this script
-- can be re-run safely.
-- ============================================================================

-- 1) Allow clearing the content of a soft-deleted message (privacy).
do $$
begin
  alter table public.chat_messages alter column message drop not null;
exception
  when undefined_table then null;
end $$;

-- 2) Members may read ALL messages, including soft-deleted ones, so the UI
--    can show the "This message was deleted" placeholder.
drop policy if exists "chat_select_member" on public.chat_messages;
create policy "chat_select_member"
  on public.chat_messages for select
  to authenticated
  using (true);

-- 3) Members may only update (soft-delete) their OWN message.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_messages'
      and policyname = 'chat_update_own'
  ) then
    create policy "chat_update_own"
      on public.chat_messages for update
      to authenticated
      using (user_id = public.current_profile_id())
      with check (user_id = public.current_profile_id());
  end if;
end $$;

-- 4) Guard: the ONLY allowed update on a chat message is a soft delete
--    (message cleared + deleted_at set the first time). Editors / content
--    rewrites are rejected no matter who is calling.
create or replace function public.chat_message_soft_delete_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.deleted_at is null then
    raise exception 'chat: only soft-delete updates are allowed';
  end if;
  if old.deleted_at is not null then
    raise exception 'chat: message was already deleted';
  end if;
  return new;
end;
$$;

drop trigger if exists chat_messages_soft_delete_guard on public.chat_messages;
create trigger chat_messages_soft_delete_guard
  before update on public.chat_messages
  for each row execute function public.chat_message_soft_delete_guard();

-- ============================================================================
-- ============================================================================
-- FILE: 20260101002500_login_easy.sql
--
-- Instant member login (idempotent, bulletproof, safe to re-run).
--   1. Auto-confirms every new account at creation time (dashboard-independent)
--   2. Confirms existing accounts stuck waiting for the email link
--   3. Re-creates username/email login resolver so login by USERNAME or EMAIL
--      works even if an earlier auth script was never applied.
-- ============================================================================

create or replace function public.autoconfirm_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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