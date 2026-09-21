// Shared Supabase client helpers. Secrets (SUPABASE_SERVICE_ROLE_KEY) live ONLY
// server-side here - never in the frontend bundle.

import { createClient } from '@supabase/supabase-js'

function required(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`)
  }
  return value
}

/** Supabase client for admin/RPC checks using the caller's JWT (no service role). */
export function createUserClient(authHeader) {
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Missing SUPABASE_URL / SUPABASE_ANON_KEY')
  }
  return createClient(url, anonKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Supabase admin client (service role) for privileged writes - server-side only. */
export function createServiceClient() {
  return createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function getSupabaseUrl() {
  return process.env.SUPABASE_URL ?? ''
}