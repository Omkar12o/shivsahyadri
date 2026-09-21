import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2]
const password = process.argv[3] || '123456'

if (!url || !serviceRole || !email) {
  console.error(
    [``, `Usage:`, `  SUPABASE_URL=<project-url> SUPABASE_SERVICE_ROLE_KEY=<key> npm run create-admin <email> [password]`, ``,
     `The service role key is under Dashboard > Settings > API (the service_role key, NOT the anon key).`, ``].join('\n'),
  )
  process.exit(1)
}

const admin = createClient(url, serviceRole, { auth: { persistSession: false } })

async function main() {
  let user

  const { data: existing, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) {
    console.error(`Failed to list users: ${listError.message}`)
    console.error(`Is SUPABASE_SERVICE_ROLE_KEY correct? Check it in Dashboard > Settings > API.`)
    process.exit(1)
  }

  const found = existing.users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase())
  if (found) {
    console.log(`Account exists (${found.id}); resetting password and confirming email...`)
    const { data, error } = await admin.auth.admin.updateUserById(found.id, {
      password,
      email_confirm: true,
    })
    if (error) {
      console.error(`Failed to update user: ${error.message}`)
      process.exit(1)
    }
    user = data.user
  } else {
    console.log(`Creating account ${email}...`)
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Shiv', user_id: email.split('@')[0] },
    })
    if (error) {
      console.error(`Failed to create user: ${error.message}`)
      process.exit(1)
    }
    user = data.user
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (profile) {
    const { error } = await admin
      .from('profiles')
      .update({ role: 'admin', is_active: true, email })
      .eq('id', profile.id)
    if (error) {
      console.error(`Failed to promote profile: ${error.message}`)
      process.exit(1)
    }
  } else {
    const { error } = await admin.from('profiles').insert({
      auth_user_id: user.id,
      full_name: 'Shiv',
      user_id: email.split('@')[0],
      email,
      role: 'admin',
      is_active: true,
    })
    if (error) {
      console.error(`Failed to create profile: ${error.message}`)
      process.exit(1)
    }
  }

  console.log(``)
  console.log(`ADMIN READY`)
  console.log(`  Email:    ${email}`)
  console.log(`  Password: ${password}`)
  console.log(`  Role:     admin (confirm with the SQL: select email, role from profiles where email='${email}';)`)
}

main()