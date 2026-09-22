import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminStats, type AdminStats } from '@/services/statsService'
import { settingsService } from '@/services/settingsService'
import { galleryService } from '@/services/galleryService'
import { announcementService } from '@/services/announcementService'
import { useAuth } from '@/contexts/AuthContext'
import { StatCard } from '@/components/ui/display'
import { LoadingScreen } from '@/components/ui/feedback'
import { getRelativeTime, cn } from '@/utils'
import type { SiteSettings } from '@/types'
import {
  Users,
  Cake,
  Calendar,
  Music,
  Images,
  Video,
  Bell,
  Megaphone,
  Handshake,
  Heart,
  Plus,
  ArrowRight,
  Globe,
  Upload,
  Settings,
  Clock,
} from 'lucide-react'

interface ActivityItem {
  id: string
  kind: 'announcement' | 'gallery' | 'video'
  title: string
  subtitle: string
  image_url: string | null
  created_at: string
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  const [recentPhotos, setRecentPhotos] = useState<{ id: string; image_url: string; title: string }[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getAdminStats(profile?.id),
      settingsService.getSiteSettings().catch(() => null),
      galleryService.listRecent(3).catch(() => []),
      Promise.all([
        announcementService.list({ publishedOnly: true, limit: 5 }).catch(() => [] as { id: string; title: string; message: string; created_at: string }[]),
        galleryService.list({ publishedOnly: true, limit: 5 }).catch(() => [] as { id: string; image_url: string; title: string; created_at: string }[]),
      ]),
    ])
      .then(([statsResult, siteResult, photos, [announcements, gallery]]) => {
        if (cancelled) return
        setStats(statsResult)
        setSiteSettings(siteResult)
        setRecentPhotos(photos)
        const items: ActivityItem[] = [
          ...announcements.map((a) => ({
            id: `ann-${a.id}`,
            kind: 'announcement' as const,
            title: a.title,
            subtitle: 'New announcement',
            image_url: null,
            created_at: a.created_at,
          })),
          ...gallery.map((g) => ({
            id: `gal-${g.id}`,
            kind: 'gallery' as const,
            title: g.title,
            subtitle: 'New photo added to gallery',
            image_url: g.image_url,
            created_at: g.created_at,
          })),
        ]
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setActivity(items.slice(0, 6))
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [profile?.id])

  if (loading) return <LoadingScreen />

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Admin'
  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const contentCards = [
    { label: 'Members', value: stats?.totalMembers ?? 0, icon: Users, accent: 'bg-blue-100 text-blue-700', to: '/admin/members' },
    { label: 'Aartis', value: stats?.totalAartis ?? 0, icon: Music, accent: 'bg-purple-100 text-purple-700', to: '/admin/aartis' },
    { label: 'Programs', value: stats?.totalPrograms ?? 0, icon: Calendar, accent: 'bg-green-100 text-green-700', to: '/admin/programs' },
    { label: 'Meetings', value: stats?.totalMeetings ?? 0, icon: Handshake, accent: 'bg-amber-100 text-amber-700', to: '/admin/meetings' },
    { label: 'Announcements', value: stats?.totalAnnouncements ?? 0, icon: Megaphone, accent: 'bg-orange-100 text-orange-700', to: '/admin/announcements' },
    { label: 'Gallery', value: stats?.totalGalleryPhotos ?? 0, icon: Images, accent: 'bg-pink-100 text-pink-700', to: '/admin/gallery' },
    { label: 'Videos', value: stats?.totalVideos ?? 0, icon: Video, accent: 'bg-red-100 text-red-700', to: '/admin/videos' },
    { label: '2026 Festival', value: 'Live', icon: Heart, accent: 'bg-saffron/10 text-saffron', to: '/admin/festival' },
  ]

  const quickActions = [
    { label: 'Add Member', icon: Users, to: '/admin/members' },
    { label: 'Upload Photos', icon: Upload, to: '/admin/gallery' },
    { label: 'Add Program', icon: Calendar, to: '/admin/programs' },
    { label: 'Post Announcement', icon: Megaphone, to: '/admin/announcements' },
    { label: 'Add Video', icon: Video, to: '/admin/videos' },
    { label: 'Add Aarti', icon: Music, to: '/admin/aartis' },
  ]

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Namaste, {firstName}</h1>
          <p className="text-sm text-gray-500 mt-1">{todayLabel}</p>
        </div>
        <Link
          to="/home"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm"
        >
          <Globe className="w-4 h-4 mr-1.5" aria-hidden="true" />
          View Website
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              to={action.to}
              className="card p-4 flex flex-col items-start gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <span className="p-2.5 rounded-xl bg-saffron/10 text-saffron">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-gray-800">{action.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Members" value={stats?.totalMembers ?? 0} icon={<Users className="w-6 h-6" />} hint={`${stats?.activeMembers} active`} />
        <StatCard label="Today's Birthdays" value={stats?.todayBirthdays ?? 0} icon={<Cake className="w-6 h-6" />} accent="amber" />
        <StatCard label="Today's Programs" value={stats?.todayPrograms ?? 0} icon={<Calendar className="w-6 h-6" />} accent="blue" />
        <StatCard label="Upcoming Events" value={stats?.upcomingPrograms ?? 0} icon={<Calendar className="w-6 h-6" />} accent="green" />
        <StatCard label="Aartis" value={stats?.totalAartis ?? 0} icon={<Music className="w-6 h-6" />} accent="purple" />
        <StatCard label="Gallery Photos" value={stats?.totalGalleryPhotos ?? 0} icon={<Images className="w-6 h-6" />} />
        <StatCard label="Videos" value={stats?.totalVideos ?? 0} icon={<Video className="w-6 h-6" />} accent="red" />
        <StatCard label="Unread Notes" value={stats?.unreadNotifications ?? 0} icon={<Bell className="w-6 h-6" />} />
      </div>

      {/* Website management */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-gray-900">Website Management</h2>
            <p className="text-xs text-gray-500">Update your website images and settings in one place.</p>
          </div>
          <Link to="/admin/settings" className="btn-outline text-sm">
            <Settings className="w-4 h-4 mr-1.5" aria-hidden="true" />
            Manage Website Settings
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {siteSettings?.logo_url ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <img src={siteSettings.logo_url} alt="Logo" className="w-12 h-12 rounded-xl object-contain bg-white border" />
              <div>
                <p className="text-sm font-medium text-gray-800">Logo uploaded</p>
                <p className="text-xs text-gray-500">Update in Website Settings</p>
              </div>
            </div>
          ) : (
            <Link
              to="/admin/settings"
              className="flex items-center gap-3 p-3 rounded-xl bg-saffron/5 border border-dashed border-saffron/40 hover:bg-saffron/10 transition-colors"
            >
              <span className="w-12 h-12 rounded-xl bg-saffron/10 text-saffron flex items-center justify-center">
                <Upload className="w-6 h-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-saffron">Upload Logo</p>
                <p className="text-xs text-gray-500">Add your mandal logo</p>
              </div>
            </Link>
          )}
          {siteSettings?.ganpati_image_url ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <img src={siteSettings.ganpati_image_url} alt="Ganpati" className="w-12 h-12 rounded-xl object-cover bg-white border" />
              <div>
                <p className="text-sm font-medium text-gray-800">Ganpati image uploaded</p>
                <p className="text-xs text-gray-500">Update in Website Settings</p>
              </div>
            </div>
          ) : (
            <Link
              to="/admin/settings"
              className="flex items-center gap-3 p-3 rounded-xl bg-saffron/5 border border-dashed border-saffron/40 hover:bg-saffron/10 transition-colors"
            >
              <span className="w-12 h-12 rounded-xl bg-saffron/10 text-saffron flex items-center justify-center">
                <Upload className="w-6 h-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-saffron">Upload Ganpati Image</p>
                <p className="text-xs text-gray-500">Set the hero Ganpati image</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Content management */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Content Management</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {contentCards.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.label} to={card.to} className="card p-4 flex items-start justify-between gap-2 hover:shadow-lg transition-shadow">
                <div>
                  <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.accent)}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <p className="mt-2.5 text-sm font-medium text-gray-800">{card.label}</p>
                  <p className="text-lg font-bold text-gray-900">{card.value}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 mt-1" aria-hidden="true" />
              </Link>
            )
          })}
        </div>
      </div>

      {/* Gallery + Website status + Recent activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Gallery card */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Gallery</h2>
            <Link to="/admin/gallery" className="text-xs font-medium text-saffron hover:underline">
              View Gallery
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {recentPhotos.map((photo) => (
              <Link key={photo.id} to="/admin/gallery" className="group relative">
                <img src={photo.image_url} alt={photo.title} className="h-20 w-full object-cover rounded-xl border hover:opacity-80 transition-opacity" />
              </Link>
            ))}
          </div>
          {recentPhotos.length === 0 && (
            <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center">
              <p className="text-sm text-gray-500">No photos yet.</p>
              <Link to="/admin/gallery" className="inline-flex items-center gap-1 text-xs font-semibold text-saffron mt-1.5">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Upload first photo
              </Link>
            </div>
          )}
        </div>

        {/* Website settings status */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900">Website Settings</h2>
          <div className="space-y-2.5 mt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Logo</span>
              <span className={cn('badge', siteSettings?.logo_url ? 'badge-success' : 'badge-warning')}>
                {siteSettings?.logo_url ? 'Uploaded' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Ganpati Image</span>
              <span className={cn('badge', siteSettings?.ganpati_image_url ? 'badge-success' : 'badge-warning')}>
                {siteSettings?.ganpati_image_url ? 'Uploaded' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Countdown</span>
              <span className={cn('badge', siteSettings?.countdown_target ? 'badge-success' : 'badge-warning')}>
                {siteSettings?.countdown_target ? 'Set' : 'Not set'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Birthday Title</span>
              <span className={cn('badge', siteSettings?.birthday_title ? 'badge-success' : 'badge-warning')}>
                {siteSettings?.birthday_title ? 'Set' : 'Not set'}
              </span>
            </div>
          </div>
          <Link to="/admin/settings" className="btn-outline text-sm mt-5">
            Open Website Settings
          </Link>
        </div>

        {/* Recent activity */}
        <div className="card p-5 lg:col-span-1">
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          {activity.length === 0 ? (
            <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center">
              <p className="text-sm text-gray-500">No recent activity.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {activity.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-9 h-9 rounded-lg object-cover border flex-shrink-0" />
                  ) : (
                    <span className="w-9 h-9 rounded-lg bg-saffron/10 text-saffron flex items-center justify-center flex-shrink-0">
                      <Megaphone className="w-4 h-4" aria-hidden="true" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {getRelativeTime(item.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}