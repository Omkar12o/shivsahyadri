import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { profileService } from '@/services/profileService'
import { LoadingScreen, EmptyState } from '@/components/ui/feedback'
import { getInitials, getAvatarColor, cn } from '@/utils'
import type { MemberDirectoryEntry } from '@/types'

const GRID_CLASSES = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'

export default function Members() {
  const [items, setItems] = useState<MemberDirectoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<MemberDirectoryEntry | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const data = await profileService.getMemberDirectory()
        setItems(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load members')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Live: admin edits a member -> directory updates instantly on member side
  useEffect(() => {
    const ch = supabase
      .channel('members-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        profileService.getMemberDirectory().then(setItems).catch(() => {})
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const filtered = items.filter(m =>
    !q ||
    m.full_name.toLowerCase().includes(q.toLowerCase()) ||
    (m.position ?? '').toLowerCase().includes(q.toLowerCase()),
  )

  if (loading) return <LoadingScreen label="Loading members..." />
  if (error) return (
    <div className="container-main px-4 py-10">
      <h1 className="page-title">Our Members</h1>
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 mt-4">{error}</p>
    </div>
  )

  return (
    <div className="container-main px-4 py-10">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-saffron">Our Team</p>
        <h1 className="page-title">Our Members</h1>
        <p className="page-subtitle">Meet the people who help make our Ganesh Mandal possible.</p>
      </div>

      {items.length > 0 && (
        <div className="mx-auto max-w-md mt-8">
          <input className="input text-center" placeholder="🔍 Search members…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-10"><EmptyState title="No members yet" description="Members will appear here soon." /></div>
      ) : (
        <div className={cn('grid gap-4 sm:gap-5 mt-8 mx-auto max-w-6xl', GRID_CLASSES)}>
          {filtered.map(m => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left w-full"
            >
              {/* Passport photo — 3:4 ratio, cover, not circular */}
              <div className="aspect-[3/4] w-full overflow-hidden bg-saffron/5">
                {m.profile_photo_url ? (
                  <img src={m.profile_photo_url} alt={m.full_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                ) : (
                  <div className={cn('w-full h-full flex flex-col items-center justify-center text-white', getAvatarColor(m.full_name))}>
                    <span className="text-4xl font-bold">{getInitials(m.full_name)}</span>
                  </div>
                )}
              </div>
              <div className="p-3 text-center">
                <p className="font-bold text-gray-900 text-sm truncate">{m.full_name}</p>
                {m.position ? (
                  <p className="text-[11px] font-semibold text-saffron uppercase tracking-wide mt-0.5 truncate">{m.position}</p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-0.5">Member</p>
                )}
                {m.bio && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{m.bio}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 text-center relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-xl px-2" aria-label="Close">✕</button>
            {selected.profile_photo_url ? (
              <div className="w-32 h-40 rounded-xl overflow-hidden mx-auto border-2 border-saffron/20">
                <img src={selected.profile_photo_url} alt={selected.full_name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={cn('w-32 h-40 rounded-xl flex items-center justify-center text-white text-3xl font-bold mx-auto', getAvatarColor(selected.full_name))}>
                {getInitials(selected.full_name)}
              </div>
            )}
            <h2 className="text-2xl font-bold mt-4">{selected.full_name}</h2>
            {selected.position && <p className="text-sm font-medium text-saffron uppercase tracking-wide mt-1">{selected.position}</p>}
            {selected.bio && <p className="text-sm text-gray-600 mt-4 leading-relaxed">{selected.bio}</p>}
          </div>
        </div>
      )}
    </div>
  )
}