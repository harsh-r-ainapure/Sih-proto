const CACHE_NAME = 'ocean-hazard-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const STATIC_CACHE_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/wave-svgrepo-com.svg'
];

// Dynamic cache for API responses and other resources
const DYNAMIC_CACHE_NAME = 'ocean-hazard-dynamic-v1.0.0';

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_CACHE_FILES);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If online, cache the response and return it
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // If offline, try to serve from cache, fallback to offline page
          return caches.match(request)
            .then((response) => {
              if (response) {
                return response;
              }
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // Handle API requests (cache-first strategy for GeoJSON data)
  if (url.pathname.includes('/data/') && url.pathname.includes('.geojson')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            console.log('Service Worker: Serving GeoJSON from cache', request.url);
            return response;
          }
          
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE_NAME)
                  .then((cache) => {
                    console.log('Service Worker: Caching GeoJSON', request.url);
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch((error) => {
              console.error('Service Worker: Failed to fetch GeoJSON', error);
              throw error;
            });
        })
    );
    return;
  }

  // Handle static assets (cache-first strategy)
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE_NAME)
                  .then((cache) => cache.put(request, responseClone));
              }
              return response;
            });
        })
    );
    return;
  }

  // For all other requests, use network-first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE_NAME)
            .then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle background sync for offline form submissions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event', event.tag);
  
  if (event.tag === 'incident-report-sync') {
    event.waitUntil(
      syncIncidentReports()
    );
  }
});

// Function to sync incident reports when online
async function syncIncidentReports() {
  try {
    // Get pending reports from IndexedDB or localStorage
    const pendingReports = await getPendingReports();
    
    for (const report of pendingReports) {
      try {
        const response = await fetch('/api/incidents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report.data)
        });
        
        if (response.ok) {
          await removePendingReport(report.id);
          console.log('Service Worker: Synced incident report', report.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync report', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Helper functions for managing pending reports
async function getPendingReports() {
  // This would typically use IndexedDB
  // For now, return empty array as placeholder
  return [];
}

async function removePendingReport(id) {
  // This would typically remove from IndexedDB
  console.log('Service Worker: Removing pending report', id);
}

// Handle push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  const options = {
    body: 'New ocean hazard alert in your area',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Ocean Hazard Alert', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/map')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

