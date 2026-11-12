// PidgeX Progressive Web App Service Worker with Native Push & Call Notifications
const CACHE_NAME = 'pidgex-pwa-v6';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

// Resilient Network-First fetch handler that NEVER returns undefined or breaks Google Chrome
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass service worker for dynamic API, websockets, live dev modules and external resources
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/ws') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src') ||
    url.pathname.startsWith('/node_modules') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('google') ||
    url.hostname.includes('gstatic')
  ) {
    return;
  }

  // Handle navigation requests (opening the app in Chrome/Google)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        try {
          const cached = await caches.match('/index.html');
          if (cached) return cached;
        } catch {}
        return new Response(
          '<!doctype html><html><head><meta charset="utf-8"><title>PidgeX</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#0f131c;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center"><h2>PidgeX</h2><p>Reconectando a la red...</p><button onclick="location.reload()" style="padding:10px 20px;border-radius:8px;background:#2563eb;color:#fff;border:none;cursor:pointer">Reintentar</button></div></body></html>',
          {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          }
        );
      })
    );
    return;
  }
});

// OS Native Push Notifications Handler (Lockscreen, Background & System Tray)
self.addEventListener('push', (event) => {
  let data = {
    title: 'PidgeX 🐦',
    body: 'Tienes un nuevo mensaje en PidgeX',
    icon: '/pidgex-logo.svg',
    type: 'message',
    url: '/',
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const isCall =
    data.type === 'call' ||
    (data.title && data.title.toLowerCase().includes('llamada'));

  const options = isCall
    ? {
        body: data.body || '📞 Llamada entrante en PidgeX. Toca para contestar.',
        icon: data.icon || '/pidgex-logo.svg',
        badge: '/pidgex-logo.svg',
        vibrate: [1000, 400, 1000, 400, 1000, 400, 1200],
        tag: 'incoming_call',
        renotify: true,
        requireInteraction: true,
        data: {
          url: data.url || `/?autoAnswerCall=${data.callId || ''}`,
          callId: data.callId,
          type: 'call',
        },
        actions: [
          { action: 'answer', title: '📞 Contestar' },
          { action: 'decline', title: '❌ Rechazar' },
        ],
      }
    : {
        body: data.body || 'Nuevo mensaje recibido en PidgeX',
        icon: data.icon || '/pidgex-logo.svg',
        badge: '/pidgex-logo.svg',
        vibrate: [300, 150, 300],
        tag: data.tag || `msg_${Date.now()}`,
        renotify: true,
        requireInteraction: false,
        data: {
          url: data.url || (data.chatId ? `/?chatId=${data.chatId}` : '/'),
          chatId: data.chatId,
          type: 'message',
        },
        actions: [{ action: 'open', title: '💬 Abrir Chat' }],
      };

  event.waitUntil(
    self.registration.showNotification(data.title || (isCall ? '📞 Llamada en PidgeX' : 'PidgeX 🐦'), options)
  );
});

// Notification Click Handler (Brings app to foreground / answers call directly)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notificationData = event.notification.data || {};
  const action = event.action;
  let targetUrl = notificationData.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If user tapped "Decline"
        if (action === 'decline') {
          if (notificationData.callId) {
            try {
              fetch('/api/calls/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callId: notificationData.callId, status: 'declined' }),
              }).catch(() => {});
            } catch (e) {}
          }
          for (const client of clientList) {
            client.postMessage({
              type: 'DECLINE_CALL',
              callId: notificationData.callId,
            });
          }
          return;
        }

        if (action === 'answer' && !targetUrl.includes('answer=true')) {
          targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'answer=true';
        }

        // Check if an existing PidgeX tab is open
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            if (action === 'answer' && notificationData.callId) {
              client.postMessage({
                type: 'ANSWER_CALL',
                callId: notificationData.callId,
              });
            }
            return client.focus();
          }
        }

        // If no open tab, open new window to target URL (wakes phone browser)
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
