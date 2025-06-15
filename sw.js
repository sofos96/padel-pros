const CACHE_NAME = 'padel-pros-v1';
const BASE_PATH = '/padel-pros';
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
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
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