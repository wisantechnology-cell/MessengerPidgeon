// PidgeX Progressive Web App Service Worker with WhatsApp-Style Push Calls & Native OS Sound Notifications
const CACHE_NAME = 'pidgex-pwa-v8';
const DEFAULT_ICON = '/assets/aistudio/Logo_de_PidgeX_5e3aa7b3.PNG';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((k) => k !== CACHE_NAME).map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

// Resilient Network-First fetch handler that NEVER returns undefined or breaks Chrome
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

  // Handle navigation requests (opening the app in Chrome/Safari)
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

function resolveNotificationIcon(rawIcon) {
  if (!rawIcon || typeof rawIcon !== 'string') return DEFAULT_ICON;
  if (rawIcon.startsWith('data:') || rawIcon.endsWith('.svg')) return DEFAULT_ICON;
  return rawIcon;
}

// OS Native Push Notifications Handler (Lockscreen, Background, Screen Wake & System Sound)
self.addEventListener('push', (event) => {
  let data = {
    title: 'PidgeX',
    body: 'Tienes un nuevo mensaje en PidgeX',
    icon: DEFAULT_ICON,
    type: 'message',
    url: '/',
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const iconUrl = resolveNotificationIcon(data.icon || data.callerAvatar);

  // 1. Call Ended / Missed Call Push
  if (data.type === 'call_ended') {
    event.waitUntil(
      (async () => {
        const tag = data.callId ? `pidgex_call_${data.callId}` : 'incoming_call';
        try {
          const existing = await self.registration.getNotifications({ tag });
          existing.forEach((n) => n.close());
          const generic = await self.registration.getNotifications({ tag: 'incoming_call' });
          generic.forEach((n) => n.close());
        } catch {}

        const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of clientList) {
          client.postMessage({ type: 'CALL_ENDED_PUSH', callId: data.callId });
        }

        if (data.missed) {
          await self.registration.showNotification(
            data.title || `📞 Llamada perdida de ${data.callerName || 'Contacto'}`,
            {
              body: data.body || 'Toca para abrir PidgeX y devolver la llamada.',
              icon: iconUrl,
              badge: DEFAULT_ICON,
              vibrate: [200, 100, 200],
              silent: false,
              tag: `pidgex_missed_${data.callId || Date.now()}`,
              renotify: true,
              data: {
                url: data.url || (data.chatId ? `/?chatId=${encodeURIComponent(data.chatId)}` : '/'),
                chatId: data.chatId,
                type: 'message',
              },
            }
          );
        }
      })()
    );
    return;
  }

  const isCall =
    data.type === 'call' ||
    (typeof data.title === 'string' && data.title.toLowerCase().includes('llamada'));

  // 2. WhatsApp-style Incoming Call Push (Wakes Screen, Continuous Vibration, Native System Alert, Answer/Decline)
  if (isCall) {
    event.waitUntil(
      (async () => {
        try {
          if (self.navigator && typeof self.navigator.setAppBadge === 'function') {
            await self.navigator.setAppBadge(1);
          }
        } catch {}

        // Notify any background/open tabs immediately so IncomingCallModal + ringtone + wakeLock activate
        const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of clientList) {
          client.postMessage({
            type: 'INCOMING_CALL_PUSH',
            call: {
              id: data.callId || `call_${Date.now()}`,
              callerId: data.callerId || '',
              callerName: data.callerName || 'Contacto PidgeX',
              callerPhone: data.callerPhone || '',
              callerAvatar: iconUrl,
              isVideo: Boolean(data.isVideo),
              isGroup: Boolean(data.isGroup),
              chatId: data.chatId || '',
            },
          });
        }

        const callTag = data.callId ? `pidgex_call_${data.callId}` : 'incoming_call';
        await self.registration.showNotification(
          data.title || `📞 Llamada de ${data.callerName || 'PidgeX'}`,
          {
            body: data.body || 'Llamada entrante en PidgeX • Toca para contestar',
            icon: iconUrl,
            badge: DEFAULT_ICON,
            vibrate: [1000, 350, 1000, 350, 1000, 350, 1200],
            tag: callTag,
            renotify: true,
            requireInteraction: true,
            silent: false,
            timestamp: Date.now(),
            data: {
              url: data.url || `/?autoAnswerCall=${encodeURIComponent(data.callId || '')}`,
              callId: data.callId,
              type: 'call',
              call: {
                id: data.callId || '',
                callerId: data.callerId || '',
                callerName: data.callerName || 'Contacto PidgeX',
                callerPhone: data.callerPhone || '',
                callerAvatar: iconUrl,
                isVideo: Boolean(data.isVideo),
                isGroup: Boolean(data.isGroup),
                chatId: data.chatId || '',
              },
            },
            actions: [
              { action: 'answer', title: '📞 Contestar' },
              { action: 'decline', title: '❌ Rechazar' },
            ],
          }
        );
      })()
    );
    return;
  }

  // 3. Incoming Message Push (Uses phone's own configured OS notification sound via silent: false + vibration)
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const hasFocusedVisibleClient = clientList.some(
        (c) => c.visibilityState === 'visible' && c.focused
      );

      // If app is already open and focused, let the active page handle foreground notification without double-firing
      if (hasFocusedVisibleClient && !data.forceShow) {
        return;
      }

      try {
        if (self.navigator && typeof self.navigator.setAppBadge === 'function') {
          await self.navigator.setAppBadge(1);
        }
      } catch {}

      await self.registration.showNotification(data.title || 'PidgeX', {
        body: data.body || 'Nuevo mensaje recibido en PidgeX',
        icon: iconUrl,
        badge: DEFAULT_ICON,
        vibrate: [220, 90, 220],
        tag: data.tag || (data.chatId ? `pidgex_msg_${data.chatId}` : `pidgex_msg_${Date.now()}`),
        renotify: true,
        requireInteraction: false,
        silent: false, // Plays the phone's own system notification sound!
        timestamp: Date.now(),
        data: {
          url: data.url || (data.chatId ? `/?chatId=${encodeURIComponent(data.chatId)}` : '/'),
          chatId: data.chatId,
          type: 'message',
        },
        actions: [{ action: 'open', title: '💬 Abrir Chat' }],
      });
    })()
  );
});

// Notification Click Handler (Brings app to foreground, answers/declines calls, or opens chat directly)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notificationData = event.notification.data || {};
  const action = event.action;
  let targetUrl = notificationData.url || '/';

  event.waitUntil(
    (async () => {
      try {
        if (self.navigator && typeof self.navigator.clearAppBadge === 'function') {
          await self.navigator.clearAppBadge();
        }
      } catch {}

      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

      // Decline call right from lockscreen / notification bar
      if (action === 'decline') {
        if (notificationData.callId) {
          fetch('/api/calls/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callId: notificationData.callId, status: 'declined' }),
          }).catch(() => {});
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

      // Focus existing PidgeX window if open
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (notificationData.type === 'call' && notificationData.callId) {
            client.postMessage({
              type: 'OPEN_OR_ANSWER_CALL',
              callId: notificationData.callId,
              autoAnswer: action === 'answer',
              call: notificationData.call || null,
            });
          } else if (notificationData.chatId) {
            client.postMessage({
              type: 'OPEN_CHAT',
              chatId: notificationData.chatId,
            });
          }
          return client.focus();
        }
      }

      // Otherwise open new window to target URL (wakes phone browser directly into the call or chat)
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })()
  );
});
