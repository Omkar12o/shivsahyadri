import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'
import type { FestivalYear, FestivalTransaction, FestivalFinanceSummary } from '@/types'

export const festivalService = {
  async getYear(year: number): Promise<FestivalYear | null> {
    const { data, error } = await supabase.from('festival_years').select('*').eq('year', year).maybeSingle()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },
  async listYears(): Promise<FestivalYear[]> {
    const { data, error } = await supabase.from('festival_years').select('*').order('year', { ascending: false })
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as FestivalYear[]
  },
  async updateYear(id: string, payload: Partial<FestivalYear>): Promise<FestivalYear> {
    const { data, error } = await supabase.from('festival_years').update(payload).eq('id', id).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },
  async getSummary(year: number): Promise<FestivalFinanceSummary | null> {
    const { data, error } = await (supabase as any).from('festival_finance_summary').select('*').eq('year', year).maybeSingle()
    if (error) throw new Error(getErrorMessage(error))
    return data as FestivalFinanceSummary | null
  },
  async listTransactions(yearId: string): Promise<FestivalTransaction[]> {
    const { data, error } = await supabase.from('festival_transactions').select('*').eq('festival_year_id', yearId).order('transaction_date', { ascending: false })
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as FestivalTransaction[]
  },
  async addTransaction(payload: Omit<FestivalTransaction, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<FestivalTransaction> {
    const { data, error } = await supabase.from('festival_transactions').insert(payload).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },
  async removeTransaction(id: string): Promise<void> {
    const { error } = await supabase.from('festival_transactions').delete().eq('id', id)
    if (error) throw new Error(getErrorMessage(error))
  },
}
