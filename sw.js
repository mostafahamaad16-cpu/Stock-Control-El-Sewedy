const CACHE_NAME = 'inventory-app-v4'; 

const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './favicon.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting(); 
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // التقاط الشيت المرسل عبر المشاركة (Share Target)
    if (event.request.method === 'POST' && event.request.url.includes('/share-target/')) {
        event.respondWith((async () => {
            try {
                const formData = await event.request.formData();
                const file = formData.get('sharedFile');
                if (file) {
                    // حفظ الشيت مؤقتاً في الكاش
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put('/shared-excel-file', new Response(file));
                }
                // فتح التطبيق وإخباره بوجود شيت جديد
                return Response.redirect('/?shared=1', 303);
            } catch (err) {
                return Response.redirect('/', 303);
            }
        })());
        return;
    }

    // الكود العادي لتشغيل التطبيق أوفلاين (Network First)
    if (!event.request.url.startsWith('http')) return;
    event.respondWith(
        fetch(event.request).then(response => {
            return caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, response.clone());
                return response;
            });
        }).catch(() => {
            return caches.match(event.request);
        })
    );
});
