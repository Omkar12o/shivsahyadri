import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'
import type { Database } from '@/lib/database.types'
import type { AdminSettings, DonationInfo, MandalInfo, SiteSettings } from '@/types'

type SiteSettingsUpdate = Database['public']['Tables']['site_settings']['Update']

async function fetchSingleton<T>(table: 'donation_info' | 'mandal_info' | 'site_settings' | 'admin_settings'): Promise<T | null> {
  const { data, error } = await supabase.from(table).select('*').limit(1).maybeSingle()
  if (error) throw new Error(getErrorMessage(error))
  return (data as T) ?? null
}

export const settingsService = {
  async getDonationInfo(): Promise<DonationInfo | null> {
    return fetchSingleton<DonationInfo>('donation_info')
  },

  async saveDonationInfo(payload: Partial<DonationInfo>): Promise<void> {
    const existing = await fetchSingleton<DonationInfo>('donation_info')
    if (existing) {
      const { error } = await supabase.from('donation_info').update(payload).eq('id', existing.id)
      if (error) throw new Error(getErrorMessage(error))
      return
    }
    const { error } = await supabase
      .from('donation_info')
      .insert({ mandal_name: 'Shivsaydri Ganesh Mandal', upi_id: '', ...payload })
    if (error) throw new Error(getErrorMessage(error))
  },

  async getMandalInfo(): Promise<MandalInfo | null> {
    return fetchSingleton<MandalInfo>('mandal_info')
  },

  async saveMandalInfo(payload: Partial<MandalInfo>): Promise<void> {
    const existing = await fetchSingleton<MandalInfo>('mandal_info')
    if (existing) {
      const { error } = await supabase.from('mandal_info').update(payload).eq('id', existing.id)
      if (error) throw new Error(getErrorMessage(error))
      return
    }
    const { error } = await supabase
      .from('mandal_info')
      .insert({ name: 'Shivsaydri Ganesh Mandal', village: 'Umarkhanchan', ...payload })
    if (error) throw new Error(getErrorMessage(error))
  },

  async getSiteSettings(): Promise<SiteSettings | null> {
    return fetchSingleton<SiteSettings>('site_settings')
  },

  async saveSiteSettings(payload: Partial<SiteSettings>): Promise<void> {
    const existing = await fetchSingleton<SiteSettings>('site_settings')
    if (existing) {
      const { error } = await supabase
        .from('site_settings')
        .update(payload as unknown as SiteSettingsUpdate)
        .eq('id', existing.id)
      if (error) throw new Error(getErrorMessage(error))
      return
    }
    const { error } = await supabase.from('site_settings').insert(payload as unknown as SiteSettingsUpdate)
    if (error) throw new Error(getErrorMessage(error))
  },

  async getAdminSettings(): Promise<AdminSettings | null> {
    return fetchSingleton<AdminSettings>('admin_settings')
  },

  async saveAdminSettings(payload: Partial<AdminSettings>): Promise<void> {
    const existing = await fetchSingleton<AdminSettings>('admin_settings')
    if (existing) {
      const { error } = await supabase.from('admin_settings').update(payload).eq('id', existing.id)
      if (error) throw new Error(getErrorMessage(error))
      return
    }
    const { error } = await supabase.from('admin_settings').insert(payload)
    if (error) throw new Error(getErrorMessage(error))
  },
}
