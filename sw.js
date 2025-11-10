
const CACHE_NAME = 'tracker-cache-v2';
const DEX_API_HOSTNAME = 'api.dexscreener.com';

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  '/index.tsx',
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

  // Strategy for other assets: Cache-first, then network, with SPA fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If found in cache, return it.
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from the network.
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache the new response for future use.
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // If network request fails (e.g., offline),
          // check if it's a navigation request.
          if (event.request.mode === 'navigate') {
            // Fallback to the main index.html page for SPA routing.
            return caches.match('/index.html');
          }
          // For other failed requests (scripts, styles, images),
          // let the browser handle the error.
          return;
        });
    })
  );
});
