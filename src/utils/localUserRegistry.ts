import { UserProfile, Chat } from '../types';
import { ensurePhoneStartsWith16 } from './phoneUtils';

const KNOWN_USERS_KEY = 'pidgex_known_users_registry';

export function getCleanDigits(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

export function cleanPhoneWithoutPrefix16(phone?: string): string {
  const digits = getCleanDigits(phone);
  return digits.replace(/^16/, '');
}

/**
 * Returns all users known to this browser instance (across sessions and tabs).
 */
export function getKnownUsers(): Partial<UserProfile>[] {
  try {
    const raw = localStorage.getItem(KNOWN_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading known users registry:', err);
  }
  return [];
}

/**
 * Stores or updates a known user in the local cross-session registry.
 */
export function registerKnownUser(u: Partial<UserProfile>): void {
  if (!u || (!u.phone && !u.id)) return;
  try {
    const list = getKnownUsers();
    const phoneClean = getCleanDigits(u.phone);
    const existingIndex = list.findIndex(
      (item) =>
        (u.id && item.id === u.id) ||
        (phoneClean && getCleanDigits(item.phone) === phoneClean)
    );

    const userEntry: Partial<UserProfile> = {
      id: u.id || `user_${Date.now()}`,
      name: u.name || 'Usuario PidgeX',
      username: u.username || '@usuario',
      phone: u.phone ? ensurePhoneStartsWith16(u.phone) : undefined,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...userEntry };
    } else {
      list.push(userEntry);
    }

    localStorage.setItem(KNOWN_USERS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Error saving to known users registry:', err);
  }
}

/**
 * Registers contacts from existing chats so they are instantly searchable.
 */
export function registerChatsContacts(chats: Chat[]): void {
  if (!Array.isArray(chats)) return;
  chats.forEach((chat) => {
    if (chat.phone) {
      registerKnownUser({
        id: chat.id,
        name: chat.name,
        phone: chat.phone,
        avatarUrl: chat.avatarUrl,
      });
    }
  });
}

/**
 * Searches local registry and active chats for a user matching a phone number.
 */
export function findKnownUserByPhone(rawPhone: string): Partial<UserProfile> | null {
  if (!rawPhone) return null;
  const targetClean = getCleanDigits(rawPhone);
  const targetWithout16 = cleanPhoneWithoutPrefix16(rawPhone);

  if (targetClean.length < 5) return null;

  const users = getKnownUsers();
  for (const u of users) {
    if (!u.phone) continue;
    const userClean = getCleanDigits(u.phone);
    const userWithout16 = cleanPhoneWithoutPrefix16(u.phone);

    // Exact digits match (e.g. 16612345678 === 16612345678)
    if (userClean === targetClean) {
      return u;
    }

    // Match without leading 16 prefix if long enough (e.g. 612345678)
    if (
      targetWithout16.length >= 7 &&
      userWithout16.length >= 7 &&
      userWithout16 === targetWithout16
    ) {
      return u;
    }
  }

  // Also check directly in stored chats
  try {
    const rawChats = localStorage.getItem('birdmessage_chats_cache');
    if (rawChats) {
      const chats: Chat[] = JSON.parse(rawChats);
      if (Array.isArray(chats)) {
        for (const c of chats) {
          if (!c.phone) continue;
          const cClean = getCleanDigits(c.phone);
          const cWithout16 = cleanPhoneWithoutPrefix16(c.phone);
          if (cClean === targetClean || (targetWithout16.length >= 7 && cWithout16 === targetWithout16)) {
            return {
              id: c.id,
              name: c.name,
              phone: c.phone,
              avatarUrl: c.avatarUrl,
            };
          }
        }
      }
    }
  } catch {}

  return null;
}

/**
 * Broadcast presence across all open tabs so tabs on the same computer/device know about each other.
 */
export function broadcastUserPresence(user: UserProfile): void {
  if (!user || !user.phone) return;
  registerKnownUser(user);
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bus = new BroadcastChannel('pidgex_presence_bus');
      bus.postMessage({
        type: 'USER_PRESENCE',
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
        },
      });
      bus.close();
    }
  } catch {}
}

/**
 * Initializes a presence listener across open browser tabs.
 */
export function initPresenceListener(onNewUser?: (u: Partial<UserProfile>) => void): () => void {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return () => {};
  }

  const bus = new BroadcastChannel('pidgex_presence_bus');
  bus.onmessage = (ev) => {
    if (ev.data && ev.data.type === 'USER_PRESENCE' && ev.data.user) {
      registerKnownUser(ev.data.user);
      if (onNewUser) {
        onNewUser(ev.data.user);
      }
    }
  };

  return () => {
    try {
      bus.close();
    } catch {}
  };
}
