// sw.js — safe Service Worker (does not fail install if some files are missing)
const CACHE = "uhu-v3";
const OFFLINE_URL = "/offline.html";

const ASSETS = [
  "/", "/index.html", "/offline.html",
  "/manifest.webmanifest",
  "/favicon.ico", "/logo.png", "/og.png",
  "/revolut-qr.png",
  "/crm-config.js", "/crm.js",
  "/impressum.html", "/datenschutz.html", "/agb.html",
  "/icons/icon-192.png", "/icons/icon-512.png",
];

async function cacheSafe(cache, url){
  try{
    const req = new Request(url, { cache: "reload" });
    const res = await fetch(req);
    if(res && res.ok){
      await cache.put(url, res.clone());
      return true;
    }
  }catch(e){}
  return false;
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // cache OFFLINE first
    await cacheSafe(cache, OFFLINE_URL);
    await Promise.allSettled(ASSETS.map(u => cacheSafe(cache, u)));
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

  event.respondWith((async () => {
    const url = new URL(req.url);

    // Navigation: network-first, fallback to offline
    if (req.mode === "navigate") {
      try{
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put("/index.html", fresh.clone()).catch(()=>{});
        return fresh;
      }catch(e){
        const cachedOffline = await caches.match(OFFLINE_URL);
        return cachedOffline || new Response("Offline", { status: 503 });
      }
    }

    // Static: cache-first
    const cached = await caches.match(req);
    if (cached) return cached;

    try{
      const res = await fetch(req);
      const cache = await caches.open(CACHE);
      // Only cache same-origin successful responses
      if (url.origin === self.location.origin && res && res.ok) {
        cache.put(req, res.clone()).catch(()=>{});
      }
      return res;
    }catch(e){
      return new Response("", { status: 504 });
    }
  })());
});
