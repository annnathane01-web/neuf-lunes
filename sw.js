// Fonctionne hors connexion : met l'appli, les images et les polices en cache
const CACHE='neuf-lunes-v17';
const FILES=['./','index.html','manifest.webmanifest','annuaire.json','catalogue.json','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png','icons/favicon.png',
  'fonts/dancing-script-latin-ext.woff2','fonts/dancing-script-latin.woff2','fonts/figtree-latin-ext.woff2','fonts/figtree-latin.woff2','fonts/young-serif-latin-ext.woff2','fonts/young-serif-latin.woff2','img/bebe-00.webp','img/bebe-01.webp','img/bebe-02.webp','img/bebe-03.webp','img/bebe-04.webp','img/bebe-05.webp','img/bebe-06.webp','img/bebe-07.webp','img/bebe-08.webp','img/bebe-09.webp','img/bebe-10.webp','img/bebe-11.webp','img/medaillon.webp','img/yoga-ball.webp','img/yoga-breath.webp','img/yoga-butterfly.webp','img/yoga-calf.webp','img/yoga-catcow.webp','img/yoga-child.webp','img/yoga-lie.webp','img/yoga-neck.webp','img/yoga-side.webp','img/yoga-slow.webp','img/yoga-squat.webp','img/yoga-tilt.webp','img/yoga-warrior.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    // réseau d'abord pour la page (mises à jour), cache sinon
    e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c))}return res}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
  }
});
