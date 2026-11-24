/* Service worker: simpan kerangka aplikasi agar cepat dibuka.
   Data (Apps Script) selalu diambil langsung dari internet. */
const VERSI = 'pptw-v3';
const ASET = ['./', 'index.html', 'ppt-gen.js', 'jszip.min.js', 'template.pptx', 'manifest.json',
  'aset/latar-slide.jpg', 'aset/ikon-192.png', 'aset/ikon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(ASET)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSI).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // jaringan dulu, cadangan dari cache (agar pembaruan cepat tersebar)
  e.respondWith(fetch(e.request).then(r => {
    const salin = r.clone(); caches.open(VERSI).then(c => c.put(e.request, salin)); return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
