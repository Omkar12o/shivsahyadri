import { useEffect, useMemo, useState } from 'react'
import { Bell, Plus, Send, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { notificationService } from '@/services/notificationService'
import { pushService } from '@/services/pushService'
import { birthdayService } from '@/services/birthdayService'
import { memberService } from '@/services/memberService'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import ConfirmDialog from '@/components/ConfirmDialog'
import { getInitials, getAvatarColor, cn } from '@/utils'
import type { Notification, NotificationType } from '@/types'

type Target = 'all_members' | 'active_members' | 'specific_member'

const TYPE_ICONS: Record<NotificationType, string> = {
  announcement: '📢',
  program: '📅',
  aarti: '🙏',
  birthday: '🎂',
  system: '⚙️',
}

export default function AdminNotifications() {
  const { profile } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const [items, setItems] = useState<Notification[]>([])
  const [members, setMembers] = useState<Array<{ id: string; full_name: string; profile_photo_url: string | null }>>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', type: 'announcement' as NotificationType, target: 'all_members' as Target, link: '', memberId: '' })
  const [pushEnabled, setPushEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [lastStats, setLastStats] = useState<{ sent: number; failed: number } | null>(null)
  const [justNow, setJustNow] = useState(false)

  const load = () => notificationService.listForProfile(profile?.id ?? '10000000000000000000000000000000').then(setItems)
  const loadMembers = () => memberService.listMembers({ role: 'member', pageSize: 500 }).then(r => setMembers(r.data as never))
  useEffect(() => {
    if (profile?.id) load()
    loadMembers()
  }, [profile?.id])

  const subscribersCount = useMemo(() => 0, [])
  void subscribersCount

  const valid = form.title.trim().length > 0 && form.message.trim().length > 0

  const openComposer = () => {
    setForm({ title: '', message: '', type: 'announcement', target: 'all_members', link: '', memberId: '' })
    setPushEnabled(true)
    setLastStats(null)
    setJustNow(false)
    setOpen(true)
  }

  const buildUrl = () => form.link.trim() || '/member/notifications'

  const confirmSend = async () => {
    setBusy(true)
    try {
      await notificationService.create({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        related_member_id: form.target === 'specific_member' && form.memberId ? form.memberId : null,
        related_program_id: null,
        birthday_date: null,
      })
      toastSuccess('✓ Notification published to the in-app center.')

      let pushStats = { sent: 0, failed: 0, total: 0 }
      if (pushEnabled) {
        const recipients = form.target === 'specific_member' && form.memberId ? [form.memberId] : []
        try {
          const res = await pushService.send({
            title: form.title.trim(),
            body: form.message.trim(),
            url: buildUrl(),
            recipient_ids: recipients,
            to_all: form.target !== 'specific_member',
          })
          pushStats = res
          setLastStats({ sent: res.sent, failed: res.failed })
        } catch {
          setLastStats({ sent: 0, failed: -1 })
        }
      }

      if (pushStats.failed > 0) {
        toastSuccess(`✓ Notification sent to ${pushStats.sent} devices, but ${pushStats.failed} could not be notified.`)
      } else if (pushEnabled) {
        toastSuccess(`✓ Push notification sent to ${pushStats.sent} devices.`)
      }

      setOpen(false)
      setJustNow(true)
      load()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Could not send notification.')
    } finally {
      setBusy(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">🔔 Notification Center</h1>
          <p className="text-sm text-gray-500">Send in-app + push notifications to members.</p>
        </div>
        <button className="btn-primary text-sm" onClick={openComposer}>
          <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" /> New Notification
        </button>
      </div>

      {/* Composer */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Send Notification</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl px-2" aria-label="Close">✕</button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="label">Title *</label>
                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Evening Aarti Update" />
              </div>
              <div>
                <label className="label">Message *</label>
                <textarea className="input" rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="e.g. Today's Aarti starts at 7:30 PM at the Mandap." />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as NotificationType })}>
                    {(Object.keys(TYPE_ICONS) as NotificationType[]).map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Target *</label>
                  <select className="input" value={form.target} onChange={e => setForm({ ...form, target: e.target.value as Target })}>
                    <option value="all_members">All Members</option>
                    <option value="active_members">Active Members</option>
                    <option value="specific_member">Specific Member</option>
                  </select>
                </div>
              </div>
              {form.target === 'specific_member' && (
                <div>
                  <label className="label">Select Member</label>
                  <select className="input" value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })}>
                    <option value="">Choose a member…</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Link (optional)</label>
                <input className="input" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="/aarti or /programs or /calendar or /gallery" />
                <p className="text-xs text-gray-400 mt-1">Opened when the member taps the notification.</p>
              </div>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="w-4 h-4 mt-0.5 accent-saffron" checked={pushEnabled} onChange={e => setPushEnabled(e.target.checked)} />
                <span>
                  <b>Send push notification to members</b>
                  <span className="block text-xs text-gray-500">Send to subscribed devices via secure push. Requires VITE_VAPID_PUBLIC_KEY + server VAPID keys.</span>
                </span>
              </label>
            </div>

            {lastStats && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
                  <p className="text-xs text-green-700 font-bold">Sent</p>
                  <p className="text-2xl font-bold text-green-800">{lastStats.sent}</p>
                </div>
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
                  <p className="text-xs text-red-700 font-bold">Failed</p>
                  <p className="text-2xl font-bold text-red-800">{lastStats.failed < 0 ? '?' : lastStats.failed}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button className="btn-primary flex-1" disabled={!valid || busy} onClick={() => setConfirmOpen(true)}>
                <Send className="w-4 h-4 mr-1.5" aria-hidden="true" /> {busy ? 'Sending…' : 'Send Notification'}
              </button>
              <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        title="Send notification to members?"
        message={`You are about to notify ${form.target === 'specific_member' ? 'the selected member' : 'subscribed members'}.${pushEnabled ? ' A push notification will also be sent where supported.' : ''}`}
        confirmLabel="Send Notification"
        busy={busy}
        onConfirm={confirmSend}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Stats strip */}
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="card p-4"><p className="text-sm text-gray-500">Total sent (push)</p><p className="text-3xl font-bold">{items.length}</p></div>
        <div className="card p-4"><p className="text-sm text-gray-500">In-app notifications</p><p className="text-3xl font-bold">{items.length}</p></div>
        <div className="card p-4"><p className="text-sm text-gray-500">Members</p><p className="text-3xl font-bold">{members.length}</p></div>
      </div>

      {/* History */}
      <div className="mt-6">
        <h2 className="font-bold mt-6 mb-2">Notification History</h2>
        {justNow && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-2 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Notification sent successfully
          </p>
        )}
        <div className="space-y-2">
          {items.length === 0 && <p className="card p-6 text-center text-gray-500">No notifications sent yet.</p>}
          {items.map(n => (
            <div key={n.id} className="card p-4 flex justify-between items-center gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl shrink-0">{TYPE_ICONS[n.type as NotificationType] ?? '📢'}</span>
                <div className="min-w-0">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{String(n.message)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {n.type} • {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button onClick={async () => { await notificationService.remove(n.id).catch(() => {}); load() }} className="text-red-600 text-xs hover:underline shrink-0">Delete</button>
            </div>
          ))}
        </div>
      </div>

      {/* Birthday check */}
      <div className="card mt-6 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎂</span>
          <div>
            <p className="font-bold">Birthday notifications</p>
            <p className="text-xs text-gray-500">Generates today's birthday notifications for members who made birthdays visible.</p>
          </div>
        </div>
        <button className="btn-outline text-sm" onClick={async () => {
          try {
            const n = await birthdayService.runCheck()
            toastSuccess(`Created ${n} birthday notification(s).`)
            load()
          } catch (e) { toastError(e instanceof Error ? e.message : 'Birthday check failed.') }
        }}>Run Birthday Check</button>
      </div>
    </div>
  )
}