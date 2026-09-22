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
  Users,
  Handshake,
  Phone,
  Mail,
  MessageCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { aartiService } from '@/services/aartiService'
import { programService } from '@/services/programService'
import { announcementService } from '@/services/announcementService'
import { galleryService } from '@/services/galleryService'
import { birthdayService } from '@/services/birthdayService'
import { meetingService } from '@/services/meetingService'
import { settingsService } from '@/services/settingsService'
import { profileService } from '@/services/profileService'
import { Countdown, QuickActionIcon } from '@/components/ui/display'
import { LoadingScreen } from '@/components/ui/feedback'
import { formatDate, formatTime, formatRelativeTime } from '@/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import type {
  Aarti,
  Program,
  Announcement,
  GalleryImage,
  Notification,
  SiteSettings,
  Meeting,
  MemberDirectoryEntry,
  DonationInfo,
  MandalInfo,
  QuickAction,
} from '@/types'

export default function Home() {
  const { t } = useLanguage()
  const [aartis, setAartis] = useState<Aarti[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [birthdays, setBirthdays] = useState<Notification[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [members, setMembers] = useState<MemberDirectoryEntry[]>([])
  const [site, setSite] = useState<SiteSettings | null>(null)
  const [donation, setDonation] = useState<DonationInfo | null>(null)
  const [mandal, setMandal] = useState<MandalInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const [a, p, an, g, b, mt, s, d, m, membersList] = await Promise.all([
          aartiService.listToday().catch(() => []),
          programService.listToday().catch(() => []),
          announcementService.list({ limit: 3 }).catch(() => []),
          galleryService.list({ limit: 8 }).catch(() => []),
          birthdayService.listToday().catch(() => []),
          meetingService.listUpcoming().catch(() => []),
          settingsService.getSiteSettings().catch(() => null),
          settingsService.getDonationInfo().catch(() => null),
          settingsService.getMandalInfo().catch(() => null),
          profileService.getMemberDirectory().catch(() => []),
        ])
        if (!alive) return
        setAartis(a)
        setPrograms(p)
        setAnnouncements(an)
        setGallery(g)
        setBirthdays(b)
        setMeetings(mt.slice(0, 3))
        setSite(s)
        setDonation(d)
        setMandal(m)
        setMembers(membersList)
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_info' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mandal_info' }, load)
      .subscribe()
    return () => { alive = false; supabase.removeChannel(ch) }
  }, [])

  if (loading) return <LoadingScreen label="Loading Mandal..." />

  const upcomingPrograms = programs.length ? programs : []
  const importantNotice = announcements.find(a => a.priority === 'urgent' || a.priority === 'high') ?? announcements[0]

  const quickActions = (site?.quick_actions ?? []).filter((q: QuickAction) => q.enabled).sort((a, b) => a.order - b.order)

  const membersPreviewCount = site?.members_preview_count ?? 4
  const galleryPreviewCount = site?.gallery_preview_count ?? 6

  const mandalName = mandal?.name ?? 'Shivsaydri Ganesh Mandal'
  const mandalVillage = mandal?.village ? (mandal.village ? `, ${mandal.village}` : '') : ''

  const donationTitle = site?.donation_title ?? 'Support Our Mandal'

  return (
    <div className="flex flex-col">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-saffron via-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} aria-hidden="true" />
        <div className="container-main px-4 py-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-center md:text-left animate-slide-up">
              <p className="text-xs md:text-sm font-semibold tracking-[0.35em] uppercase text-white/80 font-devanagari">॥ श्री गणेशाय नमः ॥</p>
              <h1 className="mt-3 text-4xl md:text-5xl xl:text-6xl font-bold leading-tight text-balance">
                {site?.hero_welcome ?? t('hero.welcome')}
              </h1>
              <p className="mt-3 text-lg md:text-xl text-white/90">{site?.hero_message ?? `${mandalName}${mandalVillage}`}</p>
              <p className="mt-4 text-sm text-white/80 flex items-center justify-center md:justify-start gap-2">
                <Calendar className="w-4 h-4" aria-hidden="true" /> {todayStr}
              </p>

              {site?.countdown_target && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-white/90 mb-2">Countdown to Ganeshotsav</p>
                  <Countdown target={site.countdown_target} />
                </div>
              )}

              {/* Quick action buttons */}
              <div className="mt-8 grid grid-cols-2 gap-3 max-w-md mx-auto md:mx-0">
                {quickActions.length > 0 ? (
                  quickActions.map(action => (
                    <Link
                      key={action.id}
                      to={action.destination || '#'}
                      className="btn group bg-white text-saffron hover:bg-cream shadow-lg shadow-saffron/20"
                    >
                      <QuickActionIcon name={action.icon} className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                      {action.label || t('hero.aarti')}
                    </Link>
                  ))
                ) : (
                  <>
                    <Link to="/aarti" className="btn bg-white text-saffron hover:bg-cream"><Music className="w-4 h-4 mr-2" aria-hidden="true" />{t('hero.aarti')}</Link>
                    <Link to="/programs" className="btn bg-white/15 text-white border border-white/30 hover:bg-white/25"><Calendar className="w-4 h-4 mr-2" aria-hidden="true" />{t('hero.programs')}</Link>
                    <Link to="/gallery" className="btn bg-white/15 text-white border border-white/30 hover:bg-white/25"><Images className="w-4 h-4 mr-2" aria-hidden="true" />{t('hero.gallery')}</Link>
                    <Link to="/donation" className="btn bg-white text-saffron hover:bg-cream"><Heart className="w-4 h-4 mr-2" aria-hidden="true" />{t('hero.donation')}</Link>
                  </>
                )}
              </div>
            </div>

            {/* Hero image: object-cover, ~480px tall desktop / ~300px mobile, radius 24 */}
            <div className="relative mx-auto w-full max-w-xl animate-fade-in">
              {site?.ganpati_image_url ? (
                <div className="rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/20">
                  <img
                    src={site.ganpati_image_url}
                    alt="Ganpati Bappa"
                    className="w-full h-[300px] md:h-[480px] object-cover"
                    loading="eager"
                  />
                </div>
              ) : (
                <div
                  className="w-full h-[300px] md:h-[480px] rounded-3xl bg-white/15 backdrop-blur border border-white/20 flex flex-col items-center justify-center text-center p-8"
                >
                  <span className="text-7xl md:text-8xl">🙏</span>
                  <p className="mt-4 text-2xl font-bold font-devanagari">गणपती बाप्पा मोरया</p>
                  <p className="text-sm text-white/80 mt-1">{mandalName}</p>
                  <p className="text-xs text-white/60 mt-4">Ganpati hero image coming soon</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FESTIVAL BANNER ============ */}
      <section className="container-main px-4 -mt-6 relative z-10">
        <div className="bg-gradient-to-r from-saffron via-orange-500 to-red-600 rounded-2xl p-5 md:p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex-1">
            <p className="text-[11px] font-bold bg-white/20 inline-block px-3 py-1 rounded-full uppercase tracking-wider">✨ Festival</p>
            <h3 className="text-xl md:text-2xl font-bold mt-2">{site?.banner_title ?? 'Ganesh Chaturthi Festival'}</h3>
            {site?.banner_subtitle && <p className="text-sm text-white/90 mt-1">{site.banner_subtitle}</p>}
            {site?.banner_description && <p className="text-sm text-white/85 mt-1 line-clamp-2">{site.banner_description}</p>}
          </div>
          <Link to={site?.banner_button_link || '/festival/2026'} className="bg-white text-saffron px-6 py-3 rounded-xl font-bold whitespace-nowrap shrink-0">
            {site?.banner_button_text || 'View 2026 →'}
          </Link>
        </div>
      </section>

      {/* ============ TODAY'S PROGRAMS ============ */}
      <section className="container-main px-4 py-10 md:py-14">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">{site?.programs_title ?? t('hero.today') + "'s Program"}</h2>
          <Link to="/programs" className="text-sm font-medium text-saffron hover:underline">View All Programs →</Link>
        </div>
        {upcomingPrograms.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" aria-hidden="true" />
            <p>No programs scheduled for today.</p>
            <p className="text-sm">Check Programs page for upcoming events.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingPrograms.map(p => (
              <Link
                key={p.id}
                to="/programs"
                className="card p-5 flex gap-4 hover:shadow-md transition-shadow"
              >
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover shrink-0" loading="lazy" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-saffron/10 flex items-center justify-center text-saffron shrink-0">
                    <Calendar className="w-6 h-6" aria-hidden="true" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{p.title}</p>
                  <p className="text-sm text-gray-500 flex gap-2"><Clock className="w-4 h-4" aria-hidden="true" />{formatTime(p.start_time)}{p.end_time ? ` - ${formatTime(p.end_time)}` : ''}</p>
                  {p.location && <p className="text-xs text-gray-400 flex gap-1"><MapPin className="w-3 h-3" aria-hidden="true" />{p.location}</p>}
                  {p.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ============ ABOUT SECTION ============ */}
      {site?.about_show !== false && (site?.about_heading || site?.about_description) && (
        <section className="bg-white border-y border-gray-100">
          <div className="container-main px-4 py-10 md:py-14 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-saffron">About Our Mandal</p>
              <h2 className="text-2xl md:text-3xl font-bold mt-2">{site?.about_heading ?? 'About our Mandal'}</h2>
              <p className="text-gray-600 mt-4 leading-relaxed">{site?.about_description ?? 'We are a community of devotees celebrating Ganesh Chaturthi together every year.'}</p>
              {(site?.about_button_text || site?.about_button_link) && (
                <Link to={site?.about_button_link || '/contact'} className="btn btn-secondary mt-6">
                  {site?.about_button_text || 'Learn More'}
                </Link>
              )}
            </div>
            {site?.about_image_url && (
              <div className="rounded-3xl overflow-hidden shadow-lg">
                <img src={site.about_image_url} alt="About Mandal" className="w-full h-64 md:h-80 object-cover" loading="lazy" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============ IMPORTANT NOTICE ============ */}
      {importantNotice && (
        <section className="container-main px-4 py-6">
          <div className="card p-5 border-l-4 border-l-saffron bg-orange-50/50">
            <div className="flex gap-3">
              <Megaphone className="w-6 h-6 text-saffron shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold text-gray-900">🔔 Important Notice</p>
                <p className="font-medium">{importantNotice.title}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{importantNotice.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(importantNotice.created_at)}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ AARTI + BIRTHDAYS ============ */}
      <section className="container-main px-4 py-8 grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold flex items-center gap-2"><Music className="w-5 h-5 text-saffron" aria-hidden="true" /> Today&apos;s Aarti</h3>
          {aartis.length === 0 ? <p className="text-sm text-gray-500 mt-3">No Aarti published yet.</p> : (
            <ul className="mt-3 space-y-3">
              {aartis.map(a => (
                <li key={a.id} className="flex justify-between items-center border rounded-xl px-4 py-3 hover:bg-saffron/5 hover:border-saffron/30 transition-colors">
                  <div><p className="font-medium">{a.title}</p><p className="text-xs text-gray-500">{a.category} • {formatTime(a.time)}</p></div>
                  <Link to={`/aarti/${a.id}`} className="btn-secondary text-xs px-3 py-1.5 shrink-0">View</Link>
                </li>
              ))}
            </ul>
          )}
          <Link to="/aarti" className="btn-secondary w-full mt-4 justify-center">All Aartis</Link>
        </div>
        <div className="card p-6">
          <h3 className="font-bold flex items-center gap-2"><Users className="w-5 h-5 text-saffron" aria-hidden="true" /> Today&apos;s Birthdays</h3>
          {birthdays.length === 0 ? <p className="text-sm text-gray-500 mt-3">No birthdays today. 🎂</p> : (
            <ul className="mt-3 space-y-3">
              {birthdays.map(b => (
                <li key={b.id} className="flex gap-3 items-center border rounded-xl px-4 py-3">
                  <span className="text-xl">🎂</span>
                  <div><p className="font-medium">{b.title}</p><p className="text-xs text-gray-500">{b.message}</p></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ============ ANNOUNCEMENTS ============ */}
      {announcements.length > 0 && (
        <section id="announcements" className="container-main px-4 pb-8">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-saffron" aria-hidden="true" />{site?.announcements_title ?? 'Recent Announcements'}</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {announcements.map(a => (
              <div key={a.id} className="card p-5">
                <span className={`badge ${a.priority === 'urgent' ? 'bg-red-100 text-red-700' : a.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{a.priority}</span>
                <p className="font-semibold mt-2">{a.title}</p>
                <p className="text-sm text-gray-600 line-clamp-3">{a.message}</p>
                <p className="text-xs text-gray-400 mt-2">{formatDate(a.created_at)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ MEETINGS ============ */}
      {meetings.length > 0 && (
        <section className="container-main px-4 pb-8">
          <div className="flex items-end justify-between mb-4"><h3 className="font-bold flex items-center gap-2"><Handshake className="w-5 h-5 text-saffron" aria-hidden="true" />Upcoming Meetings</h3><Link to="/meetings" className="text-sm text-saffron font-medium">View All →</Link></div>
          <div className="grid md:grid-cols-3 gap-4">
            {meetings.map(m => (
              <div key={m.id} className="card p-5">
                <p className="font-semibold truncate">{m.title}</p>
                <p className="text-sm text-gray-500">{formatDate(m.meeting_date)} • {formatTime(m.start_time)}{m.end_time ? ` - ${formatTime(m.end_time)}` : ''}</p>
                {m.location && <p className="text-xs text-gray-400 mt-1">📍 {m.location}</p>}
                {m.agenda && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{m.agenda}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ MEMBERS PREVIEW ============ */}
      {site?.members_preview_show !== false && members.length > 0 && (
        <section className="bg-cream border-y border-gray-100">
          <div className="container-main px-4 py-10 md:py-14">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-semibold tracking-[0.3em] uppercase text-saffron">Our Team</p>
                <h2 className="text-2xl md:text-3xl font-bold mt-1">Our Mandal Team</h2>
              </div>
              <Link to="/members" className="text-sm text-saffron font-medium shrink-0">View All Members →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {members.slice(0, membersPreviewCount).map(m => (
                <div key={m.id} className="card p-4 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-200">
                  {m.profile_photo_url ? (
                    <img src={m.profile_photo_url} alt={m.full_name} className="w-20 h-20 rounded-full object-cover ring-4 ring-saffron/20" loading="lazy" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-saffron text-white flex items-center justify-center text-xl font-bold ring-4 ring-saffron/20">
                      {m.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                  )}
                  <p className="font-semibold mt-3 truncate w-full">{m.full_name}</p>
                  <p className="text-xs text-saffron font-medium mt-0.5">{m.position || 'Member'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ GALLERY PREVIEW ============ */}
      {site?.gallery_preview_show !== false && gallery.length > 0 && (
        <section className="container-main px-4 py-10 md:py-14">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-saffron">Moments</p>
              <h2 className="text-2xl md:text-3xl font-bold mt-1">{site?.gallery_title ?? 'Latest Memories'}</h2>
            </div>
            <Link to="/gallery" className="text-sm text-saffron font-medium">View Gallery →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {gallery.slice(0, galleryPreviewCount).map(g => (
              <Link to="/gallery" key={g.id}>
                <img src={g.image_url} alt={g.title} className="h-32 md:h-40 w-full object-cover rounded-2xl hover:opacity-90 hover:scale-[1.02] transition-all duration-200" loading="lazy" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============ DONATION ============ */}
      {site?.donation_show !== false && donation && donation.upi_id && (
        <section className="bg-gradient-to-br from-saffron via-primary-600 to-primary-800 text-white">
          <div className="container-main px-4 py-10 md:py-14 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/80">🙏 Seva</p>
              <h2 className="text-2xl md:text-3xl font-bold mt-2">{donationTitle}</h2>
              <p className="text-white/90 mt-3">
                {donation.instructions || `Support ${donation.mandal_name || mandalName}. Every contribution helps us celebrate Ganeshotsav with devotion and joy.`}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/donation" className="btn bg-white text-saffron hover:bg-cream px-8">
                  <Heart className="w-4 h-4 mr-2" aria-hidden="true" /> Donate Now
                </Link>
                {donation.upi_qr_url && (
                  <a href={donation.upi_qr_url} target="_blank" rel="noopener noreferrer" className="btn bg-white/15 text-white border border-white/30 hover:bg-white/25">
                    View QR
                  </a>
                )}
              </div>
            </div>
            {donation.upi_qr_url && (
              <div className="bg-white rounded-3xl p-6 flex flex-col items-center justify-center shadow-xl mx-auto">
                <img src={donation.upi_qr_url} alt="UPI QR Code" className="w-44 h-44 object-contain" loading="lazy" />
                <p className="text-sm font-semibold text-gray-700 mt-3">{donation.upi_id}</p>
                <p className="text-xs text-gray-500 mt-1">Scan to pay via UPI</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============ CONTACT STRIP ============ */}
      {mandal && (mandal.contact_phone || mandal.contact_email || mandal.address) && (
        <section className="container-main px-4 py-10 md:py-14">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card p-6 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-saffron/10 text-saffron flex items-center justify-center shrink-0"><Phone className="w-5 h-5" aria-hidden="true" /></div>
              <div>
                <p className="font-semibold">Call Us</p>
                <p className="text-sm text-gray-600">{mandal.contact_phone || '—'}</p>
                {mandal.contact_whatsapp && (
                  <p className="text-sm text-gray-600 flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" aria-hidden="true" /> {mandal.contact_whatsapp}</p>
                )}
              </div>
            </div>
            <div className="card p-6 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-saffron/10 text-saffron flex items-center justify-center shrink-0"><Mail className="w-5 h-5" aria-hidden="true" /></div>
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-sm text-gray-600 break-all">{mandal.contact_email || '—'}</p>
              </div>
            </div>
            <div className="card p-6 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-saffron/10 text-saffron flex items-center justify-center shrink-0"><MapPin className="w-5 h-5" aria-hidden="true" /></div>
              <div>
                <p className="font-semibold">Address</p>
                <p className="text-sm text-gray-600">{mandal.address || '—'}</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}