// sw.js
const CACHE = "uhu-v1";
const OFFLINE_URL = "/offline.html";

const ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/logo.png",
  "/crm-config.js",
  "/crm.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/impressum.html",
  "/datenschutz.html",
  "/agb.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Только GET кешируем
  if (req.method !== "GET") return;

  event.respondWith((async () => {
    try {
      const cached = await caches.match(req);
      if (cached) return cached;

      const res = await fetch(req);
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
      return res;
    } catch (e) {
      // offline fallback для навигации
      if (req.mode === "navigate") {
        const offline = await caches.match(OFFLINE_URL);
        return offline || new Response("Offline", { status: 503 });
      }
      return new Response("", { status: 504 });
    }
  })());
});
