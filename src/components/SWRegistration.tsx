'use client';

import { useEffect } from 'react';

export function SWRegistration() {
  useEffect(() => {
    // 只在生产环境注册 Service Worker
    // 开发环境下 SW 会拦截 HMR 请求，导致页面无限刷新
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

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
