/**
 * Custom Service Worker for StockPulse Push Notifications (No VAPID)
 * =================================================================
 * 
 * Handles push notifications with mobile compatibility
 * and proper event handling for iOS and Android devices.
 * Simplified implementation without VAPID dependencies.
 */

const CACHE_NAME = 'stockpulse-v1';
const STATIC_CACHE = 'stockpulse-static-v1';
const DYNAMIC_CACHE = 'stockpulse-dynamic-v1';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll([
          '/',
          '/manifest.json',
          '/icons/icon-192x192.svg',
          '/icons/icon-512x512.svg',
          '/offline.html'
        ]);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('Service Worker: Activation failed', error);
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received', event);
  
  let notificationData = {
    title: 'StockPulse',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    tag: 'stockpulse-notification',
    requireInteraction: false,
    data: {},
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/action-view.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/action-close.svg'
      }
    ]
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('Service Worker: Push data received', pushData);
      
      notificationData = {
        ...notificationData,
        ...pushData,
        // Ensure required fields are present
        title: pushData.title || notificationData.title,
        body: pushData.body || notificationData.body,
        icon: pushData.icon || notificationData.icon,
        badge: pushData.badge || notificationData.badge,
        tag: pushData.tag || notificationData.tag,
        requireInteraction: pushData.requireInteraction !== undefined ? pushData.requireInteraction : notificationData.requireInteraction,
        data: pushData.data || notificationData.data,
        actions: pushData.actions || notificationData.actions
      };
    } catch (error) {
      console.error('Service Worker: Failed to parse push data', error);
      // Use default notification data
    }
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log('Service Worker: Notification shown successfully');
      })
      .catch((error) => {
        console.error('Service Worker: Failed to show notification', error);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();

  if (event.action === 'close') {
    console.log('Service Worker: Notification closed by user');
    return;
  }

  // Handle notification click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('Service Worker: Focusing existing window');
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          console.log('Service Worker: Opening new window');
          return clients.openWindow('/');
        }
      })
      .catch((error) => {
        console.error('Service Worker: Failed to handle notification click', error);
      })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      Promise.resolve()
        .then(() => {
          console.log('Service Worker: Background sync completed');
        })
        .catch((error) => {
          console.error('Service Worker: Background sync failed', error);
        })
    );
  }
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Fetch event - handle network requests
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
        // Return cached version if available
        if (response) {
          return response;
        }

        // Fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cache successful responses
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

console.log('Service Worker: Script loaded successfully');
