const cacheName='teo-security-shell-v3';
const shell=['./index.html','./style.css?v=3','./app.js?v=3','./install.js','./manifest.webmanifest?v=2','./assets/driveway.webp','./assets/barrier-arm.webp','./assets/teo.svg','./assets/icon-192.png','./assets/icon-512.png'];
const urls=new Set(shell.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(shell)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('teo-security-shell-')&&k!==cacheName).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
  if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match(new URL('./index.html',self.registration.scope))));return}
  if(urls.has(event.request.url))event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));
});
