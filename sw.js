/* sw.js — безопасный Service Worker (без падений)
   Стратегия:
   - Навигация (HTML): network-first, fallback -> /offline.html
   - Статика (иконки/картинки/css/js): stale-while-revalidate
   - POST/другие методы НЕ кешируем
*/
const CACHE_VERSION = "uhu-v7";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/logo.png",
  "/og.png",
  "/revolut-qr.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/crm-config.js",
  "/crm.js",
  "/impressum.html",
  "/datenschutz.html",
  "/agb.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(PRECACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => {
      if (![STATIC_CACHE, RUNTIME_CACHE].includes(k)) return caches.delete(k);
      return null;
    }));
    await self.clients.claim();
  })());
});

async function cachePut(cacheName, request, response) {
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // кешируем только GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // только свой origin
  if (url.origin !== self.location.origin) return;

  // Навигация: network-first
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: "no-store" });
        const copy = fresh.clone();
        cachePut(RUNTIME_CACHE, req, copy).catch(() => {});
        return fresh;
      } catch (_) {
        const cached = await caches.match(req);
        return cached || (await caches.match(OFFLINE_URL)) || new Response("Offline", { status: 503 });
      }
    })());
    return;
  }

  // Статика: stale-while-revalidate
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const fetchPromise = fetch(req).then((res) => {
      if (res && res.ok) cachePut(RUNTIME_CACHE, req, res.clone()).catch(() => {});
      return res;
    }).catch(() => null);

    return cached || (await fetchPromise) || new Response("", { status: 504 });
  })());
});
