import { useEffect, useState } from 'react'
import { videoService } from '@/services/videoService'
import { getYouTubeId, getYouTubeThumbnail } from '@/utils'
import type { Video } from '@/types'
import { useToast } from '@/components/ToastProvider'
import ConfirmDialog from '@/components/ConfirmDialog'

interface VideoForm {
  id: string | null
  title: string
  video_url: string
  category: string
  description: string
  is_published: boolean
}

const emptyForm: VideoForm = { id: null, title: '', video_url: '', category: 'ganpati', description: '', is_published: true }

export default function AdminVideos() {
  const [items, setItems] = useState<Video[]>([])
  const [form, setForm] = useState<VideoForm>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Video | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { success: toastSuccess, error: toastError } = useToast()

  const load = () => videoService.list({ publishedOnly: false }).then(setItems).catch(() => toastError('Failed to load videos.'))
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title.trim() || !form.video_url.trim()) { toastError('Title and YouTube URL are required.'); return }
    if (!getYouTubeId(form.video_url.trim())) { toastError('Please paste a valid YouTube link (youtu.be / youtube.com/watch).'); return }
    const thumbnail = getYouTubeThumbnail(form.video_url.trim())
    try {
      if (form.id) {
        await videoService.update(form.id, {
          title: form.title.trim(),
          video_url: form.video_url.trim(),
          category: form.category.trim(),
          description: form.description || null,
          thumbnail_url: thumbnail,
          is_published: form.is_published,
        })
        toastSuccess('Video updated.')
      } else {
        await videoService.create({
          title: form.title.trim(),
          video_url: form.video_url.trim(),
          category: form.category.trim(),
          description: form.description || null,
          thumbnail_url: thumbnail,
          is_published: form.is_published,
        })
        toastSuccess('Video added.')
      }
      setForm(emptyForm)
      load()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to save video.')
    }
  }

  const edit = (v: Video) => {
    setForm({ id: v.id, title: v.title, video_url: v.video_url, category: v.category, description: v.description ?? '', is_published: v.is_published })
  }

  const togglePublish = async (v: Video) => {
    try { await videoService.update(v.id, { is_published: !v.is_published }); load() }
    catch (e) { toastError(e instanceof Error ? e.message : 'Failed to update.'); }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await videoService.remove(deleteTarget.id)
      toastSuccess(`Video "${deleteTarget.title}" deleted.`)
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
      <h1 className="text-2xl font-bold">Videos</h1>
      <p className="text-sm text-gray-500">Paste YouTube link — better than uploading huge files. Thumbnail is added automatically.</p>

      <div className="card p-4 mt-4 grid gap-3">
        <h3 className="font-bold">{form.id ? 'Edit Video' : 'Add Video'}</h3>
        <input className="input" placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <input className="input" placeholder="YouTube URL e.g. https://youtu.be/..." value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} />
        <input className="input" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
        <textarea className="input" rows={2} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} /> Published (visible to public)
        </label>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={save}>{form.id ? 'Save Video' : 'Add Video'}</button>
          {form.id && <button className="btn-outline" onClick={() => setForm(emptyForm)}>Cancel Edit</button>}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {items.map(v => (
          <div key={v.id} className="card p-4 flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {v.thumbnail_url && <img src={v.thumbnail_url} alt="" className="w-20 h-12 object-cover rounded-lg" />}
              <div className="min-w-0">
                <p className="font-bold truncate">{v.title}</p>
                <p className="text-xs text-gray-500 text-ellipsis overflow-hidden">{v.video_url}{v.is_published ? '' : ' • Draft'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => togglePublish(v)} className={`text-xs px-2 py-1 rounded ${v.is_published ? 'bg-gray-100 text-gray-600' : 'bg-saffron text-white'}`}>
                {v.is_published ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => edit(v)} className="btn-outline text-xs px-3 py-1">Edit</button>
              <button onClick={() => setDeleteTarget(v)} className="btn-danger text-xs px-3 py-1">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Video"
        message={<>Delete <b>{deleteTarget?.title}</b>? This removes it from the public Videos page.</>}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}