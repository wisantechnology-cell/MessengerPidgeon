// Client Web Push Notification Manager for Background & Lockscreen Calling
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

let isSubscribing = false;

export async function registerPushSubscription(userPhone?: string, userId?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  if (isSubscribing) return false;
  isSubscribing = true;

  try {
    // Check or request notification permission
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission !== 'granted') {
        isSubscribing = false;
        return false;
      }
    }

    const reg = await navigator.serviceWorker.ready;
    if (!reg) {
      isSubscribing = false;
      return false;
    }

    // Fetch VAPID public key from backend server
    const res = await fetch('/api/push/vapid-public-key');
    if (!res.ok) {
      isSubscribing = false;
      return false;
    }
    const { publicKey } = await res.json();
    if (!publicKey) {
      isSubscribing = false;
      return false;
    }

    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // Get existing subscription or create new one
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    const cleanPhone = getCleanPhone(userPhone || '');

    // Send subscription to server
    const subResponse = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId: userId || 'me',
        userPhone: cleanPhone,
      }),
    });

    isSubscribing = false;
    return subResponse.ok;
  } catch (err) {
    console.warn('[PushManager] Registration note:', err);
    isSubscribing = false;
    return false;
  }
}
