import { supabase } from '@/lib/supabase'
import { formatISTDate, getErrorMessage } from '@/utils'
import type { Notification } from '@/types'

export const birthdayService = {
  /** Admin/SUPER_ADMIN-triggered manual run of the server-side birthday check. */
  async runCheck(): Promise<number> {
    const { data, error } = await supabase.rpc('run_birthday_check')
    if (error) throw new Error(getErrorMessage(error))
    return data ?? 0
  },

  async listToday(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'birthday')
      .eq('birthday_date', formatISTDate())
      .order('created_at', { ascending: false })
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as Notification[]
  },

  async listRecent(limit = 5): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'birthday')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as Notification[]
  },
}
