'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          if (registration?.scope) {
            console.log('SW registered:', registration.scope);
          }
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(register, { timeout: 3000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(register, 2000);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  return null;
}
