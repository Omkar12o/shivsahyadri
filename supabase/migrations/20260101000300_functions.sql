-- ============================================================================
-- Server-side application functions
-- 1. Birthday notification generator (timezone-aware, duplicate-safe)
-- 2. Admin-triggerable birthday check RPC
-- 3. Announcement -> member notification triggers
-- ============================================================================

-- Birthday notification generator -------------------------------------------

create or replace function public.create_birthday_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Kolkata')::date;
  birthday_count integer := 0;
  m record;
begin
  for m in
    select id, full_name
    from public.profiles
    where is_active = true
      and birthday_visibility = true
      and date_of_birth is not null
      and to_char(date_of_birth, 'MM-DD') = to_char(today, 'MM-DD')
  loop
    insert into public.notifications (title, message, type, related_member_id, birthday_date)
    values (
      '🎂 Today''s Birthday',
      'Today is ' || split_part(m.full_name, ' ', 1) || '''s birthday! "Ganesh Mandal Family wishes '
        || split_part(m.full_name, ' ', 1) || ' a very Happy Birthday! 🎉🙏"',
      'birthday',
      m.id,
      today
    )
    on conflict do nothing;

    if found then
      birthday_count := birthday_count + 1;
    end if;
  end loop;

  return birthday_count;
end;
$$;

grant execute on function public.create_birthday_notifications() to service_role;

-- Admin / Edge Function entry point ------------------------------------------

create or replace function public.run_birthday_check()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  result integer;
begin
  if not exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid() and role in ('admin', 'super_admin')
  ) then
    raise exception 'Insufficient permissions to run birthday check.';
  end if;

  select public.create_birthday_notifications() into result;
  return result;
end;
$$;

grant execute on function public.run_birthday_check() to authenticated;

-- Admin member management RPCs -------------------------------------------------
-- Column-level grants prevent direct API updates of role/is_active, so these
-- SECURITY DEFINER functions are the only way to change them, with role checks.

create or replace function public.admin_set_member_active(target_profile_id uuid, active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Insufficient permissions.';
  end if;
  update public.profiles set is_active = active where id = target_profile_id;
end;
$$;

create or replace function public.admin_set_member_role(target_profile_id uuid, new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only a super admin can change member roles.';
  end if;
  if target_profile_id = public.current_profile_id() then
    raise exception 'You cannot change your own role.';
  end if;
  update public.profiles set role = new_role where id = target_profile_id;
end;
$$;

grant execute on function public.admin_set_member_active(uuid, boolean) to authenticated;
grant execute on function public.admin_set_member_role(uuid, public.user_role) to authenticated;

-- Announcements -> member notifications ---------------------------------------

create or replace function public.announcement_created_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_published and new.priority in ('high', 'urgent') then
    insert into public.notifications (title, message, type)
    values (new.title, coalesce(new.message, ''), 'announcement');
  end if;
  return new;
end;
$$;

create trigger announcements_notify_after_insert
  after insert on public.announcements
  for each row execute function public.announcement_created_notification();

create trigger announcements_notify_after_update
  after update on public.announcements
  for each row
  when (new.is_published is distinct from old.is_published
     or new.priority is distinct from old.priority)
  execute function public.announcement_created_notification();