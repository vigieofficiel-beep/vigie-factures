const CACHE_NAME = 'vigie-pro-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo-vigie.png',
  '/manifest.json',
];

// Installation — mise en cache des assets statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activation — nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // On ne cache pas les appels API
  if (request.url.includes('/api/')) return;

  // On ne cache pas les requêtes Supabase
  if (request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // On met en cache les réponses valides
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback cache si offline
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Page offline générique si rien en cache
          return caches.match('/index.html');
        });
      })
  );
});
