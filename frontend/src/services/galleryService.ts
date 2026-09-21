import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'
import { storageService } from '@/services/storageService'
import type { GalleryImage } from '@/types'

export interface GalleryFilter {
  category?: string
  year?: string
  publishedOnly?: boolean
  limit?: number
}

export const galleryService = {
  async list(filter: GalleryFilter = {}): Promise<GalleryImage[]> {
    const { category, year, publishedOnly = true, limit } = filter
    let request = supabase.from('gallery').select('*').order('created_at', { ascending: false })
    if (publishedOnly) request = request.eq('is_published', true)
    if (category && category !== 'all') request = request.eq('category', category)
    if (year && year !== 'all') {
      request = request.gte('event_date', `${year}-01-01`).lte('event_date', `${year}-12-31`)
    }
    if (limit) request = request.limit(limit)
    const { data, error } = await request
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as GalleryImage[]
  },

  async listRecent(limit = 8): Promise<GalleryImage[]> {
    return this.list({ publishedOnly: true, limit })
  },

  async create(payload: Omit<GalleryImage, 'id' | 'created_at'>): Promise<GalleryImage> {
    const { data, error } = await supabase.from('gallery').insert(payload).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async update(id: string, payload: Partial<GalleryImage>): Promise<GalleryImage> {
    const { data, error } = await supabase.from('gallery').update(payload).eq('id', id).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async remove(id: string): Promise<void> {
    const { data: existing } = await supabase.from('gallery').select('*').eq('id', id).maybeSingle()
    if (existing?.image_url) {
      try {
        await storageService.remove('gallery', existing.image_url)
      } catch (e) {
        console.warn('Could not remove storage object (may be a Cloudinary URL):', e)
      }
    }
    const { error: dbError } = await supabase.from('gallery').delete().eq('id', id)
    if (dbError) throw new Error(getErrorMessage(dbError))
  },
}
