import { supabase, getAccessToken } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'
import type { PushSubscription } from '@/types'

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? ''

export interface PushSendResult {
  total: number
  sent: number
  failed: number
  inactive: number
  gone: number
}

/**
 * Frontend push service.
 * The PUBLIC VAPID key may live in the client; the private key stays server-side
 * (send-push edge function uses the service role + VAPID private key).
 */
export const pushService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
  },

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null
    if (!('serviceWorker' in navigator)) return null
    try {
      return await navigator.serviceWorker.register('/sw.js')
    } catch {
      try {
        return await navigator.serviceWorker.register('/service-worker.js')
      } catch {
        return null
      }
    }
  },

  async urlBase64ToUint8Array(base64String: string): Promise<Uint8Array> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
    return outputArray
  },

  async getSubscription(): Promise<PushSubscriptionJSON | null> {
    if (!this.isSupported()) return null
    const reg = await this.register()
    if (!reg) return null
    return (await reg.pushManager.getSubscription()) as PushSubscriptionJSON | null
  },

  /**
   * Reads the VAPID public key from an injected global (set by Vite env).
   * Fallback: a public placeholder that just won't subscribe.
   */
  getVapidPublicKey(): string {
    return (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? ''
  },

  async subscribe(authUserId: string): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null
    const vapidPublicKey = this.getVapidPublicKey()
    if (!vapidPublicKey) {
      throw new Error('VAPID public key is not configured. Add VITE_VAPID_PUBLIC_KEY to .env')
    }
    const reg = await this.register()
    if (!reg) {
      throw new Error('Service worker is not available on this device/browser.')
    }
    const applicationServerKey = await this.urlBase64ToUint8Array(vapidPublicKey)
    const keyBytes = applicationServerKey.buffer as ArrayBuffer
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes,
    })
    const raw = sub.toJSON()
    if (!raw.endpoint || !raw.keys?.p256dh || !raw.keys?.auth) {
      throw new Error('Push subscription is incomplete.')
    }
    const { endpoint, keys } = raw as { endpoint: string; keys: { p256dh: string; auth: string } }
    const payload = {
      auth_user_id: authUserId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      device_type: detectDeviceType(),
      browser: detectBrowser(),
    }
    const { data, error } = await supabase.from('push_subscriptions').upsert(payload).select('*').single()
    if (error) throw new Error(getErrorMessage(error))
    return data as PushSubscription
  },

  async unsubscribe(authUserId: string): Promise<void> {
    const reg = await this.register()
    const sub = reg ? await reg.pushManager.getSubscription() : null
    if (sub) await sub.unsubscribe()
    const { error } = await supabase
      .from('push_subscriptions')
      .update({ active: false })
      .eq('auth_user_id', authUserId)
      .eq('active', true)
    if (error) throw new Error(getErrorMessage(error))
  },

  async listMySubscriptions(authUserId: string): Promise<PushSubscription[]> {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('auth_user_id', authUserId)
      .eq('active', true)
      .order('created_at', { ascending: false })
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as PushSubscription[]
  },

  /** Admin sends a push to subscribed members via the secure backend. */
  async send(payload: { title: string; body?: string; url?: string; recipient_ids?: string[]; to_all?: boolean }): Promise<PushSendResult> {
    if (API_BASE_URL) {
      try {
        const token = await getAccessToken()
        const res = await fetch(`${API_BASE_URL}/api/push/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        })
        const data = (await res.json()) as PushSendResult & { error?: string }
        if (!res.ok) throw new Error(data.error ?? `Push request failed (${res.status})`)
        return data
      } catch (e) {
        console.warn('Backend push failed, falling back to edge function:', e)
      }
    }
    const { data, error } = await supabase.functions.invoke<PushSendResult>('send-push', { body: payload })
    if (error) throw new Error(getErrorMessage(error))
    return data ?? { total: 0, sent: 0, failed: 0, inactive: 0, gone: 0 }
  },
}

function detectDeviceType(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  if (/Mac|Windows|Linux/.test(ua)) return 'desktop'
  return 'unknown'
}

function detectBrowser(): string | null {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent
  if (/Edg\//.test(ua) || /Edge\//.test(ua)) return 'edge'
  if (/OPR\//.test(ua)) return 'opera'
  if (/Chrome\//.test(ua)) return 'chrome'
  if (/Firefox\//.test(ua)) return 'firefox'
  if (/Safari\//.test(ua)) return 'safari'
  return null
}

/** Minimal shape mirroring the browser PushSubscription before storage. */
export interface PushSubscriptionJSON {
  endpoint: string
  keys?: { p256dh?: string; auth?: string }
}