import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Megaphone } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatRelativeTime } from '@/utils'
import { cn } from '@/utils'

type Filter = 'all' | 'unread' | 'announcements' | 'read'

const TYPE_ICON: Record<string, string> = {
  birthday: '🎂',
  announcement: '📢',
  program: '📅',
  aarti: '🙏',
  event: '📌',
}

const FILTER_TABS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'announcements', label: '📢 Announcements' },
  { value: 'read', label: 'Read' },
]

export default function Notifications() {
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications()
  const [searchParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>(searchParams.get('type') === 'announcement' ? 'announcements' : 'all')

  const counts = useMemo(
    () => ({
      unread: notifications.filter(n => !n.is_read).length,
      announcements: notifications.filter(n => n.type === 'announcement').length,
      read: notifications.filter(n => n.is_read).length,
    }),
    [notifications],
  )

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.is_read)
    if (filter === 'announcements') return notifications.filter(n => n.type === 'announcement')
    if (filter === 'read') return notifications.filter(n => n.is_read)
    return notifications
  }, [notifications, filter])

  if (loading) {
    return (
      <div className="app-container py-4 md:py-6 lg:py-8 pb-10" aria-busy="true" aria-label="Loading Notifications">
        <div className="skeleton h-3 w-28 rounded-full" />
        <div className="skeleton h-7 w-44 rounded-full mt-2" />
        <div className="skeleton h-3 w-56 rounded-full mt-2" />
        <div className="skeleton h-10 w-full rounded-full mt-4" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="app-container py-4 md:py-6 lg:py-8 pb-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <section className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-bold text-saffron uppercase tracking-wide flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5" aria-hidden="true" /> Announcements & Updates
            </p>
            <h1 className="page-title">🔔 Notifications</h1>
            <p className="page-subtitle">Announcements, programs, birthdays and event updates.</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn-outline text-xs px-3 py-2 shrink-0">Mark all read</button>
          )}
        </section>

        {/* Filter tabs */}
        <div className="mt-4 flex gap-1 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto scrollbar-hide">
          {FILTER_TABS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap capitalize',
                filter === f.value ? 'bg-saffron text-white shadow-sm' : 'text-gray-600 hover:bg-saffron/5',
              )}
            >
              {f.label}
              {f.value === 'unread' && counts.unread > 0 && ` (${counts.unread})`}
              {f.value === 'announcements' && counts.announcements > 0 && ` (${counts.announcements})`}
              {f.value === 'read' && ` (${counts.read})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="mt-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              <p className="text-2xl">{filter === 'announcements' ? '📢' : filter === 'unread' ? '🎉' : '🔔'}</p>
              <p className="mt-1">
                {filter === 'announcements'
                  ? 'No announcements yet.'
                  : filter === 'unread'
                    ? 'All caught up — no unread notifications.'
                    : 'No notifications yet.'}
              </p>
            </div>
          ) : (
            filtered.map(n => (
              <button
                key={n.id}
                onClick={() => !n.is_read && markAsRead(n.id)}
                className={cn(
                  'card p-4 flex gap-3 w-full text-left hover:shadow-lg transition',
                  !n.is_read ? 'bg-saffron/5 border-saffron/20' : 'opacity-80',
                )}
              >
                <span className="text-xl shrink-0" aria-hidden="true">{TYPE_ICON[n.type] ?? '📢'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-saffron shrink-0" aria-label="unread" />}
                  </div>
                  <p className="text-sm text-gray-600">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}