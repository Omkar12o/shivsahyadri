import { useEffect, useState } from 'react'
import { settingsService } from '@/services/settingsService'
import { uploadImage } from '@/services/uploadImageService'
import { useToast } from '@/components/ToastProvider'

function ImageUploader({
  label,
  currentUrl,
  folder,
  onUploaded,
  onRemoved,
  helper,
}: {
  label: string
  currentUrl: string | null | undefined
  folder: 'logo' | 'hero' | 'members' | 'gallery' | 'events' | 'aarti' | 'qr'
  onUploaded: (url: string, publicId: string | null) => void
  onRemoved?: () => void
  helper?: string
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (f: File | null) => {
    setError(null)
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : (currentUrl ?? null))
  }

  const upload = async () => {
    if (!file) { setError('Choose an image file first.'); return }
    setError(null)
    setUploading(true)
    setProgress(0)
    try {
      const result = await uploadImage(file, folder, setProgress)
      onUploaded(result.url, result.public_id)
      setPreview(result.url)
      setFile(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mt-2 p-3 border rounded-xl bg-orange-50">
      <p className="text-sm font-medium">{label}</p>
      {preview && <img src={preview} alt={label} className="w-20 h-20 rounded-xl object-cover mt-2 border bg-white" />}
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input mt-2 text-sm" onChange={e => handleFile(e.target.files?.[0] ?? null)} />
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div className="bg-saffron h-2" style={{ width: `${progress}%` }} />
        </div>
      )}
      {uploading && <p className="text-xs text-center text-gray-500 mt-1">{progress}% uploading...</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-2 mt-2">{error}</p>}
      <button
        className="btn-secondary w-full mt-2 text-sm disabled:opacity-50"
        disabled={uploading || !file}
        onClick={upload}
      >
        {uploading ? `Uploading ${progress}%...` : 'Upload'}
      </button>
      {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
      <div className="mt-2 flex gap-2 items-center">
        <span className="text-xs font-semibold text-gray-600">URL:</span>
        <span className="text-xs text-gray-500 truncate flex-1">{currentUrl || '—'}</span>
      </div>
      {onRemoved && currentUrl && (
        <button className="text-xs text-red-600 mt-1 underline" onClick={() => { setPreview(null); onRemoved() }}>
          Remove image
        </button>
      )}
    </div>
  )
}

export default function AdminSettings() {
  const [mandal, setMandal] = useState<Record<string, any>>({})
  const [site, setSite] = useState<Record<string, any>>({})
  const [donation, setDonation] = useState<Record<string, any>>({})
  const [social, setSocial] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    (async () => {
      try {
        const [m, s, d] = await Promise.all([
          settingsService.getMandalInfo(),
          settingsService.getSiteSettings(),
          settingsService.getDonationInfo(),
        ])
        const mandalData = (m as Record<string, any> ?? {})
        setMandal(mandalData)
        setSocial(mandalData.social_media ?? {})
        setSite((s as Record<string, any>) ?? {})
        setDonation((d as Record<string, any>) ?? {})
      } catch {
        toastError('Failed to load settings.')
      }
    })()
  }, [])

  const save = async (action: () => Promise<void>, okText: string) => {
    setSaving(true)
    try {
      await action()
      toastSuccess(okText)
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const saveMandal = () =>
    save(async () => {
      await settingsService.saveMandalInfo({ ...mandal, social_media: social })
    }, 'Mandal info saved. About / Contact pages updated.')

  const saveSite = () =>
    save(async () => {
      await settingsService.saveSiteSettings(site)
    }, 'Site settings saved. Public website updated instantly.')

  const saveDonation = () =>
    save(async () => {
      await settingsService.saveDonationInfo(donation)
    }, 'Donation info saved.')

  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-sm text-gray-500">Everything here is saved to Supabase and shown to the public website automatically within seconds.</p>
      {saving && <p className="text-xs text-gray-500 mt-1">Saving…</p>}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Mandal Info + Contact */}
        <div className="card p-4">
          <h3 className="font-bold">Mandal Info</h3>
          <input className="input mt-2" placeholder="Mandal Name" value={mandal.name ?? ''} onChange={e => setMandal({ ...mandal, name: e.target.value })} />
          <input className="input mt-2" placeholder="Village" value={mandal.village ?? ''} onChange={e => setMandal({ ...mandal, village: e.target.value })} />
          <input className="input mt-2" placeholder="Established Year" value={mandal.established_year ?? ''} onChange={e => setMandal({ ...mandal, established_year: e.target.value ? Number(e.target.value) : null })} />
          <textarea className="input mt-2" rows={3} placeholder="About / History (shown on public About page)" value={mandal.history ?? ''} onChange={e => setMandal({ ...mandal, history: e.target.value })} />
          <textarea className="input mt-2" rows={2} placeholder="Objectives" value={mandal.objectives ?? ''} onChange={e => setMandal({ ...mandal, objectives: e.target.value })} />
          <textarea className="input mt-2" rows={2} placeholder="Social Activities" value={mandal.social_activities ?? ''} onChange={e => setMandal({ ...mandal, social_activities: e.target.value })} />
          <textarea className="input mt-2" rows={2} placeholder="Community Activities" value={mandal.community_activities ?? ''} onChange={e => setMandal({ ...mandal, community_activities: e.target.value })} />
          <textarea className="input mt-2" rows={2} placeholder="Previous Years Info" value={mandal.previous_years_info ?? ''} onChange={e => setMandal({ ...mandal, previous_years_info: e.target.value })} />
          <h3 className="font-bold mt-4">Contact</h3>
          <input className="input mt-2" placeholder="Phone" value={mandal.contact_phone ?? ''} onChange={e => setMandal({ ...mandal, contact_phone: e.target.value })} />
          <input className="input mt-2" placeholder="WhatsApp" value={mandal.contact_whatsapp ?? ''} onChange={e => setMandal({ ...mandal, contact_whatsapp: e.target.value })} />
          <input className="input mt-2" placeholder="Email" value={mandal.contact_email ?? ''} onChange={e => setMandal({ ...mandal, contact_email: e.target.value })} />
          <textarea className="input mt-2" rows={2} placeholder="Address" value={mandal.address ?? ''} onChange={e => setMandal({ ...mandal, address: e.target.value })} />
          <input className="input mt-2" placeholder="Map Embed URL (Google Maps iframe src)" value={mandal.map_embed_url ?? ''} onChange={e => setMandal({ ...mandal, map_embed_url: e.target.value })} />
          <h3 className="font-bold mt-4">Social Links</h3>
          <input className="input mt-2" placeholder="Instagram URL" value={social.instagram ?? ''} onChange={e => setSocial({ ...social, instagram: e.target.value })} />
          <input className="input mt-2" placeholder="Facebook URL" value={social.facebook ?? ''} onChange={e => setSocial({ ...social, facebook: e.target.value })} />
          <input className="input mt-2" placeholder="YouTube URL" value={social.youtube ?? ''} onChange={e => setSocial({ ...social, youtube: e.target.value })} />
          <button className="btn-primary mt-3 w-full" disabled={saving} onClick={saveMandal}>
            Save Mandal Info
          </button>
        </div>

        {/* Site Settings */}
        <div className="card p-4">
          <h3 className="font-bold">Site Settings</h3>

          <ImageUploader
            label="🖼️ Mandal Logo (Header)"
            currentUrl={site.logo_url ?? null}
            folder="logo"
            helper="Square image (200x200) recommended. Header shows it instantly after save."
            onUploaded={(url, publicId) => setSite({ ...site, logo_url: url, logo_public_id: publicId })}
            onRemoved={() => setSite({ ...site, logo_url: null, logo_public_id: null })}
          />

          <ImageUploader
            label="🙏 Main Ganpati / Hero Image"
            currentUrl={site.ganpati_image_url ?? null}
            folder="hero"
            helper="Shown on the Home page hero section."
            onUploaded={(url, publicId) => setSite({ ...site, ganpati_image_url: url, ganpati_public_id: publicId })}
            onRemoved={() => setSite({ ...site, ganpati_image_url: null, ganpati_public_id: null })}
          />

          <input className="input mt-3" placeholder="Hero Welcome e.g. श्री गणेशाय नमः" value={site.hero_welcome ?? ''} onChange={e => setSite({ ...site, hero_welcome: e.target.value })} />
          <input className="input mt-2" placeholder="Hero Message" value={site.hero_message ?? ''} onChange={e => setSite({ ...site, hero_message: e.target.value })} />
          <input className="input mt-2" type="datetime-local" value={site.countdown_target ? new Date(site.countdown_target).toISOString().slice(0, 16) : ''} onChange={e => setSite({ ...site, countdown_target: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <input className="input" placeholder="Announcements title" value={site.announcements_title ?? ''} onChange={e => setSite({ ...site, announcements_title: e.target.value })} />
            <input className="input" placeholder="Programs title" value={site.programs_title ?? ''} onChange={e => setSite({ ...site, programs_title: e.target.value })} />
            <input className="input" placeholder="Gallery title" value={site.gallery_title ?? ''} onChange={e => setSite({ ...site, gallery_title: e.target.value })} />
            <input className="input" placeholder="Donation title" value={site.donation_title ?? ''} onChange={e => setSite({ ...site, donation_title: e.target.value })} />
            <input className="input" placeholder="Birthday title" value={site.birthday_title ?? ''} onChange={e => setSite({ ...site, birthday_title: e.target.value })} />
          </div>
          <button className="btn-primary mt-3 w-full" disabled={saving} onClick={saveSite}>
            Save Site
          </button>
        </div>

        {/* Donation */}
        <div className="card p-4 md:col-span-2">
          <h3 className="font-bold">Donation</h3>
          <div className="grid md:grid-cols-3 gap-2 mt-2">
            <input className="input" placeholder="UPI ID" value={donation.upi_id ?? ''} onChange={e => setDonation({ ...donation, upi_id: e.target.value })} />
            <input className="input" placeholder="Mandal Name" value={donation.mandal_name ?? ''} onChange={e => setDonation({ ...donation, mandal_name: e.target.value })} />
            <input className="input" placeholder="Bank Name" value={donation.bank_name ?? ''} onChange={e => setDonation({ ...donation, bank_name: e.target.value })} />
            <input className="input" placeholder="Account Number" value={donation.account_number ?? ''} onChange={e => setDonation({ ...donation, account_number: e.target.value })} />
            <input className="input" placeholder="IFSC Code" value={donation.ifsc_code ?? ''} onChange={e => setDonation({ ...donation, ifsc_code: e.target.value })} />
            <input className="input" placeholder="Account Holder" value={donation.account_holder ?? ''} onChange={e => setDonation({ ...donation, account_holder: e.target.value })} />
          </div>
          <ImageUploader
            label="QR Code Image (UPI)"
            currentUrl={donation.upi_qr_url ?? null}
            folder="qr"
            onUploaded={(url, publicId) => setDonation({ ...donation, upi_qr_url: url, upi_qr_public_id: publicId })}
            onRemoved={() => setDonation({ ...donation, upi_qr_url: null, upi_qr_public_id: null })}
          />
          <textarea className="input mt-2 w-full" rows={2} placeholder="Donation instructions" value={donation.instructions ?? ''} onChange={e => setDonation({ ...donation, instructions: e.target.value })} />
          <button className="btn-primary mt-3 w-full" disabled={saving} onClick={saveDonation}>
            Save Donation
          </button>
        </div>
      </div>
    </div>
  )
}