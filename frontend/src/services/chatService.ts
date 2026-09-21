import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'
import type { ChatMessage, ChatSender } from '@/types'

export interface ChatMessageRow extends ChatMessage {
  sender?: ChatSender['profile']
}

/**
 * Community chat (text-only). RLS guarantees:
 *  - members can read + insert their own messages
 *  - members cannot update/delete anyone else's
 *  - admins soft delete, super admins hard delete
 */
export const chatService = {
  async list(limit = 100): Promise<ChatMessageRow[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, sender:public_member_directory(id, full_name, profile_photo_url, role)')
      .is('deleted_at', null)
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
      .select(
        '*, sender:public_member_directory(id, full_name, profile_photo_url, role)',
      )
      .single()
    if (error) throw new Error(getErrorMessage(error))
    return data as ChatMessageRow
  },

  /** Admin soft delete. */
  async softDelete(messageId: string): Promise<void> {
    const currentProfile = await currentProfileId()
    const { error } = await supabase
      .from('chat_messages')
      .update({ deleted_at: new Date().toISOString(), deleted_by: currentProfile })
      .eq('id', messageId)
    if (error) throw new Error(getErrorMessage(error))
  },

  /** Super admin permanent delete. */
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

  subscribe(onMessage: (message: ChatMessageRow) => void, onDeleted?: (id: string) => void): () => void {
    const channel = supabase
      .channel('community-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const row = payload.new as ChatMessageRow
          if (row.deleted_at) return
          onMessage(row)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const row = payload.new as ChatMessageRow
          if (row.deleted_at && onDeleted) onDeleted(row.id)
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages' },
        (payload) => {
          if (onDeleted) onDeleted((payload.old as { id: string }).id)
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