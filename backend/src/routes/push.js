// POST /api/push/send - send web push notifications to subscribed members.
// Port of the Supabase send-push edge function. Requires admin (see auth.js).

import { Router } from 'express'
import webpush from 'web-push'

import { createServiceClient } from '../supabase.js'

const router = Router()

const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:admin@shivsaydri.in'

function buildNotification(title, body, url) {
  return {
    title,
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { url: url ?? '/' },
  }
}

async function sendOne(supabase, sub, notification) {
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
  } catch (e) {
    const statusCode = e?.statusCode
    if (statusCode === 404 || statusCode === 410) {
      await supabase.rpc('deactivate_push_subscription', { p_endpoint: sub.endpoint })
      return { id: sub.id, ok: false, failed: 'gone' }
    }
    return { id: sub.id, ok: false, failed: String(statusCode ?? 'error') }
  }
}

router.post('/', async (req, res) => {
  const vapidPublic = process.env.VAPID_PUBLIC_KEY ?? ''
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY ?? ''
  if (!vapidPublic || !vapidPrivate) {
    return res.status(500).json({ error: 'VAPID keys not configured on server.' })
  }
  webpush.setVapidDetails(VAPID_SUBJECT, vapidPublic, vapidPrivate)

  const payload = req.body ?? {}
  const title = payload.title?.trim()
  const body = payload.body?.trim() ?? ''
  if (!title) {
    return res.status(400).json({ error: 'title is required' })
  }

  const supabase = createServiceClient()

  let query = supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth, active')
    .eq('active', true)

  const recipients = Array.isArray(payload.recipient_ids) ? payload.recipient_ids.filter(Boolean) : []
  if (recipients.length > 0) {
    query = query.in('auth_user_id', recipients)
  } else if (!payload.to_all) {
    return res.json({ total: 0, sent: 0, failed: 0, inactive: 0, gone: 0 })
  }

  const { data: subs, error } = await query
  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const notification = buildNotification(title, body, payload.url)
  const results = await Promise.all((subs ?? []).map((s) => sendOne(supabase, s, notification)))

  const stats = {
    total: results.length,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok && r.failed !== 'gone').length,
    inactive: results.filter((r) => r.skipped === 'inactive').length,
    gone: results.filter((r) => r.failed === 'gone').length,
  }

  return res.json(stats)
})

export { router as pushRouter }