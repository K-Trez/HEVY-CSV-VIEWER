const SHELL_CACHE = 'hevy-shell-v1';
const SHARE_CACHE = 'hevy-share-v1';
const SHARED_KEY = '/__shared_csv__';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then(cache => cache.addAll(['/']))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(key => key !== SHELL_CACHE && key !== SHARE_CACHE)
          .map(key => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(handleShare(event.request));
    return;
  }

  if (event.request.method !== 'GET') return;

  const sameOrigin = url.origin === self.location.origin;
  const isFont = FONT_HOSTS.includes(url.hostname);
  if (!sameOrigin && !isFont) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(staleWhileRevalidate(event.request, isFont));
  }
});

async function handleShare(request) {
  try {
    const form = await request.formData();
    const file = form.get('workout_csv');
    if (!file || typeof file === 'string') {
      return Response.redirect('/?share=missing', 303);
    }

    const text = await file.text();
    if (!text.trim()) {
      return Response.redirect('/?share=empty', 303);
    }

    const cache = await caches.open(SHARE_CACHE);
    await cache.put(
      SHARED_KEY,
      new Response(text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Filename': encodeURIComponent(file.name || 'workout_data.csv'),
        },
      })
    );

    return Response.redirect('/?share=1', 303);
  } catch {
    return Response.redirect('/?share=error', 303);
  }
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(request, allowOpaque = false) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then(response => {
      if (response.ok || (allowOpaque && response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const fresh = await network;
  return fresh || Response.error();
}
