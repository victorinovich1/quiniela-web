// Service Worker para Web Push Notifications

// Bypass para peticiones de Supabase (Realtime WebSocket)
self.addEventListener('fetch', (event) => {
  // NO interceptar peticiones de Supabase
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('realtime')) {
    return
  }
})

// Listener de notificaciones push
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Quiniela Mundial', {
      body: data.message,
      icon: '/android-chrome-192x192.png',
      badge: '/favicon.ico',
      data: { url: data.link || '/' },
      vibrate: [200, 100, 200],
      tag: 'notification-' + Date.now()
    })
  )
})

// Listener de click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const url = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus()
          }
        }
        // Si no, abrir nueva ventana
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})
// No intercepta peticiones para evitar conflictos con Supabase Realtime

