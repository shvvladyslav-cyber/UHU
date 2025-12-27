// sw.js — безопасный Service Worker (без падений установки)
const CACHE_VERSION = "uhu-v5";
const CACHE_NAME = `uhu-cache-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

// Кешируем только свои (same-origin) файлы.
// Важно: если какого-то файла нет (404), SW НЕ должен падать.
const CORE_ASSETS = [
  "/", "/index.html", OFFLINE_URL,
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
  "/agb.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    self.skipWaiting();
    const cache = await caches.open(CACHE_NAME);

    // Кешируем по одному, чтобы 404 не ломал install
    await Promise.all(CORE_ASSETS.map(async (url) => {
      try {
        const res = await fetch(new Request(url, { cache: "reload" }));
        if (res.ok) await cache.put(url, res);
      } catch (e) { /* ignore */ }
    }));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k.startsWith("uhu-cache-") && k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
  })());
});

// Helpers
function isSameOrigin(requestUrl){
  try { return new URL(requestUrl).origin === self.location.origin; } catch(e){ return false; }
}
function isNavigation(req){ return req.mode === "navigate" || (req.method === "GET" && req.headers.get("accept")?.includes("text/html")); }

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Не трогаем data:, chrome-extension:, и т.п.
  const url = req.url;
  if (url.startsWith("data:") || url.startsWith("chrome-extension:")) return;

  // Навигация: network-first + offline fallback
  if (isNavigation(req)) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        // кешируем HTML только если same-origin
        if (res && res.ok && isSameOrigin(url)) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(req)) || (await cache.match(OFFLINE_URL)) || new Response("Offline", { status: 503 });
      }
    })());
    return;
  }

  // Статика same-origin: cache-first
  if (isSameOrigin(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch (e) {
        return cached || new Response("", { status: 504 });
      }
    })());
  }
});