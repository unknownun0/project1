// Service Worker for offline caching
const CACHE_NAME = 'profile-card-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/config.js',
  '/University_of_Perpetual_Help_System_DALTA_logo.png',
  '/test-profile.svg',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap',
  'https://fonts.gstatic.com/s/plusjakartasans/v9/6NuA92YF9W3hXHbL88aUuweUbFsM.woff2'
];

// Install - cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS.map(url => new Request(url, { credentials: 'omit' }))))
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension, etc.
  if (!request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.match(request).then(cached => {
      // Return cached version if available
      if (cached) return cached;
      
      // Otherwise fetch from network
      return fetch(request).then(response => {
        // Don't cache opaque responses (cross-origin no-cors)
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        
        // Cache the new response
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
        return response;
      }).catch(() => {
        // Offline fallback for HTML pages
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});