// Service Worker for Circuit Racing 4 - enables offline play
const CACHE_NAME = 'cr4-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/audio.js',
  './js/particles.js',
  './js/car.js',
  './js/track.js',
  './js/environment.js',
  './js/effects.js',
  './js/items.js',
  './js/ai.js',
  './js/slipstream.js',
  './js/camera.js',
  './js/input.js',
  './js/hud.js',
  './js/tutorial.js',
  './js/career.js',
  './js/celebration.js',
  './js/menu.js',
  './js/game.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      // Try network first for CDN resources, cache first for local
      if (event.request.url.includes('cdn.jsdelivr.net') || event.request.url.includes('fonts.googleapis.com')) {
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        }).catch(() => cached);
      }
      return cached || fetch(event.request);
    })
  );
});
