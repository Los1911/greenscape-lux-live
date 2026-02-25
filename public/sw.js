// Service Worker with Smart Caching
// IMPORTANT: Update CACHE_VERSION on every deployment to bust cache
const CACHE_VERSION = 'v4.0.0-final-20260126';
const CACHE_NAME = `greenscape-lux-${CACHE_VERSION}`;


// Resources to ALWAYS fetch from network (never cache)
const EXCLUDED_PATHS = [
  '/version.json',
  '/index.html',
  '/api/',
  'supabase.co',
  'stripe.com',
  'maps.googleapis.com',
  '.hot-update.',
  '__vite'
];

// Resources to pre-cache (minimal - only truly static assets)
const urlsToCache = [
  '/manifest.json'
];

// Check if URL should be excluded from cache
function shouldExclude(url) {
  return EXCLUDED_PATHS.some(path => url.includes(path));
}

// Check if this is a navigation request (HTML page)
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         request.destination === 'document' ||
         request.headers.get('accept')?.includes('text/html');
}

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.warn('[SW] Pre-cache failed:', err);
      })
  );
  
  // Activate immediately - don't wait for old SW to be released
  self.skipWaiting();
});

// Activate event - clean up ALL old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete ALL caches that don't match current version
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Old caches cleared');
    })
  );
  
  // Take control of all clients immediately
  return self.clients.claim();
});

// Fetch event - Network first for everything important
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Only handle http(s) requests
  if (!event.request.url.startsWith('http')) return;
  
  const url = event.request.url;
  
  // ALWAYS go to network for excluded paths and navigation requests
  if (shouldExclude(url) || isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Only fallback to cache for navigation if network fails
        if (isNavigationRequest(event.request)) {
          return caches.match('/');
        }
        throw new Error('Network request failed');
      })
    );
    return;
  }

  // For static assets: Network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((response) => {
          if (response) {
            console.log('[SW] Serving from cache:', url);
            return response;
          }
          // No cache, return offline fallback for navigation
          if (isNavigationRequest(event.request)) {
            return caches.match('/');
          }
          throw new Error('No cache available');
        });
      })
  );
});

// Message handling - support for manual cache clearing
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }
  
  if (event.data?.type === 'CLEAR_CACHE') {
    console.log('[SW] Cache clear requested');
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW] All caches cleared');
      // Notify the client
      if (event.source) {
        event.source.postMessage({ type: 'CACHE_CLEARED' });
      }
    });
  }
  
  if (event.data?.type === 'GET_VERSION') {
    // Respond with current cache version
    if (event.source) {
      event.source.postMessage({ 
        type: 'VERSION_INFO',
        version: CACHE_VERSION,
        cacheName: CACHE_NAME
      });
    }
  }
});

// Log when SW is ready
console.log('[SW] Service worker loaded, version:', CACHE_VERSION);
