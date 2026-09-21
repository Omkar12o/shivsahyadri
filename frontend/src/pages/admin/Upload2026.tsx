import { useState } from 'react'
import { galleryService } from '@/services/galleryService'
import { storageService } from '@/services/storageService'
import { uploadToCloudinary, getCloudinaryConfig } from '@/lib/cloudinary'

export default function Upload2026() {
  const { isConfigured: cloudConfigured, cloudName, preset } = getCloudinaryConfig()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('2026-decoration')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (f: File | null) => {
    setFile(f)
    setResultUrl(null)
    setError(null)
    setProgress(0)
    if (f) {
      const url = URL.createObjectURL(f)
      setPreview(url)
    } else setPreview(null)
  }

  const handleUpload = async () => {
    if (!title.trim()) return setError('Title required')
    if (!file) return setError('Please select an image file')
    setUploading(true)
    setError(null)
    setProgress(0)
    try {
      // Single file upload: try Cloudinary first (2026), fallback to Supabase gallery bucket
      let imageUrl: string
      let publicId: string | null = null
      if (cloudConfigured) {
        const result = await uploadToCloudinary(file, 'gallery', setProgress)
        imageUrl = result.url
        publicId = result.public_id
      } else {
        // fallback: Supabase storage gallery/2026
        imageUrl = await storageService.upload('gallery', '2026', file, setProgress)
      }
      setResultUrl(imageUrl)
      // Save to gallery table with year 2026 so it appears in /festival/2026 and /gallery?year=2026
      await galleryService.create({
        title: title.trim(),
        image_url: imageUrl,
        cloudinary_public_id: publicId,
        category,
        event_date: '2026-09-01',
        is_published: true,
      })
      setTitle('')
      setFile(null)
      setPreview(null)
      setProgress(100)
      setTimeout(() => setProgress(0), 1500)
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">📸 Upload Image — 2026 Festival</h1>
      <p className="text-sm text-gray-500 mt-1">
        One-file uploader for 2026. Uploaded images appear in <span className="font-medium">2026 Ganpati Festival</span> & Gallery. {cloudConfigured ? `Cloudinary: ${cloudName} / ${preset}` : 'Using Supabase storage (set Cloudinary env to use Cloudinary)'}
      </p>

      <div className="card p-6 mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Title *</label>
          <input className="input mt-1" placeholder="e.g. 2026 Decoration - Main Mandap" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium">Category</label>
          <select className="input mt-1" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="2026-decoration">2026 Decoration</option>
            <option value="2026-ganpati">2026 Ganpati</option>
            <option value="2026-sthapana">2026 Sthapana</option>
            <option value="2026-aarti">2026 Aarti</option>
            <option value="ganpati">Ganpati (general)</option>
            <option value="decoration">Decoration (general)</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Image File * (JPG/PNG/WEBP, max 10MB)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="input mt-1"
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {preview && (
          <div className="border rounded-xl overflow-hidden">
            <img src={preview} alt="preview" className="w-full h-64 object-contain bg-gray-50" />
            <p className="text-xs text-gray-500 p-2 truncate">{file?.name} • {(file!.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-saffron h-2 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {uploading && <p className="text-xs text-gray-500 text-center">{progress}% uploading...</p>}

        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
        {resultUrl && <p className="text-sm text-green-700 bg-green-50 p-3 rounded-xl break-all">✅ Uploaded: <a href={resultUrl} target="_blank" rel="noreferrer" className="underline">{resultUrl}</a> — saved to Gallery (2026)</p>}

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="btn-primary w-full justify-center disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload to 2026 Festival'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Single-file uploader: <code>frontend/src/pages/admin/Upload2026.tsx</code>. Images saved with <code>event_date=2026-09-01</code> and category <code>{category}</code>.
        </p>
      </div>
    </div>
  )
}
