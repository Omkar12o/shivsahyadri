import { supabase } from '@/lib/supabase'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Bell, Home, Music, Calendar, Images, MoreHorizontal } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/components/ToastProvider'
import PopupNotice from '@/components/PopupNotice'
import { settingsService } from '@/services/settingsService'
import { cn, getInitials, getAvatarColor } from '@/utils'

const TABS = [
  { path: '/home', icon: Home },
  { path: '/aarti', icon: Music },
  { path: '/programs', icon: Calendar },
  { path: '/gallery', icon: Images },
  { path: '/more', icon: MoreHorizontal },
]

export default function Layout() {
  const { profile, signOut } = useAuth()
  const { success: toastSuccess } = useToast()
  const { unreadCount } = useNotifications()
  const { t } = useLanguage()
  const location = useLocation()
  const nav = useNavigate()
  const [logoUrl, setLogoUrl] = useState<string | null>('/logo.jpeg')
  const [mandalName, setMandalName] = useState('Shivsaydri Ganesh Mandal')

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
    <div className="min-h-screen flex flex-col bg-cream overflow-x-hidden">
      {/* Top app bar */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-orange-100 shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/home" className="flex items-center gap-2 min-w-0" aria-label="Go to Home">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="w-9 h-9 rounded-xl object-contain bg-white border border-orange-100 p-0.5 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-saffron flex items-center justify-center shrink-0">
                <span className="text-white font-devanagari font-bold">श्री</span>
              </div>
            )}
            <span className="font-bold text-sm sm:text-base text-gray-900 truncate">{mandalName}</span>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            <Link
              to="/member/notifications"
              className="relative p-2 rounded-lg text-gray-700 active:bg-saffron/10"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link to="/member/profile" className="p-1.5 rounded-lg" aria-label="My Profile">
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt="Profile"
                  className="w-8 h-8 rounded-xl object-cover border border-orange-100"
                />
              ) : (
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs', getAvatarColor(fullName))}>
                  {getInitials(fullName)}
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pt-[calc(env(safe-area-inset-top)+56px)] pb-[calc(env(safe-area-inset-bottom)+68px)]">
        <div key={location.pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>

      {/* Scheduled announcement popup */}
      <PopupNotice />

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-orange-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Main navigation"
      >
        <div className="flex items-stretch max-w-md mx-auto">
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