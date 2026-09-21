import { useEffect, useState } from 'react'
import { programService } from '@/services/programService'
import { uploadImage } from '@/services/uploadImageService'
import { mediaService } from '@/services/mediaService'
import type { Program } from '@/types'
import { useToast } from '@/components/ToastProvider'
import ConfirmDialog from '@/components/ConfirmDialog'

interface ProgramForm {
  id: string | null
  title: string
  event_date: string
  start_time: string
  end_time: string
  location: string
  description: string
  is_published: boolean
  image_url: string
  image_public_id: string | null
}

const emptyForm: ProgramForm = {
  id: null, title: '', event_date: '', start_time: '09:00', end_time: '',
  location: '', description: '', is_published: true, image_url: '', image_public_id: null,
}

export default function AdminPrograms() {
  const [items, setItems] = useState<Program[]>([])
  const [form, setForm] = useState<ProgramForm>(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { success: toastSuccess, error: toastError } = useToast()

  const load = () => programService.list({ publishedOnly: false }).then(setItems).catch(() => toastError('Failed to load programs.'))
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title.trim() || !form.event_date) { toastError('Title and date are required.'); return }
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
        event_date: form.event_date,
        start_time: form.start_time,
        end_time: form.end_time || null,
        location: form.location || null,
        description: form.description || null,
        is_published: form.is_published,
        image_url: imageUrl,
        image_public_id: imagePublicId,
      }
      if (form.id) {
        await programService.update(form.id, payload)
        toastSuccess('Program updated.')
      } else {
        await programService.create(payload)
        toastSuccess('Program created.')
      }
      setForm(emptyForm); setFile(null)
      load()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to save program.')
    } finally {
      setUploading(false)
    }
  }

  const edit = (p: Program) => {
    setForm({ id: p.id, title: p.title, event_date: p.event_date, start_time: p.start_time, end_time: p.end_time ?? '', location: p.location ?? '', description: p.description ?? '', is_published: p.is_published, image_url: p.image_url ?? '', image_public_id: p.image_public_id })
    setFile(null)
  }

  const togglePublish = async (p: Program) => {
    try {
      await programService.update(p.id, { is_published: !p.is_published })
      load()
    } catch (e) { toastError(e instanceof Error ? e.message : 'Failed to update.') }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.image_public_id) {
        await mediaService.deleteCloudinary(deleteTarget.image_public_id)
      }
      await programService.remove(deleteTarget.id)
      toastSuccess(`Program "${deleteTarget.title}" deleted.`)
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
      <h1 className="text-2xl font-bold">Programs</h1>
      <p className="text-sm text-gray-500">Programs appear on the Home and Programs pages once published.</p>

      <div className="card p-4 mt-4 grid md:grid-cols-2 gap-3">
        <h3 className="font-bold md:col-span-2">{form.id ? 'Edit Program' : 'Add Program'}</h3>
        <input className="input" placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <input className="input" type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
        <input className="input" type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
        <input className="input" type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
        <input className="input md:col-span-2" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Poster / Image (optional)</label>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input mt-1" onChange={e => {
            const f = e.target.files?.[0] ?? null
            setFile(f)
            if (f) setForm({ ...form, image_url: URL.createObjectURL(f) })
          }} />
          {!file && form.image_url && <img src={form.image_url} alt="preview" className="w-40 h-28 object-cover rounded-xl mt-2 border" />}
          {uploading && <p className="text-xs text-saffron mt-1">Uploading…</p>}
        </div>
        <textarea className="input md:col-span-2" rows={3} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} /> Published (visible to public)
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button className="btn-primary flex-1" onClick={save}>{form.id ? 'Save Program' : 'Add Program'}</button>
          {form.id && <button className="btn-outline" onClick={() => { setForm(emptyForm); setFile(null) }}>Cancel Edit</button>}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {items.map(p => (
          <div key={p.id} className="card p-4 flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {p.image_url && <img src={p.image_url} alt="" className="w-16 h-12 object-cover rounded-lg" />}
              <div className="min-w-0">
                <p className="font-bold truncate">{p.title}</p>
                <p className="text-xs text-gray-500">{p.event_date} {p.start_time}{p.is_published ? '' : ' • Draft'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => togglePublish(p)} className={`text-xs px-2 py-1 rounded ${p.is_published ? 'bg-gray-100 text-gray-600' : 'bg-saffron text-white'}`}>
                {p.is_published ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => edit(p)} className="btn-outline text-xs px-3 py-1">Edit</button>
              <button onClick={() => setDeleteTarget(p)} className="btn-danger text-xs px-3 py-1">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Program"
        message={<>Delete <b>{deleteTarget?.title}</b>? This removes it from the public site.</>}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}