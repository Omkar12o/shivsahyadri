import { supabase } from '@/lib/supabase'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Menu, X, Bell, User, LogOut, LayoutDashboard, Home, Users, Music, Calendar, Images, Video, Heart, MapPin, Settings, ChevronDown, Handshake, Download, MessageSquare } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/components/ToastProvider'
import InstallAppButton from '@/components/InstallAppButton'
import PopupNotice from '@/components/PopupNotice'
import { settingsService } from '@/services/settingsService'
import { cn, getInitials, getAvatarColor, formatRelativeTime } from '@/utils'
import { isAdminRole } from '@/types'

export default function Layout() {
  const { profile, signOut, isAdmin } = useAuth()
  const { success: toastSuccess } = useToast()
  const { unreadCount, markAsRead, markAllAsRead, notifications } = useNotifications()
  const { lang, setLang, t } = useLanguage()
  const location = useLocation()
  const nav = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>('/logo.jpeg')
  const [mandalName, setMandalName] = useState('Shivsaydri Ganesh Mandal')
  const [mandalInfo, setMandalInfo] = useState<{ address?: string | null; contact_phone?: string | null; contact_whatsapp?: string | null; contact_email?: string | null; village?: string | null; established_year?: number | null; social_media?: Record<string, string> } | null>(null)

  useEffect(() => {
    settingsService.getSiteSettings().then(s => setLogoUrl(s?.logo_url ?? '/logo.jpeg')).catch(() => {})
    settingsService.getMandalInfo().then(m => {
      if (m) {
        setMandalName(m.name)
        setMandalInfo(m)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const channel = supabase.channel('settings-live').on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
      settingsService.getSiteSettings().then(s => setLogoUrl(s?.logo_url ?? '/logo.jpeg'))
    }).on('postgres_changes', { event: '*', schema: 'public', table: 'mandal_info' }, () => {
      settingsService.getMandalInfo().then(m => {
        if (m) {
          setMandalName(m.name)
          setMandalInfo(m)
        }
      })
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const [previousPath, setPreviousPath] = useState(location.pathname)
  if (previousPath !== location.pathname) {
    setPreviousPath(location.pathname)
    setMobileMenuOpen(false)
  }

  const navItems = [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/members', label: t('nav.members'), icon: Users },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/aarti', label: t('nav.aarti'), icon: Music },
    { path: '/programs', label: t('nav.programs'), icon: Calendar },
    { path: '/meetings', label: t('nav.meetings'), icon: Handshake },
    { path: '/festival/2026', label: t('nav.festival2026'), icon: Heart },
    { path: '/gallery', label: t('nav.gallery'), icon: Images },
    { path: '/videos', label: t('nav.videos'), icon: Video },
    { path: '/donation', label: t('nav.donation'), icon: Heart },
    { path: '/contact', label: t('nav.contact'), icon: MapPin },
  ]

  const memberNavItems = [
    { path: '/member/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/gallery', label: t('nav.gallery'), icon: Images },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/member/chat', label: 'Chat', icon: MessageSquare },
    { path: '/aarti', label: t('nav.aarti'), icon: Music },
    { path: '/programs', label: t('nav.programs'), icon: Calendar },
    { path: '/meetings', label: t('nav.meetings'), icon: Handshake },
    { path: '/festival/2026', label: t('nav.festival2026'), icon: Heart },
    { path: '/member/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { path: '/member/profile', label: 'My Profile', icon: User },
  ]

  const handleLogout = async () => {
    try {
      await signOut()
    } finally {
      setUserMenuOpen(false)
      setMobileMenuOpen(false)
      toastSuccess('✓ Logged out successfully')
      nav('/')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream overflow-x-hidden">
      {/* Upper Scroller - Ganpati Mandir */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-saffron via-orange-600 to-red-600 text-white text-xs md:text-sm pt-[calc(env(safe-area-inset-top)+6px)] pb-1.5 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee flex items-center gap-8">
          <span className="flex items-center gap-2">🛕 <span className="font-bold">Ganpati Mandir</span> — Shivsaydri Ganesh Mandal, Umarkhanchan</span>
          <span className="opacity-80">•</span>
          <span>📍 Near Ganpati Mandap, Umarkhanchan, Maharashtra</span>
          <span className="opacity-80">•</span>
          <span>🙏 Daily Aarti — Morning 06:00 • Evening 19:30</span>
          <span className="opacity-80">•</span>
          <span>✨ 2026 Festival — Decoration & Live Finance</span>
          <span className="opacity-80">•</span>
          <span className="flex items-center gap-2">🛕 <span className="font-bold">Ganpati Mandir</span> — Shivsaydri Ganesh Mandal, Umarkhanchan</span>
          <span className="opacity-80">•</span>
          <span>📍 Near Ganpati Mandap, Umarkhanchan</span>
          <span className="opacity-80">•</span>
          <span>🙏 गणपती बाप्पा मोरया</span>
          <span className="opacity-80">•</span>
          <span>🛕 Ganpati Mandir — Umarkhanchan</span>
        </div>
      </div>
      <header className={cn(
        'fixed top-[calc(env(safe-area-inset-top)+28px)] left-0 right-0 z-50 transition-all duration-300 border-b border-orange-100',
        scrolled ? 'bg-white shadow-md' : 'bg-white shadow-sm'
      )}>
        <nav className="container-main px-4" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16 md:h-18">
            <Link to="/" className="flex items-center gap-2" aria-label="Shivsaydri Ganesh Mandal Home">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Mandal Logo"
                  className="w-11 h-11 rounded-xl object-contain bg-white border border-orange-100 p-1 shadow-sm"
                  loading="eager"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl gradient-saffron flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-lg">श्री</span>
                </div>
              )}
              <span className="font-devanagari font-bold text-base sm:text-lg md:text-xl text-gray-900 block sm:block whitespace-nowrap truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[200px] md:max-w-[260px]">
                {mandalName}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
              {profile ? memberNavItems.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap',
                        isActive
                          ? 'bg-saffron text-white shadow-lg shadow-saffron/30'
                          : 'text-gray-600 hover:bg-saffron/10 hover:text-saffron'
                      )}
                  >
                    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </Link>
                )
              }) : navItems.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap',
                        isActive
                          ? 'bg-saffron text-white shadow-lg shadow-saffron/30'
                          : 'text-gray-600 hover:bg-saffron/10 hover:text-saffron'
                      )}
                  >
                    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 transition-all duration-200 shadow-lg shadow-primary-700/30"
                >
                  <Settings className="w-5 h-5" aria-hidden="true" />
                  <span>Admin</span>
                </Link>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Language Toggle - Responsive: desktop pill, mobile inside menu */}
              <div className="hidden lg:flex items-center gap-1 bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setLang('en')}
                  className={cn('px-3 py-1 text-xs font-bold rounded-full transition-colors', lang === 'en' ? 'bg-white shadow text-saffron' : 'text-gray-600 hover:text-gray-900')}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang('mr')}
                  className={cn('px-3 py-1 text-xs font-bold rounded-full transition-colors', lang === 'mr' ? 'bg-white shadow text-saffron' : 'text-gray-600 hover:text-gray-900')}
                >
                  मराठी
                </button>
              </div>
              {/* Mobile language icon - visible only on mobile/tablet */}
              <div className="flex lg:hidden items-center gap-1 bg-gray-100 rounded-full p-1">
                <button onClick={() => setLang(lang === 'en' ? 'mr' : 'en')} className="px-2 py-1 text-xs font-bold rounded-full bg-white shadow text-saffron">
                  {lang === 'en' ? 'EN' : 'मराठी'}
                </button>
              </div>
              {/* ALWAYS VISIBLE Login/Logout */}
              {profile ? (
                <>
                  <span className="hidden lg:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                    ● {profile.user_id}
                  </span>
                  {/* Notification Bell */}
                  <div className="relative">
                    <button
                      onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                      className={cn(
                        'relative p-2 rounded-xl transition-all duration-200',
                        'text-gray-600 hover:bg-saffron/10 hover:text-saffron'
                      )}
                      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                      aria-expanded={notifDropdownOpen}
                    >
                      <Bell className="w-5 h-5" aria-hidden="true" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {notifDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-slide-down z-50">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                          <h3 className="font-semibold text-gray-900">Notifications</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-sm text-saffron hover:text-primary-700 font-medium"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" aria-hidden="true" />
                              <p>No notifications yet</p>
                            </div>
                          ) : (
                            notifications.slice(0, 10).map(notif => (
                              <button
                                key={notif.id}
                                onClick={() => markAsRead(notif.id)}
                                className={cn(
                                  'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0',
                                  !notif.is_read && 'bg-saffron/5'
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-saffron/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg">{NOTIFICATION_ICONS[notif.type]}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn('font-medium text-sm', !notif.is_read ? 'text-gray-900' : 'text-gray-700')}>
                                      {notif.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notif.created_at)}</p>
                                  </div>
                                  {!notif.is_read && (
                                    <div className="w-2 h-2 bg-saffron rounded-full mt-2 flex-shrink-0" aria-hidden="true" />
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                        {notifications.length > 10 && (
                          <Link
                            to="/member/notifications"
                            className="block px-4 py-3 text-center text-sm text-saffron hover:bg-gray-50 border-t border-gray-100 font-medium"
                          >
                            View all notifications
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-saffron/10 transition-colors"
                      aria-label="User menu"
                      aria-expanded={userMenuOpen}
                    >
                      {profile.profile_photo_url ? (
                        <img
                          src={profile.profile_photo_url}
                          alt=""
                          className="w-8 h-8 rounded-xl object-cover"
                        />
                      ) : (
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-white font-semibold', getAvatarColor(profile.full_name))}>
                          {getInitials(profile.full_name)}
                        </div>
                      )}
                      <ChevronDown className="w-4 h-4 text-gray-500" aria-hidden="true" />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scale-in z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-gray-900 truncate">{profile.full_name}</p>
                          <p className="text-sm text-gray-500 truncate">@{profile.user_id}</p>
                          <span className={cn('inline-block mt-1 px-2 py-0.5 text-xs rounded-full', isAdminRole(profile.role) ? 'bg-purple-100 text-purple-700' : 'bg-saffron/10 text-saffron')}>
                            {isAdminRole(profile.role) ? 'Admin' : 'Member'}
                          </span>
                        </div>
                        <Link
                          to="/member/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                          Dashboard
                        </Link>
                        <Link
                          to="/member/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4" aria-hidden="true" />
                          My Profile
                        </Link>
                        <Link
                          to="/member/notifications"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Bell className="w-4 h-4" aria-hidden="true" />
                          Notifications
                          {unreadCount > 0 && (
                            <span className="ml-auto px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                          >
                            <Settings className="w-4 h-4" aria-hidden="true" />
                            Admin Panel
                          </Link>
                        )}
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" aria-hidden="true" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <InstallAppButton variant="outline" className="px-3 py-1.5" />
                  <Link to="/login" className="inline-flex items-center justify-center px-5 py-2 rounded-xl text-sm font-bold bg-white text-saffron border-2 border-saffron hover:bg-saffron hover:text-white">
                    Login
                  </Link>
                  <Link to="/member/register" className="inline-flex items-center justify-center px-5 py-2 rounded-xl text-sm font-bold bg-saffron text-white border-2 border-saffron hover:bg-orange-700">
                    Register
                  </Link>
                </div>
              )}
              {/* Download App - compact icon button (mobile) */}
              <InstallAppButton variant="ghost" showLabel={false} className="sm:hidden px-2.5 py-2" />
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 animate-slide-down relative z-50 max-h-[calc(100dvh-env(safe-area-inset-top)-5rem)] overflow-y-auto overflow-x-hidden overscroll-contain">
            <div className="container-main px-4 py-4 space-y-2">
              {profile ? memberNavItems.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors',
                        isActive
                          ? 'bg-saffron text-white'
                          : 'text-gray-600 hover:bg-saffron/10 hover:text-saffron'
                      )}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </Link>
                )
              }) : navItems.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors',
                        isActive
                          ? 'bg-saffron text-white'
                          : 'text-gray-600 hover:bg-saffron/10 hover:text-saffron'
                      )}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-white bg-primary-700 hover:bg-primary-800 transition-colors"
                >
                  <Settings className="w-5 h-5" aria-hidden="true" />
                  <span>Admin Panel</span>
                </Link>
              )}
              {!profile && (
                <div className="pt-2 space-y-2 border-t border-gray-100">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-secondary w-full justify-center">
                    Login
                  </Link>
                  <Link to="/member/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary w-full justify-center">
                    Register
                  </Link>
                </div>
              )}
              {/* Download App button - always available in mobile menu */}
              <InstallAppButton variant="menu" className="py-3 text-base" />
              {/* Responsive Language Switcher inside mobile menu */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 mb-2 px-1">🌐 Language / भाषा</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setLang('en')} className={cn('px-4 py-3 rounded-xl text-sm font-bold border', lang==='en' ? 'bg-saffron text-white border-saffron' : 'bg-gray-100 text-gray-700 border-gray-200')}>English</button>
                  <button onClick={() => setLang('mr')} className={cn('px-4 py-3 rounded-xl text-sm font-bold border', lang==='mr' ? 'bg-saffron text-white border-saffron' : 'bg-gray-100 text-gray-700 border-gray-200')}>मराठी</button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">{lang==='en' ? 'Current: English' : 'सध्या: मराठी'}</p>
              </div>
              {profile && (
                <div className="pt-2 border-t border-gray-100">
                  <button onClick={() => { setMobileMenuOpen(false); handleLogout() }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-medium text-red-600 border border-red-200 hover:bg-red-50">
                    <LogOut className="w-5 h-5" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Backdrop for mobile menu */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </header>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top)+6rem)] md:pt-[calc(env(safe-area-inset-top)+6.5rem)] pb-24" id="main-content">
        <Outlet />
      </main>

      <PopupNotice />

      <footer className="bg-gray-900 text-gray-300">
        <div className="container-main px-4 py-12">
          {/* Install the app - prominent CTA */}
          <div className="mb-10 rounded-2xl bg-gradient-to-r from-saffron via-orange-600 to-red-600 p-6 md:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-lg md:text-xl font-bold flex items-center gap-2"><Download className="w-5 h-5" aria-hidden="true" /> Get the Shivsaydri App</p>
              <p className="text-sm text-white/90 mt-1">Install on your phone or desktop for one-tap access, instant updates & offline support.</p>
            </div>
            <InstallAppButton variant="outline" className="shrink-0 bg-white/10 border-white/30 text-white hover:bg-white hover:text-saffron" label="Download App Now" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="Mandal Logo" className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-gray-700" loading="lazy" />
                ) : (
                  <div className="w-10 h-10 rounded-xl gradient-saffron flex items-center justify-center">
                    <span className="text-white font-bold text-lg">श्री</span>
                  </div>
                )}
                <span className="font-devanagari font-bold text-xl text-white truncate">{mandalName}</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                {mandalInfo ? `${mandalInfo.village || 'Umarkhanchan'}'s beloved Ganesh Mandal serving the community${mandalInfo.established_year ? ` since ${mandalInfo.established_year}` : ''}.` : `Umarkhanchan's beloved Ganesh Mandal serving the community since 1995.`}
                {' '}गणपती बाप्पा मोरया 🙏
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/members" className="hover:text-saffron transition-colors">Members</Link></li>
                <li><Link to="/calendar" className="hover:text-saffron transition-colors">Calendar</Link></li>
                <li><Link to="/aarti" className="hover:text-saffron transition-colors">Aarti</Link></li>
                <li><Link to="/programs" className="hover:text-saffron transition-colors">Programs</Link></li>
                <li><Link to="/gallery" className="hover:text-saffron transition-colors">Gallery</Link></li>
                <li><Link to="/donation" className="hover:text-saffron transition-colors">Donation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" aria-hidden="true" /> {mandalInfo?.address || (mandalInfo?.village ? mandalInfo.village : 'Umarkhanchan, Maharashtra')}</li>
                <li className="flex items-center gap-2">📞 {mandalInfo?.contact_phone || '+91 98765 43210'}</li>
                <li className="flex items-center gap-2">📱 {mandalInfo?.contact_whatsapp || 'WhatsApp Available'}</li>
                <li className="flex items-center gap-2">✉️ {mandalInfo?.contact_email || 'mandal@shivsaydri.org'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <a href={mandalInfo?.social_media?.facebook || '#'} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-saffron transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href={mandalInfo?.social_media?.instagram || '#'} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-saffron transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href={mandalInfo?.social_media?.youtube || '#'} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-saffron transition-colors" aria-label="YouTube">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>© 2026 {mandalName}, {mandalInfo?.village || 'Umarkhanchan'}. All rights reserved. | Made with ❤️ in 2026</p>
            <p className="mt-1 font-devanagari">गणपती बाप्पा मोरया 🙏 • 2026 Ganpati Festival • Website made in 2026</p>
            <p className="mt-2 text-xs text-gray-600">Crafted in 2026 for {mandalName} • <Link to="/festival/2026" className="text-saffron hover:underline">View 2026 Ganpati Festival →</Link></p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const NOTIFICATION_ICONS: Record<string,string> = {
  birthday: '🎂',
  announcement: '📢',
  program: '📅',
  aarti: '🙏',
  system: '⚙️',
}