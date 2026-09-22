import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { galleryService } from '@/services/galleryService'
import { LoadingScreen, EmptyState } from '@/components/ui/feedback'
import { Download, X, ChevronLeft, ChevronRight, Expand } from 'lucide-react'
import type { GalleryImage } from '@/types'
import { GALLERY_CATEGORIES } from '@/types'
import { cn } from '@/utils'

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
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

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

  // Keyboard navigation for the lightbox (Esc / arrows)
  useEffect(() => {
    if (viewerIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewerIndex(null)
      if (e.key === 'ArrowLeft') setViewerIndex(i => (i === null ? i : (i - 1 + items.length) % items.length))
      if (e.key === 'ArrowRight') setViewerIndex(i => (i === null ? i : (i + 1) % items.length))
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [viewerIndex, items.length])

  if (loading) return <LoadingScreen label="Loading gallery..." />

  const active = viewerIndex !== null ? items[viewerIndex] : null

  return (
    <div className="container-main px-4 py-10">
      <h1 className="page-title">📸 Gallery</h1>
      <p className="page-subtitle">Tap any photo to view it full size.</p>
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={() => setCat('all')} className={`btn text-xs ${cat === 'all' ? 'btn-primary' : 'btn-outline'}`}>All</button>
        {GALLERY_CATEGORIES.map(c =>
          <button key={c} onClick={() => setCat(c)} className={`btn text-xs ${cat === c ? 'btn-primary' : 'btn-outline'}`}>{c}</button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="mt-8"><EmptyState title={`No photos in "${cat === 'all' ? 'All' : cat}" yet`} description="Photos will appear here after upload." /></div>
      ) : (
        <>
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {items.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setViewerIndex(i)}
                className="card overflow-hidden group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <img src={g.image_url} alt={g.title} className="h-64 lg:h-72 w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
                  <span className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title="View full size">
                    <Expand className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="p-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{g.title}</p>
                    <p className="text-xs text-gray-500">{g.category}</p>
                  </div>
                  <span className="btn-outline text-xs px-2.5 py-1.5 shrink-0">View</span>
                </div>
              </button>
            ))}
          </div>

          {/* Mobile: clean 2-column photo grid so photos are easy to see */}
          <div className="md:hidden grid grid-cols-2 gap-3 mt-6">
            {items.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setViewerIndex(i)}
                className="card overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
              >
                <div className="relative aspect-square">
                  <img src={g.image_url} alt={g.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  <span className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full" title="View full size">
                    <Expand className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{g.title}</p>
                    <p className="text-xs text-gray-500">{g.category}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDownload(g) }}
                    disabled={downloading === g.id}
                    className="text-saffron shrink-0 disabled:opacity-60"
                    title="Download photo"
                    aria-label={`Download ${g.title}`}
                  >
                    {downloading === g.id ? <span className="text-xs">…</span> : <Download className="h-4 w-4" />}
                  </button>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Full-size lightbox viewer */}
      {active && viewerIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
          onClick={() => setViewerIndex(null)}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 text-white shrink-0" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold truncate">
              {active.title}
              {active.category ? <span className="ml-2 text-white/60 font-normal">• {active.category}</span> : null}
            </p>
            <button
              onClick={() => setViewerIndex(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Image area */}
          <div className="flex-1 min-h-0 relative flex items-stretch px-2 pb-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setViewerIndex((viewerIndex - 1 + items.length) % items.length)}
              className="absolute left-1 md:left-4 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" aria-hidden="true" />
            </button>
            <div className="flex-1 flex items-center justify-center min-w-0">
              <img
                src={active.image_url}
                alt={active.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>
            <button
              onClick={() => setViewerIndex((viewerIndex + 1) % items.length)}
              className="absolute right-1 md:right-4 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          {/* Bottom bar */}
          <div className="px-4 py-3 flex items-center justify-between text-white shrink-0" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-white/70">{(viewerIndex + 1)} / {items.length}</p>
            <button
              onClick={() => handleDownload(active)}
              disabled={downloading === active.id}
              className={cn('btn bg-white text-saffron hover:bg-cream !px-5', downloading === active.id && 'opacity-60')}
            >
              {downloading === active.id ? 'Saving…' : <><Download className="w-4 h-4 mr-2" aria-hidden="true" /> Download</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}