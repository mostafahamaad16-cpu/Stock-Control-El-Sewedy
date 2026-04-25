const CACHE_NAME = 'inventory-app-v1';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './favicon.png'
];

// تثبيت الـ Service Worker وحفظ الملفات الأساسية
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// اعتراض الطلبات لتشغيل التطبيق أوفلاين
self.addEventListener('fetch', event => {
    // تجاهل الطلبات التي لا تبدأ بـ http/https
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // إذا كان الملف موجوداً في الـ Cache، قم بإرجاعه (أوفلاين)
                if (response) {
                    return response;
                }
                // إذا لم يكن موجوداً، قم بتحميله من الإنترنت ثم احفظه للعمل أوفلاين لاحقاً
                return fetch(event.request).then(fetchResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            }).catch(() => {
                // حالة الطوارئ إذا انقطع الإنترنت ولم يكن الملف في الكاش
                console.log("الإنترنت مقطوع والملف غير متاح محلياً.");
            })
    );
});