import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, Clock, Play } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { aartiService } from '@/services/aartiService'
import { EmptyState } from '@/components/ui/feedback'
import { cn, formatTime } from '@/utils'
import type { Aarti, AartiCategory } from '@/types'
import { AARTI_CATEGORIES, AARTI_CATEGORY_LABELS } from '@/types'

const catIcon = (cat: AartiCategory) => AARTI_CATEGORIES.find(c => c.value === cat)?.icon ?? '🙏'
const catLabel = (cat: AartiCategory) => AARTI_CATEGORY_LABELS[cat] ?? cat

export default function Aarti() {
  const [items, setItems] = useState<Aarti[]>([])
  const [cat, setCat] = useState<AartiCategory | 'all'>('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => { aartiService.list({ category: cat }).then(setItems).finally(() => setLoading(false)) }, [cat])

  useEffect(() => {
    load()
    const ch = supabase.channel('aartis-live').on('postgres_changes', { event: '*', schema: 'public', table: 'aartis' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [cat, load])

  if (loading) return <AartiSkeleton />

  return (
    <div className="app-container py-4 md:py-6 lg:py-8 pb-10">
      {/* Header */}
      <section className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold text-saffron uppercase tracking-wide">🙏 Prayer Time</p>
          <h1 className="page-title">Aarti Library</h1>
          <p className="page-subtitle">Marathi lyrics, audio, and timings</p>
        </div>
        <span className="badge-primary mt-1 shrink-0">{items.length} Aartis</span>
      </section>

      {/* Aarti Book promo — सर्व मोबाईल धारकांसाठी */}
      <Link to="/aarti/book" className="mt-4 md:mt-5 block relative overflow-hidden rounded-2xl bg-gradient-to-r from-saffron via-orange-500 to-red-600 p-4 md:p-5 text-white shadow-lg shadow-saffron/20 group">
        <div className="relative flex items-center gap-4">
          <span className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold bg-white/20 inline-block px-2.5 py-1 rounded-full">सर्व मोबाईल धारकांसाठी</p>
            <h3 className="font-devanagari text-lg md:text-xl font-bold mt-1.5 leading-snug">आरती पुस्तक — सर्वांना पाठवावे</h3>
            <p className="text-sm text-white/90 mt-0.5 hidden sm:block">24 आरत्या एका पुस्तकात — Offline, Share, Print</p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 bg-white text-saffron px-4 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-transform">
            Open Book <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </span>
        </div>
      </Link>

      {/* Category filter — compact pills, edge-to-edge scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 md:mx-0 md:px-0 mt-4 md:mt-5">
        <button
          type="button"
          onClick={() => setCat('all')}
          className={cn(
            'whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-colors',
            cat === 'all' ? 'bg-saffron text-white shadow-sm' : 'bg-white border border-orange-200 text-gray-600 hover:bg-saffron/10',
          )}
        >
          All
        </button>
        {AARTI_CATEGORIES.map(c => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCat(c.value)}
            className={cn(
              'whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-colors',
              cat === c.value ? 'bg-saffron text-white shadow-sm' : 'bg-white border border-orange-200 text-gray-600 hover:bg-saffron/10',
            )}
          >
            {c.icon} {c.label.replace(' Aarti', '')}
          </button>
        ))}
      </div>

      {/* Aarti grid */}
      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No Aartis here yet" description={cat === 'all' ? 'Admin will publish Aartis soon.' : `No ${catLabel(cat)} aartis yet.`} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 md:mt-5">
          {items.map(a => (
            <Link key={a.id} to={`/aarti/${a.id}`} className="card group p-4 md:p-5 flex flex-col gap-3 hover:shadow-lg transition active:scale-[0.99]">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl bg-saffron/10 flex items-center justify-center text-xl shrink-0">
                  {catIcon(a.category)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 truncate">{a.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="badge-primary">{catLabel(a.category)}</span>
                    {a.time && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" /> {formatTime(a.time)}
                      </span>
                    )}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-saffron group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
              </div>

              {a.lyrics && (
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed whitespace-pre-line">{a.lyrics}</p>
              )}

              <div className="flex items-center gap-2 mt-auto">
                {a.audio_url && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-saffron bg-saffron/10 rounded-full px-2.5 py-1">
                    <Play className="w-3 h-3 fill-current" aria-hidden="true" /> Audio Aarti
                  </span>
                )}
                <span className="ml-auto text-xs font-bold text-saffron inline-flex items-center gap-0.5">
                  Read <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function AartiSkeleton() {
  return (
    <div className="app-container py-4 md:py-6 lg:py-8 pb-10" aria-busy="true" aria-label="Loading Aartis">
      <div className="skeleton h-3 w-24 rounded-full" />
      <div className="skeleton h-7 w-44 rounded-full mt-2" />
      <div className="skeleton h-3 w-56 rounded-full mt-2" />
      <div className="skeleton h-24 w-full rounded-2xl mt-4" />
      <div className="skeleton h-10 w-full rounded-full mt-5" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}