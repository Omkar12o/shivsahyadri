import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'
import type { Notification, NotificationRead } from '@/types'

interface NotificationRow extends Notification {
  notification_reads?: NotificationRead[] | null
}

export const notificationService = {
  async listForProfile(profileId: string, limit = 100): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        notification_reads!left (
          id,
          notification_id,
          user_id,
          read_at
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(getErrorMessage(error))

    const rows = (data ?? []) as NotificationRow[]
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      related_member_id: row.related_member_id,
      related_program_id: row.related_program_id,
      birthday_date: row.birthday_date,
      created_at: row.created_at,
      is_read: Boolean(row.notification_reads?.some((read) => read.user_id === profileId)),
    }))
  },

  async create(payload: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Promise<Notification> {
    const { data, error } = await supabase.from('notifications').insert(payload).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (error) throw new Error(getErrorMessage(error))
  },

  async markRead(notificationId: string, profileId: string): Promise<void> {
    const { error } = await supabase
      .from('notification_reads')
      .upsert(
        { notification_id: notificationId, user_id: profileId, read_at: new Date().toISOString() },
        { onConflict: 'notification_id,user_id' },
      )
    if (error) throw new Error(getErrorMessage(error))
  },

  async markAllRead(notificationIds: string[], profileId: string): Promise<void> {
    if (notificationIds.length === 0) return
    const rows = notificationIds.map((id) => ({
      notification_id: id,
      user_id: profileId,
      read_at: new Date().toISOString(),
    }))
    const { error } = await supabase
      .from('notification_reads')
      .upsert(rows, { onConflict: 'notification_id,user_id' })
    if (error) throw new Error(getErrorMessage(error))
  },

  subscribe(onInsert: (notification: Notification) => void) {
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => onInsert(payload.new as Notification),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
