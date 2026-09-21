-- Enable realtime for live auto-show: gallery, meetings, festival
do $$
begin
  alter publication supabase_realtime add table public.gallery;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.meetings;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.festival_years;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.festival_transactions;
exception when duplicate_object then null;
end $$;
-- also ensure gallery bucket remains public (already true from storage.sql)
