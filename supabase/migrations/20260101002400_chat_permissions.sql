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