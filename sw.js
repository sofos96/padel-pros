const CACHE_NAME = 'padel-pros-v2';
// Dynamic base path detection
const BASE_PATH = self.location.pathname.includes('/padel-pros/') ? '/padel-pros' : '';
const urlsToCache = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/style.css',
  BASE_PATH + '/script.js',
  BASE_PATH + '/config.js',
  BASE_PATH + '/manifest.json',
  BASE_PATH + '/images/logo.jpg',
  BASE_PATH + '/images/avatars/sofos.jpg',
  BASE_PATH + '/images/avatars/millis.jpg',
  BASE_PATH + '/images/avatars/mamoush.jpg',
  BASE_PATH + '/images/avatars/andreas.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Cache populated, skipping waiting...');
        return self.skipWaiting();
      })
  );
});

// Handle skip waiting message
self.addEventListener('message', event => {
  if (event.data && event.data.command === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        // For navigation requests, try to serve index.html
        if (event.request.mode === 'navigate') {
          return caches.match(BASE_PATH + '/index.html') || fetch(event.request);
        }
        
        return fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, serve index.html for navigation
        if (event.request.mode === 'navigate') {
          return caches.match(BASE_PATH + '/index.html');
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated, claiming clients...');
      return self.clients.claim();
    })
  );
});

// Push notification event
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Νέα ειδοποίηση από Padel Pros!',
    icon: BASE_PATH + '/images/logo.jpg',
    badge: BASE_PATH + '/images/logo.jpg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Άνοιγμα εφαρμογής',
        icon: BASE_PATH + '/images/logo.jpg'
      },
      {
        action: 'close',
        title: 'Κλείσιμο'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Padel Pros', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow(BASE_PATH + '/')
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle offline actions when back online
  return new Promise((resolve) => {
    // This would sync any pending actions
    console.log('Background sync triggered');
    resolve();
  });
} 