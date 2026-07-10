const CACHE_NAME = 'efra-pattern-quickadd-20260710-v1';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'patterns.html',
  'review.html',
  'search.html',
  'quickadd.html',
  'settings.html',
  'style.css',
  'script.js',
  'data.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).catch(() => caches.match('index.html'))));
});
