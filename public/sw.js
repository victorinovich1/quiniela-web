self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // IGNORAR COMPLETAMENTE SUPABASE Y WEBSOCKETS
  if (url.includes('supabase.co') || url.includes('realtime') || !url.startsWith('http')) {
    return;
  }
  
  event.respondWith(fetch(event.request));
});
