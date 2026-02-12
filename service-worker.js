const CACHE_NAME = 'pilice-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalacja i zapisywanie plików w pamięci podręcznej
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
  );
});

// Serwowanie plików z pamięci podręcznej
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});