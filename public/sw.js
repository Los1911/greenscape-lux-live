// Service Worker with Smart Caching
const CACHE_VERSION = 'v1.0.0'; // Static version, update manually when needed
const CACHE_NAME = `greenscape-lux-${CACHE_VERSION}`;

// Resources to exclude from caching
const EXCLUDED_PATHS = [
  '/version.json',
  '/api/',
  'supabase.co',
  'stripe.com',
  'maps.googleapis.com'
];

const urlsToCache = [
  '/',
  '/manifest.json'
];

// Check if URL should be excluded from cache
function shouldExclude(url) {
  return EXCLUDED_PATHS.some(path => url.includes(path));
}

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch(() => {})
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control immediately
});

// Fetch event - network first for critical resources
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;
  if (shouldExclude(event.request.url)) {
    // Network only for excluded paths
    event.respondWith(fetch(event.request));
    return;
  }

  // Network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          return response || caches.match('/');
        });
      })
  );
});

// Message handling
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
