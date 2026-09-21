import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, Calendar } from 'lucide-react'
import { calendarEventService } from '@/services/calendarEventService'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import ConfirmDialog from '@/components/ConfirmDialog'
import { EVENT_TYPE_OPTIONS } from '@/pages/CalendarPage'
import type { CalendarEvent } from '@/types'
import { cn, getErrorMessage } from '@/utils'
import { KOLKATA, formatKolkataDate, formatKolkataTime, formatDateInputValue } from '@/utils/calendar'

type Payload = {
  title: string
  description: string
  event_type: CalendarEvent['event_type']
  event_date: string
  start_time: string
  end_time: string
  all_day: boolean
  location: string
  status: CalendarEvent['status']
  is_public: boolean
}

const EMPTY: Payload = {
  title: '',
  description: '',
  event_type: 'program',
  event_date: '',
  start_time: '18:00',
  end_time: '',
  all_day: false,
  location: '',
  status: 'scheduled',
  is_public: true,
}

export default function AdminCalendar() {
  const { profile } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Payload>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [cursor, setCursor] = useState<Date>(() => new Date())
  const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: KOLKATA })

  const load = useCallback(() => {
    setLoading(true)
    return calendarEventService
      .adminListEvents()
      .then(setEvents)
      .catch(e => toastError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [toastError])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(
    () => events.filter(e =>
      (filter === 'all' || e.event_type === filter) &&
      (!q || e.title.toLowerCase().includes(q.toLowerCase()) || (e.location ?? '').toLowerCase().includes(q.toLowerCase())),
    ),
    [events, filter, q],
  )

  const openCreate = () => {
    setEditId(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  const openEdit = (ev: CalendarEvent) => {
    setEditId(ev.id)
    setForm({
      title: ev.title,
      description: ev.description ?? '',
      event_type: ev.event_type,
      event_date: formatDateInputValue(ev.start_datetime) ?? '',
      start_time: formatTimeInput(ev.start_datetime),
      end_time: ev.end_datetime ? formatTimeInput(ev.end_datetime) : '',
      all_day: ev.all_day,
      location: ev.location ?? '',
      status: ev.status,
      is_public: ev.is_public,
    })
    setShowForm(true)
  }

  const save = async () => {
    const title = form.title.trim()
    const event_date = form.event_date
    if (!title) { toastError('Title is required.'); return }
    if (!event_date) { toastError('Date is required.'); return }

    const start_datetime = new Date(`${event_date}T${form.start_time || '00:00'}`)
    if (Number.isNaN(start_datetime.getTime())) { toastError('Invalid date/time.'); return }

    const payload = {
      title,
      description: form.description.trim() || null,
      event_type: form.event_type,
      event_date,
      start_datetime: start_datetime.toISOString(),
      end_datetime: form.end_time && !form.all_day ? new Date(`${event_date}T${form.end_time}`).toISOString() : null,
      all_day: form.all_day,
      location: form.location.trim() || null,
      status: form.status,
      is_public: form.is_public,
      created_by: profile?.id ?? null,
    }

    setSaving(true)
    try {
      if (editId) {
        await calendarEventService.update(editId, payload)
        toastSuccess('✓ Event updated')
      } else {
        await calendarEventService.create(payload)
        toastSuccess('✓ Event created')
      }
      setShowForm(false)
      await load()
    } catch (e) {
      toastError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await calendarEventService.remove(deleteTarget.id)
      toastSuccess('✓ Event deleted')
      setDeleteTarget(null)
      await load()
    } catch (e) {
      toastError(getErrorMessage(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">📅 Calendar Events</h1>
          <p className="text-sm text-gray-500">Create and manage events for the Mandal Calendar (Asia/Kolkata).</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4 inline mr-1.5 -mt-0.5" /> New Event
        </button>
      </div>

      <div className="card mt-4 p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-gray-500">{monthLabel} · {filtered.length} events on file</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input type="month" value={formatMonthInput(cursor)} onChange={e => e.target.value && setCursor(new Date(`${e.target.value}T12:00:00`))} className="input pl-10 py-2 text-sm w-full sm:w-auto" />
            </div>
            <input className="input sm:w-56" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-1.5 mt-3 overflow-x-auto scrollbar-hide pb-1">
          <button key="all" onClick={() => setFilter('all')} className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border', filter === 'all' ? 'bg-saffron text-white border-saffron' : 'bg-white text-gray-600 border-gray-200')}>All</button>
          {EVENT_TYPE_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setFilter(o.value)} className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border', filter === o.value ? 'bg-saffron text-white border-saffron' : 'bg-white text-gray-600 border-gray-200')}>{o.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-3 font-semibold">Date</th>
                  <th className="py-2 pr-3 font-semibold">Time</th>
                  <th className="py-2 pr-3 font-semibold">Event</th>
                  <th className="py-2 pr-3 font-semibold">Type</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 font-semibold w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-400">No events yet — create your first one.</td></tr>
                )}
                {filtered.map(ev => {
                  const inMonth = new Date(ev.start_datetime).getMonth() === cursor.getMonth() && new Date(ev.start_datetime).getFullYear() === cursor.getFullYear()
                  return (
                    <tr key={ev.id} className={cn('border-b border-gray-50', !inMonth && 'opacity-40')}>
                      <td className="py-3 pr-3">{formatKolkataDate(ev.start_datetime, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                      <td className="py-3 pr-3">{ev.all_day ? 'All day' : formatKolkataTime(ev.start_datetime)}</td>
                      <td className="py-3 pr-3">
                        <p className="font-medium text-gray-800">{ev.title}</p>
                        {ev.location && <p className="text-xs text-gray-400 truncate max-w-[220px]">📍 {ev.location}</p>}
                      </td>
                      <td className="py-3 pr-3"><span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded-full capitalize">{ev.event_type}</span></td>
                      <td className="py-3 pr-3">
                        <span className={cn('text-xs font-semibold px-2 py-1 rounded-full capitalize', ev.status === 'cancelled' ? 'bg-red-100 text-red-600' : ev.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-saffron/10 text-saffron')}>{ev.status}</span>
                      </td>
                      <td className="py-3">
                        <button onClick={() => openEdit(ev)} className="p-1.5 rounded-lg text-gray-500 hover:bg-saffron/10 hover:text-saffron border border-transparent hover:border-saffron/20" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(ev)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 ml-1" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => !saving && setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 my-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold">{editId ? '✏️ Edit Event' : '✨ New Event'}</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="label">Event Title *</label>
                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Ganesh Aarti" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value as Payload['event_type'] })}>
                    {EVENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input capitalize" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Payload['status'] })}>
                    <option value="scheduled">Scheduled</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Date *</label>
                  <input type="date" className="input" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
                </div>
                <div>
                  <label className="label">Start Time</label>
                  <input type="time" className="input" value={form.start_time} disabled={form.all_day} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input type="time" className="input" value={form.end_time} disabled={form.all_day} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.all_day} onChange={e => setForm({ ...form, all_day: e.target.checked })} /> All day
              </label>

              <div>
                <label className="label">Location / Venue</label>
                <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Mandal Hall" />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[90px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details about this event…" />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="accent-saffron" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} /> Visible on public calendar
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-outline" disabled={saving} onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" disabled={saving} onClick={save}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : editId ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this event?"
        message={<><b>"{deleteTarget?.title}"</b><br />This will permanently remove it from the calendar.</>}
        confirmLabel="Delete Event"
        busy={deleting}
        onConfirm={doDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function formatTimeInput(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: KOLKATA, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso))
}

function formatMonthInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}