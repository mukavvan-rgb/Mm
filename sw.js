
const CACHE_NAME = 'tracker-cache-v1';
const DEX_API_HOSTNAME = 'api.dexscreener.com';

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
];

// Install event: precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch event: apply caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy for Dexscreener API: Network-first, then cache fallback
  if (url.hostname === DEX_API_HOSTNAME) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If the request is successful, clone it and cache it.
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If the network fails, try to serve from the cache.
          return caches.match(event.request).then(response => {
            return response || Response.error();
          });
        })
    );
    return;
  }

  // Strategy for static assets: Cache-first, then network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then(networkResponse => {
        // Optional: cache newly fetched static assets
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
