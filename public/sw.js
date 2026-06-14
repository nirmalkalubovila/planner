// Legacy Life Builder — Service Worker
// Handles push notifications, notification clicks, and basic caching.

const SW_VERSION = '1.0.2';
const CACHE_NAME = `llb-cache-v${SW_VERSION}`;

// ─── Install ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/white-logo.svg',
      ]).catch((err) => console.warn('Failed to precache default assets:', err));
    })
  );
});

// ─── Activate ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch Strategy ──────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  // Skip browser extensions and non-http protocols
  if (!requestUrl.protocol.startsWith('http')) return;

  // Disable caching on localhost/development to prevent stale asset issues with Vite's bundler
  const isLocalhost = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
  if (isLocalhost) {
    event.respondWith(fetch(event.request));
    return;
  }

  const isNavigation = event.request.mode === 'navigate';
  const isAPI = requestUrl.pathname.includes('/api/') || requestUrl.host.includes('supabase.co');

  if (isNavigation || isAPI) {
    // Network-first (Network Falling Back to Cache)
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the latest page structure
          if (isNavigation && response.status === 200) {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          }
          return response;
        })
        .catch(() => {
          // If offline, serve from cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Fallback for navigation requests when offline
            if (isNavigation) {
              return caches.match('/index.html') || caches.match('/');
            }
          });
        })
    );
  } else {
    // Cache-first (Cache Falling Back to Network)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then((response) => {
          // Only cache successful requests
          if (response.status === 200) {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          }
          return response;
        }).catch(() => {
          // Offline fallback
          return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
        });
      })
    );
  }
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

  // Keep task reminders visible until user interacts (important on mobile)
  const isTaskNotif = (data.tag || '').startsWith('task-');

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
    requireInteraction: isTaskNotif, // Keep task notifications persistent
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

// ─── Push Subscription Change (auto-renewal) ─────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  // When the browser rotates/expires the push subscription,
  // re-subscribe with the same VAPID key and notify the main thread
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription?.options || { userVisibleOnly: true })
      .then((newSubscription) => {
        // Notify all open clients to save the new subscription
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'PUSH_SUBSCRIPTION_CHANGED',
              subscription: newSubscription.toJSON(),
            });
          });
        });
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
