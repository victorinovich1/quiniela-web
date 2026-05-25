self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('supabase.co') || !event.request.url.startsWith('http')) return;
  event.respondWith(fetch(event.request));
});
