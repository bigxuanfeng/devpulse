/**
 * DevPulse Service Worker — 自毁模式
 * 此文件用于清除之前注册的 Service Worker 和所有缓存
 */

// 自毁：注销自身并清除所有缓存
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      self.registration.unregister(),
      caches.keys().then((keys) =>
        Promise.all(keys.map((key) => caches.delete(key)))
      ),
    ])
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.registration.unregister(),
      caches.keys().then((keys) =>
        Promise.all(keys.map((key) => caches.delete(key)))
      ),
      self.clients.claim(),
    ])
  );
});

// 所有请求直接透传到网络，不做任何拦截
self.addEventListener('fetch', (event) => {
  // 不调用 respondWith，让浏览器正常处理请求
});
