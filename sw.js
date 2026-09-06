const CACHE = 'alta-ccp-shell-v5';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Nunca interceptar POSTs da API. O frontend e o backend já usam o mesmo
  // formato de payload; alterar o corpo dentro do service worker torna o envio
  // frágil e pode gerar "Falha ao preparar o lote" antes de a requisição
  // sequer chegar ao servidor.
  if (event.request.method !== 'GET') return;

  // Navegação em modo network-first para evitar ficar presa em versões antigas do app.
  if (event.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put('./index.html', copy));
        return resp;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return resp;
    }))
  );
});
