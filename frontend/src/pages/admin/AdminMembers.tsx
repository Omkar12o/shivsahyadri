import { useEffect, useMemo, useState } from 'react'
import { memberService } from '@/services/memberService'
import { uploadImage } from '@/services/uploadImageService'
import { mediaService } from '@/services/mediaService'
import { LoadingScreen } from '@/components/ui/feedback'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import ConfirmDialog from '@/components/ConfirmDialog'
import { checkImageFile } from '@/utils'
import type { Profile } from '@/types'

const POSITIONS = ['President', 'Secretary', 'Treasurer', 'Member', 'Other']
const ACCEPT = 'image/jpeg,image/png,image/webp'

interface MemberForm {
  full_name: string
  user_id: string
  position: string
  bio: string
  display_order: number
  is_active: boolean
}

const emptyForm: MemberForm = {
  full_name: '',
  user_id: '',
  position: 'Member',
  bio: '',
  display_order: 1,
  is_active: true,
}

export default function AdminMembers() {
  const { profile: currentProfile } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const [items, setItems] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [form, setForm] = useState<MemberForm>(emptyForm)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [previewErr, setPreviewErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [deactivateTarget, setDeactivateTarget] = useState<Profile | null>(null)
  const [deactivating, setDeactivating] = useState(false)
  const [hardDeleteTarget, setHardDeleteTarget] = useState<Profile | null>(null)
  const [hardDeleting, setHardDeleting] = useState(false)

  const load = async () => {
    const r = await memberService.listMembers({ pageSize: 500 })
    setItems(r.data)
  }

  useEffect(() => {
    memberService
      .listMembers({ pageSize: 500 })
      .then(r => setItems(r.data))
      .catch(e => toastError(e instanceof Error ? e.message : 'Failed to load members.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(
    () =>
      items.filter(
        i =>
          !q ||
          i.full_name.toLowerCase().includes(q.toLowerCase()) ||
          i.user_id.toLowerCase().includes(q.toLowerCase()) ||
          (i.position ?? '').toLowerCase().includes(q.toLowerCase()),
      ),
    [items, q],
  )

  const positionOptions = useMemo(() => {
    const custom = items.map(i => i.position ?? '').filter(p => p && !POSITIONS.includes(p))
    return [...POSITIONS, ...custom]
  }, [items])

  const clearPreview = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
  }

  const handlePhotoChange = (file: File | null) => {
    setPreviewErr(null)
    if (!file) { setPhotoFile(null); return }
    const check = checkImageFile(file, 5)
    if (!check.ok) { setPreviewErr(check.message ?? 'Invalid image.'); setPhotoFile(null); setPhotoPreview(null); return }
    clearPreview()
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const removePhoto = () => {
    clearPreview()
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setPhotoFile(null)
    setPreviewErr(null)
    clearPreview()
    setPhotoPreview(null)
    setEditorOpen(true)
  }

  const openEdit = (m: Profile) => {
    setEditing(m)
    setForm({
      full_name: m.full_name,
      user_id: m.user_id,
      position: m.position ?? 'Member',
      bio: m.bio ?? '',
      display_order: m.display_order ?? 1,
      is_active: m.is_active,
    })
    setPhotoFile(null)
    setPreviewErr(null)
    setPhotoPreview(m.profile_photo_url)
    setEditorOpen(true)
  }

  const closeEditor = () => {
    clearPreview()
    setEditorOpen(false)
  }

  const save = async () => {
    const name = form.full_name.trim()
    if (!name) { toastError('Full name is required.'); return }
    if (photoFile) {
      const check = checkImageFile(photoFile, 5)
      if (!check.ok) { toastError(check.message ?? 'Invalid image.'); return }
    }
    setBusy(true)
    try {
      if (editing) {
        let photoUrl: string | null | undefined = undefined
        let photoPublicId: string | null = null
        if (photoFile) {
          setUploading(true)
          const result = await uploadImage(photoFile, 'members')
          photoUrl = result.url
          photoPublicId = result.public_id
          if (editing.cloudinary_public_id) {
            await mediaService.deleteCloudinary(editing.cloudinary_public_id).catch(() => {})
          }
          setUploading(false)
        } else if (!photoPreview && editing.cloudinary_public_id) {
          await mediaService.deleteCloudinary(editing.cloudinary_public_id).catch(() => {})
          photoUrl = null
          photoPublicId = null
        }
        await memberService.updateMember(editing.id, {
          full_name: name,
          position: form.position.trim() || null,
          bio: form.bio.trim() || null,
          display_order: Number(form.display_order) || 0,
          ...(photoUrl !== undefined
            ? { profile_photo_url: photoUrl, cloudinary_public_id: photoPublicId }
            : photoUrl === null
              ? { profile_photo_url: null, cloudinary_public_id: null }
              : {}),
        })
        const prev = items.find(x => x.id === editing.id)
        if (prev && prev.is_active !== form.is_active) {
          await memberService.setActive(editing.id, form.is_active)
        }
        toastSuccess(`"${name}" updated.`)
      } else {
        setUploading(true)
        let photoUrl: string | null = null
        let photoPublicId: string | null = null
        if (photoFile) {
          const result = await uploadImage(photoFile, 'members')
          photoUrl = result.url
          photoPublicId = result.public_id
        }
        setUploading(false)
        try {
          await memberService.addMember({
            full_name: name,
            user_id: form.user_id.trim() || null,
            position: form.position.trim() || null,
            bio: form.bio.trim() || null,
            profile_photo_url: photoUrl,
            cloudinary_public_id: photoPublicId,
            display_order: Number(form.display_order) || 0,
            is_active: form.is_active,
          })
        } catch (e) {
          if (photoPublicId) {
            await mediaService.deleteCloudinary(photoPublicId).catch(() => {})
          }
          throw e
        }
        toastSuccess(`"${name}" added to members.`)
      }
      closeEditor()
      await load()
    } catch (e) {
      setUploading(false)
      toastError(e instanceof Error ? e.message : 'Failed to save member.')
    } finally {
      setBusy(false)
    }
  }

  const deactivateMember = async () => {
    if (!deactivateTarget) return
    setDeactivating(true)
    try {
      await memberService.softDeleteMember(deactivateTarget.id)
      toastSuccess(`"${deactivateTarget.full_name}" deactivated and hidden from the public site.`)
      setDeactivateTarget(null)
      await load()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to deactivate member.')
    } finally {
      setDeactivating(false)
    }
  }

  const hardDelete = async () => {
    if (!hardDeleteTarget) return
    setHardDeleting(true)
    try {
      if (hardDeleteTarget.cloudinary_public_id) {
        await mediaService.deleteCloudinary(hardDeleteTarget.cloudinary_public_id)
      }
      await memberService.hardDeleteMember(hardDeleteTarget.id)
      toastSuccess(`"${hardDeleteTarget.full_name}" permanently deleted.`)
      setHardDeleteTarget(null)
      await load()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to delete member.')
    } finally {
      setHardDeleting(false)
    }
  }

  if (loading) return <LoadingScreen label="Loading members..." />

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-sm text-gray-500">Manage who appears on the public Members page.</p>
        </div>
        <button className="btn-primary text-sm" onClick={openAdd}>+ Add Member</button>
      </div>

      <input
        className="input mt-4 max-w-sm"
        placeholder="Search name / username / position"
        value={q}
        onChange={e => setQ(e.target.value)}
      />

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Member</th>
              <th className="p-3 text-left">Position</th>
              <th className="p-3 text-center">Order</th>
              <th className="p-3 text-center">Active</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {m.profile_photo_url
                      ? <img src={m.profile_photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      : <div className="w-10 h-10 rounded-full bg-saffron/15 text-saffron flex items-center justify-center text-sm font-bold">{m.full_name.slice(0, 2).toUpperCase()}</div>}
                    <div>
                      <p className="font-medium">{m.full_name}</p>
                      <p className="text-xs text-gray-500">@{m.user_id}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">{m.position ?? '—'}</td>
                <td className="p-3 text-center">{m.display_order ?? 0}</td>
                <td className="p-3 text-center">{m.is_active ? '✅' : '⭕'}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(m)} className="btn-outline text-xs px-3 py-1">Edit</button>
                    <button
                      onClick={() => setDeactivateTarget(m)}
                      className="btn-outline text-xs px-3 py-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setHardDeleteTarget(m)}
                      className="btn-outline text-xs px-3 py-1 text-red-600 border-red-300 hover:bg-red-50"
                      disabled={currentProfile?.id === m.id}
                      title={currentProfile?.id === m.id ? 'You cannot delete your own account' : 'Permanently remove member'}
                    >
                      Hard Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-6 text-center text-gray-500">No members found.</p>}
      </div>

      {editorOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={closeEditor}>
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{editing ? 'Edit Member' : 'Add Member'}</h2>
              <button onClick={closeEditor} className="text-gray-400 hover:text-gray-700 text-xl px-2">✕</button>
            </div>

            <div className="mt-4 flex items-center gap-5">
              <div className="shrink-0">
                {photoPreview
                  ? <img src={photoPreview} alt="" className="w-24 h-32 rounded-xl object-cover border-2 border-saffron/20" />
                  : <div className="w-24 h-32 rounded-xl bg-saffron/15 text-saffron flex items-center justify-center text-xl font-bold">{form.full_name.slice(0, 2).toUpperCase() || '?'}</div>}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Member Photo</p>
                <input
                  type="file"
                  accept={ACCEPT}
                  className="input text-sm mt-1"
                  onChange={e => handlePhotoChange(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-gray-400 mt-1">Passport photo (3:4). JPG, PNG or WEBP. Max 5 MB.</p>
                {editing && photoPreview && (
                  <button type="button" onClick={removePhoto} className="mt-2 text-xs font-semibold text-red-600 hover:underline">✕ Remove photo</button>
                )}
                {uploading && <p className="text-xs text-saffron mt-1">Uploading…</p>}
                {previewErr && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 mt-2">{previewErr}</p>}
              </div>
            </div>

            <div className="mt-5 grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><label className="label">Full Name *</label><input className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              {!editing && (
                <div className="md:col-span-2"><label className="label">Username (optional)</label><input className="input" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} /></div>
              )}
              <div><label className="label">Position</label>
                <select className="input" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}>
                  {positionOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div><label className="label">Display Order (lower first)</label><input className="input" type="number" value={form.display_order} onChange={e => setForm({ ...form, display_order: Number(e.target.value) || 0 })} /></div>
              <div className="md:col-span-2"><label className="label">Bio / Description</label><textarea className="input" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active (visible on public site)
              </label>
            </div>

            <div className="flex gap-2 mt-5">
              <button className="btn-primary flex-1" disabled={busy} onClick={save}>{busy ? 'Saving…' : editing ? 'Save Member' : 'Add Member'}</button>
              <button className="btn-outline" onClick={closeEditor}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title="Deactivate Member"
        message={
          <>
            <b>{deactivateTarget?.full_name}</b> will be deactivated and hidden from the public Members page. You can
            reactivate them later from the Edit form.
          </>
        }
        confirmLabel="Deactivate"
        busy={deactivating}
        onConfirm={deactivateMember}
        onCancel={() => setDeactivateTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(hardDeleteTarget)}
        title="Permanently Delete Member"
        message={
          <>
            This permanently removes <b>{hardDeleteTarget?.full_name}</b> from the database. This cannot be undone.
          </>
        }
        confirmLabel="Delete Forever"
        busy={hardDeleting}
        onConfirm={hardDelete}
        onCancel={() => setHardDeleteTarget(null)}
      />
    </div>
  )
}