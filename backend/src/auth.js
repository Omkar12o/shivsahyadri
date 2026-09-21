// Admin authorization middleware.
// Verifies the caller is an admin by running Supabase's is_admin() RPC with the
// caller's own JWT (the same model the Supabase edge functions used). The
// service role key is NEVER sent to the browser.

import { createUserClient } from './supabase.js'

export async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization ?? ''
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized - missing Authorization header.' })
  }
  try {
    const client = createUserClient(authHeader)
    const { data: isAdmin, error } = await client.rpc('is_admin')
    if (error || !isAdmin) {
      return res.status(403).json({ error: 'Forbidden - admin access required.' })
    }
    return next()
  } catch (e) {
    return res.status(401).json({ error: e instanceof Error ? e.message : 'Authentication failed.' })
  }
}