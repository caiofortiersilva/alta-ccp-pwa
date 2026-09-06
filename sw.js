const CACHE = 'alta-ccp-shell-v4';
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

  // Compatibilidade entre o formato atual do frontend e o backend.
  if (event.request.method === 'POST' && url.pathname === '/api/generate') {
    event.respondWith((async () => {
      try {
        const original = await event.request.clone().json();
        const body = original && original.payload
          ? original
          : { payload: original, recipient: original && original.recipient };

        const response = await fetch(event.request.url, {
          method: 'POST',
          headers: event.request.headers,
          body: JSON.stringify(body)
        });

        let data;
        try { data = await response.clone().json(); } catch { return response; }
        if (data && data.generated == null && data.patients != null) data.generated = data.patients;

        const headers = new Headers(response.headers);
        headers.set('Content-Type', 'application/json; charset=utf-8');
        return new Response(JSON.stringify(data), {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      } catch (e) {
        return new Response(JSON.stringify({ok:false,error:'Falha ao preparar o lote'}), {
          status: 500,
          headers: {'Content-Type':'application/json; charset=utf-8'}
        });
      }
    })());
    return;
  }

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
