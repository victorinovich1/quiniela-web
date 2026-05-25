self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // No interceptar peticiones de audio
  if (event.request.url.includes('/sounds/') || event.request.url.endsWith('.mp3')) {
    return;
  }
  
  event.respondWith(fetch(event.request));
});
