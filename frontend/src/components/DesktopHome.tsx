import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Calendar, MapPin, ArrowRight } from 'lucide-react'
import { QuickActionIcon, Countdown } from '@/components/ui/display'
import { formatTime, getAvatarColor, getInitials } from '@/utils'
import type { DonationInfo, GalleryImage, MandalInfo, MemberDirectoryEntry, Program, SiteSettings } from '@/types'

interface DesktopHomeProps {
  site: SiteSettings | null
  mandal: MandalInfo | null
  donation: DonationInfo | null
  programs: Program[]
  gallery: GalleryImage[]
  members: MemberDirectoryEntry[]
  quickActions: { destination: string; label: string; icon: string }[]
}

const QUICK_COPY: Record<string, { title: string; desc: string }> = {
  aarti: { title: 'Aarti', desc: 'Listen to Aarti with lyrics & audio' },
  programs: { title: 'Programs', desc: 'Daily events and schedule' },
  gallery: { title: 'Gallery', desc: 'Photos & memories' },
  donation: { title: 'Donation', desc: 'Support our Mandal' },
  members: { title: 'Members', desc: 'Meet our family' },
}

const FACEBOOK_PATH = 'M13.5 9H16l.5-3h-3V4.5c0-.9.3-1.5 1.7-1.5H16V.2C15.6.1 14.6 0 13.5 0 11 0 9.5 1.5 9.5 4.3V6H7v3h2.5v9h4V9z'
const INSTAGRAM_PATH = 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 7a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6zm0 4.5a1.7 1.7 0 110-3.4 1.7 1.7 0 010 3.4zm5.5-6.6a.65.65 0 100 1.3.65.65 0 000-1.3z'
const YOUTUBE_PATH = 'M23 7.5s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.4-1C16.8 4 12 4 12 4s-4.8 0-7.8.2c-.5.1-1.5.1-2.4 1-.7.7-.9 2.3-.9 2.3S.8 9.4.8 11.3v1.7c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.8.2 7.6.2 7.6.2s4.8 0 7.8-.2c.5-.1 1.5-.1 2.4-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.7c0-1.9-.2-3.8-.2-3.8zM9.7 14.9V8.6l6.2 3.2-6.2 3.1z'

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={FACEBOOK_PATH} />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={INSTAGRAM_PATH} />
    </svg>
  )
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={YOUTUBE_PATH} />
    </svg>
  )
}

export default function DesktopHome({ site, mandal, donation, programs, gallery, members, quickActions }: DesktopHomeProps) {
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null)

  const heroImage = site?.ganpati_image_url ?? null
  const heroText = site?.hero_welcome ?? 'Ganpati Bappa Morya 🙏'
  const quote = site?.hero_message ?? 'भक्ती, संस्कृती आणि सामाजिक बांधिलकीचा संगम'
  const mandalName = mandal?.name ?? 'Shivsaydri Ganesh Mandal'
  const mandalVillage = mandal?.village ?? 'Umarkhanchan'
  const location = mandal?.address ?? 'Near Ganpati Mandap, Umarkhanchan, Maharashtra'
  const social = mandal?.social_media ?? {}

  const galleryPreview = ((site?.gallery_preview_count ?? 6) > 0 ? gallery.slice(0, Math.min(site?.gallery_preview_count ?? 6, 6)) : [])
  const memberPreview = members.slice(0, Math.min(Math.max(site?.members_preview_count ?? 4, 3), 6))

  const membersWidget = memberPreview

  const aboutImage = site?.about_image_url ?? gallery[0]?.image_url ?? null

  const year = new Date().getFullYear()

  return (
    <div className="hidden lg:block bg-cream selection:bg-saffron/20">
      {/* ── 1 / TOP ANNOUNCEMENT BAR ───────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-maroon via-[#C2410C] to-saffron text-white">
        <div className="pointer-events-none absolute inset-y-0 left-1/4 w-40 bg-white/5 blur-2xl" aria-hidden="true" />
        <div className="app-container flex items-center justify-between gap-4 h-10 xl:h-11 text-[13px] font-medium">
          <span className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{location}</span>
          </span>
          <span className="font-devanagari tracking-wide whitespace-nowrap absolute left-1/2 -translate-x-1/2">
            🙏 गणपती बाप्पा मोरया 🙏
          </span>
          <span className="flex items-center gap-4 shrink-0">
            <span className="hidden 2xl:inline tracking-widest text-white/95">|| भक्ती || संस्कृती || एकता || सेवा ||</span>
            <span className="inline-flex items-center gap-2">
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="opacity-90 hover:opacity-100 hover:scale-110 transition-transform">
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="opacity-90 hover:opacity-100 hover:scale-110 transition-transform">
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}
              {social.youtube && (
                <a href={social.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="opacity-90 hover:opacity-100 hover:scale-110 transition-transform">
                  <YoutubeIcon className="w-4 h-4" />
                </a>
              )}
            </span>
          </span>
        </div>
      </div>

      {/* ── 3 / HERO BANNER ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-maroon via-[#C2410C] to-saffron shadow-xl shadow-saffron/20">
        {/* Festive glow / temple atmosphere */}
        <div className="pointer-events-none absolute -top-24 -left-16 w-96 h-96 rounded-full bg-gold/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 w-[32rem] h-[32rem] rounded-full bg-orange-300/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute top-10 right-1/3 w-24 h-24 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)', backgroundSize: '26px 26px' }} aria-hidden="true" />

        <div className="app-container relative grid lg:grid-cols-2 items-center min-h-[600px] xl:min-h-[640px] py-16">
          {/* LEFT — text content */}
          <div className="relative z-10 flex flex-col justify-center pr-6 xl:pr-16">
            <p className="font-devanagari text-gold/90 text-sm xl:text-base font-semibold tracking-wide">
              ॥ श्री गणेशाय नमः ॥
            </p>
            <h1 className="mt-4 font-devanagari font-extrabold text-white leading-[1.12] drop-shadow-lg text-[clamp(2.6rem,4.5vw,4.6rem)]">
              {heroText}
            </h1>
            <div className="mt-5 h-1 w-28 rounded-full bg-gold/80" aria-hidden="true" />
            <p className="mt-5 text-white text-2xl xl:text-3xl font-bold drop-shadow">{mandalName}</p>
            <p className="mt-1 text-white/85 text-base xl:text-lg font-medium drop-shadow">{mandalVillage}</p>
            <p className="mt-5 max-w-xl text-white/90 font-devanagari text-lg xl:text-xl leading-relaxed drop-shadow">
              “{quote}”
            </p>

            <div className="mt-9 flex items-center gap-4">
              <Link
                to="/aarti"
                className="inline-flex items-center gap-2.5 bg-white text-[#C2410C] text-base font-bold px-7 py-3.5 rounded-full shadow-lg shadow-black/10 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 transition-all"
              >
                🙏 View Aarti
              </Link>
              <Link
                to="/programs"
                className="inline-flex items-center gap-2.5 bg-white/15 text-white border border-white/40 backdrop-blur text-base font-bold px-7 py-3.5 rounded-full hover:bg-white/25 active:translate-y-0 transition-all"
              >
                📅 View Programs
              </Link>
            </div>
          </div>

          {/* RIGHT — large Ganpati image (object-contain, never cropped/stretched) */}
          <div className="relative hidden lg:flex items-center justify-center">
            <div className="pointer-events-none absolute w-[30rem] h-[30rem] xl:w-[36rem] xl:h-[36rem] rounded-full bg-gold/25 blur-3xl" aria-hidden="true" />
            {heroImage ? (
              <img
                src={heroImage}
                alt="Ganpati Bappa Morya — Shivsaydri Ganesh Mandal"
                className="relative z-10 h-[460px] xl:h-[540px] w-auto max-w-full object-contain drop-shadow-2xl"
                loading="eager"
              />
            ) : (
              <span className="relative z-10 font-devanagari font-black text-white/90 text-[10rem] drop-shadow-2xl" aria-hidden="true">श्री</span>
            )}
            <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-10 rounded-[50%] bg-black/30 blur-xl" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ── 6 / FESTIVAL BANNER ────────────────────────────────── */}
      {site?.banner_show !== false && (
        <section className="app-container pt-6 xl:pt-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#7f1d1d] via-[#b91c1c] to-saffron text-white shadow-lg shadow-red-900/20">
            <div className="pointer-events-none absolute -top-16 right-8 w-56 h-56 rounded-full bg-gold/15 blur-3xl" aria-hidden="true" />
            <div className="relative grid grid-cols-3 items-center gap-6 px-8 xl:px-12 py-8">
              <div className="min-w-0">
                <p className="text-xl xl:text-2xl font-extrabold flex items-center gap-2.5 truncate">
                  <span className="shrink-0">🛕</span>
                  <span className="truncate">{site?.banner_title ?? `${year} Ganpati Festival`}</span>
                </p>
                <p className="mt-1.5 text-white/85 text-sm truncate">
                  {site?.banner_subtitle ?? 'Decoration • Programs • Aarti • Cultural Events'}
                </p>
              </div>
              <div className="flex flex-col items-center text-center px-2">
                {site?.countdown_target ? (
                  <Countdown target={site.countdown_target} />
                ) : (
                  <>
                    <p className="text-lg xl:text-xl font-extrabold tracking-wide">📅 Coming Soon</p>
                    <p className="text-white/80 text-sm mt-0.5">{site?.banner_description ?? 'Join us for a grand celebration'}</p>
                  </>
                )}
              </div>
              <div className="flex justify-end">
                <Link
                  to={site?.banner_button_link ?? '/festival/2026'}
                  className="inline-flex items-center gap-2 bg-white text-red-800 text-sm font-extrabold px-6 py-3 rounded-full shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all"
                >
                  {site?.banner_button_text ?? 'View Festival'} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 7 / QUICK ACCESS CARDS ─────────────────────────────── */}
      <section className="app-container pt-12 xl:pt-16">
        <div className="grid grid-cols-2 2xl:grid-cols-4 gap-5">
          {quickActions.map((qa) => {
            const meta = QUICK_COPY[qa.icon] ?? { title: qa.label, desc: 'Explore more' }
            const title = qa.label || meta.title
            return (
              <Link
                key={qa.destination + qa.label}
                to={qa.destination}
                className="group card p-6 xl:p-7 flex flex-col items-start gap-4 hover:-translate-y-1 hover:shadow-xl transition-all"
              >
                <span className="w-14 h-14 rounded-2xl bg-saffron/10 text-saffron flex items-center justify-center group-hover:bg-saffron group-hover:text-white transition-colors">
                  <QuickActionIcon name={qa.icon} className="w-6 h-6" />
                </span>
                <div>
                  <p className="text-lg font-bold text-gray-900">{title}</p>
                  <p className="text-sm text-gray-500 mt-1">{meta.desc}</p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-saffron">
                  Open <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── 8 / TODAY'S PROGRAM ────────────────────────────────── */}
      <section className="app-container pt-12 xl:pt-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl xl:text-3xl font-extrabold text-gray-900">Today's Program</h2>
          <Link to="/programs" className="inline-flex items-center gap-1.5 text-sm font-bold text-saffron hover:gap-2.5 transition-all">
            View All Programs <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {programs.length ? (
          <div className="mt-6 grid grid-cols-2 xl:grid-cols-3 gap-5">
            {programs.slice(0, 6).map((program) => (
              <Link key={program.id} to="/programs" className="group card p-6 flex items-start gap-4 hover:-translate-y-1 hover:shadow-xl transition-all">
                <span className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#C2410C] to-saffron text-white flex items-center justify-center">
                  <Calendar className="w-6 h-6" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-saffron tabular-nums">
                    {formatTime(program.start_time)}
                    {program.end_time ? ` – ${formatTime(program.end_time)}` : ''}
                  </p>
                  <p className="mt-1 text-base font-bold text-gray-900 truncate group-hover:text-saffron transition-colors">{program.title}</p>
                  {program.location && (
                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" /> <span className="truncate">{program.location}</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card mt-6 px-8 py-14 text-center">
            <p className="text-4xl">📅</p>
            <p className="mt-3 text-lg font-bold text-gray-800">No programs scheduled for today</p>
            <p className="text-sm text-gray-500 mt-1">Check back soon or browse the full schedule.</p>
            <Link to="/programs" className="btn-primary mt-5 inline-flex items-center gap-2">
              Browse Programs <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      {/* ── 9 / ABOUT MANDAL ───────────────────────────────────── */}
      {site?.about_show !== false && site?.about_description && (
        <section className="app-container pt-12 xl:pt-16">
          <div className="grid grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-saffron">Namaskar 🙏</p>
              <h2 className="mt-2 text-2xl xl:text-3xl font-extrabold text-gray-900">{site?.about_heading ?? 'About Our Mandal'}</h2>
              <p className="mt-5 text-gray-600 leading-relaxed whitespace-pre-line line-clamp-6">{site.about_description}</p>
              <Link
                to={site?.about_button_link ?? '/more'}
                className="mt-7 inline-flex items-center gap-2 bg-saffron text-white text-sm font-extrabold px-7 py-3 rounded-full shadow-lg shadow-saffron/30 hover:-translate-y-0.5 hover:shadow-xl transition-all"
              >
                {site?.about_button_text ?? 'Read More'} <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-saffron/10 blur-2xl" aria-hidden="true" />
              {aboutImage ? (
                <img src={aboutImage} alt={site?.about_heading ?? 'About our Mandal'} className="relative rounded-3xl w-full h-[360px] object-cover shadow-xl" loading="lazy" />
              ) : (
                <div className="relative rounded-3xl h-[360px] bg-gradient-to-br from-saffron/15 via-orange-100 to-cream flex items-center justify-center shadow-xl">
                  <span className="font-devanagari text-7xl text-saffron/30">श्री</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 10 / MEMBERS ───────────────────────────────────────── */}
      {membersWidget.length > 0 && (
        <section className="app-container pt-12 xl:pt-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl xl:text-3xl font-extrabold text-gray-900">Our Members</h2>
            <Link to="/members" className="inline-flex items-center gap-1.5 text-sm font-bold text-saffron hover:gap-2.5 transition-all">
              View All Members <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <div className={`mt-6 grid gap-5 ${membersWidget.length === 3 ? 'grid-cols-3' : 'grid-cols-2 xl:grid-cols-4'}`}>
            {membersWidget.map((member) => (
              <Link key={member.user_id} to="/members" className="group card p-6 flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-xl transition-all">
                {member.profile_photo_url ? (
                  <img
                    src={member.profile_photo_url}
                    alt={member.full_name}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-saffron/20 group-hover:ring-saffron/40 transition-all"
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="w-20 h-20 rounded-full text-white text-2xl font-bold flex items-center justify-center ring-4 ring-saffron/20 group-hover:ring-saffron/40 transition-all"
                    style={{ backgroundColor: getAvatarColor(member.full_name) }}
                  >
                    {getInitials(member.full_name)}
                  </span>
                )}
                <p className="mt-3 font-bold text-gray-900 truncate max-w-full">{member.full_name}</p>
                {member.position && <p className="text-xs font-semibold text-saffron mt-1">{member.position}</p>}
                {member.village && <p className="text-xs text-gray-400 mt-1">{member.village}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 11 / GALLERY PREVIEW + LIGHTBOX ────────────────────── */}
      {galleryPreview.length > 0 && (
        <section className="app-container pt-12 xl:pt-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl xl:text-3xl font-extrabold text-gray-900">Gallery</h2>
            <Link to="/gallery" className="inline-flex items-center gap-1.5 text-sm font-bold text-saffron hover:gap-2.5 transition-all">
              View All <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {galleryPreview.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightbox(img)}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-orange-100 shadow-sm hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-saffron transition-shadow"
                aria-label={`Open photo: ${img.title || 'Mandal photo'}`}
              >
                <img src={img.image_url} alt={img.title || 'Mandal photo'} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                <span className="absolute bottom-3 left-3 right-3 text-left text-white text-sm font-semibold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all truncate">
                  {img.title || 'Mandal photo'}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 md:p-10"
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close preview"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img src={lightbox.image_url} alt={lightbox.title || 'Mandal photo'} className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain" />
          {lightbox.title && <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-lg font-semibold px-5 py-2 rounded-full bg-black/50">{lightbox.title}</p>}
        </div>
      )}

      {/* ── 13 / FOOTER ────────────────────────────────────────── */}
      <footer className="mt-14 xl:mt-20 bg-gradient-to-b from-maroon to-[#5c0a0a] text-white">
        <div className="app-container py-12 grid grid-cols-3 gap-10">
          <div className="col-span-1">
            <div className="flex items-center gap-3">
              {site?.logo_url ? (
                <img src={site.logo_url} alt="Mandal logo" className="w-12 h-12 rounded-xl object-contain bg-white p-0.5 shadow shrink-0" loading="lazy" />
              ) : (
                <span className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-devanagari font-bold">श्री</span>
              )}
              <div className="min-w-0">
                <p className="font-extrabold text-lg leading-tight truncate">{mandalName}</p>
                <p className="text-sm text-white/70">{mandalVillage}</p>
              </div>
            </div>
            <p className="mt-4 text-white/70 text-sm leading-relaxed max-w-sm">
              {mandal?.history || 'भक्ती, संस्कृती आणि सामाजिक बांधिलकी — a community temple mandal celebrating Ganeshotsav every year.'}
            </p>
            <div className="mt-5 flex items-center gap-3">
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-saffron transition-colors">
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-saffron transition-colors">
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}
              {social.youtube && (
                <a href={social.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-saffron transition-colors">
                  <YoutubeIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <p className="font-extrabold text-base tracking-wide">Quick Links</p>
            <ul className="mt-4 space-y-2.5 text-white/75 text-sm">
              <li><Link to="/aarti" className="hover:text-gold transition-colors">Aarti</Link></li>
              <li><Link to="/programs" className="hover:text-gold transition-colors">Programs</Link></li>
              <li><Link to="/gallery" className="hover:text-gold transition-colors">Gallery</Link></li>
              <li><Link to="/donation" className="hover:text-gold transition-colors">Donation</Link></li>
              <li><Link to="/more" className="hover:text-gold transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-extrabold text-base tracking-wide">Donation</p>
            <p className="mt-4 text-white/75 text-sm leading-relaxed">
              {donation?.instructions || 'Support our Mandal and keep the Ganeshotsav celebrations alive every year.'}
            </p>
            <Link to="/donation" className="mt-5 inline-flex items-center gap-2 bg-saffron text-white text-sm font-extrabold px-6 py-3 rounded-full hover:bg-[#e55f00] transition-colors">
              <span aria-hidden="true">💚</span> Donate Now
            </Link>
          </div>
        </div>
        <div className="border-t border-white/15">
          <div className="app-container flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm text-white/80">© {year} {mandalName} · {mandalVillage}</p>
            <p className="font-devanagari text-gold/90 font-semibold">🙏 गणपती बाप्पा मोरया 🙏</p>
          </div>
        </div>
      </footer>
    </div>
  )
}