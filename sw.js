// v3 — network-first。HTMLは常に取りに行き、失敗時のみキャッシュを返す
const CACHE = 'tsumonavi-v3';

// 新しいWorkerは待たずにすぐ引き継ぐ
self.addEventListener('install', e => self.skipWaiting());

self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

self.addEventListener('message', e => {
  // ページ側から「待たずに交代しろ」
  if (e.data === 'skipWaiting') { self.skipWaiting(); return; }
  // ページ側から「今すぐ全キャッシュを捨てろ」
  if (e.data === 'purge') {
    e.waitUntil(caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k)))));
  }
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  const isDoc = e.request.mode === 'navigate' ||
                (e.request.headers.get('accept') || '').includes('text/html');
  e.respondWith(
    fetch(e.request, isDoc ? { cache: 'no-store' } : undefined)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || Response.error()))
  );
});
