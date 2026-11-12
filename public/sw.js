// Service Worker for الصادق platform
// Cache strategy:
// - App shell: precache on install
// - Static assets: stale-while-revalidate
// - Audio files: cache-first with fallback (do not precache)
// - API: network-first

const SW_VERSION = "v1.2.0";
const STATIC_CACHE = `sadik-static-${SW_VERSION}`;
const RUNTIME_CACHE = `sadik-runtime-${SW_VERSION}`;
const AUDIO_CACHE = `sadik-audio-${SW_VERSION}`;

const APP_SHELL = [
  "/",
  "/quran",
  "/hifdh",
  "/kids",
  "/ramadan",
  "/ruqyah",
  "/morning",
  "/evening",
  "/after-prayer",
  "/adhkar-misc",
  "/names",
  "/salawat",
  "/tasbih",
  "/prayer-times",
  "/library",
  "/search",
  "/settings",
  "/about",
  "/faq",
  "/privacy",
  "/sources",
  "/manifest.json",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (name) =>
                name.startsWith("sadik-") &&
                name !== STATIC_CACHE &&
                name !== RUNTIME_CACHE &&
                name !== AUDIO_CACHE
            )
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Notifications shown through the SW survive tab-hidden states and support
// click-to-navigate. The payload.url tells us where to open.
self.addEventListener("notificationclick", (event) => {
  const data = event.notification.data || {};
  const url = data.url || "/";
  event.notification.close();

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Focus an existing window on the app origin if present
      for (const client of allClients) {
        try {
          const u = new URL(client.url);
          if (u.origin === self.location.origin) {
            await client.focus();
            if (u.pathname !== url && client.navigate) {
              await client.navigate(url);
            }
            return;
          }
        } catch {
          // ignore
        }
      }
      // Otherwise open a new window
      await self.clients.openWindow(url);
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET
  if (request.method !== "GET") return;

  // Skip cross-origin requests except for audio CDNs
  const isAudioCDN =
    url.hostname === "everyayah.com" ||
    url.hostname === "download.quranicaudio.com" ||
    url.hostname === "quranicaudio.com" ||
    url.hostname.endsWith(".everyayah.com") ||
    url.hostname.endsWith(".quranicaudio.com");

  if (url.origin !== self.location.origin && !isAudioCDN) return;

  // Audio files: cache-first (streaming)
  if (
    isAudioCDN ||
    request.destination === "audio" ||
    url.pathname.endsWith(".mp3") ||
    url.pathname.endsWith(".m4a") ||
    url.pathname.endsWith(".ogg")
  ) {
    event.respondWith(cacheFirst(request, AUDIO_CACHE, true));
    return;
  }

  // Navigation requests: network-first, fallback to cache, then offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offlinePage = await caches.match("/offline.html");
          if (offlinePage) return offlinePage;
          return new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  // Static assets: stale-while-revalidate
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

async function cacheFirst(request, cacheName, isStream = false) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    // Update in background
    fetch(request).then((resp) => {
      if (resp && resp.status === 200) {
        cache.put(request, resp.clone());
      }
    }).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response("Audio unavailable offline", { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}
