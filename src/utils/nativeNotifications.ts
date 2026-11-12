import { soundEffects } from './soundEffects';
import { ringtoneManager } from './ringtoneAudio';
import { UserProfile } from '../types';
import { registerPushSubscription } from './pushManager';

/**
 * Utility for triggering OS System Tray & Lock Screen Notifications on Mobile & Desktop
 * Supports Screen Wake, Hardware Vibration, and Service Worker background alerts.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      registerPushSubscription().catch(() => {});
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        registerPushSubscription().catch(() => {});
        return true;
      }
    }
  } catch (e) {
    console.warn('Error requesting notification permission:', e);
  }
  return false;
}

export function isNotificationPermissionGranted(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

/**
 * Trigger an OS Lockscreen & System Notification for an Incoming Call
 * Includes continuous vibration, screen wake-up, and interactive Answer / Decline buttons.
 */
export async function sendNativeCallNotification(
  callerName: string,
  isVideo: boolean = false,
  avatarUrl?: string,
  callId?: string,
  user?: UserProfile
) {
  // 1. Hardware vibration - Permanente e incondicional (no se puede desactivar)
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([800, 400, 800, 400, 800, 400, 1000]);
    } catch {}
  }

  // 2. Turn on and keep screen awake (Screen Wake Lock) - Permanente (no se puede desactivar)
  ringtoneManager.requestScreenWakeLock();

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'default') {
    await requestNotificationPermission();
  }

  if (Notification.permission === 'granted') {
    const title = `📞 ${isVideo ? 'Videollamada' : 'Llamada'} entrante de ${callerName}`;
    const body = `Toca para contestar o ver en vivo en PidgeX.`;
    const callOptions: NotificationOptions & {
      vibrate?: number[];
      tag?: string;
      renotify?: boolean;
      requireInteraction?: boolean;
      data?: any;
      actions?: { action: string; title: string }[];
    } = {
      body,
      icon: avatarUrl || '/pidgex-logo.svg',
      badge: '/pidgex-logo.svg',
      vibrate: [800, 400, 800, 400, 800, 400, 1000],
      tag: 'incoming_call',
      renotify: true,
      requireInteraction: true, // Keeps ringing on lockscreen until answered or declined
      silent: false,
      data: {
        url: `/?callId=${callId || ''}&action=answer`,
        callId,
        type: 'call',
      },
      actions: [
        { action: 'answer', title: '📞 Contestar' },
        { action: 'decline', title: '❌ Rechazar' },
      ],
    };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, callOptions);
          return;
        }
      }

      const notif = new Notification(title, callOptions);
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn('Native call notification error:', e);
    }
  }
}

/**
 * Trigger an OS Lockscreen & System Notification for an Incoming Message
 * Vibrates, temporarily wakes the screen, and provides a quick reply button.
 */
export async function sendNativeMessageNotification(
  senderName: string,
  text: string,
  avatarUrl?: string,
  chatId?: string,
  user?: UserProfile
) {
  // 1. Hardware vibration for message
  if (!user || user.vibrateOnMessage !== false) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([250, 100, 250]);
      } catch {}
    }
  }

  // 2. Temporarily turn on screen / wake lock so message is visible on locked phone
  if (!user || user.wakeScreenOnMessage !== false) {
    ringtoneManager.requestScreenWakeLock();
    setTimeout(() => {
      ringtoneManager.releaseScreenWakeLock();
    }, 4500);
  }

  soundEffects.playBirdChirp();

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'default') {
    await requestNotificationPermission();
  }

  if (Notification.permission === 'granted') {
    const title = `💬 ${senderName}`;
    const body = text || 'Nuevo mensaje recibido en PidgeX';

    const msgOptions: NotificationOptions & {
      vibrate?: number[];
      tag?: string;
      renotify?: boolean;
      requireInteraction?: boolean;
      data?: any;
      actions?: { action: string; title: string }[];
    } = {
      body,
      icon: avatarUrl || '/pidgex-logo.svg',
      badge: '/pidgex-logo.svg',
      vibrate: [250, 100, 250],
      tag: `msg_${chatId || Date.now()}`,
      renotify: true,
      requireInteraction: false,
      silent: false,
      data: {
        url: chatId ? `/?chatId=${chatId}` : '/',
        chatId,
        type: 'message',
      },
      actions: [
        { action: 'open', title: '💬 Abrir Chat' },
      ],
    };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, msgOptions);
          return;
        }
      }

      const notif = new Notification(title, msgOptions);
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn('Native message notification error:', e);
    }
  }
}

/**
 * Backward-compatible generic function
 */
export async function sendNativeSystemNotification(
  title: string,
  body: string,
  iconUrl?: string,
  chatId?: string
) {
  if (title.includes('Llamada')) {
    await sendNativeCallNotification(title.replace(/📞|Llamada de|Videollamada de/gi, '').trim(), false, iconUrl, chatId);
  } else {
    await sendNativeMessageNotification(title, body, iconUrl, chatId);
  }
}
