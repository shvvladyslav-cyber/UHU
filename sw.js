const CACHE = "uhu-kassel-v3";
const PRECACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/sw.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/screenshots/wide.png",
  "/screenshots/narrow.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith((async () => {
    const cached = await caches.match(e.request, { ignoreSearch: true });
    if (cached) return cached;
    try{
      const res = await fetch(e.request);
      if (res && res.status === 200 && res.type === "basic") {
        const cache = await caches.open(CACHE);
        cache.put(e.request, res.clone());
      }
      return res;
    }catch(err){
      const fallback = await caches.match("/index.html");
      return fallback || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" }});
    }
  })());
});
