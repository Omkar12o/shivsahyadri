import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'
import type { Video } from '@/types'

export const videoService = {
  async list(options: { publishedOnly?: boolean; category?: string } = {}): Promise<Video[]> {
    const { publishedOnly = true, category } = options
    let request = supabase.from('videos').select('*').order('created_at', { ascending: false })
    if (publishedOnly) request = request.eq('is_published', true)
    if (category && category !== 'all') request = request.eq('category', category)
    const { data, error } = await request
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as Video[]
  },

  async create(payload: Omit<Video, 'id' | 'created_at' | 'updated_at'>): Promise<Video> {
    const { data, error } = await supabase.from('videos').insert(payload).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async update(id: string, payload: Partial<Video>): Promise<Video> {
    const { data, error } = await supabase.from('videos').update(payload).eq('id', id).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('videos').delete().eq('id', id)
    if (error) throw new Error(getErrorMessage(error))
  },
}
