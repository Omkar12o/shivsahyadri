import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'
import type { ChatMessage, ChatSender } from '@/types'

export interface ChatMessageRow extends ChatMessage {
  /** sender joined from public_member_directory (also returned by send().select) */
  sender?: ChatSender['profile']
}

// chat_messages has TWO foreign keys to profiles (user_id + deleted_by), so the
// embed MUST be disambiguated with an explicit constraint hint, otherwise
// PostgREST returns "more than one relation found" and the chat fails to load.
// profiles RLS filters rows a member can't read (their own row only), so the
// embed returns null for others — MemberChat fills sender info from the public
// member directory map (which every authenticated user can read).
const SENDER_SELECT = '*, sender:profiles!chat_messages_user_id_fkey(id, full_name, profile_photo_url, role)'

/**
 * Community chat (text-only). RLS guarantees:
 *  - members can read all messages + insert their own
 *  - members can only soft-delete their OWN message (message -> NULL, deleted_at set)
 *  - admins can soft-delete any message, super admins can hard delete
 * Soft-deleted rows are still selected so the UI can render
 * "This message was deleted".
 */
export const chatService = {
  /** Latest `limit` messages (newest first internally, returned oldest -> newest). */
  async list(limit = 50): Promise<ChatMessageRow[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(SENDER_SELECT)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(getErrorMessage(error))
    return ((data ?? []) as ChatMessageRow[]).reverse()
  },

  /** Older messages before `before` for scroll-up pagination. */
  async listBefore(before: ChatMessageRow, limit = 25): Promise<ChatMessageRow[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(SENDER_SELECT)
      .or(`created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(getErrorMessage(error))
    return ((data ?? []) as ChatMessageRow[]).reverse()
  },

  async send(profileId: string, message: string): Promise<ChatMessageRow> {
    const trimmed = message.trim()
    if (!trimmed) throw new Error('Message cannot be empty.')
    if (trimmed.length > 1000) throw new Error('Message is too long (max 1000 characters).')
    const payload = {
      user_id: profileId,
      message: trimmed,
    }
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(payload)
      .select(SENDER_SELECT)
      .single()
    if (error) throw new Error(getErrorMessage(error))
    return data as ChatMessageRow
  },

  /**
   * Soft delete: members delete their own message, admins any message.
   * Content is NULLed so privacy holds; the row still renders as deleted.
   */
  async softDelete(messageId: string): Promise<void> {
    const currentProfile = await currentProfileId()
    const { error } = await supabase
      .from('chat_messages')
      .update({ message: null, deleted_at: new Date().toISOString(), deleted_by: currentProfile })
      .eq('id', messageId)
    if (error) throw new Error(getErrorMessage(error))
  },

  /** Super admin permanent delete (also removes the row entirely). */
  async hardDelete(messageId: string): Promise<void> {
    const { error } = await supabase.from('chat_messages').delete().eq('id', messageId)
    if (error) throw new Error(getErrorMessage(error))
  },

  /** Admin chat moderation list (includes soft-deleted rows). */
  async listAll(limit = 300): Promise<ChatMessageRow[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, sender:profiles!chat_messages_user_id_fkey(id, full_name, profile_photo_url, role)')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as ChatMessageRow[]
  },

  /** Realtime: upsert for INSERT (new) and UPDATE (soft delete placeholder/change), remove for DELETE. */
  subscribe(onUpsert: (message: ChatMessageRow) => void, onDelete: (id: string) => void): () => void {
    const channel = supabase
      .channel('community-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          onUpsert(payload.new as ChatMessageRow)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages' },
        (payload) => {
          if ((payload.old as ChatMessageRow).deleted_at) return
          onUpsert(payload.new as ChatMessageRow)
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages' },
        (payload) => {
          onDelete((payload.old as { id: string }).id)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}

async function currentProfileId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('id').eq('auth_user_id', user.id).maybeSingle()
  return data?.id ?? null
}