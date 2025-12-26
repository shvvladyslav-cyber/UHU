// sw.js (safe / no-crash)
// Strategy:
// - Precache only local files that exist.
// - Install never fails if some files are missing (no addAll crash).
// - Navigation: network-first -> offline.html
// - Static assets: stale-while-revalidate

const CACHE_VERSION = "uhu-v3";
const PRECACHE = `precache-${CACHE_VERSION}`;
const RUNTIME = `runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
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
  "/404.html",
  "/cabinet.html",
  "/foerderung.html"
];

// helper: cache a single request safely
async function cacheOne(cache, url) {
  try {
    const req = new Request(url, { cache: "reload" });
    const res = await fetch(req);
    if (res && res.ok) await cache.put(req, res.clone());
  } catch (e) {
    // ignore
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    await Promise.allSettled(PRECACHE_URLS.map((u) => cacheOne(cache, u)));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => {
      if (![PRECACHE, RUNTIME].includes(k)) return caches.delete(k);
    }));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Only same-origin (avoid caching third-party)
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network-first
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(RUNTIME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(req);
        return cached || (await caches.match(OFFLINE_URL)) || new Response("Offline", { status: 503 });
      }
    })());
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const fetchPromise = fetch(req).then(async (res) => {
      if (res && res.ok) {
        const cache = await caches.open(RUNTIME);
        cache.put(req, res.clone());
      }
      return res;
    }).catch(() => null);

    return cached || (await fetchPromise) || new Response("", { status: 504 });
  })());
});
