import { useEffect, useState } from 'react'
import { aartiService } from '@/services/aartiService'
import { uploadAudio } from '@/services/uploadImageService'
import { storageService } from '@/services/storageService'
import { AARTI_CATEGORIES } from '@/types'
import type { Aarti, AartiCategory } from '@/types'
import { useToast } from '@/components/ToastProvider'
import ConfirmDialog from '@/components/ConfirmDialog'

interface AartiForm {
  id: string | null
  title: string
  category: AartiCategory
  time: string
  lyrics: string
  audio_url: string
  description: string
  is_published: boolean
}

const emptyForm: AartiForm = {
  id: null, title: '', category: 'morning', time: '07:00', lyrics: '', audio_url: '', description: '', is_published: true,
}

export default function AdminAartis() {
  const [items, setItems] = useState<Aarti[]>([])
  const [form, setForm] = useState<AartiForm>(emptyForm)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUploading, setAudioUploading] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<Aarti | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { success: toastSuccess, error: toastError } = useToast()

  const load = () => aartiService.list({ publishedOnly: false }).then(setItems).catch(() => toastError('Failed to load aartis.'))
  useEffect(() => { load() }, [])

  const uploadAudioFile = async () => {
    if (!audioFile) { toastError('Choose an audio file first.'); return }
    setAudioUploading(true)
    setAudioProgress(0)
    try {
      const url = await uploadAudio(audioFile, 'aartis', setAudioProgress)
      setForm({ ...form, audio_url: url })
      setAudioFile(null)
      toastSuccess('Audio uploaded.')
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Audio upload failed.')
    } finally {
      setAudioUploading(false)
    }
  }

  const save = async () => {
    if (!form.title.trim()) { toastError('Title is required.'); return }
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        time: form.time || '00:00',
        lyrics: form.lyrics,
        audio_url: form.audio_url || null,
        description: form.description || null,
        is_published: form.is_published,
      }
      if (form.id) { await aartiService.update(form.id, payload); toastSuccess('Aarti updated.') }
      else { await aartiService.create(payload); toastSuccess('Aarti added.') }
      setForm(emptyForm); setAudioFile(null)
      load()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to save aarti.')
    }
  }

  const edit = (a: Aarti) => {
    setForm({ id: a.id, title: a.title, category: a.category, time: a.time, lyrics: a.lyrics, audio_url: a.audio_url ?? '', description: a.description ?? '', is_published: a.is_published })
    setAudioFile(null)
  }

  const togglePublish = async (a: Aarti) => {
    try { await aartiService.update(a.id, { is_published: !a.is_published }); load() }
    catch (e) { toastError(e instanceof Error ? e.message : 'Failed to update.') }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.audio_url) {
        try { await storageService.remove('aarti-audio', deleteTarget.audio_url) } catch { /* storage may hold nothing */ }
      }
      await aartiService.remove(deleteTarget.id)
      toastSuccess(`Aarti "${deleteTarget.title}" deleted.`)
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
      <h1 className="text-2xl font-bold">Aartis</h1>
      <p className="text-sm text-gray-500">Aartis are shown on the Aarti page with their daily timings. Audio shows a player on the public page.</p>

      <div className="card p-4 mt-4 grid md:grid-cols-2 gap-3">
        <h3 className="font-bold md:col-span-2">{form.id ? 'Edit Aarti' : 'Add Aarti'}</h3>
        <input className="input" placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as AartiCategory })}>
          {AARTI_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input className="input" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
        <div>
          <label className="text-sm font-medium">Audio File (MP3/WAV/OGG/M4A, max 20MB)</label>
          <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/m4a" className="input mt-1" onChange={e => setAudioFile(e.target.files?.[0] ?? null)} />
          {audioUploading && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-saffron h-2" style={{ width: `${audioProgress}%` }} />
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <button className="btn-secondary text-sm" disabled={audioUploading || !audioFile} onClick={uploadAudioFile}>
              {audioUploading ? `Uploading ${audioProgress}%…` : 'Upload Audio'}
            </button>
            {form.audio_url && <span className="text-xs text-green-600 truncate flex-1">✓ {form.audio_url.split('/').pop()}</span>}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Or paste an audio URL</label>
          <input className="input mt-1" placeholder="https://..." value={form.audio_url} onChange={e => setForm({ ...form, audio_url: e.target.value })} />
        </div>
        <textarea className="input md:col-span-2" rows={4} placeholder="Lyrics" value={form.lyrics} onChange={e => setForm({ ...form, lyrics: e.target.value })} />
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} /> Published (visible to public)
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button className="btn-primary flex-1" onClick={save}>{form.id ? 'Save Aarti' : 'Add Aarti'}</button>
          {form.id && <button className="btn-outline" onClick={() => { setForm(emptyForm); setAudioFile(null) }}>Cancel Edit</button>}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {items.map(a => (
          <div key={a.id} className="card p-4 flex justify-between items-center gap-3">
            <div>
              <p className="font-bold">{a.title}</p>
              <p className="text-xs text-gray-500">{a.category} • {a.time}{a.is_published ? '' : ' • Draft'}{a.audio_url ? ' • 🎵' : ''}</p>
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
        title="Delete Aarti"
        message={<>Delete <b>{deleteTarget?.title}</b>? This removes it from the public Aarti page.</>}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}