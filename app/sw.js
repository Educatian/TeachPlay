/**
 * Service Worker for PWA
 * Handles caching and offline functionality
 */

const CACHE_NAME = 'microcredential-v1';
const DYNAMIC_CACHE = 'microcredential-dynamic-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// API routes that should use network-first strategy
const API_ROUTES = [
    '/api/',
    'supabase.co',
    'generativelanguage.googleapis.com',
];

// ==============================
// Install Event
// ==============================

self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// ==============================
// Activate Event
// ==============================

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// ==============================
// Fetch Event
// ==============================

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension requests
    if (url.protocol === 'chrome-extension:') return;

    // API requests: Network first, fall back to cache
    if (isApiRequest(url)) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Static assets: Cache first, fall back to network
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Pages: Stale while revalidate
    event.respondWith(staleWhileRevalidate(request));
});

// ==============================
// Caching Strategies
// ==============================

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return createOfflineResponse();
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        return createOfflineResponse();
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request)
        .then((response) => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached || createOfflineResponse());

    return cached || fetchPromise;
}

// ==============================
// Helper Functions
// ==============================

function isApiRequest(url) {
    return API_ROUTES.some((route) => url.href.includes(route));
}

function isStaticAsset(url) {
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2'];
    return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

function createOfflineResponse() {
    const offlineHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline - Microcredential</title>
            <style>
                :root {
                    --ua-crimson: #9E1B32;
                }
                body {
                    font-family: system-ui, -apple-system, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    color: #1e293b;
                    text-align: center;
                    padding: 20px;
                }
                .offline-icon {
                    font-size: 64px;
                    margin-bottom: 20px;
                }
                h1 {
                    color: var(--ua-crimson);
                    margin: 0 0 10px 0;
                }
                p {
                    color: #64748b;
                    max-width: 400px;
                    line-height: 1.6;
                }
                button {
                    margin-top: 20px;
                    padding: 12px 24px;
                    background: var(--ua-crimson);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                button:hover {
                    background: #7d1528;
                }
            </style>
        </head>
        <body>
            <div class="offline-icon">📶</div>
            <h1>You're Offline</h1>
            <p>
                It looks like you've lost your internet connection. 
                Some features may not be available until you're back online.
            </p>
            <button onclick="window.location.reload()">Try Again</button>
        </body>
        </html>
    `;

    return new Response(offlineHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
    });
}

// ==============================
// Push Notifications
// ==============================

self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || 'New notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
        },
        actions: data.actions || [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Microcredential', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// ==============================
// Background Sync
// ==============================

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-submissions') {
        event.waitUntil(syncPendingSubmissions());
    }
});

async function syncPendingSubmissions() {
    try {
        const cache = await caches.open('pending-submissions');
        const requests = await cache.keys();

        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const data = await response.json();
                await fetch(request.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                await cache.delete(request);
            }
        }
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}
