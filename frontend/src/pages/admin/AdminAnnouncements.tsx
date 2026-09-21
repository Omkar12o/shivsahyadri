import { useEffect, useState } from 'react'
import { announcementService } from '@/services/announcementService'
import { uploadImage } from '@/services/uploadImageService'
import { mediaService } from '@/services/mediaService'
import { pushService } from '@/services/pushService'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/types'
import type { Announcement, AnnouncementPriority } from '@/types'
import { useToast } from '@/components/ToastProvider'
import ConfirmDialog from '@/components/ConfirmDialog'

interface AnnouncementForm {
  id: string | null
  title: string
  message: string
  priority: AnnouncementPriority
  popup_enabled: boolean
  start_date: string
  end_date: string
  is_published: boolean
  image_url: string
  image_public_id: string | null
}

const emptyForm: AnnouncementForm = {
  id: null, title: '', message: '', priority: 'medium', popup_enabled: false,
  start_date: '', end_date: '', is_published: true, image_url: '', image_public_id: null,
}

export default function AdminAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([])
  const [form, setForm] = useState<AnnouncementForm>(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [sendPush, setSendPush] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { success: toastSuccess, error: toastError } = useToast()

  const load = () => announcementService.list({ publishedOnly: false }).then(setItems).catch(() => toastError('Failed to load announcements.'))
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title.trim() || !form.message.trim()) { toastError('Title and message are required.'); return }
    setUploading(true)
    try {
      let imageUrl = form.image_url || null
      let imagePublicId = form.image_public_id
      if (file) {
        const result = await uploadImage(file, 'events')
        imageUrl = result.url
        imagePublicId = result.public_id
      }
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        priority: form.priority,
        popup_enabled: form.popup_enabled,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_published: form.is_published,
        image_url: imageUrl,
        image_public_id: imagePublicId,
      }
      if (form.id) { await announcementService.update(form.id, payload); toastSuccess('Announcement updated.') }
      else {
        await announcementService.create(payload)
        toastSuccess('✓ Announcement published')
        if (sendPush) {
          try {
            const res = await pushService.send({
              title: payload.title,
              body: payload.message,
              url: '/announcements',
              to_all: true,
            })
            if (res.failed > 0) {
              toastSuccess(`⚠ Announcement published, but ${res.failed} devices could not be notified. (${res.sent} sent)`)
            } else {
              toastSuccess(`✓ Push notification sent to ${res.sent} devices`)
            }
          } catch {
            toastSuccess('Announcement published. Push could not be sent (VAPID not configured).')
          }
          setSendPush(false)
        }
      }
      setForm(emptyForm); setFile(null)
      load()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to save announcement.')
    } finally {
      setUploading(false)
    }
  }

  const edit = (a: Announcement) => {
    setForm({
      id: a.id, title: a.title, message: a.message, priority: a.priority,
      popup_enabled: a.popup_enabled, start_date: a.start_date ?? '', end_date: a.end_date ?? '',
      is_published: a.is_published, image_url: a.image_url ?? '', image_public_id: a.image_public_id,
    })
    setFile(null)
  }

  const togglePublish = async (a: Announcement) => {
    try { await announcementService.update(a.id, { is_published: !a.is_published }); load() }
    catch (e) { toastError(e instanceof Error ? e.message : 'Failed to update.') }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.image_public_id) {
        await mediaService.deleteCloudinary(deleteTarget.image_public_id)
      }
      await announcementService.remove(deleteTarget.id)
      toastSuccess(`Announcement "${deleteTarget.title}" deleted.`)
      setDeleteTarget(null)
      load()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to delete.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Announcements</h1>
      <p className="text-sm text-gray-500">High/Urgent announcements automatically create notifications for members. Pop-up notices can be scheduled with start/end dates.</p>

      <div className="card p-4 mt-4 grid md:grid-cols-2 gap-3">
        <h3 className="font-bold md:col-span-2">{form.id ? 'Edit Announcement' : 'New Announcement'}</h3>
        <input className="input" placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as AnnouncementPriority })}>
          {(Object.keys(PRIORITY_LABELS) as AnnouncementPriority[]).map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </select>
        <textarea className="input md:col-span-2" rows={3} placeholder="Message *" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Image (optional)</label>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input mt-1" onChange={e => {
            const f = e.target.files?.[0] ?? null
            setFile(f)
            if (f) setForm({ ...form, image_url: URL.createObjectURL(f) })
          }} />
          {!file && form.image_url && <img src={form.image_url} alt="" className="w-32 h-20 object-cover rounded-xl mt-2 border" />}
          {uploading && <p className="text-xs text-saffron mt-1">Uploading…</p>}
        </div>
        <div className="md:col-span-2 grid md:grid-cols-2 gap-2">
          <div>
            <label className="label">Start Date</label>
            <input className="input" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div>
            <label className="label">End Date</label>
            <input className="input" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.popup_enabled} onChange={e => setForm({ ...form, popup_enabled: e.target.checked })} /> Show as pop-up notice
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} /> Published (visible to public)
        </label>
        {!form.id && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="accent-saffron" checked={sendPush} onChange={e => setSendPush(e.target.checked)} />
            <span>
              ☑ Send push notification to members
              <span className="block text-[11px] text-gray-400">Delivered to subscribed devices (web push).</span>
            </span>
          </label>
        )}
        <div className="md:col-span-2 flex gap-2">
          <button className="btn-primary flex-1" onClick={save}>{form.id ? 'Save Announcement' : 'Publish'}</button>
          {form.id && <button className="btn-outline" onClick={() => { setForm(emptyForm); setFile(null) }}>Cancel Edit</button>}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {items.map(a => (
          <div key={a.id} className="card p-4 flex justify-between items-center gap-3">
            <div>
              <p className="font-bold">{a.title}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{a.message}</p>
              <span className={`text-xs px-2 py-0.5 rounded inline-block mt-1 ${PRIORITY_COLORS[a.priority]}`}>{PRIORITY_LABELS[a.priority]}</span>
              {a.popup_enabled && <span className="text-xs px-2 py-0.5 rounded inline-block mt-1 ml-1 bg-purple-100 text-purple-700">Popup</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => togglePublish(a)} className={`text-xs px-2 py-1 rounded ${a.is_published ? 'bg-gray-100 text-gray-600' : 'bg-saffron text-white'}`}>
                {a.is_published ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => edit(a)} className="btn-outline text-xs px-3 py-1">Edit</button>
              <button onClick={() => setDeleteTarget(a)} className="btn-danger text-xs px-3 py-1">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Announcement"
        message={<>Delete <b>{deleteTarget?.title}</b>? This removes it from the public site.</>}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}