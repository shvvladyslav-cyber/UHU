/* UHU SW: cache-first for static, network-first for html (safer updates) */
const CACHE_NAME = "uhu-kassel-v2";

const CORE = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/sw.js",
  "/logo.png",

  "/impressum.html",
  "/datenschutz.html",
  "/agb.html",

  "/icons/icon-192.png",
  "/icons/icon-512.png",

  "/screenshots/screen-wide.png",
  "/screenshots/screen-mobile.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  // HTML: network-first (чтобы обновления прилетали быстрее)
  if (req.headers.get("accept")?.includes("text/html")) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        // fallback to cached page or offline page
        const cached = await caches.match(req, { ignoreSearch: true });
        return cached || (await caches.match("/offline.html")) || new Response("Offline", { status: 503 });
      }
    })());
    return;
  }

  // Static assets: cache-first
  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      if (isSameOrigin && fresh && fresh.status === 200 && fresh.type === "basic") {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (e) {
      return (await caches.match("/offline.html")) || new Response("Offline", { status: 503 });
    }
  })());
});
