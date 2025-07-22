const CACHE_NAME = 'visual-appointment-timer-v2.0';
const CACHE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './vta-192.png',
    './vta-512.png',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
];

// Advanced caching strategy
const CACHE_STRATEGY = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Install event - cache essential assets
self.addEventListener('install', event => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app assets');
                return cache.addAll(CACHE_ASSETS);
            })
            .then(() => {
                console.log('[SW] Assets cached successfully');
                self.skipWaiting(); // Activate immediately
            })
            .catch(error => {
                console.error('[SW] Failed to cache assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all pages immediately
            self.clients.claim()
        ])
    );
});

// Enhanced fetch strategy
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Handle different types of requests
    if (event.request.destination === 'audio') {
        // Audio files - cache first for offline playback
        event.respondWith(cacheFirst(event.request));
    } else if (url.origin === location.origin) {
        // Local assets - stale while revalidate
        event.respondWith(staleWhileRevalidate(event.request));
    } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
        // Google Fonts - cache first
        event.respondWith(cacheFirst(event.request));
    } else {
        // Other external resources - network first
        event.respondWith(networkFirst(event.request));
    }
});

// Cache-first strategy
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache-first failed:', error);
        return new Response('Offline content unavailable', { status: 503 });
    }
}

// Network-first strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response('Offline and no cached version available', { status: 503 });
    }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then(networkResponse => {
        cache.put(request, networkResponse.clone());
        return networkResponse;
    }).catch(() => cachedResponse);
    
    return cachedResponse || fetchPromise;
}

// Background sync for offline functionality
self.addEventListener('sync', event => {
    console.log('[SW] Background sync triggered:', event.tag);
    if (event.tag === 'background-appointments') {
        event.waitUntil(syncAppointments());
    }
});

async function syncAppointments() {
    try {
        // Sync appointments when back online
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_APPOINTMENTS',
                payload: { status: 'synced' }
            });
        });
    } catch (error) {
        console.error('[SW] Failed to sync appointments:', error);
    }
}

// Push notifications for appointment reminders
self.addEventListener('push', event => {
    console.log('[SW] Push event received');
    
    const options = {
        body: event.data ? event.data.text() : 'Appointment reminder',
        icon: './vta-192.png',
        badge: './vta-192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'appointment-reminder',
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: 'View Appointment',
                icon: './vta-192.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: './vta-192.png'
            }
        ],
        data: {
            url: './index.html',
            timestamp: Date.now()
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('Appointment Reminder', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    console.log('[SW] Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('./index.html')
        );
    } else if (event.action === 'dismiss') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes('./index.html') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if app is not open
                if (clients.openWindow) {
                    return clients.openWindow('./index.html');
                }
            })
        );
    }
});

// Handle messages from the main app
self.addEventListener('message', event => {
    console.log('[SW] Message received:', event.data);
    
    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_NAME });
            break;
        case 'FORCE_UPDATE':
            // Force update by deleting cache and reinstalling
            event.waitUntil(
                caches.delete(CACHE_NAME).then(() => {
                    self.registration.update();
                })
            );
            break;
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    console.log('[SW] Periodic sync triggered:', event.tag);
    if (event.tag === 'appointment-check') {
        event.waitUntil(checkUpcomingAppointments());
    }
});

async function checkUpcomingAppointments() {
    try {
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'CHECK_APPOINTMENTS',
                payload: { timestamp: Date.now() }
            });
        });
    } catch (error) {
        console.error('[SW] Failed to check appointments:', error);
    }
}

console.log('[SW] Service worker script loaded');
