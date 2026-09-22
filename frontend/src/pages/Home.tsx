import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Music,
  Megaphone,
  Images,
  Clock,
  MapPin,
  Heart,
  Play,
  ChevronRight,
  Sparkles,
  Handshake,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { aartiService } from '@/services/aartiService'
import { programService } from '@/services/programService'
import { announcementService } from '@/services/announcementService'
import { galleryService } from '@/services/galleryService'
import { settingsService } from '@/services/settingsService'
import { QuickActionIcon } from '@/components/ui/display'
import { LoadingScreen } from '@/components/ui/feedback'
import { formatDate, formatTime } from '@/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import type {
  Aarti,
  Program,
  Announcement,
  GalleryImage,
  SiteSettings,
  DonationInfo,
  MandalInfo,
  QuickAction,
} from '@/types'

const DEFAULT_QUICK_ACTIONS: { destination: string; label: string; icon: string }[] = [
  { destination: '/aarti', label: 'Aarti', icon: 'aarti' },
  { destination: '/programs', label: 'Programs', icon: 'programs' },
  { destination: '/gallery', label: 'Gallery', icon: 'gallery' },
  { destination: '/donation', label: 'Donation', icon: 'donation' },
]

export default function Home() {
  const { t } = useLanguage()
  const [aartis, setAartis] = useState<Aarti[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [upcomingFallback, setUpcomingFallback] = useState<Program[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [site, setSite] = useState<SiteSettings | null>(null)
  const [donation, setDonation] = useState<DonationInfo | null>(null)
  const [mandal, setMandal] = useState<MandalInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const [a, p, an, g, s, d, m] = await Promise.all([
          aartiService.listToday().catch(() => []),
          programService.listToday().catch(() => []),
          announcementService.list({ limit: 3 }).catch(() => []),
          galleryService.list({ limit: 8 }).catch(() => []),
          settingsService.getSiteSettings().catch(() => null),
          settingsService.getDonationInfo().catch(() => null),
          settingsService.getMandalInfo().catch(() => null),
        ])
        if (!alive) return
        setAartis(a)
        setPrograms(p)
        // When nothing is scheduled today, fall back to upcoming programs so the
        // section stays dynamic instead of showing a static empty state.
        if (p.length === 0) {
          const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
          const upcoming = await programService
            .list()
            .then(list => list.filter(x => x.event_date >= todayKey).slice(0, 3))
            .catch(() => [])
          if (alive) setUpcomingFallback(upcoming)
        } else {
          setUpcomingFallback([])
        }
        setAnnouncements(an)
        setGallery(g)
        setSite(s)
        setDonation(d)
        setMandal(m)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    const ch = supabase.channel('home-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aartis' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'programs' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_info' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mandal_info' }, load)
      .subscribe()
    return () => { alive = false; supabase.removeChannel(ch) }
  }, [])

  if (loading) return <LoadingScreen label="Loading Mandal..." />

  const displayPrograms = programs.length ? programs : upcomingFallback
  const showingUpcomingOnly = programs.length === 0 && upcomingFallback.length > 0
  const importantNotice = announcements.find(x => x.priority === 'urgent' || x.priority === 'high') ?? announcements[0]

  const dbQuickActions = (site?.quick_actions ?? []).filter((q: QuickAction) => q.enabled).sort((a, b) => a.order - b.order)
  const quickActions = dbQuickActions.length
    ? dbQuickActions.map(q => ({ destination: q.destination, label: q.label, icon: q.icon }))
    : DEFAULT_QUICK_ACTIONS

  const galleryPreviewCount = site?.gallery_preview_count ?? 6
  const galleryPreview = gallery.slice(0, galleryPreviewCount)

  const mandalName = mandal?.name ?? 'Shivsaydri Ganesh Mandal'
  const mandalVillage = mandal?.village ? `, ${mandal.village}` : ''

  const showDonation = donation && site?.donation_show !== false
  const heroImage = site?.ganpati_image_url
  const heroText = site?.hero_welcome ?? 'Ganpati Bappa Morya 🙏'

  return (
    <div className="max-w-md mx-auto px-4 pb-8">
      {/* Greeting */}
      <section className="pt-4">
        <p className="text-xs font-bold text-saffron uppercase tracking-wide">Namaskar 🙏</p>
        <h1 className="text-lg font-bold text-gray-900 mt-0.5">Welcome to {mandalName}</h1>
        <p className="text-xs text-gray-500 mt-0.5">{todayStr}</p>
      </section>

      {/* Hero card */}
      <section className="pt-4">
        <div className="relative rounded-2xl overflow-hidden min-h-[150px] flex flex-col justify-end bg-gradient-to-br from-saffron via-orange-600 to-red-600 shadow-lg shadow-saffron/20">
          {heroImage && (
            <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          )}
          <div className="relative z-10 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-4 pt-14 pb-3">
            <p className="font-devanagari font-extrabold text-white text-xl leading-tight drop-shadow">{heroText}</p>
            <p className="text-xs text-white/85 mt-0.5">Shivsaydri Ganesh Mandal{mandalVillage}</p>
            <Link
              to="/aarti"
              className="mt-2 inline-flex items-center gap-1.5 bg-white text-saffron text-xs font-bold px-3.5 py-1.5 rounded-full active:scale-95 transition-transform"
            >
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> View Aarti
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-saffron" aria-hidden="true" /> Quick Access</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {quickActions.map((qa) => (
            <Link
              key={qa.destination + qa.label}
              to={qa.destination}
              className="card p-3.5 flex items-center gap-3 active:scale-[0.97] transition-transform"
            >
              <span className="w-10 h-10 rounded-xl bg-saffron/10 text-saffron flex items-center justify-center shrink-0">
                <QuickActionIcon name={qa.icon} className="w-5 h-5" />
              </span>
              <span className="text-sm font-semibold text-gray-800">{qa.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Today's Aarti */}
      <section className="pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">{t('home.aartiTitle')}</h2>
          {aartis.length > 2 && (
            <Link to="/aarti" className="text-xs font-semibold text-saffron inline-flex items-center gap-0.5">
              {t('home.viewAll')} <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
        {aartis.length ? (
          <div className="mt-3 space-y-2.5">
            {aartis.slice(0, 3).map((aarti) => (
              <Link key={aarti.id} to={`/aarti/${aarti.id}`} className="card p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform">
                <span className="w-11 h-11 rounded-xl bg-saffron/10 text-saffron flex items-center justify-center shrink-0">
                  <Music className="w-5 h-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{aarti.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {aarti.category}
                    {aarti.time && <> • {formatTime(aarti.time)}</>}
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-saffron">
                  <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> Listen
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card mt-3 p-4 text-center text-sm text-gray-500">No Aarti scheduled today. Check back soon.</div>
        )}
      </section>

      {/* Today's Program */}
      <section className="pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">{t('home.programsTitle')}</h2>
          <Link to="/programs" className="text-xs font-semibold text-saffron inline-flex items-center gap-0.5">
            {t('home.viewAll')} <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
        {displayPrograms.length ? (
          <div className="mt-3 space-y-2.5">
            {displayPrograms.slice(0, 2).map((prog) => (
              <Link key={prog.id} to={`/programs/${prog.id}`} className="card p-4 active:scale-[0.98] transition-transform">
                <div className="flex items-start gap-3">
                  <span className="w-11 h-11 rounded-xl bg-saffron/10 text-saffron flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{prog.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {showingUpcomingOnly ? formatDate(prog.event_date) : 'Today'}
                      {prog.start_time && <> • {formatTime(prog.start_time)}</>}
                    </p>
                    {prog.location && (
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" aria-hidden="true" /> {prog.location}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card mt-3 p-4 text-center text-sm text-gray-500">No programs scheduled yet.</div>
        )}
      </section>

      {/* Latest Announcement */}
      <section className="pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Latest Announcement</h2>
          <Link to="/member/notifications" className="text-xs font-semibold text-saffron inline-flex items-center gap-0.5">
            View All <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
        {importantNotice ? (
          <Link to="/member/notifications" className="card mt-3 p-4 border-l-4 border-saffron active:scale-[0.98] transition-transform">
            <p className="font-semibold text-gray-900 flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-saffron shrink-0" aria-hidden="true" /> {importantNotice.title}
            </p>
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-line line-clamp-2">{importantNotice.message}</p>
            <p className="text-xs text-saffron font-semibold mt-1.5">Read more →</p>
          </Link>
        ) : (
          <div className="card mt-3 p-4 text-center text-sm text-gray-500">No announcements right now.</div>
        )}
      </section>

      {/* Latest Photos */}
      <section className="pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">{t('home.gallery')}</h2>
          <Link to="/gallery" className="text-xs font-semibold text-saffron inline-flex items-center gap-0.5">
            {t('home.viewAll')} <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
        {galleryPreview.length ? (
          <Link to="/gallery" className="mt-3 block rounded-2xl overflow-hidden border border-orange-100">
            <div className="grid grid-cols-3 gap-0.5">
              {galleryPreview.slice(0, 6).map((img, i) => (
                <div key={img.id} className="relative aspect-square overflow-hidden">
                  <img src={img.image_url} alt={img.title || ''} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
            <div className="bg-white px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 inline-flex items-center gap-1.5">
                <Images className="w-4 h-4 text-saffron" aria-hidden="true" /> {gallery.length} photos
              </span>
              <span className="text-xs font-bold text-saffron inline-flex items-center gap-0.5">Open Gallery <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" /></span>
            </div>
          </Link>
        ) : (
          <div className="card mt-3 p-4 text-center text-sm text-gray-500">No photos uploaded yet.</div>
        )}
      </section>

      {/* Donation */}
      {showDonation && (
        <section className="pt-6">
          <div className="relative rounded-2xl overflow-hidden p-5 bg-gradient-to-br from-saffron to-orange-600 text-white shadow-lg shadow-saffron/25">
            <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full bg-white/10" aria-hidden="true" />
            <div className="absolute right-6 bottom-0 w-16 h-16 rounded-full bg-white/5" aria-hidden="true" />
            <div className="relative">
              <p className="font-bold text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 fill-current" aria-hidden="true" /> {site?.donation_title ?? 'Support Our Mandal'}
              </p>
              <p className="text-sm text-white/90 mt-1">
                {donation?.instructions || 'Your contribution keeps Ganeshotsav celebrations alive every year.'}
              </p>
              <Link
                to="/donation"
                className="mt-3 inline-flex items-center gap-2 bg-white text-saffron text-sm font-bold px-4 py-2 rounded-full active:scale-95 transition-transform"
              >
                <Handshake className="w-4 h-4" aria-hidden="true" /> Donate Now
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}