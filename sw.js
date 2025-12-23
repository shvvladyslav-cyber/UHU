/* UHU Kassel SW (GitHub Pages / Hostinger) */
const CACHE_NAME = "uhu-kassel-v3"; // <- меняй версию при каждом обновлении
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/sw.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ASSETS);
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;

      try {
        const fresh = await fetch(req);
        // кэшируем только успешные "basic" ответы (твои файлы)
        if (fresh && fresh.status === 200 && fresh.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (e) {
        // оффлайн-фоллбек на главную
        const fallback = await caches.match("/index.html", { ignoreSearch: true });
        return fallback || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      }
    })()
  );
});
