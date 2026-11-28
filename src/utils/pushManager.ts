// Client Web Push Notification Manager for Background & Lockscreen Calling & Messaging
const getCleanPhone = (phone?: string): string => (phone || '').replace(/\D/g, '');

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export function isIosBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export interface PushRegistrationResult {
  ok: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  endpoint?: string;
  reason?: string;
}

let inFlightPromise: Promise<PushRegistrationResult> | null = null;

async function doRegisterPushSubscription(
  userPhone?: string,
  userId?: string,
  interactive: boolean = false
): Promise<PushRegistrationResult> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ok: false, permission: 'unsupported', subscribed: false, reason: 'no_notification_api' };
  }

  let permission: NotificationPermission = Notification.permission;
  if (permission === 'default') {
    if (!interactive) {
      return { ok: false, permission: 'default', subscribed: false, reason: 'needs_user_gesture' };
    }
    try {
      permission = await Notification.requestPermission();
    } catch {
      permission = Notification.permission;
    }
  }

  if (permission !== 'granted') {
    return { ok: false, permission, subscribed: false, reason: 'permission_not_granted' };
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: true, permission: 'granted', subscribed: false, reason: 'no_push_manager' };
  }

  try {
    let reg = await navigator.serviceWorker.getRegistration('/');
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js');
    }
    reg = await navigator.serviceWorker.ready;
    if (!reg || !reg.pushManager) {
      return { ok: false, permission: 'granted', subscribed: false, reason: 'no_sw_ready' };
    }

    const res = await fetch('/api/push/vapid-public-key');
    if (!res.ok) {
      return { ok: false, permission: 'granted', subscribed: false, reason: 'vapid_fetch_failed' };
    }
    const { publicKey } = await res.json();
    if (!publicKey) {
      return { ok: false, permission: 'granted', subscribed: false, reason: 'missing_vapid_key' };
    }

    const expectedKey = urlBase64ToUint8Array(publicKey);
    let subscription = await reg.pushManager.getSubscription();

    // If existing subscription was created with a different VAPID key, unsubscribe and re-subscribe
    if (subscription) {
      const existingRawKey = subscription.options?.applicationServerKey;
      if (existingRawKey) {
        const existingBytes = new Uint8Array(existingRawKey);
        if (!uint8ArraysEqual(existingBytes, expectedKey)) {
          try {
            await subscription.unsubscribe();
          } catch {}
          subscription = null;
        }
      }
    }

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: expectedKey,
      });
    }

    const cleanPhone = getCleanPhone(userPhone || '');
    const normalizedUserId = userId && userId !== 'user_me' ? userId : undefined;

    // Only register with server if we have at least a phone, userId, or interactive activation
    if (!cleanPhone && !normalizedUserId && !interactive) {
      return {
        ok: true,
        permission: 'granted',
        subscribed: true,
        endpoint: subscription.endpoint,
        reason: 'awaiting_user_identity',
      };
    }

    const subResponse = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId: normalizedUserId || userId || 'me',
        userPhone: cleanPhone,
      }),
    });

    if (!subResponse.ok) {
      return {
        ok: false,
        permission: 'granted',
        subscribed: false,
        endpoint: subscription.endpoint,
        reason: 'server_subscribe_failed',
      };
    }

    try {
      localStorage.setItem('pidgex_push_endpoint', subscription.endpoint);
      localStorage.setItem('pidgex_push_last_sync', String(Date.now()));
    } catch {}

    return {
      ok: true,
      permission: 'granted',
      subscribed: true,
      endpoint: subscription.endpoint,
    };
  } catch (err) {
    console.warn('[PushManager] Registration note:', err);
    return {
      ok: false,
      permission: Notification.permission,
      subscribed: false,
      reason: err instanceof Error ? err.message : 'subscribe_error',
    };
  }
}

export async function registerPushSubscription(
  userPhone?: string,
  userId?: string,
  interactive: boolean = false
): Promise<PushRegistrationResult> {
  if (inFlightPromise) {
    try {
      await inFlightPromise;
    } catch {}
  }

  inFlightPromise = doRegisterPushSubscription(userPhone, userId, interactive).finally(() => {
    inFlightPromise = null;
  });

  return inFlightPromise;
}

export interface PushStatusSummary {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  hasBrowserSub: boolean;
  serverSubscribed: boolean;
  devicesCount: number;
  standalone: boolean;
  isIos: boolean;
  endpoint?: string;
}

export async function getPushSubscriptionStatus(
  userPhone?: string,
  userId?: string
): Promise<PushStatusSummary> {
  const supported = isPushSupported();
  const permission: NotificationPermission | 'unsupported' =
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported';
  const standalone = isStandalonePwa();
  const isIos = isIosBrowser();

  let hasBrowserSub = false;
  let endpoint: string | undefined;

  if (supported) {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        hasBrowserSub = true;
        endpoint = sub.endpoint;
      }
    } catch {}
  }

  let serverSubscribed = false;
  let devicesCount = 0;

  try {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (userPhone) params.set('userPhone', getCleanPhone(userPhone));
    const res = await fetch(`/api/push/status?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      serverSubscribed = Boolean(data.subscribed);
      devicesCount = Number(data.devicesCount || 0);
    }
  } catch {}

  return {
    supported,
    permission,
    hasBrowserSub,
    serverSubscribed,
    devicesCount,
    standalone,
    isIos,
    endpoint,
  };
}

export async function sendTestPushNotification(opts: {
  kind: 'message' | 'call';
  delaySeconds?: number;
  userPhone?: string;
  userId?: string;
  userName?: string;
}): Promise<{ ok: boolean; scheduled?: boolean; delivered?: number; error?: string }> {
  try {
    // Ensure device subscription is up to date before sending test
    const regResult = await registerPushSubscription(opts.userPhone, opts.userId, true);
    if (!regResult.ok && regResult.permission !== 'granted') {
      return { ok: false, error: 'Permiso de notificaciones no concedido.' };
    }

    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: opts.kind,
        delaySeconds: opts.delaySeconds || 0,
        userId: opts.userId,
        userPhone: getCleanPhone(opts.userPhone),
        userName: opts.userName,
        endpoint: regResult.endpoint,
      }),
    });

    if (!res.ok) {
      return { ok: false, error: 'No se pudo enviar la prueba.' };
    }
    const data = await res.json();
    return {
      ok: Boolean(data.success),
      scheduled: Boolean(data.scheduled),
      delivered: Number(data.delivered || 0),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Error de red',
    };
  }
}
