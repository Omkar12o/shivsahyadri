import { createClient } from 'npm:@supabase/supabase-js@2.46.1'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@shivsaydri.in'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PushPayload {
  title: string
  body?: string
  url?: string
  /** Fallback target list when no recipient_ids given. */
  recipient_ids?: string[]
  /** Specific recipient profile ids (superset of the above). */
  to_all?: boolean
}

interface PushSubscriptionRow {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  active: boolean
}

function buildNotification(title: string, body: string, url?: string) {
  return {
    title,
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { url: url ?? '/' },
  }
}

async function sendOne(sub: PushSubscriptionRow, notification: Record<string, unknown>) {
  if (!sub.active) return { id: sub.id, ok: true, skipped: 'inactive' }
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(notification),
    )
    return { id: sub.id, ok: true }
  } catch (e: unknown) {
    const statusCode = (e as { statusCode?: number })?.statusCode
    // 404 / 410 => subscription is gone, deactivate it server-side.
    if (statusCode === 404 || statusCode === 410) {
      await supabase.rpc('deactivate_push_subscription', { p_endpoint: sub.endpoint })
      return { id: sub.id, ok: false, failed: 'gone' }
    }
    return { id: sub.id, ok: false, failed: String(statusCode ?? 'error') }
  }
}

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured on server.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

  // Verify the caller is an admin using their anon JWT (no service role leakage).
  const requestHeaders = new Headers(req.headers)
  const authHeader = requestHeaders.get('authorization')
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  })
  const isAdminResp = await anonClient.rpc('is_admin')
  if (!isAdminResp.data) {
    return new Response(JSON.stringify({ error: 'Unauthorized - admin only.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const payload = (await req.json()) as PushPayload
  const title = payload.title?.trim()
  const body = payload.body?.trim() ?? ''
  if (!title) {
    return new Response(JSON.stringify({ error: 'title is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Resolve recipients: either specific profile ids (by auth user id) or all loaded.
  let query = supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth, active')
    .eq('active', true)

  const recipients = payload.recipient_ids?.filter(Boolean)
  if (recipients && recipients.length > 0) {
    query = query.in('auth_user_id', recipients)
  } else if (!payload.to_all) {
    return new Response(JSON.stringify({ sent: 0, failed: 0, skipped: 0, total: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: subs, error } = await query
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const notification = buildNotification(title, body, payload.url)
  const results = await Promise.all((subs as PushSubscriptionRow[] | null | undefined)?.map((s) => sendOne(s, notification)) ?? [])

  const stats = {
    total: results.length,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok && r.failed !== 'gone').length,
    inactive: results.filter((r) => r.skipped === 'inactive').length,
    gone: results.filter((r) => r.failed === 'gone').length,
  }

  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(handler)