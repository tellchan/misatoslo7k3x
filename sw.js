// v2 — network-first。HTMLは常に取りに行き、失敗時のみキャッシュを返す
const CACHE = 'tsumonavi-v2';

self.addEventListener('install', e => self.skipWaiting());

self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => clients.claim())
));

// ページ側から「今すぐ全キャッシュを捨てろ」と言われたら従う
self.addEventListener('message', e => {
  if (e.data === 'purge') {
    e.waitUntil(caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k)))));
  }
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isDoc = e.request.mode === 'navigate' ||
                (e.request.headers.get('accept') || '').includes('text/html');
  e.respondWith(
    fetch(e.request, isDoc ? { cache: 'no-store' } : undefined)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
