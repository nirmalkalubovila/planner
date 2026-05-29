// Legacy Life Builder — Service Worker
// Handles push notifications, notification clicks, and basic caching.

const SW_VERSION = '1.0.0';
const CACHE_NAME = `llb-cache-v${SW_VERSION}`;

// ─── Install ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ─── Push Notification Received ──────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Legacy Life Builder', body: 'You have a new notification', url: '/today' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/white-logo.svg',
    badge: '/white-logo.svg',
    vibrate: [100, 50, 100, 50, 200],
    data: { url: data.url || '/today' },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    tag: data.tag || `llb-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ─── Notification Click ──────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/today';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'NOTIFICATION_CLICK', url });
          return;
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(url);
    })
  );
});

// ─── Message from main thread ────────────────────────────
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  if (type === 'SHOW_NOTIFICATION') {
    const { title, options } = payload;
    self.registration.showNotification(title, {
      body: options.body || '',
      icon: '/white-logo.svg',
      badge: '/white-logo.svg',
      vibrate: [100, 50, 100, 50, 200],
      data: { url: options.url || '/today' },
      tag: options.tag || `llb-${Date.now()}`,
      renotify: !!options.renotify,
      silent: options.silent || false,
    });
  }

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
