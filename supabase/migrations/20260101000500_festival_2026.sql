-- ============================================================================
-- 2026 Ganpati Festival - Year archive, finance sheet, final pooja persons
-- ============================================================================

create type public.transaction_type as enum ('income', 'expense');

create table public.festival_years (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique check (year >= 2000 and year <= 2100),
  title text not null,
  theme text,
  description text,
  decoration_theme text,
  final_pooja_person1 text,
  final_pooja_person2 text,
  is_active boolean not null default true,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_festival_years_year on public.festival_years (year desc);
create index idx_festival_years_is_published on public.festival_years (is_published);

create trigger festival_years_set_updated_at
  before update on public.festival_years
  for each row execute function public.set_updated_at();

create table public.festival_transactions (
  id uuid primary key default gen_random_uuid(),
  festival_year_id uuid not null references public.festival_years (id) on delete cascade,
  type public.transaction_type not null,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  description text,
  transaction_date date not null default current_date,
  receipt_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_festival_transactions_year on public.festival_transactions (festival_year_id);
create index idx_festival_transactions_type on public.festival_transactions (type);
create index idx_festival_transactions_date on public.festival_transactions (transaction_date);

create trigger festival_transactions_set_updated_at
  before update on public.festival_transactions
  for each row execute function public.set_updated_at();

-- Finance summary view ---------------------------------------------------

create or replace view public.festival_finance_summary
with (security_invoker = true) as
select
  fy.id as festival_year_id,
  fy.year,
  coalesce(sum(case when ft.type = 'income' then ft.amount else 0 end), 0) as total_income,
  coalesce(sum(case when ft.type = 'expense' then ft.amount else 0 end), 0) as total_expense,
  coalesce(sum(case when ft.type = 'income' then ft.amount else -ft.amount end), 0) as remaining
from public.festival_years fy
left join public.festival_transactions ft on ft.festival_year_id = fy.id
group by fy.id, fy.year;

grant select on public.festival_finance_summary to anon, authenticated;

-- RLS ---------------------------------------------------------------------

alter table public.festival_years enable row level security;
alter table public.festival_transactions enable row level security;

create policy "festival_years_select_published" on public.festival_years
  for select using (is_published = true or public.is_admin());
create policy "festival_years_insert_admin" on public.festival_years
  for insert with check (public.is_admin());
create policy "festival_years_update_admin" on public.festival_years
  for update using (public.is_admin()) with check (public.is_admin());
create policy "festival_years_delete_admin" on public.festival_years
  for delete using (public.is_admin());

create policy "festival_transactions_select_published" on public.festival_transactions
  for select using (
    exists (select 1 from public.festival_years fy where fy.id = festival_year_id and (fy.is_published = true or public.is_admin()))
  );
create policy "festival_transactions_insert_admin" on public.festival_transactions
  for insert with check (public.is_admin());
create policy "festival_transactions_update_admin" on public.festival_transactions
  for update using (public.is_admin()) with check (public.is_admin());
create policy "festival_transactions_delete_admin" on public.festival_transactions
  for delete using (public.is_admin());

-- Seed 2026 year ----------------------------------------------------------

insert into public.festival_years (year, title, theme, description, decoration_theme, is_active, is_published)
values (2026, 'Ganpati Festival 2026', 'Shivsaydri 2026', 'Official 2026 Ganpati festival - Made in 2026', 'Traditional Maharashtra', true, true)
on conflict (year) do nothing;
