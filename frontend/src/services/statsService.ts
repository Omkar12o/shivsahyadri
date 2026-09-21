import { supabase } from '@/lib/supabase'
import { formatISTDate } from '@/utils'

export interface AdminStats {
  totalMembers: number
  activeMembers: number
  todayBirthdays: number
  todayPrograms: number
  upcomingPrograms: number
  totalPrograms: number
  totalMeetings: number
  totalAnnouncements: number
  totalAartis: number
  totalGalleryPhotos: number
  totalVideos: number
  unreadNotifications: number
}

export async function getAdminStats(profileId?: string): Promise<AdminStats> {
  const today = formatISTDate()

  const [
    totalMembers,
    activeMembers,
    todayBirthdays,
    todayPrograms,
    upcomingPrograms,
    totalPrograms,
    totalMeetings,
    totalAnnouncements,
    totalAartis,
    totalGalleryPhotos,
    totalVideos,
    notificationsCount,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'birthday')
      .eq('birthday_date', today),
    supabase
      .from('programs')
      .select('*', { count: 'exact', head: true })
      .eq('event_date', today)
      .eq('is_published', true),
    supabase
      .from('programs')
      .select('*', { count: 'exact', head: true })
      .gt('event_date', today)
      .eq('is_published', true),
    supabase.from('programs').select('*', { count: 'exact', head: true }),
    supabase.from('meetings').select('*', { count: 'exact', head: true }),
    supabase.from('announcements').select('*', { count: 'exact', head: true }),
    supabase.from('aartis').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('gallery').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('videos').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('notifications').select('*', { count: 'exact', head: true }),
  ]).then((results) => results.map((r) => r.count ?? 0))

  let unreadNotifications = 0
  if (profileId && notificationsCount > 0) {
    const { data } = await supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', profileId)
    const readIds = new Set((data ?? []).map((row) => row.notification_id))
    unreadNotifications = Math.max(0, notificationsCount - readIds.size)
  }

  return {
    totalMembers,
    activeMembers,
    todayBirthdays,
    todayPrograms,
    upcomingPrograms,
    totalPrograms,
    totalMeetings,
    totalAnnouncements,
    totalAartis,
    totalGalleryPhotos,
    totalVideos,
    unreadNotifications,
  }
}
