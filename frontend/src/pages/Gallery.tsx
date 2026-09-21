import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { galleryService } from '@/services/galleryService'
import { LoadingScreen, EmptyState } from '@/components/ui/feedback'
import { Download } from 'lucide-react'
import type { GalleryImage } from '@/types'
import { GALLERY_CATEGORIES } from '@/types'

async function downloadImage(image: GalleryImage) {
  const safeTitle = (image.title || 'ganesh-mandal-photo').replace(/[^a-z0-9-_ ]+/gi, '').replace(/\s+/g, '-').slice(0, 60)
  const ext = image.image_url.split('.').pop()?.toLowerCase()
  const okExt = ext && ext.length <= 4 && /^[a-z0-9]+$/.test(ext) ? ext : 'jpg'
  const filename = `${safeTitle}.${okExt}`
  try {
    const response = await fetch(image.image_url, { mode: 'cors' })
    if (!response.ok) throw new Error('fetch failed')
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
  } catch {
    // Fallback: open in a new tab so the user can long-press and save on mobile.
    window.open(image.image_url, '_blank', 'noopener,noreferrer')
  }
}

export default function Gallery() {
  const [items, setItems] = useState<GalleryImage[]>([])
  const [cat, setCat] = useState('all')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  const load = useCallback((c = cat) => {
    galleryService.list({ category: c }).then(setItems).finally(() => setLoading(false))
  }, [cat])

  useEffect(() => { load(cat) }, [cat, load])

  // Live auto-show: realtime subscription - admin upload appears instantly without refresh
  useEffect(() => {
    const ch = supabase.channel('gallery-live').on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, () => load(cat)).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [cat, load])

  const handleDownload = async (g: GalleryImage) => {
    setDownloading(g.id)
    try {
      await downloadImage(g)
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return <LoadingScreen label="Loading gallery..." />
  return (
    <div className="container-main px-4 py-10">
      <h1 className="page-title">📸 Gallery</h1>
      <p className="page-subtitle">Photos appear under the "All" tab and their own category only.</p>
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={() => setCat('all')} className={`btn text-xs ${cat === 'all' ? 'btn-primary' : 'btn-outline'}`}>All</button>
        {GALLERY_CATEGORIES.map(c =>
          <button key={c} onClick={() => setCat(c)} className={`btn text-xs ${cat === c ? 'btn-primary' : 'btn-outline'}`}>{c}</button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="mt-8"><EmptyState title={`No photos in "${cat === 'all' ? 'All' : cat}" yet`} description="Photos will appear here after upload." /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
          {items.map(g => (
            <div key={g.id} className="card overflow-hidden group">
              <img src={g.image_url} alt={g.title} className="h-48 w-full object-cover" loading="lazy" />
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{g.title}</p>
                  <p className="text-xs text-gray-500">{g.category}</p>
                </div>
                <button
                  onClick={() => handleDownload(g)}
                  disabled={downloading === g.id}
                  className="btn-outline text-xs px-2.5 py-1.5 shrink-0 disabled:opacity-60"
                  title="Download photo"
                >
                  {downloading === g.id ? '…' : <Download className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}