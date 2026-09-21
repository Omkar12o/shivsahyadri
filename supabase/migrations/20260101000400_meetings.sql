-- ============================================================================
-- Meetings section - Mandal meetings / Committee meetings
-- ============================================================================

create type public.meeting_status as enum ('scheduled', 'completed', 'cancelled');

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  agenda text,
  meeting_date date not null,
  start_time text not null,
  end_time text,
  location text,
  status public.meeting_status not null default 'scheduled',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_meetings_meeting_date on public.meetings (meeting_date);
create index idx_meetings_is_published on public.meetings (is_published);
create index idx_meetings_status on public.meetings (status);

create trigger meetings_set_updated_at
  before update on public.meetings
  for each row execute function public.set_updated_at();

-- RLS ---------------------------------------------------------------------

alter table public.meetings enable row level security;

create policy "meetings_select_published" on public.meetings
  for select using (is_published = true or public.is_admin());
create policy "meetings_insert_admin" on public.meetings
  for insert with check (public.is_admin());
create policy "meetings_update_admin" on public.meetings
  for update using (public.is_admin()) with check (public.is_admin());
create policy "meetings_delete_admin" on public.meetings
  for delete using (public.is_admin());
