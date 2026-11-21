const scope = self.registration.scope;
const cacheName = 'teo-security-shell-v5:' + scope;
const entry = new URL('index.html?release=5', scope).href;
const app = new URL('app-offline.js', scope).href;
const assets = ['style.css?v=3', 'install.js', 'manifest.webmanifest?v=2',
  'assets/driveway.webp', 'assets/barrier-arm.webp', 'assets/teo.svg',
  'assets/icon-192.png', 'assets/icon-512.png'].map(path => new URL(path, scope).href);
const urls = new Set([app, ...assets]);
const oldNames = ['teo-security-shell-v3', 'teo-security-shell-v4'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    const response = await fetch(entry, {cache: 'reload'});
    if (!response.ok || !(await response.clone().text()).includes('src="./app-offline.js"')) {
      throw new Error('Updated application shell is not available yet');
    }
    await cache.addAll([...urls].map(url => new Request(url, {cache: 'reload'})));
    await cache.put(entry, response);
    await self.skipWaiting();
  })());
});

function appPage(url) {
  const path = new URL(url);
  return path.origin === self.location.origin &&
    (path.pathname === new URL(scope).pathname || path.pathname === new URL(entry).pathname);
}

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const oldCaches = [];
    for (const name of await caches.keys()) {
      if (oldNames.includes(name) && await (await caches.open(name)).match(new URL('index.html', scope))) {
        oldCaches.push(name);
      }
    }
    await self.clients.claim();
    if (oldCaches.length) {
      const tabs = await self.clients.matchAll({type: 'window'});
      await Promise.allSettled(tabs.filter(tab => appPage(tab.url)).map(tab => tab.navigate(tab.url)));
      await Promise.all(oldCaches.map(name => caches.delete(name)));
    }
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const key = request.mode === 'navigate' && appPage(request.url) ? entry : request.url;
  if (key !== entry && !urls.has(key)) return;
  event.respondWith(caches.open(cacheName).then(async cache => (await cache.match(key)) || fetch(request)));
});
