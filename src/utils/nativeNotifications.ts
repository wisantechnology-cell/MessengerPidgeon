import { soundEffects } from './soundEffects';

/**
 * Utility for triggering OS System Tray & Lock Screen Notifications on Mobile & Desktop
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  } catch (e) {
    console.warn('Error requesting notification permission:', e);
  }
  return false;
}

export async function sendNativeSystemNotification(
  title: string,
  body: string,
  iconUrl?: string,
  chatId?: string
) {
  // Always play bird chirp sound
  soundEffects.playBirdChirp();

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  // Request permission if not already granted
  if (Notification.permission === 'default') {
    await requestNotificationPermission();
  }

  if (Notification.permission === 'granted') {
    const notificationOptions: NotificationOptions & { vibrate?: number[]; tag?: string; renotify?: boolean; data?: any } = {
      body,
      icon: iconUrl || '/pidgex-logo.svg',
      badge: '/pidgex-logo.svg',
      vibrate: [200, 100, 200, 100, 300],
      tag: `pidgex_${Date.now()}`,
      renotify: true,
      data: { chatId, url: '/' },
      silent: false,
    };

    try {
      // Use ServiceWorker Registration for true OS background/lockscreen notification if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, notificationOptions);
          return;
        }
      }

      // Fallback to standard Notification API
      const notif = new Notification(title, notificationOptions);
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn('Native notification trigger error:', e);
    }
  }
}
