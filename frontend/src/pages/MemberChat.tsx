import { useCallback, useEffect, useRef, useState } from 'react'
import { Send, Loader2, Users, MessageSquare } from 'lucide-react'
import { chatService, type ChatMessageRow } from '@/services/chatService'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { cn, getAvatarColor, getInitials, formatChatTime } from '@/utils'
import type { Profile } from '@/types'

export default function MemberChat() {
  const { profile } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const [messages, setMessages] = useState<ChatMessageRow[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [online, setOnline] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sentRef = useRef(false)

  useEffect(() => {
    let unsub: (() => void) | undefined
    let presence: ReturnType<typeof supabase.channel> | null = null
    let active = true

    const members = new Map<string, Profile>()
    let memberCount = 0

    const attachSender = (m: ChatMessageRow): ChatMessageRow => {
      if (!m.sender && members.has(m.user_id)) m.sender = members.get(m.user_id) as Profile
      return m
    }

    const loadMembers = async () => {
      if (!active) return
      try {
        const { data } = await supabase.from('public_member_directory').select('id, full_name, profile_photo_url, role').limit(500)
        if (active && data) {
          for (const p of data as Profile[]) members.set(p.id, p)
          memberCount = data.length
        }
      } catch {
        /* non-fatal: fall back to profile embed */
      }
    }

    const init = async () => {
      await loadMembers()
      if (!active) return
      try {
        const rows = await chatService.list(200)
        if (active) setMessages(rows.map(attachSender))
      } catch (e) {
        if (active) toastError(e instanceof Error ? e.message : 'Failed to load chat.')
      } finally {
        if (active) setLoading(false)
      }

      // Realtime new + soft-deleted messages
      unsub = chatService.subscribe(
        (msg) => {
          if (!active) return
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, attachSender(msg)].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          })
        },
        (id) => {
          if (active) setMessages(prev => prev.filter(m => m.id !== id))
        },
      )

      // Presence: online member count
      presence = supabase.channel('chat-presence', { config: { presence: { key: profile?.id ?? 'x' } } })
      presence
        .on('presence', { event: 'sync' }, () => {
          if (active) setOnline(presence?.presenceState<{ online_at: string }>() ? Object.keys(presence.presenceState()).length : 0)
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED' && profile) {
            const tracked = presence?.track({ online_at: new Date().toISOString() })
            void tracked
          }
        })
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

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const send = useCallback(async () => {
    const message = text.trim()
    if (!message || sending) return
    if (!profile) return
    if (message.length > 1000) {
      toastError('Message is too long (max 1000 characters).')
      return
    }
    setSending(true)
    sentRef.current = true
    try {
      await chatService.send(profile.id, message)
      setText('')
      toastSuccess('✓ Message sent')
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Message could not be sent.')
    } finally {
      setSending(false)
      sentRef.current = false
      inputRef.current?.focus()
    }
  }, [text, sending, profile, toastError, toastSuccess])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="h-[calc(100dvh-var(--header-h,64px))] flex flex-col max-w-3xl mx-auto w-full px-0 sm:px-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="h-10 w-10 rounded-full bg-gradient-saffron text-white flex items-center justify-center shrink-0">
          <MessageSquare className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">💬 Shivsaydri Mandal Chat</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span className={cn('w-2 h-2 rounded-full inline-block', online > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300')} />
            {online > 0 ? `${online} online now` : 'Community chat'}
          </p>
        </div>
        <span className="text-[11px] text-gray-400 hidden sm:inline">Text only · Members</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-cream/40">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-saffron animate-spin" aria-hidden="true" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-4xl">💬</p>
            <p className="font-bold text-gray-800 mt-3">Welcome to Shivsaydri Mandal Chat</p>
            <p className="text-sm text-gray-500 mt-1">Start the conversation with your fellow members.</p>
          </div>
        ) : (
          messages.map(m => {
            const mine = m.user_id === profile?.id
            const initials = m.sender ? getInitials(m.sender.full_name ?? '?') : '?'
            const color = m.sender ? getAvatarColor(m.sender.full_name ?? '?') : 'bg-gray-400'
            const isAdmin = m.sender?.role === 'admin' || m.sender?.role === 'super_admin'
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
                  <div className={cn(
                    'inline-block rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words text-left shadow-sm border',
                    mine
                      ? 'bg-saffron text-white border-saffron rounded-tr-sm'
                      : 'bg-white text-gray-800 border-gray-100 rounded-tl-sm',
                  )}>
                    {m.message}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 py-3 bg-white border-t border-gray-200">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => { if (e.target.value.length <= 1000) setText(e.target.value) }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={sending ? 'Sending…' : 'Type a message...'}
            className="input resize-none max-h-32 py-2.5"
            disabled={sending}
          />
          <button type="button" onClick={send} disabled={sending || !text.trim()} className="btn-primary shrink-0 !px-4" aria-label="Send">
            {sending ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Send className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
          <Users className="w-3 h-3" aria-hidden="true" /> Text only · Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  )
}