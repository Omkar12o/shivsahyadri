import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'
import type { Announcement } from '@/types'

export const announcementService = {
  async list(options: { publishedOnly?: boolean; limit?: number } = {}): Promise<Announcement[]> {
    const { publishedOnly = true, limit } = options
    let request = supabase.from('announcements').select('*').order('created_at', { ascending: false })
    if (publishedOnly) request = request.eq('is_published', true)
    if (limit) request = request.limit(limit)
    const { data, error } = await request
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as Announcement[]
  },

  async latest(): Promise<Announcement | null> {
    const items = await this.list({ publishedOnly: true, limit: 1 })
    return items[0] ?? null
  },

  async create(payload: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>): Promise<Announcement> {
    const { data, error } = await supabase.from('announcements').insert(payload).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async update(id: string, payload: Partial<Announcement>): Promise<Announcement> {
    const { data, error } = await supabase.from('announcements').update(payload).eq('id', id).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) throw new Error(getErrorMessage(error))
  },
}
