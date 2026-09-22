import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Loader2, Users, MessageSquare, Copy, Trash2, ChevronUp, X } from 'lucide-react'
import { chatService, type ChatMessageRow } from '@/services/chatService'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useChatUnread } from '@/contexts/ChatUnreadContext'
import { useToast } from '@/components/ToastProvider'
import ConfirmDialog from '@/components/ConfirmDialog'
import { cn, getAvatarColor, getInitials, formatChatTime } from '@/utils'
import { isAdminRole, type Profile } from '@/types'

const PAGE = 50
const OLDER_PAGE = 25

export default function MemberChat() {
  const { profile } = useAuth()
  const { resetChatUnread } = useChatUnread()
  const { success: toastSuccess, error: toastError } = useToast()
  const nav = useNavigate()
  const [messages, setMessages] = useState<ChatMessageRow[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [sending, setSending] = useState(false)
  const [online, setOnline] = useState(0)
  const [action, setAction] = useState<ChatMessageRow | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ChatMessageRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const oldestRef = useRef<ChatMessageRow | null>(null)
  const loadingOlderRef = useRef(false)
  const stickRef = useRef(true)
  const scrollFixRef = useRef<{ prevHeight: number } | null>(null)
  const sentRef = useRef(false)

  const sorted = useCallback(
    (msgs: ChatMessageRow[]) =>
      msgs
        .slice()
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime() ||
            a.id.localeCompare(b.id),
        ),
    [],
  )

  const merge = useCallback(
    (next: ChatMessageRow[], msg: ChatMessageRow) => {
      const idx = next.findIndex((m) => m.id === msg.id)
      if (idx < 0) return sorted([...next, msg])
      const copy = next.slice()
      copy[idx] = msg
      return copy
    },
    [sorted],
  )

  useEffect(() => {
    let unsub: (() => void) | undefined
    let presence: ReturnType<typeof supabase.channel> | null = null
    let active = true

    const members = new Map<string, Profile>()

    const attachSender = (m: ChatMessageRow): ChatMessageRow => {
      if (!m.sender && m.user_id && members.has(m.user_id)) m.sender = members.get(m.user_id) as Profile
      return m
    }

    const loadMembers = async () => {
      if (!active) return
      try {
        const { data } = await supabase.from('public_member_directory').select('id, full_name, profile_photo_url, role').limit(500)
        if (active && data) {
          for (const p of data as Profile[]) members.set(p.id, p)
        }
      } catch {
        /* non-fatal: fall back to profile embed */
      }
    }

    const init = async () => {
      await loadMembers()
      if (!active) return
      try {
        const rows = await chatService.list(PAGE)
        if (!active) return
        setMessages(rows.map(attachSender))
        oldestRef.current = rows[0] ?? null
        setHasMore(rows.length === PAGE)
        stickRef.current = true
      } catch (e) {
        if (active) toastError(e instanceof Error ? e.message : 'Failed to load chat.')
      } finally {
        if (active) setLoading(false)
      }

      unsub = chatService.subscribe(
        (msg) => {
          if (!active) return
          setMessages((prev) => {
            const wasAtBottom = stickRef.current
            const next = merge(prev, attachSender(msg))
            // Newest message arrives -> snap down if we were already at the bottom.
            if (wasAtBottom && new Date(msg.created_at).getTime() > new Date(prev[prev.length - 1]?.created_at ?? 0).getTime()) {
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
            }
            return next
          })
        },
        (id) => {
          if (active) setMessages((prev) => prev.filter((m) => m.id !== id))
        },
      )

      // Presence: online member count
      presence = supabase.channel('chat-presence', { config: { presence: { key: profile?.id ?? 'x' } } })
      presence
        .on('presence', { event: 'sync' }, () => {
          if (active && presence) setOnline(Object.keys(presence.presenceState()).length)
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED' && profile) void presence?.track({ online_at: new Date().toISOString() })
        })

      resetChatUnread()
    }

    init()

    return () => {
      active = false
      unsub?.()
      if (presence) supabase.removeChannel(presence)
      sentRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  // Keep view pinned to the bottom while reading unless the member scrolled up.
  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    stickRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  }

  // After prepending older messages, preserve the previous scroll position.
  useEffect(() => {
    if (scrollFixRef.current) {
      const el = scrollRef.current
      if (el) el.scrollTop += el.scrollHeight - scrollFixRef.current.prevHeight
      scrollFixRef.current = null
    }
  }, [messages])

  const loadOlder = useCallback(async () => {
    const before = oldestRef.current
    if (!before || loadingOlderRef.current || !hasMore) return
    loadingOlderRef.current = true
    setLoadingOlder(true)
    try {
      const el = scrollRef.current
      const prevHeight = el?.scrollHeight ?? 0
      const older = await chatService.listBefore(before, OLDER_PAGE)
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id))
        const fresh = older.filter((m) => !known.has(m.id))
        if (fresh.length) scrollFixRef.current = { prevHeight }
        return sorted([...fresh, ...prev])
      })
      oldestRef.current = older[0] ? older[0] : oldestRef.current
      setHasMore(older.length === OLDER_PAGE)
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to load older messages.')
    } finally {
      loadingOlderRef.current = false
      setLoadingOlder(false)
    }
  }, [hasMore, sorted, toastError])

  const send = useCallback(async () => {
    const message = text.trim()
    if (!message || sending || !profile) return
    if (message.length > 1000) {
      toastError('Message is too long (max 1000 characters).')
      return
    }
    setSending(true)
    sentRef.current = true
    try {
      const row = await chatService.send(profile.id, message)
      setMessages((prev) => {
        const wasAtBottom = stickRef.current
        const next = merge(prev, row)
        if (wasAtBottom) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
        return next
      })
      setText('')
      toastSuccess('✓ Message sent')
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Message could not be sent.')
    } finally {
      setSending(false)
      sentRef.current = false
      inputRef.current?.focus()
    }
  }, [text, sending, profile, toastError, toastSuccess, merge])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const resizeInput = () => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }

  const copyMessage = async () => {
    if (!action) return
    const text = action.message ?? ''
    try {
      await navigator.clipboard.writeText(text)
      toastSuccess('✓ Message copied')
    } catch {
      toastError('Could not copy the message.')
    }
    setAction(null)
  }

  const canDelete = (m: ChatMessageRow) => {
    if (m.deleted_at || !profile) return false
    const mine = m.user_id === profile.id
    const admin = isAdminRole(profile.role)
    return mine || admin
  }

  const deleteMessage = async () => {
    if (!confirmDelete || deleting) return
    setDeleting(true)
    try {
      await chatService.softDelete(confirmDelete.id)
      toastSuccess('✓ Message deleted')
      setConfirmDelete(null)
      setAction(null)
    } catch (e) {
      const raw = e instanceof Error ? e.message : ''
      toastError(/row-level security|permission denied/i.test(raw) ? "✕ You don't have permission to delete this message." : (e instanceof Error ? e.message : 'Message could not be deleted.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="h-[calc(100dvh-var(--header-h,64px)-env(safe-area-inset-bottom)-68px)] md:h-[calc(100dvh-var(--header-h,64px)-32px)] flex flex-col max-w-3xl mx-auto w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5 bg-white border-b border-gray-200 shrink-0">
        <button type="button" onClick={() => nav(-1)} className="p-1.5 -ml-1 rounded-lg text-gray-700 active:bg-saffron/10" aria-label="Go back">
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="h-10 w-10 rounded-full bg-gradient-saffron text-white flex items-center justify-center shrink-0">
          <MessageSquare className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">Community Chat</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span className={cn('w-2 h-2 rounded-full inline-block', online > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300')} />
            {online > 0 ? `${online} online now` : 'Community chat'}
          </p>
        </div>
        <span className="text-[11px] text-gray-400 hidden sm:inline">Text only · Members</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 bg-cream/40">
        {loadingOlder && (
          <div className="flex justify-center py-1">
            <Loader2 className="w-4 h-4 text-saffron animate-spin" aria-hidden="true" />
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-saffron animate-spin" aria-hidden="true" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-4xl">💬</p>
            <p className="font-bold text-gray-800 mt-3">Welcome to Community Chat</p>
            <p className="text-sm text-gray-500 mt-1">Start the conversation with your fellow members.</p>
          </div>
        ) : (
          messages.map(m => {
            const mine = m.user_id === profile?.id
            const isAdmin = m.sender?.role && (m.sender.role === 'admin' || m.sender.role === 'super_admin')
            const deleted = Boolean(m.deleted_at)
            const initials = m.sender ? getInitials(m.sender.full_name ?? '?') : '?'
            const color = m.sender ? getAvatarColor(m.sender.full_name ?? '?') : 'bg-gray-400'
            return (
              <div key={m.id} className={cn('flex gap-2.5', mine && 'flex-row-reverse')}>
                <div className="shrink-0">
                  {m.sender?.profile_photo_url ? (
                    <img src={m.sender.profile_photo_url} alt="" className="h-9 w-9 rounded-full object-cover border border-gray-200" loading="lazy" />
                  ) : (
                    <div className={cn('h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold text-white', color)}>{initials}</div>
                  )}
                </div>
                <div className={cn('max-w-[80%] sm:max-w-[75%]', mine && 'text-right')}>
                  <div className={cn('flex items-center gap-2 text-xs mb-0.5', mine && 'flex-row-reverse')}>
                    <span className="font-semibold text-gray-700">{mine ? 'You' : (m.sender?.full_name ?? 'Member')}</span>
                    {isAdmin && <span className="text-[10px] font-bold text-saffron bg-saffron/10 px-1.5 py-0.5 rounded">🛡️ Admin</span>}
                    <span className="text-gray-400">{formatChatTime(m.created_at)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAction(m)}
                    className={cn(
                      'inline-block rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words text-left shadow-sm border transition-colors',
                      mine
                        ? deleted ? 'bg-saffron/85 text-white/80 border-saffron rounded-tr-sm' : 'bg-saffron text-white border-saffron rounded-tr-sm'
                        : deleted ? 'bg-gray-100 text-gray-400 border-gray-200 rounded-tl-sm' : 'bg-white text-gray-800 border-gray-100 rounded-tl-sm',
                    )}
                  >
                    {deleted ? (
                      <span className="inline-flex items-center gap-1.5 italic text-[13px]">
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> This message was deleted
                      </span>
                    ) : (
                      <span className="flex items-start">
                        <span>{m.message}</span>
                        <span className={cn('ml-2 inline-flex items-center self-end text-[10px] shrink-0', mine ? 'text-white/70' : 'text-gray-400')}>{formatChatTime(m.created_at)}</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )
          })
        )}
        {messages.length > 0 && hasMore && (
          <button type="button" onClick={loadOlder} className="flex items-center gap-1 mx-auto text-[11px] text-gray-400 hover:text-saffron">
            <ChevronUp className="w-3 h-3" aria-hidden="true" /> Older messages
          </button>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 py-3 bg-white border-t border-gray-200">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => { if (e.target.value.length <= 1000) setText(e.target.value); resizeInput() }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={sending ? 'Sending…' : 'Type a message...'}
            className="input resize-none overflow-y-auto max-h-32 py-2.5"
            disabled={sending}
          />
          <button type="button" onClick={send} disabled={sending || !text.trim()} className="btn-primary shrink-0 !px-4" aria-label="Send">
            {sending ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Send className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <Users className="w-3 h-3" aria-hidden="true" /> Text only · Enter to send · Shift+Enter for a new line
          </p>
          {text.length > 950 && <p className={cn('text-[11px]', text.length === 1000 ? 'text-red-500' : 'text-gray-400')}>{text.length}/1000</p>}
        </div>
      </div>

      {/* Action sheet */}
      {action && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setAction(null)} aria-label="Close menu" />
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl animate-page-in">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{action.user_id === profile?.id ? 'Your message' : (action.sender?.full_name ?? 'Member')}</p>
                <p className="text-xs text-gray-400">{formatChatTime(action.created_at)}</p>
              </div>
              <button type="button" onClick={() => setAction(null)} className="p-1.5 rounded-lg text-gray-500 active:bg-saffron/10" aria-label="Close">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-2">
              <button
                type="button"
                onClick={copyMessage}
                disabled={!action.message}
                className={cn('w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-800 active:bg-saffron/10', !action.message && 'opacity-50')}
              >
                <Copy className="w-4 h-4 text-saffron" aria-hidden="true" /> Copy message
              </button>
              {canDelete(action) && (
                <button
                  type="button"
                  onClick={() => { setConfirmDelete(action); setAction(null) }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-600 active:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" /> Delete for everyone
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete this message?"
        message="This removes the message for everyone in the chat. It cannot be undone."
        confirmLabel="Delete Message"
        busy={deleting}
        onConfirm={deleteMessage}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}