-- ============================================================================
-- Enable realtime for remaining admin-updated tables so the member/public
-- side updates instantly:
--   profiles       -> public Members directory + member Dashboard
--   mandal_info    -> About + Contact pages
--   donation_info  -> Donation page (QR + bank details)
-- ============================================================================

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.mandal_info;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.donation_info;
exception
  when duplicate_object then null;
end $$;