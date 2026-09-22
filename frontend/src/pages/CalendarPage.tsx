import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Columns3, Clock, MapPin } from 'lucide-react'
import { calendarEventService, type CalendarItem } from '@/services/calendarEventService'
import { useToast } from '@/components/ToastProvider'
import { cn } from '@/utils'
import {
  KOLKATA,
  nowIST,
  startOfWeekMonday,
  addDaysIST,
  sameDayIST,
  parseEventDate,
  formatKolkataDate,
  formatKolkataTime,
  WEEKDAY_LABELS,
  EVENT_TYPE_OPTIONS,
} from '@/utils/calendar'

type ViewMode = 'month' | 'week' | 'day' | 'list'

const TYPE_META: Record<string, { icon: string; classes: string }> = {
  aarti: { icon: '🙏', classes: 'bg-orange-100 text-orange-800 border-orange-200' },
  program: { icon: '📅', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
  meeting: { icon: '🤝', classes: 'bg-purple-100 text-purple-800 border-purple-200' },
  festival: { icon: '🎉', classes: 'bg-pink-100 text-pink-800 border-pink-200' },
  announcement: { icon: '📢', classes: 'bg-amber-100 text-amber-800 border-amber-200' },
  donation: { icon: '💰', classes: 'bg-green-100 text-green-800 border-green-200' },
  cultural: { icon: '🏆', classes: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  other: { icon: '📌', classes: 'bg-gray-100 text-gray-700 border-gray-200' },
}

const FILTERS = [
  { value: 'all', label: 'All' },
  ...EVENT_TYPE_OPTIONS,
]

function timeRange(item: CalendarItem): string {
  const start = formatKolkataTime(item.start_datetime)
  if (item.all_day) return 'All day'
  const end = item.end_datetime ? formatKolkataTime(item.end_datetime) : null
  return end ? `${start} – ${end}` : start
}

export default function CalendarPage() {
  const { error: toastError } = useToast()
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('month')
  const [cursor, setCursor] = useState<Date>(() => nowIST())
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<CalendarItem | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    Promise.all([calendarEventService.getAllItems()])
      .then(([data]) => setItems(data))
      .catch(() => toastError('Could not load calendar events.'))
      .finally(() => setLoading(false))
  }, [toastError])

  useEffect(() => {
    return calendarEventService.subscribe(() => {
      calendarEventService.getAllItems().then(setItems).catch(() => {})
    })
  }, [])

  const filtered = useMemo(
    () =>
      items.filter(i =>
        (filter === 'all' || i.event_type === filter) &&
        (!q || i.title.toLowerCase().includes(q.toLowerCase()) || (i.location ?? '').toLowerCase().includes(q.toLowerCase())),
      ),
    [items, filter, q],
  )

  // month grid (Mon-first)
  const monthCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const startMonday = startOfWeekMonday(first)
    const cells: Date[] = []
    for (let i = 0; i < 42; i++) cells.push(addDaysIST(startMonday, i))
    return cells
  }, [cursor])

  const weekDays = useMemo(() => {
    const monday = startOfWeekMonday(cursor)
    return Array.from({ length: 7 }, (_, i) => addDaysIST(monday, i))
  }, [cursor])

  const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: KOLKATA })

  const move = (dir: -1 | 1) => {
    if (view === 'month') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1))
    else if (view === 'week') setCursor(addDaysIST(cursor, dir * 7))
    else if (view === 'day') setCursor(addDaysIST(cursor, dir))
  }

  const goToday = () => setCursor(nowIST())

  const eventsOn = (d: Date) =>
    filtered.filter(i => sameDayIST(parseEventDate(i.start_datetime), d)).sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())

  const todayItems = eventsOn(nowIST())

  const listSorted = useMemo(() => [...filtered].sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()), [filtered])

  const dayEvents = eventsOn(cursor)

  return (
    <div className="app-container py-4 md:py-6 lg:py-8 pb-10">
      {/* Header */}
      <section className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold text-saffron uppercase tracking-wide">📅 One place for everything</p>
          <h1 className="page-title">Mandal Calendar</h1>
          <p className="page-subtitle">All Aarti, Programs, Meetings, Festivals and important events in one place.</p>
        </div>
        <span className="badge-primary mt-1 shrink-0">{filtered.length} event{filtered.length === 1 ? '' : 's'}</span>
      </section>

      {/* Controls */}
      <div className="mt-4 md:mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => move(-1)} className="p-2 rounded-lg hover:bg-saffron/10 text-gray-600 active:scale-95 transition" aria-label="Previous"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={goToday} className="btn-outline text-sm px-3 py-1.5">Today</button>
          <button onClick={() => move(1)} className="p-2 rounded-lg hover:bg-saffron/10 text-gray-600 active:scale-95 transition" aria-label="Next"><ChevronRight className="w-5 h-5" /></button>
          <p className="font-bold text-gray-900 ml-2 min-w-0 flex-1 md:flex-none md:min-w-[150px] text-center md:text-left md:ml-3 truncate">{monthLabel}</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 text-sm overflow-x-auto scrollbar-hide md:ml-auto">
          {(['month', 'week', 'day', 'list'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)} className={cn('px-3 py-1.5 rounded-lg font-medium capitalize whitespace-nowrap', view === v ? 'bg-saffron text-white shadow-sm' : 'text-gray-600 hover:bg-white')}>
              {v === 'month' ? <CalendarIcon className="w-4 h-4 inline mr-1" /> : v === 'list' ? <List className="w-4 h-4 inline mr-1" /> : v === 'week' ? <Columns3 className="w-4 h-4 inline mr-1" /> : <Clock className="w-4 h-4 inline mr-1" />}
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-2 mt-3">
        <input className="input sm:max-w-xs" placeholder="Search events…" value={q} onChange={e => setQ(e.target.value)} />
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border', filter === f.value ? 'bg-saffron text-white border-saffron' : 'bg-white text-gray-600 border-gray-200 hover:bg-saffron/5')}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Today's events */}
      <div className="card mt-4 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="font-bold text-gray-900 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-saffron rounded-full px-2.5 py-1 tracking-wide">TODAY</span>
            {formatKolkataDate(nowIST(), { day: 'numeric', month: 'long' })}
          </p>
          {todayItems.length > 0 && <span className="badge-success">{todayItems.length} event{todayItems.length === 1 ? '' : 's'}</span>}
        </div>
        {todayItems.length === 0 ? (
          <p className="text-sm text-gray-500 mt-2.5">No events scheduled for today.</p>
        ) : (
          <div className="mt-2 space-y-0.5">
            {todayItems.map(i => (
              <button key={i.id} onClick={() => setSelected(i)} className="flex items-center gap-3 text-sm w-full text-left rounded-xl px-2 py-2 hover:bg-saffron/5 transition-colors">
                <span className="min-w-[72px] text-xs font-semibold text-gray-500">{formatKolkataTime(i.start_datetime)}</span>
                <span className={cn('border rounded-lg px-2 py-0.5 text-xs font-semibold shrink-0', TYPE_META[i.event_type].classes)}>{TYPE_META[i.event_type].icon} {i.event_type}</span>
                <span className="font-medium text-gray-800 flex-1 min-w-0 truncate">{i.title}</span>
                {i.status === 'cancelled' && <span className="text-xs text-red-600 font-bold shrink-0">❌ Cancelled</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main view */}
      <div className="card mt-4 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3" aria-busy="true" aria-label="Loading calendar">
            <div className="skeleton h-24 rounded-xl" />
            <div className="skeleton h-64 rounded-xl" />
          </div>
        ) : view === 'month' ? (
          <>
            {/* Desktop + tablet grid */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                {WEEKDAY_LABELS.map(d => <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500">{d}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {monthCells.map((d, idx) => {
                  const inMonth = d.getMonth() === cursor.getMonth()
                  const dayEvents = eventsOn(d)
                  const isToday = sameDayIST(d, nowIST())
                  return (
                    <button key={idx} onClick={() => { setSelectedDay(d); setView('day') }} className={cn('min-h-[92px] border border-gray-100 p-1.5 text-left align-top hover:bg-saffron/5 transition-colors', !inMonth && 'bg-gray-50/60', isToday && 'bg-saffron/5')}>
                      <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold', isToday ? 'bg-saffron text-white' : inMonth ? 'text-gray-800' : 'text-gray-300')}>
                        {d.getDate()}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 3).map(e => (
                          <div key={e.id} onClick={ev => { ev.stopPropagation(); setSelected(e) }} className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold truncate border', TYPE_META[e.event_type].classes)}>
                            {formatKolkataTime(e.start_datetime)} {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && <div className="text-[10px] text-saffron font-semibold px-1">+{dayEvents.length - 3} more</div>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            {/* Mobile compact list */}
            <div className="sm:hidden p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{monthLabel}</p>
              <div className="mt-2 divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
                {listSorted.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No events in this view.</p>}
                {listSorted.map(i => (
                  <button key={i.id} onClick={() => setSelected(i)} className="flex items-center gap-3 py-2.5 w-full text-left">
                    <div className="w-10 shrink-0 text-center">
                      <p className="font-bold text-gray-800 leading-none">{formatKolkataDate(i.start_datetime, { day: '2-digit' })}</p>
                      <p className="text-[10px] text-gray-400 uppercase">{formatKolkataDate(i.start_datetime, { month: 'short' })}</p>
                    </div>
                    <span className={cn('rounded-lg px-2 py-0.5 text-xs font-semibold border shrink-0', TYPE_META[i.event_type].classes)}>{TYPE_META[i.event_type].icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{i.title}</p>
                      <p className="text-[11px] text-gray-400">{formatKolkataTime(i.start_datetime)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : view === 'week' ? (
          <div className="p-2">
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              {weekDays.map(d => {
                const isToday = sameDayIST(d, nowIST())
                return (
                  <div key={d.toISOString()} className={cn('py-2 text-center text-xs font-semibold', isToday ? 'text-saffron' : 'text-gray-500')}>
                    {WEEKDAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]} {d.getDate()}
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-7">
              {weekDays.map((d, idx) => {
                const evs = eventsOn(d)
                return (
                  <div key={idx} className="min-h-[380px] border border-gray-100 p-1.5">
                    {evs.length === 0 && <p className="text-[10px] text-gray-300 text-center mt-8">—</p>}
                    {evs.map(e => (
                      <button key={e.id} onClick={() => setSelected(e)} className={cn('mb-1 w-full rounded-md px-2 py-1 text-left text-[11px] font-semibold border', TYPE_META[e.event_type].classes)}>
                        {formatKolkataTime(e.start_datetime)}
                        <span className="block truncate">{e.title}</span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        ) : view === 'day' ? (
          <div className="p-4">
            <p className="font-bold text-gray-900 mb-3">{formatKolkataDate(selectedDay ?? cursor, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <div className="space-y-2">
              {dayEvents.length === 0 && <p className="text-sm text-gray-500">No events scheduled for this day.</p>}
              {dayEvents.map(i => (
                <button key={i.id} onClick={() => setSelected(i)} className="w-full flex items-center gap-3 text-left p-3 rounded-xl border border-gray-100 hover:bg-saffron/5 transition-colors">
                  <span className="min-w-[80px] text-sm font-semibold text-saffron">{formatKolkataTime(i.start_datetime)}</span>
                  <span className={cn('rounded-lg px-2 py-0.5 text-xs font-semibold border shrink-0', TYPE_META[i.event_type].classes)}>{TYPE_META[i.event_type].icon} {i.event_type}</span>
                  <span className="font-medium text-gray-800 flex-1 min-w-0 truncate">{i.title}</span>
                  {i.status === 'cancelled' && <span className="text-xs text-red-600 font-bold shrink-0">❌</span>}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 max-h-[75vh] overflow-y-auto">
            {listSorted.length === 0 && <p className="py-10 text-center text-sm text-gray-500">No events found.</p>}
            {listSorted.map(i => (
              <button key={i.id} onClick={() => setSelected(i)} className="w-full flex flex-wrap items-center gap-3 py-3 border-b border-gray-100 last:border-0 text-left hover:bg-saffron/5 px-2 rounded-lg transition-colors">
                <div className="w-12 shrink-0 text-center border-2 border-saffron/20 rounded-xl py-1">
                  <p className="text-lg font-bold text-gray-900 leading-none">{formatKolkataDate(i.start_datetime, { day: '2-digit' })}</p>
                  <p className="text-[10px] text-saffron font-bold uppercase">{formatKolkataDate(i.start_datetime, { month: 'short' })}</p>
                </div>
                <div className="min-w-[76px] text-sm text-gray-500 font-medium shrink-0">{formatKolkataTime(i.start_datetime)}</div>
                <span className={cn('rounded-lg px-2 py-0.5 text-xs font-semibold border shrink-0', TYPE_META[i.event_type].classes)}>{TYPE_META[i.event_type].icon} {i.event_type}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 truncate">{i.title}</p>
                  {i.location && <p className="text-[11px] text-gray-400 inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" aria-hidden="true" /> {i.location}</p>}
                </div>
                {i.status === 'cancelled' && <span className="text-xs text-red-600 font-bold shrink-0">❌ Cancelled</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Event details modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-xl px-2" aria-label="Close">✕</button>
            <span className={cn('inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-semibold border', TYPE_META[selected.event_type].classes)}>
              {TYPE_META[selected.event_type].icon} {selected.event_type}
            </span>
            <h2 className="text-xl font-bold mt-3">{selected.title}</h2>
            <p className="text-sm text-gray-500 mt-1 capitalize">
              {formatKolkataDate(selected.start_datetime, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm text-gray-700 mt-1 font-medium">{timeRange(selected)}</p>
            {selected.location && <p className="text-sm text-gray-600 mt-2">📍 {selected.location}</p>}
            {selected.description && <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{selected.description}</p>}
            {selected.status === 'cancelled' && <p className="text-sm text-red-600 font-bold mt-3">❌ This event has been cancelled.</p>}
          </div>
        </div>
      )}
    </div>
  )
}