import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'
import type { Meeting } from '@/types'

export const meetingService = {
  async list(options: { publishedOnly?: boolean } = {}): Promise<Meeting[]> {
    const { publishedOnly = true } = options
    let request = supabase.from('meetings').select('*').order('meeting_date', { ascending: true }).order('start_time', { ascending: true })
    if (publishedOnly) request = request.eq('is_published', true)
    const { data, error } = await request
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as Meeting[]
  },

  async listUpcoming(): Promise<Meeting[]> {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('is_published', true)
      .gte('meeting_date', today)
      .order('meeting_date', { ascending: true })
      .order('start_time', { ascending: true })
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as Meeting[]
  },

  async getById(id: string): Promise<Meeting | null> {
    const { data, error } = await supabase.from('meetings').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async create(payload: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>): Promise<Meeting> {
    const { data, error } = await supabase.from('meetings').insert(payload).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async update(id: string, payload: Partial<Meeting>): Promise<Meeting> {
    const { data, error } = await supabase.from('meetings').update(payload).eq('id', id).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('meetings').delete().eq('id', id)
    if (error) throw new Error(getErrorMessage(error))
  },
}
