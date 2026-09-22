import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ChatUnreadProvider } from './contexts/ChatUnreadContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { ToastProvider } from './components/ToastProvider'
import './styles/index.css'

// Dev mode: never use a cached service worker - stale SW caches can make the
// site appear "not loading". Production uses the PWA SW (see vite.config.ts).
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(async (registrations) => {
    const hadController = !!navigator.serviceWorker.controller
    await Promise.all(
      registrations.map(async (registration) => {
        if (registration.active) registration.active.postMessage({ type: 'SKIP_WAITING' })
        await registration.unregister()
      }),
    )
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
    // A stale worker that was already controlling this page keeps serving it;
    // force one clean reload so the fresh (SW-less) build is fetched.
    if (hadController && !window.location.search.includes('sw-cleared')) {
      window.location.replace(window.location.pathname + '?sw-cleared')
    }
  })
} else if (!import.meta.env.DEV && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch(() => navigator.serviceWorker.register('/sw.ts'))
  })
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <ChatUnreadProvider>
                <App />
              </ChatUnreadProvider>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
)