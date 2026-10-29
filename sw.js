// Network-first: you always get your latest data.js when online, cached copy when offline.
// Bump CACHE when you add new files.
const CACHE = 'tb-ops-v3';
const ASSETS = [
  './', 'index.html', 'dashboard.html', 'css/style.css',
  'js/config.js', 'js/auth.js', 'js/data.js', 'js/app.js', 'js/login.js',
  'manifest.webmanifest', 'icons/favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Same-origin files skip the HTTP cache so edits to data.js show up on refresh.
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const network = sameOrigin && e.request.mode !== 'navigate'
    ? fetch(e.request.url, { cache: 'no-cache' })
    : fetch(e.request);
  // Store same-origin files without their ?v= query so the cache keeps one copy each.
  const key = sameOrigin ? url.origin + url.pathname : e.request;
  e.respondWith(
    network
      .then((res) => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(key, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
