const CACHE_NAME = 'cave-game-v7';
const BASE_PATH = '/CaveGame';
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/game.js`,
  `${BASE_PATH}/world.js`,
  `${BASE_PATH}/player.js`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/three.min.js`,  
  `${BASE_PATH}/Screenshot_20250209-154144~2.png`,
  `${BASE_PATH}/3227683066.png`,
  `${BASE_PATH}/Screenshot_20250209-205941~2.png`,
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});