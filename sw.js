const CACHE_NAME = "uhu-cache-v7";
const OFFLINE_URL = "/offline.html";

const ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/logo.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  OFFLINE_URL
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        // network first for html
        if (req.headers.get("accept")?.includes("text/html")) {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
          return fresh;
        }

        // cache first for everything else
        const cached = await caches.match(req);
        if (cached) return cached;

        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        // offline fallback
        if (req.headers.get("accept")?.includes("text/html")) {
          return caches.match(OFFLINE_URL);
        }
        throw e;
      }
    })()
  );
});
