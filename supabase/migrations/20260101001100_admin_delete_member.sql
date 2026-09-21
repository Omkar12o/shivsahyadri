-- ============================================================================
-- Admin delete member options:
-- 1. Soft delete = deactivate member (hidden from public directory)
--    (reuses admin_set_member_active with active = false)
-- 2. Hard delete = permanently remove member profile + their auth login.
--    Restricted to super_admin only and protected against self-delete / deleting
--    another super admin.
-- ============================================================================

create or replace function public.admin_hard_delete_member(target_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user uuid;
  v_role public.user_role;
begin
  if not public.is_super_admin() then
    raise exception 'Only a super admin can permanently delete members.';
  end if;
  if target_profile_id = public.current_profile_id() then
    raise exception 'You cannot delete your own account.';
  end if;

  select auth_user_id, role into v_auth_user, v_role
  from public.profiles
  where id = target_profile_id;

  if not found then
    raise exception 'Member not found.';
  end if;
  if v_role = 'super_admin' then
    raise exception 'A super admin cannot be deleted.';
  end if;

  -- Deleting the auth user cascades to the profile (FK on auth_user_id).
  if v_auth_user is not null then
    delete from auth.users where id = v_auth_user;
  else
    delete from public.profiles where id = target_profile_id;
  end if;
end;
$$;

grant execute on function public.admin_hard_delete_member(uuid) to authenticated;