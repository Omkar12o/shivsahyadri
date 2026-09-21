// POST /api/birthday-worker - daily birthday notification generation.
// Port of the Supabase birthday-worker edge function. Safe to call repeatedly;
// the SQL function dedupes. Protected by an optional CRON_SECRET (recommended
// for scheduled calls) - see index.js.

import { Router } from 'express'

import { createServiceClient } from '../supabase.js'

const router = Router()

router.post('/', async (req, res) => {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const provided = req.headers['x-cron-secret'] ?? req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? ''
    if (provided !== secret) {
      return res.status(401).json({ ok: false, error: 'Unauthorized.' })
    }
  }

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase.rpc('create_birthday_notifications')
    if (error) throw error
    return res.json({ ok: true, created: data, at: new Date().toISOString() })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) })
  }
})

export { router as birthdayRouter }