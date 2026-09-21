// Scheduled Edge Function: daily birthday check.
//
// Runs the server-side create_birthday_notifications() function so members
// get birthday notifications every day (Asia/Kolkata), WITHOUT relying on any
// browser being open.
//
// Local dev:
//   supabase functions serve birthday-worker
//
// Production (replace secrets first):
//   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<service_role_key>"
//   npx supabase functions deploy birthday-worker --no-verify-jwt \
//     --schedule "30 18 * * *"   # 18:30 UTC == 00:00 IST
//
// The SQL function itself computes "today" in Asia/Kolkata and dedupes with a
// partial unique index, so this worker is safe to run manually any number of
// times per day.

import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function errorResponse(body: unknown, status = 500) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse({ error: 'Method not allowed' }, 405)
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return errorResponse({ error: 'SUPABASE_SERVICE_ROLE_KEY secret is not configured' }, 500)
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabase.rpc('create_birthday_notifications')

    if (error) throw error

    return new Response(
      JSON.stringify({ ok: true, created: data, at: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return errorResponse({ ok: false, error: String(err) })
  }
})