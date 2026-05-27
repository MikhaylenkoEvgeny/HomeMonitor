// HomeMonitor disables the upstream cache-first service worker so UI overlay
// changes are visible immediately after reinstall.
const CACHE_NAME = 'ruview-homemonitor-ru-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
        return Promise.resolve(false);
      })))
      .then(() => self.clients.claim())
  );
});
