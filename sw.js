self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  if (e.request.method === 'GET') {
    e.waitUntil(fetch(e.request).then(res => caches.open('v1').then(c => c.put(e.request, res))).catch(()=>{}));
  }
});
