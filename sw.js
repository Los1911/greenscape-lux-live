<<<<<<< HEAD
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
=======
// Enhanced Service Worker with Cache Invalidation
const CACHE_VERSION = Date.now();
const CACHE_NAME = `greenscape-lux-v${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// Critical resources that should always be fresh
const CRITICAL_RESOURCES = [
  '/version.json',
  '/get-a-quote',
  '/api/'
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
];

const urlsToCache = [
  '/',
<<<<<<< HEAD
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
=======
  '/manifest.json',
  '/favicon.ico'
];
// Install event - cache resources
self.addEventListener('install', (event) => {
  // Service Worker installing
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Service worker cache opened successfully
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        // Cache failed in production
      })
  );
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
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
<<<<<<< HEAD
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
=======
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).then((fetchResponse) => {
          // Don't cache non-successful responses
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }

          // Clone the response for caching
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return fetchResponse;
        });
      })
      .catch(() => {
        // Fallback for offline scenarios
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
      })
  );
});

<<<<<<< HEAD
// Message handling
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
=======
// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notification event
// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'GreenScape Lux Notification',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'default',
      requireInteraction: data.priority === 'high',
      data: {
        url: data.url || '/notifications',
        timestamp: Date.now(),
        alertType: data.alertType,
        ...data.customData
      },
      actions: [
        {
          action: 'view',
          title: 'View Dashboard',
          icon: '/icon-192x192.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icon-192x192.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'GreenScape Lux Alert', options)
    );
  } catch (error) {
    // Fallback for simple text notifications
    const options = {
      body: event.data.text(),
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png'
    };
    
    event.waitUntil(
      self.registration.showNotification('GreenScape Lux', options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/notifications';

  if (event.action === 'view') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if dashboard is already open
          for (const client of clientList) {
            if (client.url.includes('/notifications') && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window if not found
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default click action
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          if (clientList.length > 0) {
            return clientList[0].focus();
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      // Sync pending notifications when back online
      fetch('/api/sync-notifications', { method: 'POST' })
        .catch(() => {
          // Handle sync failure silently
        })
    );
  }
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    // Handle test notifications from dashboard
    const options = {
      body: event.data.body || 'Test notification',
      icon: '/icon-192x192.png',
      tag: 'test-notification'
    };
    
    self.registration.showNotification(
      event.data.title || 'Test Alert', 
      options
    );
  }
});
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
