// Service Worker para PWA + Web Push Notifications

// Instalación inmediata
self.addEventListener('install', () => self.skipWaiting())

// Activación y control de clientes
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()))

// Fetch handler requerido para PWA instalable
self.addEventListener('fetch', (event) => {
  // Handler mínimo - no intercepta peticiones
})

// Listener de notificaciones push
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
      .then(() => console.log('[SW] Notificación mostrada'))
  )
})

// Listener de click en notificación
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notificación clickeada')
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url))
})

