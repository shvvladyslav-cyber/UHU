/* PR-4: UHU service worker (cache-first for static, network-first for html) */
const VERSION = "uhu-sw-v4";
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/offline.html",
  "/impressum.html",
  "/datenschutz.html",
  "/agb.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/screenshots/uhu-wide.png",
  "/screenshots/uhu-mobile.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => {
      if (k !== STATIC_CACHE && k !== RUNTIME_CACHE) return caches.delete(k);
    }));
    self.clients.claim();
  })());
});

// Helper: avoid caching weird URLs
function isSafeHttpRequest(req) {
  try {
    const url = new URL(req.url);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (e) {
    return false;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Safety: ignore non-http(s) like data:, chrome-extension:, etc.
  if (!isSafeHttpRequest(req)) return;

  const url = new URL(req.url);

  // Never cache revolut / telegram links
  if (url.hostname.includes("revolut") || url.hostname.includes("t.me")) return;

  // HTML pages: network-first (fresh), fallback to cache/offline
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(req);
        return cached || caches.match("/offline.html");
      }
    })());
    return;
  }

  // Static assets: cache-first
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (e) {
      return cached || Response.error();
    }
  })());
});
