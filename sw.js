// sw.js — safe PWA cache (no crashes if some assets are missing)
const CACHE = "uhu-v3";
const OFFLINE_URL = "/offline.html";

// Put here ONLY files that точно существуют в репозитории.
// (Если файла нет — SW всё равно не упадёт, мы кешируем по одному с try/catch.)
const ASSETS = [
  "/",
  "/index.html",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/favicon.ico",
  "/logo.png",
  "/og.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/crm-config.js",
  "/crm.js",
  "/impressum.html",
  "/datenschutz.html",
  "/agb.html",
  "/revolut-qr.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);

    // Кешируем по одному — чтобы один 404 НЕ ломал установку SW
    await Promise.allSettled(
      ASSETS.map(async (url) => {
        try { await cache.add(new Request(url, { cache: "reload" })); } catch (_) {}
      })
    );

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

// Network-first for navigation, cache-first for static
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Cache only GET
  if (req.method !== "GET") return;

  // Не трогаем нестандартные протоколы (data:, chrome-extension:, etc)
  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Navigation: network first, then offline page
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (_) {
        const cached = await caches.match(req);
        return cached || (await caches.match(OFFLINE_URL)) || new Response("Offline", { status: 503 });
      }
    })());
    return;
  }

  // Static: cache first
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const res = await fetch(req);
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
      return res;
    } catch (_) {
      return new Response("", { status: 504 });
    }
  })());
});
