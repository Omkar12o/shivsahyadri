import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  })
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export function formatDateTime(date: string, time: string): string {
  return `${formatDate(date)} at ${formatTime(time)}`
}

export function getRelativeTime(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function isToday(date: string): boolean {
  const today = new Date()
  const target = new Date(date)
  return today.toDateString() === target.toDateString()
}

export function isBirthdayToday(dateOfBirth: string): boolean {
  const today = new Date()
  const dob = new Date(dateOfBirth)
  return today.getMonth() === dob.getMonth() && today.getDate() === dob.getDate()
}

export function getAge(dateOfBirth: string): number {
  const today = new Date()
  const dob = new Date(dateOfBirth)
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile.replace(/\D/g, ''))
}

export function validateUserId(userId: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(userId)
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }
  return { valid: true, message: '' }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-saffron',
    'bg-primary-600',
    'bg-primary-700',
    'bg-amber-600',
    'bg-orange-600',
    'bg-red-600',
    'bg-pink-600',
    'bg-rose-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  return validTypes.includes(file.type)
}

export function checkImageFile(file: File, maxMb = 10): { ok: boolean; message?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return { ok: false, message: 'Please upload a JPG, JPEG, PNG or WEBP image.' }
  }
  if (file.size > maxMb * 1024 * 1024) {
    return { ok: false, message: `Image is too large. Maximum size is ${maxMb} MB.` }
  }
  return { ok: true }
}

export function isValidAudioFile(file: File): boolean {
  const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
  return validTypes.includes(file.type)
}

export function getTimeInIST(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
}

export function formatISTDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

export function formatISTTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })
}

/** Alias kept for components that expect formatRelativeTime. */
export function formatRelativeTime(date: string): string {
  return getRelativeTime(date)
}

/** Compact chat timestamp in Asia/Kolkata, e.g. "10:32 AM". */
export function formatChatTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDateInput(date: string | Date | null): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-CA')
}

export function formatBirthday(dateOfBirth: string | null): string {
  if (!dateOfBirth) return 'Not set'
  const d = new Date(dateOfBirth)
  if (Number.isNaN(d.getTime())) return 'Not set'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
}

export function getYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

export function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback
  if (typeof error === 'string') return error
  if (typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    const message = (error as { message: string }).message
    if (/duplicate key|23505/i.test(message)) {
      return 'That value already exists. Please choose another.'
    }
    if (/row-level security|permission denied|42501/i.test(message)) {
      return 'You do not have permission to perform this action.'
    }
    if (/invalid login credentials/i.test(message)) {
      return 'Invalid User ID or Password.'
    }
    if (/network|fetch/i.test(message)) {
      return 'Network error. Please check your internet connection.'
    }
    return message
  }
  return fallback
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

const memoryCooldowns: Record<string, number> = {}

/** Persist a cooldown (seconds) so email actions can't be spammed across reloads. */
export function setCooldown(key: string, seconds: number): void {
  const until = Date.now() + seconds * 1000
  memoryCooldowns[key] = until
  try {
    localStorage.setItem(`mandal:cooldown:${key}`, String(until))
  } catch {
    /* memory-only fallback */
  }
}

/** Seconds remaining for a cooldown key (0 = no cooldown active). */
export function getCooldownRemaining(key: string): number {
  let until = memoryCooldowns[key] ?? 0
  try {
    const stored = Number(localStorage.getItem(`mandal:cooldown:${key}`))
    if (stored && stored > until) until = stored
  } catch {
    /* memory-only fallback */
  }
  if (!until) return 0
  const remaining = Math.ceil((until - Date.now()) / 1000)
  return remaining > 0 ? remaining : 0
}

export function sortByDateDesc<T extends Record<string, unknown>>(items: T[], key: keyof T): T[] {
  return [...items].sort((a, b) => {
    const aVal = new Date(String(a[key] ?? '')).getTime()
    const bVal = new Date(String(b[key] ?? '')).getTime()
    return (Number.isNaN(bVal) ? 0 : bVal) - (Number.isNaN(aVal) ? 0 : aVal)
  })
}