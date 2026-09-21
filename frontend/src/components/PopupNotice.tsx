import { useEffect, useState } from 'react'
import { X, Megaphone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Announcement } from '@/types'
import { formatDate } from '@/utils'

function todayISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 10)
}

/**
 * Shows a scheduled pop-up notice on public pages. Reads announcements where
 * popup_enabled = true and today is inside the start/end date range. The notice
 * shows once per browser session per announcement.
 */
export default function PopupNotice() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      const today = todayISO()
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .eq('popup_enabled', true)
        .order('created_at', { ascending: false })
        .limit(10)
      if (cancelled || error) return
      const active = (data ?? []).find(a => {
        if (a.start_date && a.start_date > today) return false
        if (a.end_date && a.end_date < today) return false
        return true
      })
      if (active && !sessionStorage.getItem(`popup-seen-${active.id}`)) {
        setAnnouncement(active)
      }
    }
    check()

    const channel = supabase.channel('popup-notice').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'announcements' },
      () => check(),
    ).subscribe()
    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  if (!announcement || closed) return null

  const dismiss = () => {
    sessionStorage.setItem(`popup-seen-${announcement.id}`, '1')
    setClosed(true)
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-start justify-between px-5 py-4 border-b border-orange-100 bg-gradient-to-r from-saffron/10 to-orange-100/40">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-saffron text-white flex items-center justify-center">
              <Megaphone className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="font-bold text-gray-900">{announcement.title}</h2>
          </div>
          <button onClick={dismiss} className="text-gray-400 hover:text-gray-700 text-xl px-1" aria-label="Close notice">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {announcement.image_url && (
            <img src={announcement.image_url} alt="" className="w-full h-40 object-cover rounded-xl mb-3 border" />
          )}
          <p className="text-gray-700 whitespace-pre-line">{announcement.message}</p>
          {announcement.start_date && (
            <p className="text-xs text-gray-400 mt-3">{formatDate(announcement.start_date)} onward</p>
          )}
        </div>
        <div className="px-5 py-4 border-t border-gray-100">
          <button className="btn-primary w-full" onClick={dismiss}>Got it</button>
        </div>
      </div>
    </div>
  )
}