// Apartamenty Pilice – service worker
// Strategia "najpierw sieć": gdy telefon jest online, zawsze pobieramy najnowszą
// wersję strony. Kopia z pamięci podręcznej jest używana tylko offline.
// Zmiana CACHE_NAME usuwa stare kopie zapisane u gości.

const CACHE_NAME = 'pilice-v7';

// Adresy podajemy względem tego pliku (bez "/" na początku),
// więc działają pod każdą domeną i w każdym folderze.
const ASSETS = [
  './',
  'index.html',
  'index_en.html',
  'index_de.html',
  'trasy/index.html',
  'trasy/trasy.js',
  'css/style.css',
  'js/main.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'img/hero1.jpg'
];
const OFFLINE_PAGE = new URL('index.html', self.location).href;

// Instalacja: zapisz podstawowe strony i od razu przejmij kontrolę.
// Każdy plik zapisujemy osobno – brak jednego pliku (404) nie blokuje
// instalacji nowej wersji.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        ASSETS.map((path) => {
          const url = new URL(path, self.location).href;
          return fetch(url, { cache: 'reload' })
            .then((response) => (response.status === 200 ? cache.put(url, response) : undefined))
            .catch(() => undefined);
        })
      )
    )
  );
  self.skipWaiting();
});

// Aktywacja: usuń stare pamięci podręczne (np. 'pilice-v1')
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Pobieranie: najpierw sieć, a gdy brak internetu – kopia z pamięci podręcznej
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return; // linki zewnętrzne (Google Maps, YouTube itp.) obsługuje przeglądarka
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Zapisujemy tylko pełne odpowiedzi (200). Fragmenty plików (np. PDF
        // wczytywany po kawałku) nie dają się zapisać w pamięci podręcznej.
        if (response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, copy))
            .catch(() => undefined);
        }
        return response;
      })
      .catch(() =>
        caches.match(request, { ignoreSearch: true }).then((cached) =>
          cached
          || (request.mode === 'navigate' ? caches.match(OFFLINE_PAGE) : undefined)
          || Response.error()
        )
      )
  );
});
