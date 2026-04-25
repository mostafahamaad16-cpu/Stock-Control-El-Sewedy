// قم بتغيير رقم الإصدار هنا (مثلاً v2 إلى v3) كلما قمت بتعديل كود HTML ورفعه على جيت هاب
// هذا يجبر متصفحات المستخدمين على تحديث التطبيق لديهم
const CACHE_NAME = 'inventory-app-v2'; 

const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './favicon.png'
];

// 1. تثبيت الـ Service Worker وحفظ الملفات الأساسية
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
    );
    // تفعيل الـ Service Worker الجديد فوراً
    self.skipWaiting(); 
});

// 2. تفعيل الـ Service Worker ومسح أي كاش قديم (مهم جداً لتحديث التطبيق)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. اعتراض الطلبات (استراتيجية: الإنترنت أولاً، ثم الكاش في حالة انقطاع الشبكة)
self.addEventListener('fetch', event => {
    // تجاهل الطلبات التي لا تبدأ بـ http/https أو طلبات الإضافات الخارجية
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        fetch(event.request).then(response => {
            // إذا كان هناك اتصال بالإنترنت، نقوم بجلب النسخة الأحدث وتحديث الكاش الصامت
            return caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, response.clone());
                return response;
            });
        }).catch(() => {
            // حدث خطأ في الشبكة (الإنترنت مقطوع) -> نجلب الملف من الكاش لضمان استمرار العمل
            console.log('[Service Worker] Network failed, falling back to cache.');
            return caches.match(event.request);
        })
    );
});
