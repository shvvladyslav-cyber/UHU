// sw.js — SAFE VERSION
const CACHE = "uhu-v3";
const OFFLINE_URL = "/offline.html";

const ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
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
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(
      ASSETS.map(async (url) => {
        try {
          const res = await fetch(url, { cache: "no-cache" });
          if (res && res.ok) await cache.put(url, res.clone());
        } catch (_) {}
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

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    if (req.mode === "navigate") {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put("/index.html", fresh.clone());
        return fresh;
      } catch {
        return (await caches.match(OFFLINE_URL)) || (await caches.match("/index.html"));
      }
    }

    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch {
      return new Response("", { status: 504 });
    }
  })());
});
