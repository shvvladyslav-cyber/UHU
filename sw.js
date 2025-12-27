// sw.js — UHU безопасный Service Worker (cache-first + offline page)
const CACHE_VERSION = "uhu-v9";
const CACHE_NAME = `uhu-cache-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const ASSETS = [
  "/",
  "/index.html",
  "/cabinet.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/logo.png",
  "/og.png",
  "/crm-config.js",
  "/crm.js",
  "/impressum.html",
  "/datenschutz.html",
  "/agb.html",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Важно: cache.addAll падает целиком если хоть один файл 404.
    // Поэтому кешируем «мягко».
    await Promise.allSettled(ASSETS.map(async (u) => {
      try{
        const res = await fetch(u, { cache: "no-cache" });
        if(res && res.ok) await cache.put(u, res);
      }catch(e){}
    }));

    // offline page обязательно
    try{
      const res = await fetch(OFFLINE_URL, { cache:"no-cache" });
      if(res && res.ok) await cache.put(OFFLINE_URL, res);
    }catch(e){}

    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Не кешируем Apps Script и внешние домены
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Навигация: сначала сеть, потом кеш, потом offline
    if (req.mode === "navigate") {
      try{
        const fresh = await fetch(req);
        if(fresh && fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      }catch(e){
        return (await cache.match(req)) || (await cache.match(OFFLINE_URL)) || new Response("Offline", { status: 503 });
      }
    }

    // Остальные: кеш-first
    const cached = await cache.match(req);
    if (cached) return cached;

    try{
      const fresh = await fetch(req);
      if(fresh && fresh.ok) cache.put(req, fresh.clone());
      return fresh;
    }catch(e){
      return new Response("", { status: 504 });
    }
  })());
});
