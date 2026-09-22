import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  Video,
  Megaphone,
  Heart,
  MapPin,
  Info,
  ChevronRight,
  LogOut,
  Settings,
  Download,
  Languages,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/components/ToastProvider'
import { cn, getInitials, getAvatarColor } from '@/utils'
import { settingsService } from '@/services/settingsService'
import { useEffect, useState } from 'react'
import type { DonationInfo, MandalInfo, SiteSettings } from '@/types'

interface Row {
  label: string
  to?: string
  icon: React.ReactNode
  badge?: number
  onClick?: () => void
  danger?: boolean
}

export default function More() {
  const { profile, isAdmin, signOut } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const { unreadCount } = useNotifications()
  const { lang, setLang, t } = useLanguage()
  const nav = useNavigate()
  const [site, setSite] = useState<SiteSettings | null>(null)
  const [mandal, setMandal] = useState<MandalInfo | null>(null)
  const [donation, setDonation] = useState<DonationInfo | null>(null)

  useEffect(() => {
    settingsService.getSiteSettings().then(setSite).catch(() => {})
    settingsService.getMandalInfo().then(setMandal).catch(() => {})
    settingsService.getDonationInfo().then(setDonation).catch(() => {})
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      toastSuccess('✓ Logged out successfully')
      nav('/login', { replace: true })
    } catch {
      toastError('✕ Could not log out right now. Please try again.')
    }
  }

  const rows: Row[] = [
    { label: t('nav.members'), to: '/members', icon: <Users className="w-5 h-5" aria-hidden="true" /> },
    { label: t('nav.videos'), to: '/videos', icon: <Video className="w-5 h-5" aria-hidden="true" /> },
    { label: 'Announcements', to: '/member/notifications', icon: <Megaphone className="w-5 h-5" aria-hidden="true" />, badge: unreadCount },
  ]
  if (donation) {
    rows.push({ label: t('nav.donation'), to: '/donation', icon: <Heart className="w-5 h-5" aria-hidden="true" /> })
  }
  rows.push({ label: t('nav.contact'), to: '/contact', icon: <MapPin className="w-5 h-5" aria-hidden="true" /> })
  if (mandal?.established_year) {
    rows.push({ label: 'About Mandal', to: '/more', icon: <Info className="w-5 h-5" aria-hidden="true" />, onClick: () => document.getElementById('abo-mandal')?.scrollIntoView({ behavior: 'smooth' }) })
  }

  const fullName = profile?.full_name ?? 'Member'
  const village = profile?.village ?? mandal?.village ?? ''

  return (
    <div className="max-w-md mx-auto px-4 py-4 pb-8">
      {/* Profile card */}
      <Link to="/member/profile" className="block">
        <div className="card p-4 flex items-center gap-3 active:scale-[0.99] transition-transform">
          {profile?.profile_photo_url ? (
            <img src={profile.profile_photo_url} alt="Profile" className="w-14 h-14 rounded-2xl object-cover border border-orange-100" />
          ) : (
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg', getAvatarColor(fullName))}>
              {getInitials(fullName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 truncate">{fullName}</p>
            {profile?.user_id && <p className="text-sm text-gray-500 truncate">@{profile.user_id}</p>}
            {village && <p className="text-xs text-gray-400">{village}</p>}
          </div>
          <div className="flex items-center gap-1 text-saffron">
            <span className="text-xs font-semibold">View</span>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
      </Link>

      {/* Menu rows */}
      <div className="card mt-4 divide-y divide-gray-100 overflow-hidden">
        {rows.map((row, i) => (
          <Link
            key={row.label}
            to={row.to ?? '#'}
            onClick={row.onClick}
            className="flex items-center gap-3 px-4 py-3.5 text-gray-800 active:bg-saffron/5 transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-saffron/10 text-saffron flex items-center justify-center shrink-0">
              {row.icon}
            </span>
            <span className="flex-1 text-sm font-semibold">{row.label}</span>
            {row.badge != null && row.badge > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                {row.badge > 9 ? '9+' : row.badge}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
          </Link>
        ))}

        {isAdmin && (
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3.5 text-gray-800 active:bg-saffron/5 transition-colors">
            <span className="w-8 h-8 rounded-lg bg-primary-700/10 text-primary-700 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="flex-1 text-sm font-semibold">Admin Panel</span>
            <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
          </Link>
        )}

        <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 text-red-600 active:bg-red-50 transition-colors text-left">
          <span className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="flex-1 text-sm font-semibold">{t('nav.logout')}</span>
        </button>
      </div>

      {/* Language + install */}
      <div className="card mt-4 divide-y divide-gray-100 overflow-hidden">
        <button
          type="button"
          onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-gray-800 active:bg-saffron/5 transition-colors text-left"
        >
          <span className="w-8 h-8 rounded-lg bg-saffron/10 text-saffron flex items-center justify-center shrink-0">
            <Languages className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="flex-1 text-sm font-semibold">
            {t('lang.switchTo')} {lang === 'en' ? t('lang.marathi') : t('lang.english')}
          </span>
          <span className="text-xs font-bold text-saffron bg-saffron/10 rounded-lg px-2 py-1">{lang === 'en' ? 'EN' : 'मराठी'}</span>
        </button>
        <Link to="/home" className="flex items-center gap-3 px-4 py-3.5 text-gray-800 active:bg-saffron/5 transition-colors">
          <span className="w-8 h-8 rounded-lg bg-saffron/10 text-saffron flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="flex-1 text-sm font-semibold">Install App</span>
          <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
        </Link>
      </div>

      {/* About Mandal */}
      {mandal?.established_year && (
        <div id="abo-mandal" className="card mt-4 p-5 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-saffron flex items-center justify-center text-white font-devanagari font-bold text-xl">श्री</div>
          <h2 className="mt-3 font-bold text-gray-900">{mandal.name}</h2>
          {mandal.village && <p className="text-sm text-gray-500 mt-0.5">{mandal.village}</p>}
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            {site?.about_description ?? 'Shivsaydri Ganesh Mandal is dedicated to celebrating Ganeshotsav with devotion, unity and community service.'}
          </p>
          {mandal.established_year && (
            <p className="text-xs text-gray-400 mt-2">Established {mandal.established_year}</p>
          )}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 pt-6">Shivsaydri Ganesh Mandal • Private Members App</p>
    </div>
  )
}