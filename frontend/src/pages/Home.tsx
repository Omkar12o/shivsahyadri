import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Music,
  Megaphone,
  Images,
  Clock,
  Heart,
  Play,
  ChevronRight,
  Sparkles,
  Handshake,
  Rocket,
  Calendar,
  MapPin,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { aartiService } from '@/services/aartiService'
import { announcementService } from '@/services/announcementService'
import { programService } from '@/services/programService'
import { galleryService } from '@/services/galleryService'
import { settingsService } from '@/services/settingsService'
import { profileService } from '@/services/profileService'
import { QuickActionIcon } from '@/components/ui/display'
import { formatTime, getAvatarColor, getInitials } from '@/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import DesktopHome from '@/components/DesktopHome'
import type {
  Aarti,
  Announcement,
  GalleryImage,
  Program,
  SiteSettings,
  DonationInfo,
  MandalInfo,
  QuickAction,
  MemberDirectoryEntry,
} from '@/types'

const DEFAULT_QUICK_ACTIONS: { destination: string; label: string; icon: string }[] = [
  { destination: '/aarti', label: 'Aarti', icon: 'aarti' },
  { destination: '/programs', label: 'Programs', icon: 'programs' },
  { destination: '/gallery', label: 'Gallery', icon: 'gallery' },
  { destination: '/donation', label: 'Donation', icon: 'donation' },
]

export default function Home() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [aartis, setAartis] = useState<Aarti[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [members, setMembers] = useState<MemberDirectoryEntry[]>([])
  const [site, setSite] = useState<SiteSettings | null>(null)
  const [donation, setDonation] = useState<DonationInfo | null>(null)
  const [mandal, setMandal] = useState<MandalInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const aliveRef = useRef(true)
  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const load = useCallback(async () => {
    try {
      setLoadError(false)
      const [a, an, p, g, mList, s, d, m] = await Promise.all([
        aartiService.listToday().catch(() => []),
        announcementService.list({ limit: 3 }).catch(() => []),
        programService.listToday().catch(() => []),
        galleryService.list({ limit: 8 }).catch(() => []),
        profileService.getMemberDirectory().catch(() => []),
        settingsService.getSiteSettings().catch(() => null),
        settingsService.getDonationInfo().catch(() => null),
        settingsService.getMandalInfo().catch(() => null),
      ])
      if (!aliveRef.current) return
      setAartis(a)
      setAnnouncements(an)
      setPrograms(p)
      setGallery(g)
      setMembers(mList)
      setSite(s)
      setDonation(d)
      setMandal(m)
    } catch {
      if (aliveRef.current) setLoadError(true)
    } finally {
      if (aliveRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    aliveRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    const ch = supabase.channel('home-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aartis' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'programs' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_info' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mandal_info' }, load)
      .subscribe()
    return () => { aliveRef.current = false; supabase.removeChannel(ch) }
  }, [load])

  const membersPreviewCount = Math.min(Math.max(site?.members_preview_count ?? 6, 0), 12)

  if (loading) return <HomeSkeleton />
  const importantNotice = announcements.find(x => x.priority === 'urgent' || x.priority === 'high') ?? announcements[0]

  const dbQuickActions = (site?.quick_actions ?? []).filter((q: QuickAction) => q.enabled).sort((a, b) => a.order - b.order)
  const quickActions = dbQuickActions.length
    ? dbQuickActions.map(q => ({ destination: q.destination, label: q.label, icon: q.icon }))
    : DEFAULT_QUICK_ACTIONS

  const galleryPreview = (site?.gallery_preview_count ?? 6) > 0 ? gallery.slice(0, Math.min(site?.gallery_preview_count ?? 6, 8)) : []

  const mandalName = mandal?.name ?? 'Shivsaydri Ganesh Mandal'
  const mandalVillage = mandal?.village ? `, ${mandal.village}` : ''

  const showDonation = donation && site?.donation_show !== false
  const heroImage = site?.ganpati_image_url
  const heroText = site?.hero_welcome ?? 'Ganpati Bappa Morya 🙏'
  const showAbout = site?.about_show !== false && !!site?.about_description

  const firstName = (profile?.full_name || '').trim().split(/\s+/)[0] || 'Member'

  if (loadError && !aartis.length && !members.length && !gallery.length) {
    return (
      <div className="app-container py-16 text-center">
        <p className="text-4xl">📡</p>
        <h2 className="mt-3 text-lg font-bold text-gray-900">Unable to load this section</h2>
        <p className="text-sm text-gray-500 mt-1">Please check your connection and try again.</p>
        <button type="button" onClick={() => { setLoading(true); setLoadError(false); load() }} className="btn-primary mt-5">
          <Rocket className="w-4 h-4" aria-hidden="true" /> Try Again
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Mobile / tablet — original member app view (unchanged) */}
      <div className="app-container py-4 md:py-6 pb-10 lg:hidden">
      {/* Greeting */}
      <section className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold text-saffron uppercase tracking-wide">Namaskar 🙏</p>
          <h1 className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5">Welcome back, {firstName}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{todayStr}</p>
        </div>
      </section>

      {/* Hero / Ganpati image — mobile keeps the full-bleed card; desktop becomes a balanced 42/58 two-column hero */}
      <section className="pt-4 md:pt-6">
        <div
          className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-gradient-to-br from-saffron via-orange-600 to-red-600 shadow-lg shadow-saffron/20 flex items-end h-[340px] sm:h-[380px] md:h-[420px] lg:h-auto lg:min-h-[440px] lg:grid lg:grid-cols-[42%_58%] lg:mx-auto"
        >
          {heroImage ? (
            <img
              src={heroImage}
              alt="Ganpati Bappa Morya"
              className="absolute inset-0 w-full h-full object-cover object-center lg:static lg:col-start-2 lg:row-start-1 lg:block"
              loading="eager"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center font-devanagari text-white text-6xl md:text-7xl drop-shadow bg-gradient-to-br from-saffron via-orange-600 to-red-600 lg:static lg:col-start-2 lg:row-start-1" aria-hidden="true">
              श्री
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none lg:hidden" aria-hidden="true" />

          {/* Mobile / tablet overlay content (unchanged) */}
          <div className="relative z-10 w-full flex flex-col items-start justify-end px-4 md:px-7 pb-4 md:pb-6 lg:hidden">
            <p className="font-devanagari font-extrabold text-white text-2xl md:text-4xl leading-tight drop-shadow-md">{heroText}</p>
            <p className="font-devanagari text-white/95 text-sm md:text-lg mt-1 drop-shadow">॥ श्री गणेशाय नमः ॥</p>
            <p className="text-[13px] md:text-base text-white/90 mt-0.5 drop-shadow">Shivsaydri Ganesh Mandal{mandalVillage}</p>
            <Link
              to="/aarti"
              className="mt-3 md:mt-4 inline-flex items-center gap-2 bg-white text-saffron text-sm md:text-base font-bold px-5 py-2.5 md:px-6 md:py-3 rounded-full active:scale-95 transition-transform shadow-md"
            >
              <span className="text-base md:text-lg" aria-hidden="true">🙏</span> View Aarti
            </Link>
          </div>

          {/* Desktop left column — greeting, name, village, date, actions (≥1024px only) */}
          <div className="hidden lg:flex flex-col justify-center px-10 xl:px-14 py-12 relative z-10 lg:col-start-1 lg:row-start-1">
            <p className="font-devanagari text-saffron-50/95 text-sm md:text-base font-semibold tracking-wide drop-shadow">॥ श्री गणेशाय नमः ॥</p>
            <h1 className="mt-3 font-devanagari font-extrabold text-white leading-[1.08] drop-shadow-md text-[clamp(2rem,3.2vw,3.5rem)]">
              {heroText}
            </h1>
            <p className="mt-4 font-bold text-white text-xl lg:text-2xl drop-shadow">{mandalName}</p>
            <p className="mt-1 text-white/85 text-sm md:text-base drop-shadow">
              {mandal?.village ?? 'Maharashtra'}
            </p>
            <p className="mt-2 text-white/80 text-sm md:text-base drop-shadow">{todayStr}</p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/aarti"
                className="inline-flex items-center gap-2 bg-white text-saffron text-sm font-bold px-6 py-3 rounded-full shadow-md transition-transform hover:scale-[1.02] active:scale-95"
              >
                <Music className="w-4 h-4" aria-hidden="true" /> View Aarti
              </Link>
              <Link
                to="/programs"
                className="inline-flex items-center gap-2 bg-white/15 text-white border border-white/30 backdrop-blur text-sm font-bold px-6 py-3 rounded-full transition-colors hover:bg-white/25 active:scale-95"
              >
                <Calendar className="w-4 h-4" aria-hidden="true" /> View Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access — 2 cols mobile, 4 cols desktop */}
      <section className="pt-6 md:pt-8">
        <h2 className="text-sm md:text-base font-bold text-gray-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-saffron" aria-hidden="true" /> Quick Access
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-3">
          {quickActions.map((qa) => (
            <Link
              key={qa.destination + qa.label}
              to={qa.destination}
              className="card p-4 md:p-5 flex items-center gap-3 active:scale-[0.97] transition-transform min-h-[64px]"
            >
              <span className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-saffron/10 text-saffron flex items-center justify-center shrink-0">
                <QuickActionIcon name={qa.icon} className="w-5 h-5 md:w-6 md:h-6" />
              </span>
              <span className="text-sm md:text-base font-semibold text-gray-800">{qa.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Today's Program — real Supabase data, desktop-only section */}
      <section className="hidden lg:block pt-10">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-saffron" aria-hidden="true" /> Today's Program
        </h2>
        {programs.length ? (
          <div className="mt-3 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {programs.slice(0, 6).map((program) => (
              <Link key={program.id} to="/programs" className="card p-4 flex items-center gap-3 hover:shadow-lg transition active:scale-[0.98]">
                <span className="w-11 h-11 rounded-xl bg-saffron/10 text-saffron flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{program.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {formatTime(program.start_time)}
                      {program.end_time ? ` – ${formatTime(program.end_time)}` : ''}
                    </span>
                    {program.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" aria-hidden="true" /> {program.location}
                      </span>
                    )}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="card mt-3 p-6 text-center text-sm text-gray-500">
            <p className="text-2xl">📅</p>
            <p className="mt-1">No programs scheduled for today.</p>
          </div>
        )}
      </section>

      {/* Dashboard grid — Aarti | Programs (2 cols on desktop) */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <section className="pt-6 md:pt-8 lg:pt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-gray-900">{t('home.aartiTitle')}</h2>
            {aartis.length > 3 && (
              <Link to="/aarti" className="text-xs font-semibold text-saffron inline-flex items-center gap-0.5">
                {t('home.viewAll')} <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
          {aartis.length ? (
            <div className="mt-3 space-y-2.5">
              {aartis.slice(0, 3).map((aarti) => (
                <Link key={aarti.id} to={`/aarti/${aarti.id}`} className="card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform">
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
            <div className="card mt-3 p-6 text-center text-sm text-gray-500">
              <p className="text-2xl">🙏</p>
              <p className="mt-1">No Aarti available today.</p>
            </div>
          )}
        </section>

        <section className="pt-6 md:pt-8 lg:pt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-gray-900">👥 {t('home.membersTitle')}</h2>
            <Link to="/members" className="text-xs font-semibold text-saffron inline-flex items-center gap-0.5">
              {t('home.viewAll')} <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
          {members.length ? (
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {members.slice(0, membersPreviewCount).map((member) => (
                <Link key={member.user_id} to="/members" className="card p-3 flex items-center gap-2.5 active:scale-[0.98] transition-transform min-w-0">
                  <span className="w-9 h-9 rounded-full text-white text-sm font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: getAvatarColor(member.full_name) }}>
                    {getInitials(member.full_name)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{member.full_name}</p>
                    {member.position && <p className="text-[11px] text-gray-500 truncate">{member.position}</p>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card mt-3 p-6 text-center text-sm text-gray-500">
              <p className="text-2xl">👥</p>
              <p className="mt-1">No members yet.</p>
            </div>
          )}
        </section>
      </div>

      {/* Dashboard row 2 — Announcement | Gallery */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <section className="pt-6 md:pt-8 lg:pt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-gray-900">📢 Latest Update</h2>
            <Link to="/member/notifications" className="text-xs font-semibold text-saffron inline-flex items-center gap-0.5">
              View All <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
          {importantNotice ? (
            <Link to="/member/notifications" className="card mt-3 p-4 border-l-4 border-saffron active:scale-[0.98] transition-transform block">
              <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-saffron shrink-0" aria-hidden="true" /> {importantNotice.title}
              </p>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-line line-clamp-2">{importantNotice.message}</p>
              <p className="text-xs text-saffron font-semibold mt-1.5">Read more →</p>
            </Link>
          ) : (
            <div className="card mt-3 p-6 text-center text-sm text-gray-500">
              <p className="text-2xl">📢</p>
              <p className="mt-1">No new announcements</p>
            </div>
          )}

          {/* About Mandal preview */}
          {showAbout && (
            <div className="card mt-3 p-4">
              <h2 className="text-sm md:text-base font-bold text-gray-900">About Our Mandal</h2>
              <p className="text-sm text-gray-600 mt-1 line-clamp-3">{site.about_description}</p>
              <Link to="/more" className="text-xs text-saffron font-semibold mt-1.5 inline-flex items-center gap-0.5">
                Read More <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>

        <section className="pt-6 md:pt-8 lg:pt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-gray-900">📸 {t('home.gallery')}</h2>
            <Link to="/gallery" className="text-xs font-semibold text-saffron inline-flex items-center gap-0.5">
              {t('home.viewAll')} <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
          {galleryPreview.length ? (
            <Link to="/gallery" className="mt-3 block rounded-2xl overflow-hidden border border-orange-100">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-0.5">
                {galleryPreview.slice(0, 6).map((img) => (
                  <div key={img.id} className="relative aspect-square overflow-hidden">
                    <img src={img.image_url} alt={img.title || 'Mandal photo'} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
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
            <div className="card mt-3 p-6 text-center text-sm text-gray-500">
              <p className="text-2xl">📸</p>
              <p className="mt-1">No photos available yet.</p>
            </div>
          )}

          {/* Donation */}
          {showDonation && (
            <div className="mt-3 relative rounded-2xl md:rounded-3xl overflow-hidden p-5 md:p-6 bg-gradient-to-br from-saffron to-orange-600 text-white shadow-lg shadow-saffron/25">
              <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full bg-white/10" aria-hidden="true" />
              <div className="relative">
                <p className="font-bold text-base md:text-lg flex items-center gap-2">
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
          )}
        </section>
      </div>
      </div>

      {/* Desktop (≥1024px) — premium festival homepage */}
      <DesktopHome
        site={site}
        mandal={mandal}
        donation={donation}
        programs={programs}
        gallery={gallery}
        members={members}
        quickActions={quickActions}
      />
    </>
  )
}

function HomeSkeleton() {
  return (
    <>
      <div className="app-container py-4 md:py-6 pb-10 lg:hidden" aria-busy="true" aria-label="Loading Home">
      <div className="space-y-1">
        <div className="skeleton h-3 w-24 rounded-full" />
        <div className="skeleton h-5 w-56 rounded-full" />
        <div className="skeleton h-3 w-40 rounded-full" />
      </div>
      <div className="skeleton h-[340px] sm:h-[380px] md:h-[420px] mt-5 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-16 md:h-[72px] rounded-2xl" />
        ))}
      </div>
      <div className="lg:grid lg:grid-cols-2 lg:gap-6 mt-5 space-y-3 lg:space-y-0">
        <div className="space-y-2.5">
          <div className="skeleton h-4 w-32 rounded-full" />
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-[72px] rounded-2xl" />)}
        </div>
        <div className="space-y-2.5">
          <div className="skeleton h-4 w-32 rounded-full" />
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-[72px] rounded-2xl" />)}
        </div>
      </div>
      </div>

      {/* Desktop skeleton */}
      <div className="hidden lg:block bg-cream" aria-busy="true" aria-label="Loading Home">
        <div className="skeleton h-10 w-full rounded-none" />
        <div className="app-container grid grid-cols-2 gap-10 min-h-[600px] py-16">
          <div className="space-y-4">
            <div className="skeleton h-4 w-40 rounded-full" />
            <div className="skeleton h-16 w-3/4 rounded-2xl" />
            <div className="skeleton h-8 w-56 rounded-full" />
            <div className="skeleton h-5 w-64 rounded-full" />
            <div className="skeleton h-5 w-80 rounded-full" />
            <div className="flex gap-3 pt-4">
              <div className="skeleton h-12 w-40 rounded-full" />
              <div className="skeleton h-12 w-40 rounded-full" />
            </div>
          </div>
          <div className="skeleton h-[540px] rounded-3xl" />
        </div>
        <div className="app-container space-y-10 pb-10">
          <div className="skeleton h-28 rounded-3xl" />
          <div className="grid grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-44 rounded-3xl" />)}
          </div>
          <div className="grid grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-3xl" />)}
          </div>
        </div>
      </div>
    </>
  )
}