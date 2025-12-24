/* UHU Service Worker — PR-12 (Legal + Trust Pack) */
const CACHE_VERSION = "uhu-v12";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./logo.png",
  "./impressum.html",
  "./datenschutz.html",
  "./agb.html"
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => (key !== CACHE_VERSION ? caches.delete(key) : null))
      );
      await self.clients.claim();
    })()
  );
});

// Fetch: cache-first for same-origin, network for others
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only GET
  if (req.method !== "GET") return;

  // Only same-origin caching
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_VERSION);

        // Try cache
        const cached = await cache.match(req, { ignoreSearch: true });
        if (cached) return cached;

        // Fetch & cache
        try {
          const fresh = await fetch(req);
          // Cache only successful basic responses
          if (fresh && fresh.ok && fresh.type === "basic") {
            cache.put(req, fresh.clone());
          }
          return fresh;
        } catch (e) {
          // Offline fallback to main page
          const fallback = await cache.match("./index.html");
          return fallback || new Response("Offline", { status: 503 });
        }
      })()
    );
  }
});
