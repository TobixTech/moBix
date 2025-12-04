const CACHE_NAME = "mobix-v2"
const STATIC_CACHE = "mobix-static-v2"
const DYNAMIC_CACHE = "mobix-dynamic-v2"

// Static assets to cache immediately
const STATIC_ASSETS = ["/", "/offline", "/favicon.svg"]

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
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match("/offline")
          })
        }),
    )
    return
  }

  // For static assets
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|css|js|woff2?)$/i)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          fetch(request).then((response) => {
            if (response.status === 200) {
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, response)
              })
            }
          })
          return cached
        }
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

  event.respondWith(fetch(request).catch(() => caches.match(request)))
})

self.addEventListener("push", (event) => {
  let data = {
    title: "moBix",
    body: "New content available!",
    url: "/home",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
  }

  try {
    if (event.data) {
      data = { ...data, ...JSON.parse(event.data.text()) }
    }
  } catch (e) {
    data.body = event.data?.text() || data.body
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: {
      url: data.url,
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: "open", title: "Watch Now" },
      { action: "close", title: "Dismiss" },
    ],
    tag: "mobix-notification",
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification.data?.url || "/home"

  if (event.action === "close") {
    return
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    }),
  )
})
