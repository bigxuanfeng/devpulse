'use client';

import { useEffect } from 'react';

export function SWRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // 开发环境：主动注销所有已注册的 Service Worker
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          if (registrations.length > 0) {
            console.log(`[SW] 开发环境：注销 ${registrations.length} 个旧 Service Worker`);
            registrations.forEach((registration) => {
              registration.unregister();
            });
          }
        })
        .catch((error) => {
          console.error('[SW] 注销失败:', error);
        });

      // 同时清除所有缓存
      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            caches.delete(cacheName);
          });
        });
      }
      return;
    }

    // 生产环境：注册 Service Worker
    const registerSW = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] 注册成功:', registration.scope);
        })
        .catch((error) => {
          console.error('[SW] 注册失败:', error);
        });
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }

    return () => {
      window.removeEventListener('load', registerSW);
    };
  }, []);

  return null;
}
