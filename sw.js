/* sw.js — UHU Kassel PWA */
const CACHE_VERSION = "uhu-v7";
const CACHE_NAME = `uhu-cache-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "/",                 // for root navigation
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/logo.png"
];

// Install: cache core
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // cache what exists; if logo.png not present, ignore errors
    await Promise.all(CORE_ASSETS.map(async (url) => {
      try { await cache.add(url); } catch (e) {}
    }));
    self.skipWaiting();
  })());
});

// Activate: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => {
      if (k.startsWith("uhu-cache-") && k !== CACHE_NAME) return caches.delete(k);
    }));
    self.clients.claim();
  })());
});

// Fetch strategy:
// - HTML/navigation: Network First (fresh updates), fallback to cache
// - others: Cache First, fallback to network
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  const isNavigation = req.mode === "navigate" ||
    (req.method === "GET" && req.headers.get("accept")?.includes("text/html"));

  if (isNavigation) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put("/index.html", fresh.clone());
        return fresh;
      } catch (e) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match("/index.html")) || new Response("Offline", { status: 503 });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      // cache static GET only
      if (req.method === "GET" && fresh && fresh.status === 200) {
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (e) {
      return cached || new Response("", { status: 504 });
    }
  })());
});
