import { useEffect, useState } from 'react'
import { Bell, BellOff, Check, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { pushService } from '@/services/pushService'
import { useToast } from '@/components/ToastProvider'
import { cn } from '@/utils'

/**
 * Member Push Notifications panel.
 * NEVER asks on first page load. Member enables explicitly after seeing the
 * benefit. Handles VAPID subscription + saves it in Supabase push_subscriptions.
 */
export default function PushNotificationPanel({
  onStatusChange,
}: {
  onStatusChange?: (enabled: boolean) => void
}) {
  const { user, profile } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const [status, setStatus] = useState<'loading' | 'unsupported' | 'off' | 'enabled'>('loading')
  const [busy, setBusy] = useState(false)

  const refreshStatus = async () => {
    if (!pushService.isSupported()) {
      setStatus('unsupported')
      return
    }
    try {
      const sub = await pushService.getSubscription()
      setStatus(sub ? 'enabled' : 'off')
    } catch {
      setStatus('off')
    }
  }

  useEffect(() => {
    refreshStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    onStatusChange?.(status === 'enabled')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const enable = async () => {
    if (!user || !profile) return
    setBusy(true)
    try {
      await pushService.subscribe(user.id)
      setStatus('enabled')
      toastSuccess('✓ Notifications enabled for this device.')
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Could not enable notifications.')
      await refreshStatus()
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    if (!user) return
    setBusy(true)
    try {
      await pushService.unsubscribe(user.id)
      setStatus('off')
      toastSuccess('Notifications disabled for this device.')
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Could not disable notifications.')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'unsupported') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-3">
        <BellOff className="w-5 h-5 text-gray-400 shrink-0" aria-hidden="true" />
        <p className="text-sm text-gray-600">
          Browser push isn't supported on this device. You'll still get notifications inside the app (🔔).
        </p>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="rounded-2xl border border-saffron/20 bg-saffron/5 p-4 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-saffron animate-spin shrink-0" aria-hidden="true" />
        <p className="text-sm text-gray-600">Checking notification status…</p>
      </div>
    )
  }

  if (status === 'enabled') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-green-800">Notifications enabled</p>
            <p className="text-xs text-green-700">This device will receive push notifications for announcements & events.</p>
          </div>
          <button type="button" onClick={disable} disabled={busy} className="btn-outline text-xs px-3 py-1.5 shrink-0">
            {busy ? '…' : 'Disable'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-saffron/25 bg-gradient-to-br from-saffron/10 to-primary-100/40 p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-saffron text-white flex items-center justify-center shrink-0 shadow-md shadow-saffron/30">
          <Bell className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900">Enable Push Notifications</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Get instant alerts for <b>Aarti</b> updates, <b>Program</b> & <b>Festival</b> announcements and
            important notices — even when the app is closed.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={enable} disabled={busy} className="btn-primary text-sm px-4 py-2">
              {busy && <Loader2 className="w-4 h-4 mr-1.5 inline animate-spin" aria-hidden="true" />}
              <Bell className={cn('w-4 h-4 mr-1.5', busy && 'hidden')} aria-hidden="true" />
              {busy ? 'Enabling…' : 'Enable Notifications'}
            </button>
            {profile && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Check className="w-3.5 h-3.5" aria-hidden="true" /> Saves securely for your account.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}