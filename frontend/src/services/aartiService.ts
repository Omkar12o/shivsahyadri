import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'
import type { Aarti, AartiCategory } from '@/types'

export const aartiService = {
  async list(options: { publishedOnly?: boolean; category?: AartiCategory | 'all' } = {}): Promise<Aarti[]> {
    const { publishedOnly = true, category = 'all' } = options
    let request = supabase.from('aartis').select('*').order('time', { ascending: true })
    if (publishedOnly) request = request.eq('is_published', true)
    if (category !== 'all') request = request.eq('category', category)
    const { data, error } = await request
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as Aarti[]
  },

  async getById(id: string): Promise<Aarti | null> {
    const { data, error } = await supabase.from('aartis').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async listToday(): Promise<Aarti[]> {
    const { data, error } = await supabase
      .from('aartis')
      .select('*')
      .eq('is_published', true)
      .order('time', { ascending: true })
      .limit(6)
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as Aarti[]
  },

  async create(payload: Omit<Aarti, 'id' | 'created_at' | 'updated_at' | 'audio_public_id'> & { audio_public_id?: string | null }): Promise<Aarti> {
    const { data, error } = await supabase.from('aartis').insert(payload).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async update(id: string, payload: Partial<Aarti>): Promise<Aarti> {
    const { data, error } = await supabase.from('aartis').update(payload).eq('id', id).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('aartis').delete().eq('id', id)
    if (error) throw new Error(getErrorMessage(error))
  },
}
