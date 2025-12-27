// sw.js — safe Service Worker (без падений на 404/invalid URL)
const CACHE = "uhu-v3";
const OFFLINE_URL = "/offline.html";

const ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/logo.png",
  "/og.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/crm-config.js",
  "/crm.js",
  "/impressum.html",
  "/datenschutz.html",
  "/agb.html"
];

// Кладём в кеш то, что доступно. Если что-то 404 — не валим install.
async function safeCacheAddAll(cache, urls){
  const results = await Promise.allSettled(urls.map(async (u) => {
    try { await cache.add(u); } catch(e) { /* ignore */ }
  }));
  return results;
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await safeCacheAddAll(cache, ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))));
    // гарантируем offline страницу в кеше
    const cache = await caches.open(CACHE);
    await safeCacheAddAll(cache, [OFFLINE_URL]);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Кешируем только GET
  if (req.method !== "GET") return;

  // Не трогаем нестандартные протоколы (data:, chrome-extension:, etc.)
  let url;
  try { url = new URL(req.url); } catch(e) { return; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Навигация: сначала сеть, затем кеш, затем offline
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
        return res;
      } catch(e) {
        const cached = await caches.match(req);
        return cached || (await caches.match(OFFLINE_URL)) || new Response("Offline", { status: 503 });
      }
    })());
    return;
  }

  // Остальные запросы: cache-first
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      // кешируем только удачные ответы
      if (res && res.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch(e) {
      return cached || new Response("", { status: 504 });
    }
  })());
});
