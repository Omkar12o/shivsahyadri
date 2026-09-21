import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'
import type { CalendarEvent, CalendarEventStatus, CalendarEventType, Meeting, Program } from '@/types'

export interface CalendarItem {
  id: string
  source: 'calendar' | 'program' | 'meeting'
  title: string
  description: string | null
  event_type: CalendarEventType
  start_datetime: string
  end_datetime: string | null
  all_day: boolean
  location: string | null
  status: CalendarEventStatus
  is_public: boolean
  link?: string
}

/**
 * Calendar aggregation service.
 * Combines admin `calendar_events` with the existing `programs` and `meetings`
 * tables so admins never enter the same event twice. No duplication.
 * Times are stored as timestamptz (or date+time strings) and rendered in
 * Asia/Kolkata by the UI.
 */
export const calendarEventService = {
  async listEvents(): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .is('is_public', true)
      .order('start_datetime', { ascending: true })
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as CalendarEvent[]
  },

  async adminListEvents(): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start_datetime', { ascending: true })
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as CalendarEvent[]
  },

  async create(payload: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<CalendarEvent> {
    const { data, error } = await supabase.from('calendar_events').insert(payload).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data as CalendarEvent
  },

  async update(id: string, payload: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const { data, error } = await supabase.from('calendar_events').update(payload).eq('id', id).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data as CalendarEvent
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id)
    if (error) throw new Error(getErrorMessage(error))
  },

  subscribe(onChange: () => void): () => void {
    const channel = supabase
      .channel('calendar-events-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calendar_events' }, onChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'calendar_events' }, onChange)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'calendar_events' }, onChange)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  },

  /**
   * Merge all sources into displayable items between a start/end timestamp.
   * For `programs` and `meetings`, the date is stored as `date` and time as a
   * string; we combine them into an ISO local-time string (Asia/Kolkata).
   */
  async getItems(from: Date, to: Date): Promise<CalendarItem[]> {
    const [events, programs, meetings] = await Promise.all([
      this.listEvents().catch(() => []),
      getAllPublishedPrograms(),
      getAllPublishedMeetings(),
    ])

    const items: CalendarItem[] = []

    for (const e of events) {
      const start = new Date(e.start_datetime)
      if (start < from || start > to) continue
      items.push({
        id: e.id,
        source: 'calendar',
        title: e.title,
        description: e.description,
        event_type: e.event_type,
        start_datetime: e.start_datetime,
        end_datetime: e.end_datetime,
        all_day: e.all_day,
        location: e.location,
        status: e.status,
        is_public: e.is_public,
        link: '/calendar',
      })
    }

    for (const p of programs) {
      const start = combineDateTime(p.event_date, p.start_time)
      if (!start) continue
      if (start < from || start > to) continue
      items.push({
        id: `program-${p.id}`,
        source: 'program',
        title: p.title,
        description: p.description,
        event_type: 'program',
        start_datetime: start.toISOString(),
        end_datetime: p.end_time ? combineDateTime(p.event_date, p.end_time)?.toISOString() ?? null : null,
        all_day: false,
        location: p.location,
        status: 'scheduled',
        is_public: p.is_published,
        link: '/programs',
      })
    }

    for (const m of meetings) {
      const start = combineDateTime(m.meeting_date, m.start_time)
      if (!start) continue
      if (start < from || start > to) continue
      items.push({
        id: `meeting-${m.id}`,
        source: 'meeting',
        title: m.title,
        description: m.description,
        event_type: 'meeting',
        start_datetime: start.toISOString(),
        end_datetime: m.end_time ? combineDateTime(m.meeting_date, m.end_time)?.toISOString() ?? null : null,
        all_day: false,
        location: m.location,
        status: m.status === 'cancelled' ? 'cancelled' : m.status === 'completed' ? 'completed' : 'scheduled',
        is_public: m.is_published,
        link: '/meetings',
      })
    }

    return items.sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
  },

  /** All items regardless of window (used for list view). */
  async getAllItems(): Promise<CalendarItem[]> {
    const [events, programs, meetings] = await Promise.all([
      this.listEvents().catch(() => []),
      getAllPublishedPrograms(),
      getAllPublishedMeetings(),
    ])

    const items: CalendarItem[] = []
    for (const e of events) {
      items.push({
        id: e.id,
        source: 'calendar',
        title: e.title,
        description: e.description,
        event_type: e.event_type,
        start_datetime: e.start_datetime,
        end_datetime: e.end_datetime,
        all_day: e.all_day,
        location: e.location,
        status: e.status,
        is_public: e.is_public,
        link: '/calendar',
      })
    }
    for (const p of programs) {
      const start = combineDateTime(p.event_date, p.start_time)
      if (!start) continue
      items.push({
        id: `program-${p.id}`,
        source: 'program',
        title: p.title,
        description: p.description,
        event_type: 'program',
        start_datetime: start.toISOString(),
        end_datetime: p.end_time ? combineDateTime(p.event_date, p.end_time)?.toISOString() ?? null : null,
        all_day: false,
        location: p.location,
        status: 'scheduled',
        is_public: p.is_published,
        link: '/programs',
      })
    }
    for (const m of meetings) {
      const start = combineDateTime(m.meeting_date, m.start_time)
      if (!start) continue
      items.push({
        id: `meeting-${m.id}`,
        source: 'meeting',
        title: m.title,
        description: m.description,
        event_type: 'meeting',
        start_datetime: start.toISOString(),
        end_datetime: m.end_time ? combineDateTime(m.meeting_date, m.end_time)?.toISOString() ?? null : null,
        all_day: false,
        location: m.location,
        status: m.status === 'cancelled' ? 'cancelled' : m.status === 'completed' ? 'completed' : 'scheduled',
        is_public: m.is_published,
        link: '/meetings',
      })
    }
    return items.sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
  },

  /** Today's items for the homepage / portal. */
  async getTodayItems(): Promise<CalendarItem[]> {
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)
    const items = await this.getItems(startOfDay, endOfDay)
    return items.sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
  },

  /** Upcoming items (from now) for the homepage / dashboards. */
  async getUpcomingItems(): Promise<CalendarItem[]> {
    const now = new Date()
    const items = await this.getAllItems()
    return items.filter((i) => new Date(i.start_datetime).getTime() >= now.getTime() - 30 * 60 * 1000).slice(0, 8)
  },
}

async function getAllPublishedPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('id, title, description, event_date, start_time, end_time, location, is_published')
    .eq('is_published', true)
  if (error) return []
  return (data ?? []) as Program[]
}

async function getAllPublishedMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('id, title, description, meeting_date, start_time, end_time, location, status, is_published')
    .eq('is_published', true)
  if (error) return []
  return (data ?? []) as Meeting[]
}

/** Combine a `YYYY-MM-DD` date with a `HH:MM` time string into a Date in Asia/Kolkata. */
function combineDateTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr || !/^\d{2}:\d{2}/.test(timeStr)) return null
  const [h, m] = timeStr.split(':').map(Number)
  const [y, mo, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, mo - 1, d, h - 5, m - 30))
  return isNaN(date.getTime()) ? null : date
}