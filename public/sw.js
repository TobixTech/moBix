const CACHE_NAME = "mobix-v1"
const STATIC_CACHE = "mobix-static-v1"
const DYNAMIC_CACHE = "mobix-dynamic-v1"

// Static assets to cache immediately
const STATIC_ASSETS = ["/", "/offline", "/favicon.svg", "/icons/icon-192x192.jpg", "/icons/icon-512x512.jpg"]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Caching static assets")
      return cache.addAll(STATIC_ASSETS)
    }),
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE).map((name) => caches.delete(name)),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event - network first with cache fallback
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") return

  // Skip API requests and external URLs
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) {
    return
  }

  // For navigation requests (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Return cached version or offline page
          return caches.match(request).then((cached) => {
            return cached || caches.match("/offline")
          })
        }),
    )
    return
  }

  // For static assets (images, CSS, JS)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|css|js|woff2?)$/i)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Return cached version and update in background
          fetch(request).then((response) => {
            if (response.status === 200) {
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, response)
              })
            }
          })
          return cached
        }
        // Fetch and cache if not in cache
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      }),
    )
    return
  }

  // Default: network first
  event.respondWith(fetch(request).catch(() => caches.match(request)))
})

// Handle push notifications
self.addEventListener("push", (event) => {
  const options = {
    body: event.data?.text() || "New content available on moBix!",
    icon: "/icons/icon-192x192.jpg",
    badge: "/icons/icon-72x72.jpg",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      { action: "explore", title: "View Now" },
      { action: "close", title: "Close" },
    ],
  }

  event.waitUntil(self.registration.showNotification("moBix", options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  }
})
