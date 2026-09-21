import { useEffect, useState } from 'react'
import { meetingService } from '@/services/meetingService'
import type { Meeting, MeetingStatus } from '@/types'

export default function AdminMeetings() {
  const [items, setItems] = useState<Meeting[]>([])
  const [form, setForm] = useState({
    title: '',
    meeting_date: '',
    start_time: '10:00',
    end_time: '',
    location: '',
    agenda: '',
    description: '',
    status: 'scheduled' as MeetingStatus,
  })

  const load = () => meetingService.list({ publishedOnly: false }).then(setItems)
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!form.title || !form.meeting_date) return alert('Title & date required')
    await meetingService.create({
      ...form,
      end_time: form.end_time || null,
      location: form.location || null,
      agenda: form.agenda || null,
      description: form.description || null,
      is_published: true,
    })
    setForm({ title: '', meeting_date: '', start_time: '10:00', end_time: '', location: '', agenda: '', description: '', status: 'scheduled' })
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Manage Meetings</h1>
      <div className="card p-4 mt-4 grid md:grid-cols-2 gap-3">
        <input className="input" placeholder="Meeting Title * " value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <input className="input" type="date" value={form.meeting_date} onChange={e => setForm({ ...form, meeting_date: e.target.value })} />
        <input className="input" type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
        <input className="input" type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
        <input className="input md:col-span-2" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
        <textarea className="input md:col-span-2" rows={2} placeholder="Agenda" value={form.agenda} onChange={e => setForm({ ...form, agenda: e.target.value })} />
        <textarea className="input md:col-span-2" rows={2} placeholder="Description / Minutes" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as MeetingStatus })}>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="btn-primary md:col-span-2" onClick={handleAdd}>Add Meeting</button>
      </div>

      <div className="mt-6 space-y-2">
        {items.map(m => (
          <div key={m.id} className="card p-4 flex justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{m.title}</p>
              <p className="text-xs text-gray-500">{m.meeting_date} {m.start_time}{m.end_time ? ` - ${m.end_time}` : ''} • {m.status} {m.location ? `• ${m.location}` : ''}</p>
              {m.agenda && <p className="text-xs text-gray-600 mt-1 truncate">Agenda: {m.agenda}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <select
                value={m.status}
                onChange={async e => { await meetingService.update(m.id, { status: e.target.value as MeetingStatus }); load() }}
                className="input text-xs py-1 px-2 h-8"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button onClick={async () => { await meetingService.remove(m.id); load() }} className="btn-danger text-xs px-3 py-1 h-8">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
