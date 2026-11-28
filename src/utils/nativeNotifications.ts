import { ringtoneManager } from './ringtoneAudio';
import { UserProfile } from '../types';
import { registerPushSubscription } from './pushManager';

const DEFAULT_NOTIF_ICON = '/assets/aistudio/Logo_de_PidgeX_5e3aa7b3.PNG';

function safeNotifIcon(url?: string): string {
  if (!url || typeof url !== 'string') return DEFAULT_NOTIF_ICON;
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_NOTIF_ICON;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return DEFAULT_NOTIF_ICON;
  if (trimmed.toLowerCase().endsWith('.svg')) return DEFAULT_NOTIF_ICON;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return trimmed;
  }
  return DEFAULT_NOTIF_ICON;
}

let lastMsgNotifKey = '';
let lastMsgNotifAt = 0;

/**
 * Request notification permission (must be invoked from a user tap/click gesture)
 * and immediately register Web Push for background calls & messages.
 */
export async function requestNotificationPermission(
  userPhone?: string,
  userId?: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const result = await registerPushSubscription(userPhone, userId, true);
    return result.permission === 'granted';
  } catch (e) {
    console.warn('Error requesting notification permission:', e);
    return Notification.permission === 'granted';
  }
}

export function isNotificationPermissionGranted(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

/**
 * Close any ringing OS call notifications (e.g., once answered, declined, or hung up)
 */
export async function closeNativeCallNotification(callId?: string): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    if (!reg || !reg.getNotifications) return;
    const notifications = await reg.getNotifications();
    notifications.forEach((n) => {
      const nData = (n as any).data || {};
      const isCallTag =
        (n.tag && (n.tag.startsWith('pidgex_call_') || n.tag === 'incoming_call')) ||
        nData.type === 'call';
      if (isCallTag && (!callId || nData.callId === callId || n.tag === `pidgex_call_${callId}`)) {
        n.close();
      }
    });
  } catch {}
}

/**
 * Trigger an OS Lockscreen & System Notification for an Incoming Call
 * Includes continuous WhatsApp-style vibration, screen wake-up, and Answer / Decline buttons.
 */
export async function sendNativeCallNotification(
  callerName: string,
  isVideo: boolean = false,
  avatarUrl?: string,
  callId?: string,
  _user?: UserProfile
) {
  // 1. Hardware vibration - strong continuous pattern
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([1000, 350, 1000, 350, 1000, 350, 1200]);
    } catch {}
  }

  // 2. Keep screen awake (Screen Wake Lock)
  ringtoneManager.requestScreenWakeLock();

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const title = `📞 ${isVideo ? 'Videollamada' : 'Llamada'} entrante de ${callerName}`;
  const body = `Toca para contestar o rechazar en PidgeX.`;
  const resolvedIcon = safeNotifIcon(avatarUrl);
  const callOptions: NotificationOptions & {
    vibrate?: number[];
    tag?: string;
    renotify?: boolean;
    requireInteraction?: boolean;
    data?: any;
    actions?: { action: string; title: string }[];
  } = {
    body,
    icon: resolvedIcon,
    badge: DEFAULT_NOTIF_ICON,
    vibrate: [1000, 350, 1000, 350, 1000, 350, 1200],
    tag: `pidgex_call_${callId || 'live'}`,
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: {
      url: `/?autoAnswerCall=${callId || ''}`,
      callId,
      callerName,
      callerAvatar: resolvedIcon,
      isVideo,
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

/**
 * Trigger an OS Lockscreen & System Notification for an Incoming Message.
 * Uses the phone's own configured notification sound (silent: false) when messageToneId is 'system_default'
 * plus hardware vibration and brief screen wake.
 */
export async function sendNativeMessageNotification(
  senderName: string,
  text: string,
  avatarUrl?: string,
  chatId?: string,
  user?: UserProfile
) {
  if (user?.doNotDisturb) return;

  // Dedupe identical notifications firing within 1.2s (e.g. Firestore + WebSocket simultaneously)
  const dedupeKey = `${chatId || ''}|${senderName}|${(text || '').slice(0, 60)}`;
  const now = Date.now();
  if (dedupeKey === lastMsgNotifKey && now - lastMsgNotifAt < 1200) {
    return;
  }
  lastMsgNotifKey = dedupeKey;
  lastMsgNotifAt = now;

  // 1. Hardware vibration for message
  const shouldVibrate = !user || user.vibrateOnMessage !== false;
  if (shouldVibrate && typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([220, 90, 220]);
    } catch {}
  }

  // 2. Temporarily wake screen so message is visible
  if (!user || user.wakeScreenOnMessage !== false) {
    ringtoneManager.requestScreenWakeLock();
    setTimeout(() => {
      ringtoneManager.releaseScreenWakeLock();
    }, 4500);
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const title = senderName || 'Nuevo mensaje en PidgeX';
  const body = text || 'Nuevo mensaje recibido en PidgeX';
  const resolvedIcon = safeNotifIcon(avatarUrl);
  // When using 'system_default' (the default), silent MUST be false so the phone plays its own configured OS tone.
  // When the user explicitly chose an in-app/custom sound, silent: true prevents double-playing two sounds at once.
  const useSystemPhoneSound = !user?.messageToneId || user.messageToneId === 'system_default';

  const msgOptions: NotificationOptions & {
    vibrate?: number[];
    tag?: string;
    renotify?: boolean;
    requireInteraction?: boolean;
    data?: any;
    actions?: { action: string; title: string }[];
  } = {
    body,
    icon: resolvedIcon,
    badge: DEFAULT_NOTIF_ICON,
    vibrate: shouldVibrate ? [220, 90, 220] : [],
    tag: `msg_${chatId || 'general'}`,
    renotify: true,
    requireInteraction: false,
    silent: !useSystemPhoneSound,
    data: {
      url: chatId ? `/?chatId=${encodeURIComponent(chatId)}` : '/',
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

/**
 * Backward-compatible generic function
 */
export async function sendNativeSystemNotification(
  title: string,
  body: string,
  iconUrl?: string,
  chatId?: string,
  user?: UserProfile
) {
  if (title.includes('Llamada')) {
    await sendNativeCallNotification(
      title.replace(/📞|Llamada de|Videollamada de/gi, '').trim(),
      false,
      iconUrl,
      chatId,
      user
    );
  } else {
    await sendNativeMessageNotification(title, body, iconUrl, chatId, user);
  }
}
