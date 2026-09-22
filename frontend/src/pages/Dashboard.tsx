import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { Link } from 'react-router-dom'
import { User, Calendar, Music, Bell, Heart, Images, MessageSquare, ChevronRight, Clock, Download, Users, Video, Megaphone, MapPin, Home } from 'lucide-react'
import InstallAppButton from '@/components/InstallAppButton'
import PushNotificationPanel from '@/components/PushNotificationPanel'
import { calendarEventService, type CalendarItem } from '@/services/calendarEventService'
import { galleryService } from '@/services/galleryService'
import { formatKolkataDate, formatKolkataTime } from '@/utils/calendar'
import type { GalleryImage } from '@/types'
import heroImage from '@/assets/hero.png'

export default function Dashboard() {
  const { profile, refreshProfile } = useAuth()
  const { notifications, unreadCount } = useNotifications()
  const [todayItems, setTodayItems] = useState<CalendarItem[]>([])
  const [upcomingItems, setUpcomingItems] = useState<CalendarItem[]>([])
  const [photos, setPhotos] = useState<GalleryImage[]>([])

  useEffect(() => {
    const ch = supabase.channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => refreshProfile().catch(() => {}))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => refreshProfile().catch(() => {}))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [refreshProfile])

  useEffect(() => {
    calendarEventService.getTodayItems().then(setTodayItems).catch(() => setTodayItems([]))
    calendarEventService.getUpcomingItems().then(setUpcomingItems).catch(() => setUpcomingItems([]))
    galleryService.listRecent(8).then(setPhotos).catch(() => setPhotos([]))
    const gal = supabase.channel('dashboard-gallery')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, () => {
        galleryService.listRecent(8).then(setPhotos).catch(() => {})
      })
      .subscribe()
    return () => { supabase.removeChannel(gal) }
  }, [])

  const recentTitle = useMemo(() => notifications[0]?.title ?? 'No notifications yet', [notifications])

  const startTime = (s: string) => new Date(s).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' })

  return (
    <div className="container-main px-4 py-10">
      {/* Greeting hero with Mandal logo + Ganpati image */}
      <div className="card overflow-hidden">
        <div className="relative">
          <img src={heroImage} alt="Ganpati Bappa" className="w-full h-36 md:h-44 object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          <div className="absolute bottom-4 left-0 right-0 px-5 flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="Mandal Logo"
              className="w-12 h-12 rounded-2xl bg-white object-contain p-1 border border-white/40 shadow-lg"
              loading="eager"
            />
            <div className="min-w-0 text-white">
              <p className="font-devanagari font-bold text-lg md:text-xl truncate">Shivsaydri Ganesh Mandal</p>
              <p className="text-xs text-white/80 truncate">Umarkhanchan • गणपती बाप्पा मोरया 🙏</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mt-4">
        <div>
          <h1 className="page-title">🙏 Welcome, {profile?.full_name}</h1>
          <p className="page-subtitle">@{profile?.user_id} • {profile?.village ?? 'Umarkhanchan'} • {profile?.role}</p>
        </div>
        <div className="flex items-center gap-2">
          <PushNotificationPanel />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Notifications</p>
          <p className="text-3xl font-bold">{unreadCount}<span className="text-sm text-gray-400 ml-1">new</span></p>
          <Link to="/member/notifications" className="text-xs text-saffron font-medium mt-1 inline-flex items-center gap-0.5">View <ChevronRight className="w-3 h-3" /></Link>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Today's Events</p>
          <p className="text-3xl font-bold">{todayItems.length}</p>
          <Link to="/calendar" className="text-xs text-saffron font-medium mt-1 inline-flex items-center gap-0.5">Calendar <ChevronRight className="w-3 h-3" /></Link>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Birthday Visible</p>
          <p className="text-lg font-bold mt-1">{profile?.birthday_visibility ? 'Yes 🎂' : 'Hidden'}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Recent</p>
          <p className="text-sm font-medium mt-1 truncate">{recentTitle}</p>
        </div>
      </div>

      {/* Today + Upcoming events */}
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-saffron" /> Today — {formatKolkataDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <Link to="/calendar" className="text-xs text-saffron font-semibold">View all →</Link>
          </div>
          <div className="mt-3 space-y-2">
            {todayItems.length === 0 ? <p className="text-sm text-gray-400">No events today. Enjoy your day! 🕊️</p> :
              todayItems.map(i => (
                <div key={i.id} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-saffron font-bold">{startTime(i.start_datetime)}</span>
                  <span className="text-gray-700 font-medium truncate">{i.title}</span>
                  <span className="ml-auto text-xs text-gray-400 capitalize shrink-0 px-2 py-0.5 bg-gray-100 rounded-full">{i.event_type}</span>
                </div>
              ))
            }
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="font-bold flex items-center gap-2"><Calendar className="w-4 h-4 text-saffron" /> Upcoming</p>
            <Link to="/calendar" className="text-xs text-saffron font-semibold">Calendar →</Link>
          </div>
          <div className="mt-3 space-y-2">
            {upcomingItems.length === 0 ? <p className="text-sm text-gray-400">No upcoming events.</p> :
              upcomingItems.slice(0, 4).map(i => (
                <div key={i.id} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-saffron font-bold">{formatKolkataDate(i.start_datetime, { day: 'numeric', month: 'short' })}</span>
                  <span className="text-gray-700 font-medium truncate">{i.title}</span>
                  <span className="ml-auto text-xs text-gray-400 capitalize shrink-0 px-2 py-0.5 bg-gray-100 rounded-full">{i.event_type}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Link to="/home" className="card p-6 hover:shadow-lg flex flex-col items-center gap-2 text-center"><Home className="w-8 h-8 text-saffron" />Home</Link>
        <Link to="/aarti" className="card p-6 hover:shadow-lg flex flex-col items-center gap-2 text-center"><Music className="w-8 h-8 text-saffron" />Aarti</Link>
        <Link to="/programs" className="card p-6 hover:shadow-lg flex flex-col items-center gap-2 text-center"><Calendar className="w-8 h-8 text-saffron" />Programs</Link>
        <Link to="/gallery" className="card p-6 hover:shadow-lg flex flex-col items-center gap-2 text-center"><Images className="w-8 h-8 text-saffron" />Gallery</Link>
        <Link to="/members" className="card p-6 hover:shadow-lg flex flex-col items-center gap-2 text-center"><Users className="w-8 h-8 text-saffron" />Members</Link>
        <Link to="/videos" className="card p-6 hover:shadow-lg flex flex-col items-center gap-2 text-center"><Video className="w-8 h-8 text-saffron" />Videos</Link>
        <Link to="/home#announcements" className="card p-6 hover:shadow-lg flex flex-col items-center gap-2 text-center"><Megaphone className="w-8 h-8 text-saffron" />Announcements</Link>
        <Link to="/donation" className="card p-6 hover:shadow-lg flex flex-col items-center gap-2 text-center"><Heart className="w-8 h-8 text-saffron" />Donation</Link>
        <Link to="/contact" className="card p-6 hover:shadow-lg flex flex-col items-center gap-2 text-center"><MapPin className="w-8 h-8 text-saffron" />Contact</Link>
        <Link to="/member/chat" className="card p-6 hover:shadow-lg flex flex-col items-center gap-2 text-center"><MessageSquare className="w-8 h-8 text-saffron" />Community Chat</Link>
        <Link to="/member/notifications" className="card p-6 hover:shadow-lg flex flex-col items-center gap-2 text-center"><Bell className="w-8 h-8 text-saffron" />Notifications ({unreadCount})</Link>
        <Link to="/member/profile" className="card p-6 hover:shadow-lg flex flex-col items-center gap-2 text-center"><User className="w-8 h-8 text-saffron" />My Profile</Link>
      </div>

      {/* Gallery section — recent published photos */}
      {photos.length > 0 && (
        <div className="card mt-8 p-5">
          <div className="flex items-center justify-between">
            <p className="font-bold flex items-center gap-2"><Images className="w-4 h-4 text-saffron" /> Latest Memories</p>
            <Link to="/gallery" className="text-xs text-saffron font-semibold">View Gallery →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {photos.map(g => (
              <Link to="/gallery" key={g.id} className="group block overflow-hidden rounded-2xl">
                <img src={g.image_url} alt={g.title || 'Gallery photo'} className="h-28 md:h-36 w-full object-cover group-hover:scale-105 group-hover:opacity-90 transition-all duration-300" loading="lazy" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="card mt-8 p-5 md:p-6 bg-gradient-to-r from-saffron/10 to-primary-100/60 border-saffron/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-saffron flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Install the App</p>
              <p className="text-sm text-gray-500">One-tap access from your home screen — works offline too.</p>
            </div>
          </div>
          <InstallAppButton variant="solid" className="shrink-0 px-5" />
        </div>
      </div>
    </div>
  )
}