const CACHE_NAME = 'visual-appointment-reminders-v1';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './service-worker.js',
    './styles.css',
    './vta-192.png',
    './vta-512.png',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(urlsToCache))
    );
});

// Fetch event (serve cached files first)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
});

// Activate event (clean up old caches)
self.addEventListener('activate', event => {
    const cacheAllowlist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheAllowlist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Request notification permission on load
if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
}

function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
    }
}

// Update playWarningBeep and playAlarmSound to also show notifications
function playWarningBeep() {
    const audio = document.getElementById('warningBeep');
    audio.play();
    showNotification('Appointment Reminder', 'Your appointment reminder time has been reached!');
}

function playAlarmSound() {
    const audio = document.getElementById('alarmSound');
    audio.play();
    showNotification('Appointment Time', 'Your appointment time is now!');
}
