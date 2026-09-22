/**
 * Calendar date/time helpers — the Mandal uses Asia/Kolkata.
 * We format display strings with the IST timezone so browser timezone
 * differences can never move an event to another date.
 */

export const KOLKATA = 'Asia/Kolkata'

/** Calendar event type options (labels used in filters + admin pickers). */
export const EVENT_TYPE_OPTIONS = [
  { value: 'aarti', label: '🙏 Aarti' },
  { value: 'program', label: '📅 Program' },
  { value: 'meeting', label: '🤝 Meeting' },
  { value: 'festival', label: '🎉 Festival' },
  { value: 'announcement', label: '📢 Announcement' },
  { value: 'donation', label: '💰 Donation Event' },
  { value: 'cultural', label: '🏆 Cultural Event' },
  { value: 'other', label: '📌 Other' },
]

/** A date "now" in IST (components preserved as if local). */
export function nowIST(): Date {
  const s = new Date().toLocaleString('en-US', { timeZone: KOLKATA })
  return new Date(s)
}

export function formatKolkataDate(d: Date | string, opts: Intl.DateTimeFormatOptions = {}): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-IN', { timeZone: KOLKATA, ...opts })
}

export function formatKolkataTime(d: Date | string, opts: Intl.DateTimeFormatOptions = {}): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleTimeString('en-IN', { timeZone: KOLKATA, hour: 'numeric', minute: '2-digit', hour12: true, ...opts })
}

export function formatKolkataDateTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString('en-IN', { timeZone: KOLKATA, day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

export function dayKeyIST(d: Date): string {
  const s = new Intl.DateTimeFormat('en-CA', { timeZone: KOLKATA }).format(d)
  return s
}

export function startOfDayIST(d: Date): Date {
  const s = new Date(d)
  s.setHours(0, 0, 0, 0)
  return s
}

export function endOfDayIST(d: Date): Date {
  const s = new Date(d)
  s.setHours(23, 59, 59, 999)
  return s
}

export function addDaysIST(d: Date, days: number): Date {
  const s = new Date(d)
  s.setDate(s.getDate() + days)
  return s
}

export function startOfWeekMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDaysIST(d, diff)
}

export function sameDayIST(a: Date, b: Date): boolean {
  return dayKeyIST(a) === dayKeyIST(b)
}

/** Safely parse a DB timestamptz into a Date (always UTC-based). */
export function parseEventDate(value: string): Date {
  return new Date(value)
}

/** YYYY-MM-DD of a timestamptz in IST (for `<input type="date">` values). */
export function formatDateInputValue(value: string | null | undefined): string | null {
  if (!value) return null
  const s = new Intl.DateTimeFormat('en-CA', { timeZone: KOLKATA }).format(new Date(value))
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}

/** Weekday short labels Monday-first (for calendar headers). */
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']