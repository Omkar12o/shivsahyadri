import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Loader2, ShieldAlert } from 'lucide-react'
import { chatService, type ChatMessageRow } from '@/services/chatService'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import ConfirmDialog from '@/components/ConfirmDialog'
import { cn, getAvatarColor, getInitials, formatChatTime } from '@/utils'

export default function AdminChat() {
  const { profile } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const [messages, setMessages] = useState<ChatMessageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ChatMessageRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [hardDeleteTarget, setHardDeleteTarget] = useState<ChatMessageRow | null>(null)
  const [hardDeleting, setHardDeleting] = useState(false)
  const softDeleteRef = useRef(false)

  const isSuperAdmin = profile?.role === 'super_admin'

  const load = () =>
    chatService
      .listAll(300)
      .then(setMessages)
      .catch(e => toastError(e instanceof Error ? e.message : 'Failed to load chat.'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
    const ch = supabase
      .channel('admin-chat-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(
    () =>
      messages.filter(m =>
        !q ||
        (m.message ?? '').toLowerCase().includes(q.toLowerCase()) ||
        (m.sender?.full_name ?? '').toLowerCase().includes(q.toLowerCase()),
      ),
    [messages, q],
  )

  const softDelete = async () => {
    if (!deleteTarget || softDeleteRef.current) return
    softDeleteRef.current = true
    setDeleting(true)
    try {
      await chatService.softDelete(deleteTarget.id)
      toastSuccess('✓ Message deleted')
      setDeleteTarget(null)
      load()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to delete message.')
    } finally {
      setDeleting(false)
      softDeleteRef.current = false
    }
  }

  const hardDelete = async () => {
    if (!hardDeleteTarget || softDeleteRef.current) return
    softDeleteRef.current = true
    setHardDeleting(true)
    try {
      await chatService.hardDelete(hardDeleteTarget.id)
      toastSuccess('✓ Message permanently deleted')
      setHardDeleteTarget(null)
      load()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to permanently delete message.')
    } finally {
      setHardDeleting(false)
      softDeleteRef.current = false
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">💬 Community Chat</h1>
          <p className="text-sm text-gray-500">Moderate the member chat — search, soft delete (admin) and permanently delete (Super Admin).</p>
        </div>
      </div>

      <div className="relative mt-4 max-w-sm">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input className="input pl-10" placeholder="Search messages / members…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="card mt-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-500">{filtered.length} messages</p>
          {isSuperAdmin && (
            <span className="inline-flex items-center gap-1 text-[11px] text-saffron font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" /> Super Admin
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-saffron animate-spin" aria-hidden="true" />
          </div>
        ) : (
          <div className="mt-2 space-y-2 max-h-[70vh] overflow-y-auto">
            {filtered.length === 0 && <p className="py-10 text-center text-gray-500">No messages found.</p>}
            {filtered.map(m => (
              <div key={m.id} className={cn('p-3 rounded-xl border', m.deleted_at ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-gray-100')}>
                <div className="flex items-center gap-2">
                  {m.sender?.profile_photo_url ? (
                    <img src={m.sender.profile_photo_url} alt="" className="h-7 w-7 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white', m.sender ? getAvatarColor(m.sender.full_name ?? '?') : 'bg-gray-400')}>
                      {m.sender ? getInitials(m.sender.full_name ?? '?') : '?'}
                    </div>
                  )}
                  <span className="font-semibold text-sm text-gray-800">{m.sender?.full_name ?? 'Unknown'}</span>
                  {(m.sender?.role === 'admin' || m.sender?.role === 'super_admin') && (
                    <span className="text-[10px] font-bold text-saffron bg-saffron/10 px-1.5 py-0.5 rounded">🛡️ Admin</span>
                  )}
                  <span className="text-xs text-gray-400">{formatChatTime(m.created_at)}</span>
                  {m.deleted_at && <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-auto">Deleted</span>}
                </div>
                <p className={cn('text-sm mt-1.5 whitespace-pre-wrap break-words', m.deleted_at && 'line-through text-gray-400 italic')}>
                  {m.deleted_at ? 'This message was deleted' : m.message}
                </p>
                {!m.deleted_at && (
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => setDeleteTarget(m)} className="btn-outline text-xs px-3 py-1 text-red-600 border-red-300 hover:bg-red-50">Delete</button>
                    {isSuperAdmin && (
                      <button onClick={() => setHardDeleteTarget(m)} className="btn-danger text-xs px-3 py-1">Permanently Delete</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this message?"
        message={<><b>"{deleteTarget?.message?.slice(0, 80) ?? 'This message was deleted'}"</b><br />This action cannot be undone for members.</>}
        confirmLabel="Delete Message"
        busy={deleting}
        onConfirm={softDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(hardDeleteTarget)}
        title="Permanently Delete Chat Message"
        message={<>This removes the message <b>permanently</b> from the database. This cannot be undone.</>}
        confirmLabel="Delete Forever"
        busy={hardDeleting}
        onConfirm={hardDelete}
        onCancel={() => setHardDeleteTarget(null)}
      />
    </div>
  )
}