import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Music,
  CalendarDays,
  Image as ImageIcon,
  Heart,
  Users,
  Megaphone,
  Globe,
  Upload,
  Trash2,
  Eye,
  X,
  Save,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Check,
} from 'lucide-react'
import { settingsService } from '@/services/settingsService'
import { uploadImage } from '@/services/uploadImageService'
import { mediaService } from '@/services/mediaService'
import { useToast } from '@/components/ToastProvider'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useAuth } from '@/contexts/AuthContext'
import { cn, checkImageFile } from '@/utils'
import { isAdminRole } from '@/types'
import type { QuickAction, SiteSettings } from '@/types'

const ICON_OPTIONS = [
  { value: 'music', label: 'Music / Aarti', icon: Music },
  { value: 'calendar', label: 'Calendar / Programs', icon: CalendarDays },
  { value: 'image', label: 'Image / Gallery', icon: ImageIcon },
  { value: 'heart', label: 'Heart / Donation', icon: Heart },
  { value: 'users', label: 'Users / Members', icon: Users },
  { value: 'megaphone', label: 'Megaphone / Announcement', icon: Megaphone },
  { value: 'globe', label: 'Globe / Website', icon: Globe },
]

function QuickActionIcon({ name, className }: { name: string; className?: string }) {
  const found = ICON_OPTIONS.find((o) => o.value === name)
  const Icon = found?.icon ?? Heart
  return <Icon className={className} aria-hidden="true" />
}

function Field({ label, children, helper }: { label: string; children: React.ReactNode; helper?: string }) {
  return (
    <div className="mt-3">
      <label className="label">{label}</label>
      {children}
      {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
    </div>
  )
}

function SectionCard({
  title,
  emoji,
  description,
  children,
  onSave,
  saving,
}: {
  title: string
  emoji: string
  description?: string
  children: React.ReactNode
  onSave: () => void
  saving: boolean
}) {
  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-bold text-gray-900">
          {emoji} {title}
        </h3>
        {saving && <span className="badge-primary animate-pulse">Saving…</span>}
      </div>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      {children}
      <button className="btn-primary w-full mt-4 disabled:opacity-60" disabled={saving} onClick={onSave}>
        <Save className="w-4 h-4 mr-1.5" aria-hidden="true" />
        {saving ? 'Saving…' : 'Save & Publish'}
      </button>
    </div>
  )
}

/** Image manager: choose -> preview -> Upload & Save (Cloudinary -> Supabase). */
function ImageManager({
  title,
  description,
  currentUrl,
  publicId,
  folder,
  onUploaded,
  onRemoved,
  onHardDelete,
  canHardDelete,
}: {
  title: string
  description: string
  currentUrl: string | null | undefined
  publicId: string | null | undefined
  folder: 'logo' | 'hero' | 'members' | 'gallery' | 'events' | 'aarti' | 'qr'
  onUploaded: (url: string, publicId: string | null) => Promise<void>
  onRemoved: () => Promise<void>
  onHardDelete: () => Promise<void>
  canHardDelete: boolean
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'saving' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [confirmHardDelete, setConfirmHardDelete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { success: toastSuccess, error: toastError } = useToast()

  const reset = () => {
    setFile(null)
    setPreview(null)
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFile = (f: File | null) => {
    setStatus('idle')
    setMessage(null)
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const uploadAndSave = async () => {
    if (!file) {
      setStatus('error')
      setMessage('Choose an image file first.')
      return
    }
    const check = checkImageFile(file)
    if (!check.ok) {
      setStatus('error')
      setMessage(check.message ?? 'Invalid image file.')
      return
    }
    setStatus('uploading')
    setMessage('Uploading to Cloudinary…')
    setProgress(0)
    try {
      const result = await uploadImage(file, folder, setProgress)
      setProgress(100)
      setStatus('saving')
      setMessage('Saving to Supabase…')
      await onUploaded(result.url, result.public_id)
      setStatus('done')
      setMessage('Image uploaded and published.')
      toastSuccess('✓ Image uploaded and saved.')
    } catch (e) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Image upload failed.')
      toastError(e instanceof Error ? e.message : 'Image upload failed.')
    } finally {
      reset()
      setTimeout(() => setStatus((s) => (s === 'done' ? 'idle' : s)), 2500)
    }
  }

  const download = async () => {
    if (!currentUrl) return
    try {
      const res = await fetch(currentUrl)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.jpg`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
      toastSuccess('✓ Image download started.')
    } catch {
      window.open(currentUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleRemove = async () => {
    try {
      await onRemoved()
      toastSuccess('✓ Image reference removed. Public page updated.')
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to remove image.')
    } finally {
      setConfirmRemove(false)
    }
  }

  const handleHardDelete = async () => {
    try {
      await onHardDelete()
      toastSuccess('✓ Image permanently deleted from Cloudinary.')
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to delete image.')
    } finally {
      setConfirmHardDelete(false)
    }
  }

  return (
    <div className="mt-3 p-3 md:p-4 border border-orange-100 rounded-xl bg-orange-50/60">
      {/* Current image */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="w-full sm:w-24 h-40 sm:h-24 rounded-xl overflow-hidden border bg-white flex items-center justify-center flex-shrink-0">
          {currentUrl ? (
            <img src={currentUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl sm:text-2xl text-gray-300">🖼️</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          {currentUrl ? (
            <p className="text-[11px] text-gray-500 mt-1 truncate break-all">{currentUrl}</p>
          ) : (
            <p className="text-[11px] text-orange-600 mt-1 font-medium">No image uploaded yet.</p>
          )}
        </div>
      </div>

      {/* Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="input mt-3 text-sm"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {preview && status !== 'error' && (
        <div className="mt-2 flex items-center gap-3">
          <img src={preview} alt="Selected preview" className="w-14 h-14 rounded-lg object-cover border bg-white" />
          <p className="text-xs text-gray-500">Preview ready. Click “Upload &amp; Save”.</p>
        </div>
      )}

      {(status === 'uploading' || status === 'saving') && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-saffron h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-center text-gray-500 mt-1">{message}</p>
        </div>
      )}

      {status === 'done' && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-2 mt-2 flex items-center gap-2">
          <Check className="w-4 h-4" aria-hidden="true" /> {message}
        </p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-2 mt-2">{message}</p>
      )}

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="btn-primary text-sm"
          disabled={status === 'uploading' || status === 'saving' || !file}
          onClick={uploadAndSave}
        >
          <Upload className="w-4 h-4 mr-1.5" aria-hidden="true" />
          {status === 'uploading' || status === 'saving' ? `${progress}%…` : 'Upload & Save'}
        </button>
        {currentUrl && (
          <button className="btn-ghost text-sm text-gray-700" disabled={status === 'uploading' || status === 'saving'} onClick={download}>
            <ExternalLink className="w-4 h-4 mr-1.5 rotate-45" aria-hidden="true" />
            Download
          </button>
        )}
        {currentUrl && (
          <button className="btn-ghost text-sm text-gray-700" disabled={status === 'uploading' || status === 'saving'} onClick={() => setConfirmRemove(true)}>
            <X className="w-4 h-4 mr-1.5" aria-hidden="true" />
            Remove
          </button>
        )}
        {canHardDelete && (
          <button
            className="text-sm text-red-600 inline-flex items-center font-medium disabled:opacity-50"
            disabled={status === 'uploading' || status === 'saving'}
            onClick={() => setConfirmHardDelete(true)}
          >
            <Trash2 className="w-4 h-4 mr-1" aria-hidden="true" /> Hard Delete
          </button>
        )}
      </div>

      <p className="text-[11px] text-gray-400 mt-2">
        Images go to Cloudinary; only the URL + public_id are stored in Supabase. Admin-only writes, public read-only.
      </p>

      <ConfirmDialog
        open={confirmRemove}
        title="Remove image?"
        message="This clears the image reference so it disappears from the public homepage. The Cloudinary file is kept."
        confirmLabel="Remove"
        onConfirm={handleRemove}
        onCancel={() => setConfirmRemove(false)}
      />
      <ConfirmDialog
        open={confirmHardDelete}
        title="Permanently delete image?"
        message="This deletes the Cloudinary asset permanently AND clears the reference. This cannot be undone."
        confirmLabel="Delete Forever"
        onConfirm={handleHardDelete}
        onCancel={() => setConfirmHardDelete(false)}
      />
    </div>
  )
}

export default function AdminHomePage() {
  const { profile } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const [site, setSite] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(true)

  const canHardDelete = isAdminRole(profile?.role)

  const createDefaultSite = (): SiteSettings => ({
    id: '',
    logo_url: null,
    logo_public_id: null,
    ganpati_image_url: null,
    ganpati_public_id: null,
    countdown_target: null,
    hero_welcome: 'Shree Ganeshay Namah',
    hero_message: 'Shivsaydri Ganesh Mandal, Umarkhanchan',
    announcements_title: 'Recent Announcements',
    programs_title: "Today's Program",
    gallery_title: 'Latest Memories',
    birthday_title: "Today's Birthdays",
    donation_title: 'Support Our Mandal',
    about_heading: 'About Our Mandal',
    about_description: '',
    about_image_url: null,
    about_image_public_id: null,
    about_button_text: 'Learn More',
    about_button_link: '/contact',
    about_show: true,
    banner_title: 'Ganesh Chaturthi Festival',
    banner_subtitle: '',
    banner_description: '',
    banner_button_text: 'View 2026 →',
    banner_button_link: '/festival/2026',
    banner_show: true,
    members_preview_show: true,
    members_preview_count: 4,
    gallery_preview_show: true,
    gallery_preview_count: 6,
    donation_show: true,
    quick_actions: [
      { id: 'aarti', label: 'Aarti', icon: 'music', order: 0, enabled: true, destination: '/aarti' },
      { id: 'programs', label: 'Programs', icon: 'calendar', order: 1, enabled: true, destination: '/programs' },
      { id: 'gallery', label: 'Gallery', icon: 'image', order: 2, enabled: true, destination: '/gallery' },
      { id: 'donation', label: 'Donation', icon: 'heart', order: 3, enabled: true, destination: '/donation' },
    ],
    updated_at: new Date().toISOString(),
  })

  const load = () =>
    settingsService
      .getSiteSettings()
      .then((s) => setSite(s ?? createDefaultSite()))
      .catch(() => setSite(createDefaultSite()))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const setValue = (patch: Partial<SiteSettings>) => {
    setSite((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  const save = async (okText: string) => {
    if (!site) return
    setSavingSection(okText)
    try {
      await settingsService.saveSiteSettings({
        hero_welcome: site.hero_welcome,
        hero_message: site.hero_message,
        countdown_target: site.countdown_target,
        about_heading: site.about_heading,
        about_description: site.about_description,
        about_image_url: site.about_image_url,
        about_image_public_id: site.about_image_public_id,
        about_button_text: site.about_button_text,
        about_button_link: site.about_button_link,
        about_show: site.about_show,
        banner_title: site.banner_title,
        banner_subtitle: site.banner_subtitle,
        banner_description: site.banner_description,
        banner_button_text: site.banner_button_text,
        banner_button_link: site.banner_button_link,
        banner_show: site.banner_show,
        members_preview_show: site.members_preview_show,
        members_preview_count: site.members_preview_count,
        gallery_preview_show: site.gallery_preview_show,
        gallery_preview_count: site.gallery_preview_count,
        donation_show: site.donation_show,
        quick_actions: site.quick_actions,
      })
      toastSuccess(`✓ ${okText}`)
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to save. Please try again.')
    } finally {
      setSavingSection(null)
    }
  }

  const quickActions = useMemo<QuickAction[]>(() => {
    const defaults: QuickAction[] = [
      { id: 'aarti', label: 'Aarti', icon: 'music', order: 0, enabled: true, destination: '/aarti' },
      { id: 'programs', label: 'Programs', icon: 'calendar', order: 1, enabled: true, destination: '/programs' },
      { id: 'gallery', label: 'Gallery', icon: 'image', order: 2, enabled: true, destination: '/gallery' },
      { id: 'donation', label: 'Donation', icon: 'heart', order: 3, enabled: true, destination: '/donation' },
    ]
    if (!site?.quick_actions || site.quick_actions.length === 0) return defaults
    const merged = defaults.map((d) => ({ ...d, ...(site.quick_actions ?? []).find((q) => q.id === d.id) }))
    return merged.sort((a, b) => a.order - b.order)
  }, [site?.quick_actions])

  const updateQuickAction = (id: string, patch: Partial<QuickAction>) => {
    setSite((prev) => {
      if (!prev) return prev
      const list = (prev.quick_actions ?? []).filter((q) => q.id !== id)
      return { ...prev, quick_actions: [...list, { ...(quickActions.find((q) => q.id === id) as QuickAction), ...patch }] }
    })
  }

  const updateOrder = (index: number, dir: 1 | -1) => {
    const items = [...quickActions]
    const swap = index + dir
    if (swap < 0 || swap >= items.length) return
    const [item] = items.splice(index, 1)
    items.splice(swap, 0, item)
    const renumbered = items.map((q, i) => ({ ...q, order: i }))
    setSite((prev) => (prev ? { ...prev, quick_actions: renumbered } : prev))
  }

  const removeCloudinaryAsset = async (publicId: string | null | undefined) => {
    if (publicId) await mediaService.deleteCloudinary(publicId)
  }

  /** Persists a small site_settings patch immediately (used by image uploads). */
  const persistPatch = async (patch: Partial<SiteSettings>, okText: string) => {
    try {
      await settingsService.saveSiteSettings(patch)
      toastSuccess(`✓ ${okText}`)
      setSite((prev) => (prev ? { ...prev, ...patch } : prev))
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to save. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-saffron border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!site) return null

  const enabledActions = quickActions.filter((q) => q.enabled)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">🏠 Home Page Manager</h1>
          <p className="text-sm text-gray-500 mt-1">
            Everything saves to Supabase and the public homepage updates automatically within seconds.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm shrink-0"
        >
          <Eye className="w-4 h-4 mr-1.5" aria-hidden="true" /> View Site
        </a>
      </div>

      {/* Quick Actions */}
      <div className="card p-4 md:p-5 mt-6">
        <h3 className="font-bold text-gray-900">⚡ Quick Actions</h3>
        <p className="text-sm text-gray-500">Jump straight to the tool you need.</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Link to="/admin/settings" className="btn-secondary text-xs md:text-sm">
            <Upload className="w-4 h-4 mr-1.5" aria-hidden="true" /> Ganpati Image
          </Link>
          <Link to="/admin/settings#logo" className="btn-secondary text-xs md:text-sm">
            <Upload className="w-4 h-4 mr-1.5" aria-hidden="true" /> Logo
          </Link>
          <Link to="/admin/gallery" className="btn-secondary text-xs md:text-sm">
            <ImageIcon className="w-4 h-4 mr-1.5" aria-hidden="true" /> Gallery Photo
          </Link>
          <Link to="/admin/members" className="btn-secondary text-xs md:text-sm">
            <Users className="w-4 h-4 mr-1.5" aria-hidden="true" /> Add Member
          </Link>
          <Link to="/admin/aartis" className="btn-secondary text-xs md:text-sm">
            <Music className="w-4 h-4 mr-1.5" aria-hidden="true" /> Add Aarti
          </Link>
          <Link to="/admin/programs" className="btn-secondary text-xs md:text-sm">
            <CalendarDays className="w-4 h-4 mr-1.5" aria-hidden="true" /> Add Program
          </Link>
        </div>
      </div>

      {/* LIVE PREVIEW */}
      <button
        className={cn(
          'mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors',
          previewOpen ? 'border-saffron/30 bg-saffron/10 text-saffron' : 'border-gray-200 text-gray-500 hover:bg-gray-50',
        )}
        onClick={() => setPreviewOpen((o) => !o)}
      >
        <Eye className="w-4 h-4" aria-hidden="true" /> {previewOpen ? 'Hide Live Preview' : 'Show Live Preview'}
      </button>

      {previewOpen && (
        <div className="card mt-2 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Live Preview · Public homepage hero
          </div>
          <div className="gradient-saffron text-white px-4 py-6 md:px-8 md:py-8 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 text-center md:text-left w-full">
              <p className="text-xs uppercase tracking-[0.3em] text-white/80 font-devanagari">॥ श्री गणेशाय नमः ॥</p>
              <h2 className="font-devanagari font-bold text-2xl md:text-4xl mt-2">{site.hero_welcome || 'Shree Ganeshay Namah'}</h2>
              <p className="text-white/90 mt-2 text-sm md:text-base">{site.hero_message || 'Shivsaydri Ganesh Mandal, Umarkhanchan'}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                {enabledActions.map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-2 rounded-full text-xs font-medium">
                    <QuickActionIcon name={a.icon} className="w-4 h-4" /> {a.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="w-full md:w-72 h-56 md:h-72 rounded-3xl overflow-hidden border-4 border-white/30 shadow-xl flex-shrink-0">
              {site.ganpati_image_url ? (
                <img src={site.ganpati_image_url} alt="Ganpati hero" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-center px-4 font-devanagari">🙏 Ganpati Bappa Morya</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* HERO TEXT */}
        <SectionCard
          title="Hero Section"
          emoji="🙏"
          description="The main welcome area. Use श्री गणेशाय नमः with your mandal name as subtitle."
          saving={savingSection === 'Hero section'}
          onSave={() => save('Hero section')}
        >
          <Field label="Welcome text">
            <input
              className="input"
              value={site.hero_welcome ?? ''}
              placeholder="Shree Ganeshay Namah"
              onChange={(e) => setValue({ hero_welcome: e.target.value })}
            />
          </Field>
          <Field label="Subtitle / message">
            <input
              className="input"
              value={site.hero_message ?? ''}
              placeholder="Shivsaydri Ganesh Mandal, Umarkhanchan"
              onChange={(e) => setValue({ hero_message: e.target.value })}
            />
          </Field>
          <Field label="Ganesh sthapana countdown (optional)" helper="Leave blank to hide the countdown.">
            <input
              type="datetime-local"
              className="input"
              value={site.countdown_target ? new Date(site.countdown_target).toISOString().slice(0, 16) : ''}
              onChange={(e) => setValue({ countdown_target: e.target.value ? new Date(e.target.value).toISOString() : null })}
            />
          </Field>
        </SectionCard>

        {/* HERO IMAGE */}
        <SectionCard
          title="Hero Image (Ganpati)"
          emoji="🖼️"
          description="The big Ganpati image on the right of the hero — 450–520px tall on desktop, 280–350px on mobile."
          saving={savingSection === 'Hero image'}
          onSave={() => save('Hero image')}
        >
          <ImageManager
            title="Ganpati hero image"
            description="Landscape photo recommended (1200×800)."
            currentUrl={site.ganpati_image_url}
            publicId={site.ganpati_public_id}
            folder="hero"
            canHardDelete={canHardDelete}
            onUploaded={async (url, publicId) => {
              await persistPatch({ ganpati_image_url: url, ganpati_public_id: publicId }, 'Ganpati hero image updated')
            }}
            onRemoved={async () => {
              await persistPatch({ ganpati_image_url: null, ganpati_public_id: null }, 'Ganpati hero image removed')
            }}
            onHardDelete={async () => {
              const pid = site.ganpati_public_id
              await removeCloudinaryAsset(pid)
              await persistPatch({ ganpati_image_url: null, ganpati_public_id: null }, 'Ganpati hero image deleted forever')
            }}
          />
        </SectionCard>

        {/* QUICK ACTIONS */}
        <SectionCard
          title="Quick Action Buttons"
          emoji="⚡"
          description="The action buttons on the homepage hero. Reorder, rename, enable/disable and set destinations."
          saving={savingSection === 'Quick actions'}
          onSave={() => save('Quick actions')}
        >
          <div className="space-y-3 mt-3">
            {quickActions.map((a, i) => (
              <div key={a.id} className={cn('border rounded-xl p-3', !a.enabled && 'opacity-60 bg-gray-50')}>
                <div className="flex items-center gap-2">
                  <QuickActionIcon name={a.icon} className="w-5 h-5 text-saffron shrink-0" />
                  <input
                    className="input py-2"
                    value={a.label}
                    onChange={(e) => updateQuickAction(a.id, { label: e.target.value })}
                  />
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button className="p-1 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30" disabled={i === 0} onClick={() => updateOrder(i, -1)} aria-label="Move up">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30" disabled={i === quickActions.length - 1} onClick={() => updateOrder(i, 1)} aria-label="Move down">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <select
                    className="input py-2 flex-1 min-w-[140px]"
                    value={a.icon}
                    onChange={(e) => updateQuickAction(a.id, { icon: e.target.value })}
                  >
                    {ICON_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 shrink-0">
                    <input
                      type="checkbox"
                      checked={a.enabled}
                      onChange={(e) => updateQuickAction(a.id, { enabled: e.target.checked })}
                      className="w-4 h-4 accent-saffron"
                    />
                    Show
                  </label>
                </div>
                <input
                  className="input py-2 mt-2"
                  value={a.destination}
                  placeholder="/aarti"
                  onChange={(e) => updateQuickAction(a.id, { destination: e.target.value })}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* FESTIVAL BANNER */}
        <SectionCard
          title="Festival Banner"
          emoji="🎪"
          description="A highlighted strip below the hero (e.g. “Ganesh Chaturthi 2026”)."
          saving={savingSection === 'Festival banner'}
          onSave={() => save('Festival banner')}
        >
          <label className="flex items-center gap-2 mt-3 text-sm font-medium text-gray-700">
            <input type="checkbox" className="w-4 h-4 accent-saffron" checked={site.banner_show} onChange={(e) => setValue({ banner_show: e.target.checked })} />
            Show festival banner on homepage
          </label>
          <Field label="Banner title">
            <input className="input" value={site.banner_title ?? ''} placeholder="Ganesh Chaturthi 2026" onChange={(e) => setValue({ banner_title: e.target.value })} />
          </Field>
          <Field label="Subtitle / date">
            <input className="input" value={site.banner_subtitle ?? ''} placeholder="Starts 20th August, 2026" onChange={(e) => setValue({ banner_subtitle: e.target.value })} />
          </Field>
          <Field label="Description (optional)">
            <textarea className="input" rows={2} value={site.banner_description ?? ''} onChange={(e) => setValue({ banner_description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Button text">
              <input className="input" value={site.banner_button_text ?? ''} placeholder="View Schedule" onChange={(e) => setValue({ banner_button_text: e.target.value })} />
            </Field>
            <Field label="Button link">
              <input className="input" value={site.banner_button_link ?? ''} placeholder="/programs" onChange={(e) => setValue({ banner_button_link: e.target.value })} />
            </Field>
          </div>
        </SectionCard>

        {/* ABOUT */}
        <SectionCard
          title="About Section"
          emoji="ℹ️"
          description="A short “About our Mandal” strip with an optional image."
          saving={savingSection === 'About section'}
          onSave={() => save('About section')}
        >
          <label className="flex items-center gap-2 mt-3 text-sm font-medium text-gray-700">
            <input type="checkbox" className="w-4 h-4 accent-saffron" checked={site.about_show} onChange={(e) => setValue({ about_show: e.target.checked })} />
            Show about section on homepage
          </label>
          <Field label="Heading">
            <input className="input" value={site.about_heading ?? ''} placeholder="About Shivsaydri Ganesh Mandal" onChange={(e) => setValue({ about_heading: e.target.value })} />
          </Field>
          <Field label="Description">
            <textarea className="input" rows={3} value={site.about_description ?? ''} onChange={(e) => setValue({ about_description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Button text">
              <input className="input" value={site.about_button_text ?? ''} placeholder="Learn More" onChange={(e) => setValue({ about_button_text: e.target.value })} />
            </Field>
            <Field label="Button link">
              <input className="input" value={site.about_button_link ?? ''} placeholder="/contact" onChange={(e) => setValue({ about_button_link: e.target.value })} />
            </Field>
          </div>
          <ImageManager
            title="About image"
            description="Optional image beside the about text."
            currentUrl={site.about_image_url}
            publicId={site.about_image_public_id}
            folder="hero"
            canHardDelete={canHardDelete}
            onUploaded={async (url, publicId) => {
              await persistPatch({ about_image_url: url, about_image_public_id: publicId }, 'About image updated')
            }}
            onRemoved={async () => {
              await persistPatch({ about_image_url: null, about_image_public_id: null }, 'About image removed')
            }}
            onHardDelete={async () => {
              const pid = site.about_image_public_id
              await removeCloudinaryAsset(pid)
              await persistPatch({ about_image_url: null, about_image_public_id: null }, 'About image deleted forever')
            }}
          />
        </SectionCard>

        {/* PREVIEWS + DONATION */}
        <div className="space-y-6 lg:space-y-6">
          <SectionCard
            title="Members Preview"
            emoji="👥"
            description="“Our Mandal Team” strip — shows active public members with circular photos."
            saving={savingSection === 'Members preview'}
            onSave={() => save('Members preview')}
          >
            <label className="flex items-center gap-2 mt-3 text-sm font-medium text-gray-700">
              <input type="checkbox" className="w-4 h-4 accent-saffron" checked={site.members_preview_show} onChange={(e) => setValue({ members_preview_show: e.target.checked })} />
              Show members preview
            </label>
            <Field label="How many members to show">
              <div className="grid grid-cols-3 gap-2">
                {[3, 4, 6].map((n) => (
                  <button
                    key={n}
                    className={cn('btn text-sm', site.members_preview_count === n ? 'btn-primary' : 'btn-outline')}
                    onClick={() => setValue({ members_preview_count: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Field>
          </SectionCard>

          <SectionCard
            title="Gallery Preview"
            emoji="🖼️"
            description="“Latest Memories” strip — the newest published gallery images."
            saving={savingSection === 'Gallery preview'}
            onSave={() => save('Gallery preview')}
          >
            <label className="flex items-center gap-2 mt-3 text-sm font-medium text-gray-700">
              <input type="checkbox" className="w-4 h-4 accent-saffron" checked={site.gallery_preview_show} onChange={(e) => setValue({ gallery_preview_show: e.target.checked })} />
              Show gallery preview
            </label>
            <Field label="How many photos to show">
              <div className="grid grid-cols-3 gap-2">
                {[4, 6, 8].map((n) => (
                  <button
                    key={n}
                    className={cn('btn text-sm', site.gallery_preview_count === n ? 'btn-primary' : 'btn-outline')}
                    onClick={() => setValue({ gallery_preview_count: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Field>
          </SectionCard>

          <SectionCard
            title="Donation Section"
            emoji="💰"
            description="UPI ID, QR, bank details and instructions are managed in Website Settings."
            saving={savingSection === 'Donation section'}
            onSave={() => save('Donation section')}
          >
            <p className="text-sm text-gray-500 mt-3">
              <Link to="/admin/settings" className="text-saffron font-semibold inline-flex items-center gap-1">
                Go to Website Settings <ExternalLink className="w-3.5 h-3.5" />
              </Link>{' '}
              to edit UPI / QR / bank details.
            </p>
            <label className="flex items-center gap-2 mt-3 text-sm font-medium text-gray-700">
              <input type="checkbox" className="w-4 h-4 accent-saffron" checked={site.donation_show} onChange={(e) => setValue({ donation_show: e.target.checked })} />
              Show donation section on homepage
            </label>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}