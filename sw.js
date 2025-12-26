// sw.js — безопасный service worker (без падений на addAll)
// Стратегия:
// - Навигация (страницы): network-first, fallback offline.html
// - Остальные GET: cache-first + обновление в фоне
const CACHE = "uhu-v3";
const OFFLINE_URL = "/offline.html";

const ASSETS = [
  "/", "/index.html", "/offline.html",
  "/manifest.webmanifest",
  "/favicon.ico", "/logo.png", "/og.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png", "/icons/icon-512.png",
  "/crm-config.js", "/crm.js",
  "/impressum.html", "/datenschutz.html", "/agb.html",
  "/revolut-qr.png"
];

// Добавляем в кеш «мягко»: если чего-то нет (404), SW не падает
async function safeCacheAddAll(cache, urls){
  for(const url of urls){
    try{
      const req = new Request(url, { cache: "reload" });
      const res = await fetch(req);
      if(res && res.ok) await cache.put(req, res.clone());
    }catch(e){
      // игнорируем ошибку — продолжим кешировать остальное
    }
  }
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
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Только свой origin кешируем (чтобы не ловить ошибки с чужими доменами)
  if (url.origin !== self.location.origin) return;

  // Навигация: network-first
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try{
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
        return res;
      }catch(e){
        const cached = await caches.match(req);
        if (cached) return cached;
        const offline = await caches.match(OFFLINE_URL);
        return offline || new Response("Offline", { status: 503, headers: {"Content-Type":"text/plain"} });
      }
    })());
    return;
  }

  // Остальные запросы: cache-first
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) {
      // обновим в фоне
      event.waitUntil((async () => {
        try{
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
        }catch(e){}
      })());
      return cached;
    }

    try{
      const res = await fetch(req);
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
      return res;
    }catch(e){
      return new Response("", { status: 504 });
    }
  })());
});
