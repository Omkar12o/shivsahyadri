import { useMemo, useState } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatRelativeTime } from '@/utils'
import { cn } from '@/utils'

type Filter = 'unread' | 'read' | 'all'

const TYPE_ICON: Record<string, string> = {
  birthday: '🎂',
  announcement: '📢',
  program: '📅',
  aarti: '🙏',
  event: '📌',
}

export default function Notifications() {
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications()
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo(
    () => ({
      unread: notifications.filter(n => !n.is_read).length,
      read: notifications.filter(n => n.is_read).length,
    }),
    [notifications],
  )

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.is_read)
    if (filter === 'read') return notifications.filter(n => n.is_read)
    return notifications
  }, [notifications, filter])

  if (loading) return <div className="container-main px-4 py-10 text-center"><div className="animate-spin inline-block w-8 h-8 border-4 border-saffron border-t-transparent rounded-full" /></div>

  return (
    <div className="container-main px-4 py-10 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="page-title">🔔 Notifications {unreadCount > 0 && <span className="text-sm align-middle ml-1 text-saffron">({unreadCount} new)</span>}</h1>
        {unreadCount > 0 && <button onClick={markAllAsRead} className="btn-outline text-sm shrink-0">Mark all read</button>}
      </div>

      <div className="flex gap-1 mt-4 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto scrollbar-hide">
        {(['all', 'unread', 'read'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap capitalize',
              filter === f ? 'bg-saffron text-white shadow-sm' : 'text-gray-600 hover:bg-saffron/5',
            )}
          >
            {f} {f === 'unread' && counts.unread > 0 && `(${counts.unread})`} {f === 'read' && `(${counts.read})`}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            {filter === 'unread' ? '🎉 All caught up — no unread notifications.' : 'No notifications yet.'}
          </div>
        ) : (
          filtered.map(n => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markAsRead(n.id)}
              className={cn(
                'card p-4 flex gap-3 w-full text-left',
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
  )
}