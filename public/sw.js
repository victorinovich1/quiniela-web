// Service Worker para Web Push Notifications

// Bypass para peticiones de Supabase (Realtime WebSocket)
self.addEventListener('fetch', function(event) {
  // NO interceptar peticiones de Supabase
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('realtime')) {
    return
  }
})

// Listener de notificaciones push - Despierta el teléfono
self.addEventListener('push', function(event) {
  console.log('[SW] Push recibido', event)
  
  const data = event.data ? event.data.json() : { title: 'Quiniela 2026', message: '¡Hay novedades!' }
  
  const options = {
    body: data.message,
    icon: '/android-chrome-192x192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: { url: data.link || '/predictions' }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => console.log('[SW] Notificación mostrada en pantalla de bloqueo'))
  )
})

// Listener de click en notificación
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notificación clickeada')
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url))
})
})
// No intercepta peticiones para evitar conflictos con Supabase Realtime

