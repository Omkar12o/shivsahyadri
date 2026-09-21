import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'
import type { Program } from '@/types'

export const programService = {
  async list(options: { publishedOnly?: boolean } = {}): Promise<Program[]> {
    const { publishedOnly = true } = options
    let request = supabase.from('programs').select('*').order('event_date', { ascending: true })
    if (publishedOnly) request = request.eq('is_published', true)
    const { data, error } = await request
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as Program[]
  },

  async getById(id: string): Promise<Program | null> {
    const { data, error } = await supabase.from('programs').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async listToday(): Promise<Program[]> {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('is_published', true)
      .eq('event_date', today)
      .order('start_time', { ascending: true })
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as Program[]
  },

  async create(payload: Omit<Program, 'id' | 'created_at' | 'updated_at'>): Promise<Program> {
    const { data, error } = await supabase.from('programs').insert(payload).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async update(id: string, payload: Partial<Program>): Promise<Program> {
    const { data, error } = await supabase.from('programs').update(payload).eq('id', id).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('programs').delete().eq('id', id)
    if (error) throw new Error(getErrorMessage(error))
  },
}
