// Secure Cloudinary deletion endpoint.
//
// Called by the admin panel when an image/audio is HARD deleted, so the file
// is removed from Cloudinary along with the database row.
//
// Security model:
//   - verify_jwt is ON (default), so we receive the logged-in member's JWT.
//   - The function calls the public is_admin() RPC *with that user's JWT* and
//     only proceeds when it returns true. No admin key, no secrets in the app.
//   - The Cloudinary Admin API is called with a SHA-1 signed request using the
//     CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET secrets (never exposed to the
//     browser).
//
// Deploy (one time):
//   npx supabase secrets set CLOUDINARY_CLOUD_NAME="dmst612g"
//   npx supabase secrets set CLOUDINARY_API_KEY="<your api key>"
//   npx supabase secrets set CLOUDINARY_API_SECRET="<your api secret>"
//   npx supabase functions deploy cloudinary-delete
//
// Call: POST /functions/v1/cloudinary-delete  { "public_id": "...", "resource_type": "image" }

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function sha1Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(data))
  const bytes = new Uint8Array(digest)
  let hex = ''
  for (const b of bytes) hex += b.toString(16).padStart(2, '0')
  return hex
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const authorization = req.headers.get('Authorization') ?? ''
  if (!supabaseUrl || !anonKey || !authorization) {
    return json({ error: 'Missing auth context' }, 401)
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')
  if (adminError || !isAdmin) {
    return json({ error: 'Forbidden: admin access required' }, 403)
  }

  let body: { public_id?: string; resource_type?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const publicId = body.public_id
  if (!publicId || typeof publicId !== 'string') {
    return json({ error: 'public_id is required' }, 400)
  }
  const resourceType = body.resource_type === 'raw' ? 'raw' : 'image'

  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME') ?? ''
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY') ?? ''
  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET') ?? ''
  if (!cloudName || !apiKey || !apiSecret) {
    return json({ error: 'Cloudinary secrets are not configured on this function' }, 500)
  }

  const timestamp = String(Math.round(Date.now() / 1000))
  const toSign = `${publicId}${timestamp}${apiSecret}`
  const signature = await sha1Hex(toSign)

  const form = new URLSearchParams()
  form.set('public_id', publicId)
  form.set('timestamp', timestamp)
  form.set('api_key', apiKey)
  form.set('signature', signature)
  form.set('resource_type', resourceType)

  const destroyUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`

  try {
    const res = await fetch(destroyUrl, {
      method: 'POST',
      body: form,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const data = await res.json()
    return json({ ok: res.ok, result: data.data ?? data })
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500)
  }
})