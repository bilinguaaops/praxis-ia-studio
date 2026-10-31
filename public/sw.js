// Praxis Pro - Service Worker pour Notifications Web Push & PWA
const CACHE_NAME = 'praxis-cache-v1';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activation et prise de contrôle immédiate
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Réception des notifications Push émises par le serveur Praxis
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Praxis IA',
        body: event.data.text() || 'Nouvelle notification pédagogique',
      };
    }
  }

  const title = data.title || 'Praxis Pro · Notification';
  const options = {
    body: data.body || 'Une information importante vous attend sur votre espace enseignant.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/favicon-32x32.png',
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      ...data.data,
    },
    vibrate: [150, 80, 150],
    tag: data.tag || `praxis-${Date.now()}`,
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'open', title: 'Ouvrir Praxis' },
      { action: 'close', title: 'Fermer' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur la notification push
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si une fenêtre Praxis est déjà ouverte, la mettre au premier plan et naviguer
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (targetUrl && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Sinon, ouvrir une nouvelle fenêtre vers l'URL ciblée
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
