import { supabase, getAccessToken } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'

export interface MediaDeleteResult {
  ok: boolean
  result?: unknown
  error?: string
}

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? ''

/**
 * Deletes a Cloudinary asset by its public_id using the secure backend
 * endpoint (admin-only, verified server side). Falls back to the Supabase
 * edge function when VITE_API_URL is not configured.
 */
export const mediaService = {
  async deleteCloudinary(publicId: string | null | undefined, resourceType: 'image' | 'raw' = 'image'): Promise<boolean> {
    if (!publicId) return true
    if (API_BASE_URL) {
      try {
        const token = await getAccessToken()
        const res = await fetch(`${API_BASE_URL}/api/cloudinary/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ public_id: publicId, resource_type: resourceType }),
        })
        const data = (await res.json()) as MediaDeleteResult
        if (!res.ok) {
          console.warn('Cloudinary delete via backend failed:', data.error)
          return false
        }
        return Boolean(data.ok)
      } catch (e) {
        console.warn('Cloudinary delete via backend failed, falling back to edge function:', e)
      }
    }
    try {
      const { data, error } = await supabase.functions.invoke<MediaDeleteResult>('cloudinary-delete', {
        body: { public_id: publicId, resource_type: resourceType },
      })
      if (error) {
        console.warn('Cloudinary delete edge function not available:', getErrorMessage(error))
        return false
      }
      return Boolean(data?.ok)
    } catch (e) {
      console.warn('Cloudinary delete failed:', e)
      return false
    }
  },
}