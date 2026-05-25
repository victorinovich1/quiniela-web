self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // CRÍTICO: Ignorar WebSockets (wss://) y cualquier petición que no sea HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(fetch(event.request));
});
