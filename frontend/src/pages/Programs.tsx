import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { programService } from '@/services/programService'
import { EmptyState } from '@/components/ui/feedback'
import { formatDate, formatTime } from '@/utils'
import { Calendar, MapPin, Clock } from 'lucide-react'
import type { Program } from '@/types'

export default function Programs() {
  const [items, setItems] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => programService.list().then(setItems).finally(() => setLoading(false))

  useEffect(() => {
    load()
    const ch = supabase.channel('programs-live').on('postgres_changes', { event: '*', schema: 'public', table: 'programs' }, () => load()).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  if (loading) return <ProgramsSkeleton />

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const todays = items.filter(p => p.event_date === today)
  const upcoming = items.filter(p => p.event_date > today)
  const past = items.filter(p => p.event_date < today)

  return (
    <div className="app-container py-4 md:py-6 lg:py-8 pb-10">
      {/* Header */}
      <section className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold text-saffron uppercase tracking-wide">📅 Ganeshotsav Schedule</p>
          <h1 className="page-title">Programs & Calendar</h1>
          <p className="page-subtitle">Daily schedule of aarti, events and celebrations</p>
        </div>
        <Link to="/calendar" className="btn-outline text-xs px-4 py-2 shrink-0">Full Calendar →</Link>
      </section>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No programs yet" description="Schedule will be published by Admin." />
        </div>
      ) : (
        <div className="mt-2 space-y-8">
          <section className="pt-4 md:pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm md:text-base font-bold text-gray-900">Today</h2>
              {todays.length > 0 && <span className="badge-success">{todays.length} event{todays.length === 1 ? '' : 's'}</span>}
            </div>
            {todays.length === 0 ? (
              <EmptyCard emoji="🗓️" text="No events scheduled for today." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">{todays.map(p => <ProgramCard key={p.id} p={p} today />)}</div>
            )}
          </section>

          <section className="pt-4 md:pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm md:text-base font-bold text-gray-900">Upcoming</h2>
              {upcoming.length > 0 && <span className="badge-primary">{upcoming.length} event{upcoming.length === 1 ? '' : 's'}</span>}
            </div>
            {upcoming.length === 0 ? (
              <EmptyCard emoji="✅" text="All caught up — no upcoming events." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">{upcoming.map(p => <ProgramCard key={p.id} p={p} />)}</div>
            )}
          </section>

          {past.length > 0 && (
            <section className="pt-4 md:pt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm md:text-base font-bold text-gray-900">Completed</h2>
                <span className="badge">{past.length} event{past.length === 1 ? '' : 's'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3 opacity-70 hover:opacity-100 transition-opacity">
                {past.slice(0, 6).map(p => <ProgramCard key={p.id} p={p} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function ProgramCard({ p, today }: { p: Program; today?: boolean }) {
  return (
    <article className="card flex flex-col overflow-hidden group">
      <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-saffron/15 via-orange-50 to-primary-100 overflow-hidden">
        {p.image_url ? (
          <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="w-12 h-12 rounded-2xl bg-white/70 backdrop-blur flex items-center justify-center">
              <Calendar className="w-6 h-6 text-saffron" aria-hidden="true" />
            </span>
          </div>
        )}
        <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur text-saffron text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
          {today && <span className="mr-1.5 text-red-600">●</span>}
          {formatDate(p.event_date)}
        </span>
      </div>
      <div className="p-4 md:p-5 flex flex-col gap-2 flex-1">
        <p className="font-bold text-gray-900 leading-snug">{p.title}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <p className="inline-flex items-center gap-1.5 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-saffron shrink-0" aria-hidden="true" />
            {formatTime(p.start_time)}{p.end_time ? ` – ${formatTime(p.end_time)}` : ''}
          </p>
          {p.location && (
            <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-saffron shrink-0" aria-hidden="true" /> {p.location}
            </p>
          )}
        </div>
        {p.description && <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{p.description}</p>}
      </div>
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

function ProgramsSkeleton() {
  return (
    <div className="app-container py-4 md:py-6 lg:py-8 pb-10" aria-busy="true" aria-label="Loading Programs">
      <div className="skeleton h-3 w-28 rounded-full" />
      <div className="skeleton h-7 w-52 rounded-full mt-2" />
      <div className="skeleton h-3 w-64 rounded-full mt-2" />
      <div className="skeleton h-3 w-24 rounded-full mt-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}