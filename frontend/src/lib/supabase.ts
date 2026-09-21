import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const isPlaceholder = supabaseUrl.includes('your-project-ref') || supabaseAnonKey.includes('your-supabase-anon-key')
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey && !isPlaceholder)

if (!hasSupabaseConfig) {
  console.warn(
    'Supabase environment variables not set. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'shivsaydri-mandal-auth',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export function getSupabaseUrl(): string {
  return supabaseUrl
}

export function getSupabaseAnonKey(): string {
  return supabaseAnonKey
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
