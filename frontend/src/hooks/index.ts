import { useEffect, useMemo, useState } from 'react'
import { getCooldownRemaining, setCooldown } from '@/utils'

export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

/**
 * Countdown for email/rate-limit actions. Persists across reloads via
 * localStorage so rapid retries against Supabase email endpoints are blocked.
 */
export function useCooldown(key: string) {
  const [remaining, setRemaining] = useState(() => getCooldownRemaining(key))

  useEffect(() => {
    const update = () => setRemaining(getCooldownRemaining(key))
    update()
    const id = window.setInterval(update, 1000)
    return () => window.clearInterval(id)
  }, [key])

  const start = (seconds: number) => {
    setCooldown(key, seconds)
    setRemaining(seconds)
  }

  return { remaining, start }
}

export function useCountdown(target?: string | null) {
  const targetTime = useMemo(() => (target ? new Date(target).getTime() : null), [target])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  return useMemo(() => {
    if (!targetTime) return null
    const diff = targetTime - now
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, completed: true }
    }
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff / 3600000) % 24),
      minutes: Math.floor((diff / 60000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      completed: false,
    }
  }, [targetTime, now])
}

export function usePagination(totalItems: number, pageSize = 10) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  if (page > totalPages) {
    setPage(totalPages)
  }

  return { page, setPage, pageSize, totalPages }
}
