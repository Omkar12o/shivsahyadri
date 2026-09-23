import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Bell, Home, Music, Calendar, Images, MoreHorizontal, Megaphone, MessageCircle, Volume2, VolumeX } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useChatUnread } from '@/contexts/ChatUnreadContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/components/ToastProvider'
import PopupNotice from '@/components/PopupNotice'
import { settingsService } from '@/services/settingsService'
import { cn, getInitials, getAvatarColor } from '@/utils'
import { isNotificationSoundEnabled, setNotificationSoundEnabled, playNotificationSound } from '@/utils/sound'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

const TABS = [
  { path: '/home', icon: Home },
  { path: '/aarti', icon: Music },
  { path: '/programs', icon: Calendar },
  { path: '/gallery', icon: Images },
  { path: '/more', icon: MoreHorizontal },
]

const DESKTOP_NAV = [
  { path: '/home', label: 'Home' },
  { path: '/aarti', label: 'Aarti' },
  { path: '/programs', label: 'Programs' },
  { path: '/gallery', label: 'Gallery' },
  { path: '/members', label: 'Members' },
  { path: '/videos', label: 'Videos' },
  { path: '/donation', label: 'Donation' },
  { path: '/member/chat', label: 'Chat' },
  { path: '/more', label: 'More' },
]

export default function Layout() {
  const { profile, signOut } = useAuth()
  const { success: toastSuccess } = useToast()
  const { notifications, unreadCount } = useNotifications()
  const { chatUnread } = useChatUnread()
  const { t } = useLanguage()
  const location = useLocation()
  const nav = useNavigate()
  const [logoUrl, setLogoUrl] = useState<string | null>('/logo.jpeg')
  const [mandalName, setMandalName] = useState('Shivsaydri Ganesh Mandal')
  const [soundOn, setSoundOn] = useState(() => isNotificationSoundEnabled())
  const lastNotifId = useRef<string | null>(null)

  useEffect(() => {
    settingsService.getSiteSettings().then(s => setLogoUrl(s?.logo_url ?? '/logo.jpeg')).catch(() => {})
    settingsService.getMandalInfo().then(m => {
      if (m) setMandalName(m.name)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const channel = supabase.channel('app-shell-live').on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
      settingsService.getSiteSettings().then(s => setLogoUrl(s?.logo_url ?? '/logo.jpeg'))
    }).on('postgres_changes', { event: '*', schema: 'public', table: 'mandal_info' }, () => {
      settingsService.getMandalInfo().then(m => {
        if (m) setMandalName(m.name)
      })
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const announcementUnread = notifications.filter(n => n.type === 'announcement' && !n.is_read).length

  // Real-time: new community chat message → toast + sound (like WhatsApp badge)
  useEffect(() => {
    let channel: RealtimeChannel | null = null
    const onChat = () => {
      if (location.pathname === '/member/chat') return
      toastSuccess('💬 New Community message')
      playNotificationSound()
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session) return
      channel = supabase.channel('layout-chat-alert')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => onChat())
        .subscribe()
    })
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [location.pathname, toastSuccess])

  // Real-time: new notification → toast + sound, badge handled by NotificationContext
  useEffect(() => {
    const newest = notifications[0]
    if (!newest || newest.is_read || newest.id === lastNotifId.current) return
    lastNotifId.current = newest.id
    toastSuccess(`${newest.type === 'announcement' ? '📢' : '🔔'} ${newest.title}${newest.message ? ` — ${newest.message}` : ''}`)
    playNotificationSound()
  }, [notifications, toastSuccess])

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    setNotificationSoundEnabled(next)
  }

  const isTabActive = (path: string) =>
    path === '/home' || path === '/more'
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(path + '/')

  const handleLogout = async () => {
    try {
      await signOut()
      toastSuccess('✓ Logged out successfully')
    } catch {
      // session already gone
    }
    nav('/login', { replace: true })
  }

  const fullName = profile?.full_name ?? 'Member'

  return (
    <div className="min-h-screen flex flex-col bg-cream no-hscroll">
      {/* Top app bar — compact on mobile, full header + nav on md+ */}
      <header
        className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-orange-100 shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="app-container">
          <div className="flex items-center justify-between h-14 md:h-16 lg:h-[72px] gap-3">
            <Link to="/home" className="flex items-center gap-2 min-w-0 shrink-0" aria-label="Go to Home">
              {logoUrl ? (
                <img src={logoUrl} alt="Mandal logo" className="w-9 h-9 md:w-11 md:h-11 rounded-xl object-contain bg-white border border-orange-100 p-0.5 shadow-sm shrink-0" />
              ) : (
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-saffron flex items-center justify-center shrink-0">
                  <span className="text-white font-devanagari font-bold">श्री</span>
                </div>
              )}
              <span className="hidden sm:block font-bold text-sm md:text-base text-gray-900 truncate">{mandalName}</span>
            </Link>

            {/* Desktop navigation — from tablet up (bottom nav is hidden at the same width) */}
            <nav className="hidden md:flex items-center gap-1 mx-auto overflow-x-auto scrollbar-hide" aria-label="Primary">
              {DESKTOP_NAV.map((item) => {
                const active = item.path === '/home' || item.path === '/more'
                  ? location.pathname === item.path
                  : location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'px-3 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5',
                      active ? 'text-saffron bg-saffron/10' : 'text-gray-600 hover:text-saffron hover:bg-saffron/5',
                    )}
                  >
                    {item.label}
                    {item.path === '/member/chat' && chatUnread > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {chatUnread > 9 ? '9+' : chatUnread}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-0.5 md:gap-1 shrink-0 ml-auto md:ml-0">
              <button
                type="button"
                onClick={toggleSound}
                className={cn('p-2 rounded-lg transition-colors', soundOn ? 'text-saffron' : 'text-gray-400')}
                aria-label={soundOn ? 'Notification sound ON - tap to mute' : 'Notification sound OFF - tap to enable'}
                title={soundOn ? '🔊 Sound ON' : '🔇 Sound OFF'}
              >
                {soundOn ? <Volume2 className="w-5 h-5" aria-hidden="true" /> : <VolumeX className="w-5 h-5" aria-hidden="true" />}
              </button>
              <Link
                to="/member/notifications?type=announcement"
                className={cn(
                  'relative p-2 rounded-lg transition-all',
                  announcementUnread > 0 ? 'text-saffron bg-saffron/10 ring-2 ring-saffron/60 ring-offset-1 ring-offset-white' : 'text-gray-700 active:bg-saffron/10',
                )}
                aria-label={announcementUnread > 0 ? `Announcements, ${announcementUnread} unread` : 'Announcements'}
                title="Announcements"
              >
                <Megaphone className="w-5 h-5" aria-hidden="true" />
                {announcementUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {announcementUnread > 9 ? '9+' : announcementUnread}
                  </span>
                )}
              </Link>
              <Link
                to="/member/notifications"
                className={cn(
                  'relative p-2 rounded-lg transition-all',
                  unreadCount > 0
                    ? 'bg-saffron/10 text-saffron ring-2 ring-saffron/60 ring-offset-1 ring-offset-white'
                    : 'text-gray-700 active:bg-saffron/10',
                )}
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/member/chat"
                className="relative p-2 rounded-lg text-green-600 bg-green-500/10 hover:bg-green-500/15 transition-all"
                aria-label={chatUnread > 0 ? `Community chat, ${chatUnread} unread` : 'Community chat'}
                title="Community Chat"
              >
                <MessageCircle className="w-5 h-5" aria-hidden="true" />
                {chatUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {chatUnread > 9 ? '9+' : chatUnread}
                  </span>
                )}
              </Link>
              <Link to="/member/profile" className="p-1.5 rounded-lg" aria-label="My Profile">
                {profile?.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt="Profile" className="w-8 h-8 md:w-9 md:h-9 rounded-xl object-cover border border-orange-100" />
                ) : (
                  <div className={cn('w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs', getAvatarColor(fullName))}>
                    {getInitials(fullName)}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="layout-main flex-1 pb-[calc(env(safe-area-inset-bottom)+68px)] md:pb-8">
        <div key={location.pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>

      {/* Scheduled announcement popup */}
      <PopupNotice />

      {/* Mobile bottom nav — hidden on md+ (replaced by desktop header nav) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-orange-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Main navigation"
      >
        <div className="flex items-stretch">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = isTabActive(tab.path)
            const label = tab.path === '/home' ? t('nav.home') : tab.path === '/aarti' ? t('nav.aarti') : tab.path === '/programs' ? t('nav.programs') : tab.path === '/gallery' ? t('nav.gallery') : 'More'
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition-colors select-none',
                  active ? 'text-saffron' : 'text-gray-400 active:text-saffron',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span className={cn('p-1 rounded-xl transition-colors', active && 'bg-saffron/10')}>
                  <Icon className={cn('w-[22px] h-[22px]', active && 'stroke-[2.2]')} aria-hidden="true" />
                </span>
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}