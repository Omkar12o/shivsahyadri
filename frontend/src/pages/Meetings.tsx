import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { meetingService } from '@/services/meetingService'
import { EmptyState } from '@/components/ui/feedback'
import { formatDate, formatTime } from '@/utils'
import { Handshake, Calendar, MapPin, Clock } from 'lucide-react'
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

  if (loading) return <MeetingsSkeleton />

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const upcoming = items.filter(m => m.meeting_date >= today && m.status === 'scheduled')
  const pastScheduled = items.filter(m => m.meeting_date < today && m.status === 'scheduled')
  const completed = items.filter(m => m.status === 'completed')
  const cancelled = items.filter(m => m.status === 'cancelled')

  return (
    <div className="app-container py-4 md:py-6 lg:py-8 pb-10">
      {/* Header */}
      <section className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold text-saffron uppercase tracking-wide flex items-center gap-1.5">
            <Handshake className="w-3.5 h-3.5" aria-hidden="true" /> Committee & Planning
          </p>
          <h1 className="page-title">Mandal Meetings</h1>
          <p className="page-subtitle">Committee meetings, planning sessions & minutes</p>
        </div>
        <span className="badge-primary mt-1 shrink-0">{items.length} meeting{items.length === 1 ? '' : 's'}</span>
      </section>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No meetings yet" description="Upcoming meetings will be published by Admin." />
        </div>
      ) : (
        <div className="mt-2 space-y-8">
          <section className="pt-4 md:pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm md:text-base font-bold text-gray-900 flex items-center gap-1.5">
                <Handshake className="w-4 h-4 text-saffron" aria-hidden="true" /> Upcoming Meetings
              </h2>
              {upcoming.length > 0 && <span className="badge-primary">{upcoming.length}</span>}
            </div>
            {upcoming.length === 0 ? (
              <EmptyCard emoji="🤝" text="No upcoming meetings." />
            ) : (
              <div className="grid md:grid-cols-2 gap-4 mt-3">{upcoming.map(m => <MeetingCard key={m.id} m={m} />)}</div>
            )}
          </section>

          {pastScheduled.length > 0 && (
            <section className="pt-4 md:pt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm md:text-base font-bold text-gray-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-saffron" aria-hidden="true" /> Pending / Overdue
                </h2>
                <span className="badge-warning">{pastScheduled.length}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-3 opacity-80 hover:opacity-100 transition-opacity">{pastScheduled.map(m => <MeetingCard key={m.id} m={m} />)}</div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="pt-4 md:pt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm md:text-base font-bold text-gray-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-saffron" aria-hidden="true" /> Completed
                </h2>
                <span className="badge-success">{completed.length}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-3">{completed.slice(0, 6).map(m => <MeetingCard key={m.id} m={m} />)}</div>
            </section>
          )}

          {cancelled.length > 0 && (
            <section className="pt-4 md:pt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm md:text-base font-bold text-gray-900">Cancelled</h2>
                <span className="badge-danger">{cancelled.length}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-3 opacity-60 hover:opacity-100 transition-opacity">{cancelled.map(m => <MeetingCard key={m.id} m={m} />)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function MeetingCard({ m }: { m: Meeting }) {
  return (
    <article className="card p-4 md:p-5 flex flex-col gap-2 hover:shadow-lg transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-saffron/10 flex items-center justify-center shrink-0">
            <Handshake className="w-5 h-5 text-saffron" aria-hidden="true" />
          </span>
          <p className="font-bold text-gray-900 leading-snug">{m.title}</p>
        </div>
        <span className={`badge text-xs shrink-0 ${MEETING_STATUS_COLORS[m.status]}`}>{MEETING_STATUS_LABELS[m.status]}</span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-saffron shrink-0" aria-hidden="true" /> {formatDate(m.meeting_date)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-saffron shrink-0" aria-hidden="true" /> {formatTime(m.start_time)}{m.end_time ? ` – ${formatTime(m.end_time)}` : ''}
        </span>
      </div>

      {m.location && (
        <p className="text-xs text-gray-500 inline-flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-saffron shrink-0" aria-hidden="true" /> {m.location}
        </p>
      )}

      {m.agenda && (
        <p className="text-sm text-gray-700 mt-0.5 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
          <span className="font-semibold text-gray-800">Agenda:</span> {m.agenda}
        </p>
      )}

      {m.description && <p className="text-sm text-gray-500 leading-relaxed">{m.description}</p>}
    </article>
  )
}

function EmptyCard({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="card mt-3 p-6 text-center text-sm text-gray-500">
      <p className="text-2xl">{emoji}</p>
      <p className="mt-1">{text}</p>
    </div>
  )
}

function MeetingsSkeleton() {
  return (
    <div className="app-container py-4 md:py-6 lg:py-8 pb-10" aria-busy="true" aria-label="Loading Meetings">
      <div className="skeleton h-3 w-28 rounded-full" />
      <div className="skeleton h-7 w-48 rounded-full mt-2" />
      <div className="skeleton h-3 w-60 rounded-full mt-2" />
      <div className="skeleton h-3 w-24 rounded-full mt-5" />
      <div className="grid md:grid-cols-2 gap-4 mt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}