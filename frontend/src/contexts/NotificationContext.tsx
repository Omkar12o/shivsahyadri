import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { notificationService } from '@/services/notificationService'
import type { Notification } from '@/types'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const profileIdRef = useRef<string | null>(null)

  const refresh = useCallback(async () => {
    if (!profile) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    profileIdRef.current = profile.id
    try {
      const items = await notificationService.listForProfile(profile.id)
      setNotifications(items)
      setUnreadCount(items.filter((item) => !item.is_read).length)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!profile) return
    const unsubscribe = notificationService.subscribe((incoming) => {
      setNotifications((prev) => {
        if (prev.some((item) => item.id === incoming.id)) return prev
        return [{ ...incoming, is_read: false }, ...prev]
      })
      setUnreadCount((count) => count + 1)
    })
    return unsubscribe
  }, [profile])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const profileId = profileIdRef.current
      if (!profileId) return
      setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item)))
      setUnreadCount((count) => Math.max(0, count - 1))
      try {
        await notificationService.markRead(notificationId, profileId)
      } catch (err) {
        console.error(err)
        await refresh()
      }
    },
    [refresh],
  )

  const markAllAsRead = useCallback(async () => {
    const profileId = profileIdRef.current
    if (!profileId) return
    const unreadIds = notifications.filter((item) => !item.is_read).map((item) => item.id)
    if (unreadIds.length === 0) return
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })))
    setUnreadCount(0)
    try {
      await notificationService.markAllRead(unreadIds, profileId)
    } catch (err) {
      console.error(err)
      await refresh()
    }
  }, [notifications, refresh])

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, error, refresh, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
