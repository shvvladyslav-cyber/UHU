// sw.js — PR-14 CRM Live
// PWA cache with offline fallback

const VERSION = "uhu-v14";
const STATIC_CACHE = `${VERSION}-static`;

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/crm-config.js",
  "/crm.js",

  // legal
  "/impressum.html",
  "/datenschutz.html",
  "/agb.html",

  // icons (минимум)
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k.startsWith("uhu-") && k !== STATIC_CACHE) ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
  })());
});

// Network-first for navigations, cache-first for assets
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // same-origin only
  if (url.origin !== self.location.origin) return;

  // navigation → network first, fallback offline
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(STATIC_CACHE);
        cache.put("/index.html", fresh.clone());
        return fresh;
      } catch (e) {
        const cache = await caches.open(STATIC_CACHE);
        return (await cache.match(req)) || (await cache.match("/offline.html")) || Response.error();
      }
    })());
    return;
  }

  // assets → cache first
  event.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (e) {
      return cached || Response.error();
    }
  })());
});
