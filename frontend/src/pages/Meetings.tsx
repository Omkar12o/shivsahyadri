import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { meetingService } from '@/services/meetingService'
import { LoadingScreen, EmptyState } from '@/components/ui/feedback'
import { formatDate, formatTime } from '@/utils'
import { MEETING_STATUS_COLORS, MEETING_STATUS_LABELS } from '@/types'
import type { Meeting } from '@/types'

export default function Meetings() {
  const [items, setItems] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    meetingService.list().then(setItems).finally(() => setLoading(false))
    const ch = supabase.channel('meetings-live').on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => meetingService.list().then(setItems)).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  if (loading) return <LoadingScreen />

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const upcoming = items.filter(m => m.meeting_date >= today && m.status === 'scheduled')
  const completed = items.filter(m => m.status === 'completed')
  const cancelled = items.filter(m => m.status === 'cancelled')
  const pastScheduled = items.filter(m => m.meeting_date < today && m.status === 'scheduled')

  return (
    <div className="container-main px-4 py-10">
      <h1 className="page-title">🤝 Mandal Meetings</h1>
      <p className="page-subtitle">Committee meetings, planning sessions & minutes</p>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No meetings yet" description="Upcoming meetings will be published by Admin." />
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          <section>
            <h2 className="font-bold text-lg">Upcoming Meetings</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">No upcoming meetings.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 mt-3">
                {upcoming.map(m => <Card key={m.id} m={m} />)}
              </div>
            )}
          </section>

          {pastScheduled.length > 0 && (
            <section>
              <h2 className="font-bold text-lg">Pending / Overdue</h2>
              <div className="grid md:grid-cols-2 gap-4 mt-3 opacity-75">
                {pastScheduled.map(m => <Card key={m.id} m={m} />)}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h2 className="font-bold text-lg">Completed</h2>
              <div className="grid md:grid-cols-2 gap-4 mt-3">
                {completed.slice(0, 6).map(m => <Card key={m.id} m={m} />)}
              </div>
            </section>
          )}

          {cancelled.length > 0 && (
            <section>
              <h2 className="font-bold text-lg">Cancelled</h2>
              <div className="grid md:grid-cols-2 gap-4 mt-3 opacity-60">
                {cancelled.map(m => <Card key={m.id} m={m} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function Card({ m }: { m: Meeting }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold">{m.title}</p>
        <span className={`badge text-xs px-2 py-1 rounded-full ${MEETING_STATUS_COLORS[m.status]}`}>{MEETING_STATUS_LABELS[m.status]}</span>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        {formatDate(m.meeting_date)} • {formatTime(m.start_time)}{m.end_time ? ` - ${formatTime(m.end_time)}` : ''}
      </p>
      {m.location && <p className="text-xs text-gray-400 mt-1">📍 {m.location}</p>}
      {m.agenda && <p className="text-sm text-gray-700 mt-2"><span className="font-medium">Agenda:</span> {m.agenda}</p>}
      {m.description && <p className="text-sm text-gray-600 mt-1">{m.description}</p>}
    </div>
  )
}
