/* ============================================================
   Service Worker لتطبيق "شاشة المسجد"
   الإصدار: v4-2026-08-28

   ⚠️ مهم جدًا لصاحب المشروع: في كل مرة تُجري فيها أي تعديل على
   index.html أو أي ملف آخر في التطبيق وتريد أن تصل التحديثات فورًا
   لكل الشاشات، يجب رفع رقم CACHE_VERSION أدناه بمقدار 1 (مثلاً
   من v4 إلى v5). هذا يجبر كل الأجهزة على اعتماد الملفات الجديدة
   فورًا بدل الاستمرار في استخدام نسخة قديمة مخزّنة محليًا.
   ============================================================ */
const CACHE_VERSION = "mosque-display-v8";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
];

/* ---- التثبيت: تخزين نسخة أولية من التطبيق، وتفعيل النسخة الجديدة فورًا دون انتظار ---- */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return Promise.allSettled(
        APP_SHELL.map((url) => cache.add(url).catch(() => {}))
      );
    })
  );
});

/* ---- التفعيل: حذف أي نسخ كاش قديمة، والسيطرة الفورية على كل الصفحات المفتوحة ---- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ---- جلب الملفات ----
   لصفحة العرض الرئيسية (index.html): الشبكة أولاً، والكاش فقط كحل
   احتياطي عند انقطاع الإنترنت. هذا يضمن أن أي تحديث تنشره على
   GitHub يصل فورًا لكل شاشة متصلة، بدل انتظار اكتشاف التحديث.

   لبقية الملفات (صور، أيقونات...): الكاش أولاً لتسريع الأداء
   وتقليل استهلاك البيانات، مع تحديث الكاش في الخلفية عند توفر شبكة. */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const isNavigation =
    req.mode === "navigate" ||
    (req.destination === "document") ||
    req.url.endsWith("/") ||
    req.url.endsWith("index.html");

  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          const resClone = networkRes.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
          return networkRes;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((networkRes) => {
          const resClone = networkRes.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
          return networkRes;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
