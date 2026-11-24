/* Service worker d'Orbite (version hébergée). Réseau d'abord pour la page, cache en repli. Ne met en cache QUE les fichiers de l'appli. */
const CACHE = 'orbite-web-0.11.0-beta.28-1774de80';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png', 'icons/apple-touch-icon.png'];
const abs = (u) => new URL(u, self.registration.scope).href;
const ALLOWED = new Set(SHELL.map(abs));
const INDEX = abs('index.html'), ROOT = abs('./');
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' }))))).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('orbite-web-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== self.location.origin) return;            // polices Google et tout le reste : le navigateur s'en occupe
  const page = r.mode === 'navigate' || u.href === ROOT || u.href === INDEX;
  const key = page ? INDEX : u.origin + u.pathname;
  if (!page && !ALLOWED.has(key)) return;                                             // hors enveloppe : jamais mis en cache
  e.respondWith(fetch(r).then((res) => { if (res.ok && !res.redirected) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); } return res; })
    .catch(() => caches.match(key).then((m) => m || caches.match(INDEX))));
});
