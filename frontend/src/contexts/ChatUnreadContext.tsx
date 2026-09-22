import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface ChatUnreadContextValue {
  /** Number of new community chat messages received while not on the chat page. */
  chatUnread: number
  /** Clear unread count (called when the member opens Community Chat). */
  resetChatUnread: () => void
}

const ChatUnreadContext = createContext<ChatUnreadContextValue>({
  chatUnread: 0,
  resetChatUnread: () => {},
})

// eslint-disable-next-line react-refresh/only-export-components
export function useChatUnread() {
  return useContext(ChatUnreadContext)
}

export function ChatUnreadProvider({ children }: { children: React.ReactNode }) {
  const [chatUnread, setChatUnread] = useState(0)
  const location = useLocation()
  const onChatRef = useRef(false)

  useEffect(() => {
    onChatRef.current = location.pathname === '/member/chat'
    // Navigating into the chat clears the count.
    if (onChatRef.current) setChatUnread(0)
  }, [location.pathname])

  useEffect(() => {
    let active = true
    const cleanup: Array<() => void> = []

    supabase.auth.getSession().then(({ data }) => {
      if (!active || !data?.session) return
      const channel = supabase
        .channel('chat-unread-count')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          () => {
            // Only bump while the member is NOT viewing the chat page.
            if (!onChatRef.current) setChatUnread((c) => c + 1)
          },
        )
        .subscribe()
      cleanup.push(() => {
        supabase.removeChannel(channel)
      })
    })

    return () => {
      active = false
      cleanup.forEach((fn) => fn())
    }
  }, [])

  const resetChatUnread = () => setChatUnread(0)

  return (
    <ChatUnreadContext.Provider value={{ chatUnread, resetChatUnread }}>
      {children}
    </ChatUnreadContext.Provider>
  )
}