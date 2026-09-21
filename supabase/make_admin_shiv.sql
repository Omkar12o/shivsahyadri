-- ============================================================================
-- HOW TO CREATE THE FIRST ADMIN / SUPER ADMIN (secure)
-- ============================================================================
-- The admin's password is ALWAYS managed by Supabase Auth. Never put a real
-- password in SQL or React code.
--
-- STEP 1 - Create the account through Supabase Auth.
--   Option A (recommended, easiest): sign up on the website as a normal member
--     (Member > Create Member Account). Use a real email + strong password.
--   Option B: open Supabase Dashboard > Authentication > Users > Add user and
--     create the admin with email + password there.
--
-- STEP 2 - Promote that account to admin / super_admin.
--   Run THIS file in: Supabase Dashboard > SQL Editor.
--   The WHERE clause below is already pre-filled for admin login as shiv@123.com.
-- ============================================================================

update public.profiles
set role = 'super_admin', is_active = true
where (email = lower('shiv@123.com') or user_id = 'shiv@123')
returning id, full_name, user_id, email, role;

-- To create a normal (limited) admin instead of super_admin, set:
--   role = 'admin'

-- Verify existing admins:
select id, full_name, user_id, email, role, is_active
from public.profiles
where role in ('admin', 'super_admin')
order by role desc, full_name asc;