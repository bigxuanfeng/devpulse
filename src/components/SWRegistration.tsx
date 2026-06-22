'use client';

import { useEffect } from 'react';

export function SWRegistration() {
  useEffect(() => {
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

    // 如果页面已经加载完成，立即注册；否则等待加载完成
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
