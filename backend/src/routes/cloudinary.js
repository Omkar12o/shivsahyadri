// POST /api/cloudinary/delete - hard-delete a Cloudinary asset (admin only).
// Port of the Supabase cloudinary-delete edge function. The Cloudinary API
// secret stays server-side.

import { Router } from 'express'
import crypto from 'node:crypto'

const router = Router()

router.post('/', async (req, res) => {
  const body = req.body ?? {}
  const publicId = body.public_id
  if (!publicId || typeof publicId !== 'string') {
    return res.status(400).json({ error: 'public_id is required' })
  }
  const resourceType = body.resource_type === 'raw' ? 'raw' : 'image'

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? ''
  const apiKey = process.env.CLOUDINARY_API_KEY ?? ''
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? ''
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Cloudinary secrets are not configured on this server.' })
  }

  const timestamp = String(Math.round(Date.now() / 1000))
  const toSign = `${publicId}${timestamp}${apiSecret}`
  const signature = crypto.createHash('sha1').update(toSign).digest('hex')

  const form = new URLSearchParams()
  form.set('public_id', publicId)
  form.set('timestamp', timestamp)
  form.set('api_key', apiKey)
  form.set('signature', signature)
  form.set('resource_type', resourceType)

  const destroyUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`

  try {
    const response = await fetch(destroyUrl, {
      method: 'POST',
      body: form,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const data = await response.json()
    return res.json({ ok: response.ok, result: data.data ?? data })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) })
  }
})

export { router as cloudinaryRouter }