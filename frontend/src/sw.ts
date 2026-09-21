/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

const STORAGE_URL = 'supabase.co/storage/v1/object/public'
const API_URL = 'supabase.co'

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// API calls: network-first so fresh admin edits appear; cached as fallback offline.
registerRoute(
  ({ url }) => url.hostname.endsWith(API_URL) && !url.pathname.includes('/storage/v1/object/public'),
  new NetworkFirst({
    cacheName: 'supabase-api',
    networkTimeoutSeconds: 10,
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 })],
  }),
)

// Public storage images: cache-first for fast, offline-friendly media.
registerRoute(
  ({ url }) => url.hostname.endsWith(API_URL) && url.pathname.includes('/storage/v1/object/public'),
  new CacheFirst({
    cacheName: 'supabase-storage',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
)

// Cloudinary images: cache-first.
registerRoute(
  ({ url }) => url.hostname.endsWith('cloudinary.com'),
  new CacheFirst({
    cacheName: 'cloudinary-images',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
)

// Offline fallback for navigations.
const APP_SHELL = new URL('./index.html', self.registration.scope).toString()

async function handleNavigation(event: FetchEvent): Promise<Response> {
  const request = event.request
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open('app-shell')
      cache.put(APP_SHELL, networkResponse.clone())
      return networkResponse
    }
    throw new Error('network error')
  } catch {
    const cached = await caches.match(request, { ignoreSearch: true })
    if (cached) return cached
    const shell = await caches.match(APP_SHELL)
    if (shell) return shell
    return new Response('You are offline. Please check your connection.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event))
  }
})

// ---------------------------------------------------------------------------
// Web Push
// ---------------------------------------------------------------------------

interface PushPayload {
  title: string
  body?: string
  url?: string
  icon?: string
  badge?: string
  data?: { url?: string }
}

function parsePushPayload(data: PushPayload): PushPayload {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as PushPayload
    } catch {
      return { title: data || 'Shivsaydri Ganesh Mandal', url: '/' }
    }
  }
  return {
    title: data?.title || 'Shivsaydri Ganesh Mandal',
    body: data?.body,
    url: data?.data?.url || data?.url || '/',
    icon: data?.icon || '/pwa-192x192.png',
    badge: data?.badge || '/pwa-192x192.png',
  }
}

self.addEventListener('push', (event) => {
  if (!event.data) return
  const payload = parsePushPayload(event.data.json())
  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    data: { url: payload.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(payload.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of allClients) {
        if ('focus' in client) {
          await client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(new URL(url, self.registration.scope).toString())
    })(),
  )
})