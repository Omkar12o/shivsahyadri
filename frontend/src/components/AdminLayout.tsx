import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Home,
  Users,
  Music,
  CalendarDays,
  Handshake,
  Images,
  Video,
  Megaphone,
  Bell,
  Heart,
  Globe,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
  MessageSquare,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { useNotifications } from '@/contexts/NotificationContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn, getInitials, getAvatarColor } from '@/utils'

interface NavItem {
  path: string
  label: string
  icon: typeof LayoutDashboard
  match: string[]
}

interface NavGroup {
  group: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'MAIN',
    items: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, match: ['/admin/dashboard'] },
      { path: '/admin/home', label: 'Home Page', icon: Home, match: ['/admin/home'] },
    ],
  },
  {
    group: 'CONTENT',
    items: [
      { path: '/admin/members', label: 'Members', icon: Users, match: ['/admin/members'] },
      { path: '/admin/aartis', label: 'Aarti', icon: Music, match: ['/admin/aartis', '/admin/aarti'] },
      { path: '/admin/programs', label: 'Programs', icon: CalendarDays, match: ['/admin/programs'] },
      { path: '/admin/meetings', label: 'Meetings', icon: Handshake, match: ['/admin/meetings'] },
      { path: '/admin/gallery', label: 'Gallery', icon: Images, match: ['/admin/gallery'] },
      { path: '/admin/videos', label: 'Videos', icon: Video, match: ['/admin/videos'] },
      { path: '/admin/announcements', label: 'Announcements', icon: Megaphone, match: ['/admin/announcements'] },
      { path: '/admin/notifications', label: 'Notifications', icon: Bell, match: ['/admin/notifications'] },
      { path: '/admin/calendar', label: 'Calendar', icon: CalendarDays, match: ['/admin/calendar'] },
      { path: '/admin/chat', label: 'Community Chat', icon: MessageSquare, match: ['/admin/chat'] },
      { path: '/admin/festival', label: '2026 Festival', icon: Heart, match: ['/admin/festival'] },
    ],
  },
  {
    group: 'WEBSITE',
    items: [
      { path: '/admin/settings', label: 'Website Settings', icon: Globe, match: ['/admin/settings', '/admin/website'] },
      { path: '/admin/media', label: 'Media Library', icon: FolderOpen, match: ['/admin/media'] },
    ],
  },
  {
    group: 'SYSTEM',
    items: [{ path: '/admin/settings', label: 'Settings', icon: Settings, match: ['/admin/settings'] }],
  },
]

function SidebarContent({
  onClickLink,
}: {
  onClickLink?: () => void
}) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const nav = useNavigate()
  const { success: toastSuccess } = useToast()

  const handleLogout = async () => {
    try {
      await signOut()
    } finally {
      toastSuccess('✓ Logged out successfully')
      nav('/login', { replace: true })
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 h-16 px-4 border-b border-gray-200 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl gradient-saffron flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">श्री</span>
        </div>
        <div className="min-w-0">
          <p className="font-devanagari font-bold text-lg text-gray-900 leading-tight truncate">Shivsaydri Admin</p>
          <p className="text-[11px] text-gray-500 leading-tight">Ganesh Mandal · Umarkhanchan</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5 scrollbar-hide" aria-label="Admin navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.group}>
            <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{group.group}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = item.match.includes(location.pathname)
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={onClickLink}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-saffron text-white shadow-sm shadow-saffron/30'
                        : 'text-gray-600 hover:bg-saffron/10 hover:text-saffron',
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2">
          {profile?.profile_photo_url ? (
            <img src={profile.profile_photo_url} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div
              className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0', getAvatarColor(profile?.full_name ?? '?'))}
            >
              {getInitials(profile?.full_name ?? '?')}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{profile?.full_name}</p>
            <p className="text-xs text-gray-500 truncate">@{profile?.user_id}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </>
  )
}

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const { success: toastSuccess } = useToast()
  const { unreadCount } = useNotifications()
  const { lang, setLang } = useLanguage()
  const location = useLocation()
  const nav = useNavigate()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const currentLabel = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.match.includes(location.pathname))?.label ?? 'Admin'

  const handleLogout = async () => {
    try {
      await signOut()
    } finally {
      toastSuccess('✓ Logged out successfully')
      nav('/login', { replace: true })
    }
  }

  const closeAll = () => {
    setMobileSidebarOpen(false)
    setProfileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-[260px] bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 lg:translate-x-0',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent onClickLink={closeAll} />
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 lg:ml-[260px] flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="font-semibold text-gray-900 text-lg truncate">{currentLabel}</h1>
            </div>

            <div className="flex items-center gap-1.5 lg:gap-2">
              {/* Language toggle */}
              <div className="flex items-center rounded-xl bg-gray-100 p-1 text-xs font-semibold">
                <button
                  onClick={() => setLang('en')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg transition-colors',
                    lang === 'en' ? 'bg-saffron text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang('mr')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg transition-colors font-devanagari',
                    lang === 'mr' ? 'bg-saffron text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  मराठी
                </button>
              </div>

              {/* Notifications */}
              <Link
                to="/admin/notifications"
                onClick={() => setProfileMenuOpen(false)}
                className={cn(
                  'relative p-2 rounded-xl transition-colors',
                  unreadCount > 0 ? 'bg-saffron/10 text-saffron ring-2 ring-saffron/60 ring-offset-1 ring-offset-white' : 'text-gray-600 hover:bg-gray-100',
                )}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile menu */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen((o) => !o)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  aria-label="Profile menu"
                >
                  {profile?.profile_photo_url ? (
                    <img src={profile.profile_photo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div
                      className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold', getAvatarColor(profile?.full_name ?? '?'))}
                    >
                      {getInitials(profile?.full_name ?? '?')}
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" aria-hidden="true" />
                </button>

                {profileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} aria-hidden="true" />
                    <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 overflow-hidden animate-scale-in">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-medium text-gray-900 truncate">{profile?.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">@{profile?.user_id}</p>
                        <span className="badge bg-saffron/10 text-saffron mt-1.5">Admin</span>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/home"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={closeAll}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" aria-hidden="true" />
                          View Website
                        </Link>
                        <Link
                          to="/admin/settings"
                          onClick={closeAll}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-4 h-4" aria-hidden="true" />
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" aria-hidden="true" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}