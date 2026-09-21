import { useEffect, useState } from 'react'
import { galleryService } from '@/services/galleryService'
import { uploadImage } from '@/services/uploadImageService'
import { mediaService } from '@/services/mediaService'
import { GALLERY_CATEGORIES } from '@/types'
import type { GalleryImage } from '@/types'
import { useToast } from '@/components/ToastProvider'
import ConfirmDialog from '@/components/ConfirmDialog'

interface EditForm {
  title: string
  category: string
  event_date: string
  is_published: boolean
}

const emptyEdit: EditForm = { title: '', category: 'Ganpati', event_date: '', is_published: true }

export default function AdminGallery() {
  const [items, setItems] = useState<GalleryImage[]>([])
  const { success: toastSuccess, error: toastError } = useToast()

  const [files, setFiles] = useState<File[]>([])
  const [category, setCategory] = useState('Ganpati')
  const [eventDate, setEventDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')

  const [editing, setEditing] = useState<GalleryImage | null>(null)
  const [editForm, setEditForm] = useState<EditForm>(emptyEdit)
  const [savingEdit, setSavingEdit] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () =>
    galleryService.list({ publishedOnly: false }).then(setItems).catch(() => toastError('Failed to load gallery.'))

  useEffect(() => { load() }, [])

  const handleFiles = (list: FileList | null) => {
    if (!list?.length) return
    setFiles(Array.from(list))
  }

  const startUpload = async () => {
    if (files.length === 0) { toastError('Select at least one image file.'); return }
    setUploading(true)
    setProgress(0)
    let ok = 0
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadStatus(`Uploading ${i + 1} of ${files.length}…`)
      try {
        const uploaded = await uploadImage(file, 'gallery', setProgress)
        const title = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Gallery Photo'
        await galleryService.create({
          title,
          image_url: uploaded.url,
          cloudinary_public_id: uploaded.public_id,
          category,
          event_date: eventDate || null,
          is_published: true,
        })
        ok++
      } catch (e) {
        toastError(`Failed on "${file.name}": ${e instanceof Error ? e.message : 'Upload error'}`)
        break
      }
    }
    setUploading(false)
    setUploadStatus('')
    setFiles([])
    setEventDate('')
    if (ok > 0) toastSuccess(`${ok} photo${ok > 1 ? 's' : ''} uploaded to the public Gallery.`)
    load()
  }

  const togglePublish = async (g: GalleryImage) => {
    try {
      await galleryService.update(g.id, { is_published: !g.is_published })
      toastSuccess(g.is_published ? `"${g.title}" unpublished.` : `"${g.title}" published.`)
      load()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to update.')
    }
  }

  const openEdit = (g: GalleryImage) => {
    setEditing(g)
    setEditForm({ title: g.title, category: g.category, event_date: g.event_date ?? '', is_published: g.is_published })
  }

  const saveEdit = async () => {
    if (!editing) return
    if (!editForm.title.trim()) { toastError('Title is required.'); return }
    setSavingEdit(true)
    try {
      await galleryService.update(editing.id, {
        title: editForm.title.trim(),
        category: editForm.category,
        event_date: editForm.event_date || null,
        is_published: editForm.is_published,
      })
      toastSuccess('Photo details saved.')
      setEditing(null)
      load()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to save.')
    } finally {
      setSavingEdit(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.cloudinary_public_id) {
        await mediaService.deleteCloudinary(deleteTarget.cloudinary_public_id)
      }
      await galleryService.remove(deleteTarget.id)
      toastSuccess(`✓ Deleted successfully — "${deleteTarget.title}" permanently removed.`)
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
      <h1 className="text-2xl font-bold">Gallery</h1>
      <p className="text-sm text-gray-500">Uploaded images appear instantly on the public Gallery page.</p>

      <div className="card p-4 mt-4">
        <h3 className="font-bold">Upload Photos</h3>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="input mt-2"
          disabled={uploading}
          onChange={e => handleFiles(e.target.files)}
        />
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
            {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="input" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
        </div>
        {files.length > 0 && !uploading && (
          <p className="text-sm text-gray-600 mt-2">{files.length} file{files.length > 1 ? 's' : ''} selected.</p>
        )}
        {uploading && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-saffron h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-center text-gray-500 mt-1">{uploadStatus} {progress}%</p>
          </div>
        )}
        <button className="btn-primary mt-3 disabled:opacity-50" disabled={uploading || files.length === 0} onClick={startUpload}>
          {uploading ? `Uploading…` : `Upload ${files.length > 0 ? files.length : ''} Photo${files.length === 1 ? '' : 's'}`.trim()}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
        {items.map(g => (
          <div key={g.id} className="card overflow-hidden">
            <img src={g.image_url} className="h-32 w-full object-cover" alt={g.title} />
            <div className="p-2">
              <p className="text-xs font-medium truncate" title={g.title}>{g.title}</p>
              <p className="text-xs text-gray-400">{g.category}{g.is_published ? '' : ' • Draft'}</p>
              <div className="flex items-center justify-between gap-1 mt-1">
                <button onClick={() => togglePublish(g)} className={`text-xs px-2 py-1 rounded ${g.is_published ? 'bg-gray-100 text-gray-600' : 'bg-saffron text-white'}`}>
                  {g.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => openEdit(g)} className="btn-outline text-xs px-2 py-1">Edit</button>
                <button onClick={() => setDeleteTarget(g)} className="text-red-600 text-xs shrink-0">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && !uploading && (
        <p className="text-center text-gray-400 mt-10">No photos yet. Upload the first one above.</p>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Photo</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700 text-xl px-2">✕</button>
            </div>
            <img src={editing.image_url} alt={editing.title} className="w-full h-40 object-cover rounded-xl mt-4 border" />
            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><label className="label">Title *</label><input className="input" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
              <div><label className="label">Category</label>
                <select className="input" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                  {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">Event Date</label><input className="input" type="date" value={editForm.event_date} onChange={e => setEditForm({ ...editForm, event_date: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input type="checkbox" checked={editForm.is_published} onChange={e => setEditForm({ ...editForm, is_published: e.target.checked })} /> Published (visible to public)
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="btn-primary flex-1" disabled={savingEdit} onClick={saveEdit}>{savingEdit ? 'Saving…' : 'Save'}</button>
              <button className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Photo Permanently"
        message={
          <>
            This permanently removes <b>{deleteTarget?.title}</b> from the database
            {deleteTarget?.cloudinary_public_id ? ' and deletes the image file from Cloudinary' : ''}. This cannot be
            undone.
          </>
        }
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}