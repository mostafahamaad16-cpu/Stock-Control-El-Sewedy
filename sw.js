const CACHE_NAME = 'inventory-app-v10'; 
const SHARED_CACHE = 'shared-file-cache'; // صندوق مخصص وثابت للملفات المشتركة

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
                    // لا تحذف صندوق الملفات المشتركة عند التحديث
                    if (cacheName !== CACHE_NAME && cacheName !== SHARED_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // التقاط الشيت المرسل عبر المشاركة
    if (event.request.method === 'POST' && event.request.url.includes('share-target')) {
        event.respondWith((async () => {
            try {
                const formData = await event.request.formData();
                const file = formData.get('sharedFile');
                if (file) {
                    // حفظ الشيت في الصندوق المخصص
                    const cache = await caches.open(SHARED_CACHE);
                    await cache.put('/shared-excel', new Response(file));
                }
                // التوجيه لمسار جيت هاب
                return Response.redirect('/Stock-Control-El-Sewedy/?shared=1', 303);
            } catch (err) {
                return Response.redirect('/Stock-Control-El-Sewedy/', 303);
            }
        })());
        return;
    }

    // الكود العادي للأوفلاين
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
