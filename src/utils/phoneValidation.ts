import { db, collection, getDocs, query, where } from '../firebase';
import { UserProfile } from '../types';
import { ensurePhoneStartsWith16 } from './phoneUtils';
import {
  findKnownUserByPhone,
  registerKnownUser,
  getCleanDigits,
  cleanPhoneWithoutPrefix16,
  getKnownUsers,
} from './localUserRegistry';

export const FIRESTORE_UPGRADE_URL =
  'https://console.firebase.google.com/project/notional-yarrow-lw2h4/firestore/databases/ai-studio-birdmessage-8f242d9c-f8df-4a5a-af57-e3cd129cc6f4/data?openUpgradeDialog=true';

export interface PhoneLookupResult {
  user: Partial<UserProfile> | null;
  isSelf: boolean;
  isQuotaExceeded?: boolean;
  quotaUpgradeUrl?: string;
}

/**
 * Detailed user search by phone:
 * 1. Checks current user (self-chat / self-phone)
 * 2. Checks local cross-session / cross-tab registry and chat history
 * 3. Checks Firestore database
 * 4. Catches Firestore quota limits or connection issues gracefully
 */
export async function findUserByPhoneDetailed(
  rawPhone: string,
  currentUserId?: string,
  currentUserPhone?: string
): Promise<PhoneLookupResult> {
  const normalizedPhone = ensurePhoneStartsWith16(rawPhone);
  const cleanTarget = getCleanDigits(rawPhone);
  const cleanTargetWithout16 = cleanPhoneWithoutPrefix16(rawPhone);
  const cleanMyPhone = currentUserPhone ? getCleanDigits(currentUserPhone) : '';
  const cleanMyPhoneWithout16 = currentUserPhone ? cleanPhoneWithoutPrefix16(currentUserPhone) : '';

  if (cleanTarget.length < 5) {
    return { user: null, isSelf: false };
  }

  // 1. Check if target is current user's own phone
  const isSelfByPhone =
    (cleanMyPhone && cleanTarget === cleanMyPhone) ||
    (cleanMyPhoneWithout16.length >= 7 &&
      cleanTargetWithout16.length >= 7 &&
      cleanTargetWithout16 === cleanMyPhoneWithout16);

  if (isSelfByPhone) {
    return {
      user: {
        id: currentUserId || 'me',
        name: 'Mi Espacio (Tú)',
        phone: normalizedPhone,
      },
      isSelf: true,
    };
  }

  // 2. Ask server auth directory first (handles all phone formatting/spacing differences)
  try {
    const res = await fetch('/api/auth/find-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizedPhone, currentUserId }),
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data?.found && data?.user) {
          registerKnownUser(data.user);
          return { user: data.user, isSelf: Boolean(data.isSelf) };
        }
      }
    }
  } catch {
    // continue to Firestore / local fallback
  }

  // 3. Query Firestore (exact formatted, phoneClean, raw digits, plus flexible phonesMatch fallback)
  let isQuotaExceeded = false;
  try {
    const usersCol = collection(db, 'users');
    const queries = [
      query(usersCol, where('phone', '==', normalizedPhone)),
      query(usersCol, where('phoneClean', '==', cleanTarget)),
    ];
    if (cleanTarget !== normalizedPhone) {
      queries.push(query(usersCol, where('phone', '==', cleanTarget)));
    }

    for (const qItem of queries) {
      const snap = await getDocs(qItem);
      if (!snap.empty) {
        for (const docSnap of snap.docs) {
          const docData = docSnap.data() as UserProfile;
          if (docData && docData.phone) {
            const normalizedDocUser = { ...docData, id: docData.id || docSnap.id };
            registerKnownUser(normalizedDocUser);
            const isDocSelf = Boolean(
              (currentUserId && (normalizedDocUser.id === currentUserId || docSnap.id === currentUserId)) ||
                (cleanMyPhone && getCleanDigits(normalizedDocUser.phone) === cleanMyPhone)
            );
            return { user: normalizedDocUser, isSelf: isDocSelf };
          }
        }
      }
    }

    // Flexible scan in Firestore users collection for spaced vs unspaced phone differences
    const allUsersSnap = await getDocs(usersCol);
    for (const docSnap of allUsersSnap.docs) {
      const docData = docSnap.data() as UserProfile;
      if (!docData?.phone) continue;
      const docClean = getCleanDigits(docData.phone);
      const docWithout16 = cleanPhoneWithoutPrefix16(docData.phone);
      const matched =
        docClean === cleanTarget ||
        (cleanTargetWithout16.length >= 6 &&
          docWithout16.length >= 6 &&
          docWithout16 === cleanTargetWithout16);
      if (matched) {
        const normalizedDocUser = { ...docData, id: docData.id || docSnap.id };
        registerKnownUser(normalizedDocUser);
        const isDocSelf = Boolean(
          (currentUserId && (normalizedDocUser.id === currentUserId || docSnap.id === currentUserId)) ||
            (cleanMyPhone && docClean === cleanMyPhone)
        );
        return { user: normalizedDocUser, isSelf: isDocSelf };
      }
    }
  } catch (err: any) {
    const errString = String(err?.message || err || '').toLowerCase();
    const isQuota =
      err?.code === 'resource-exhausted' ||
      errString.includes('quota exceeded') ||
      errString.includes('quota') ||
      errString.includes('resource-exhausted');

    if (isQuota) {
      console.warn('Firebase Firestore daily read quota reached:', err);
      isQuotaExceeded = true;
    } else {
      console.warn('Firestore user lookup error:', err);
    }
  }

  // 4. Fallback to local cross-tab / cross-session registry
  const localMatch = findKnownUserByPhone(rawPhone);
  if (localMatch) {
    const isSelfMatch = Boolean(
      (currentUserId && localMatch.id === currentUserId) ||
        (cleanMyPhone && getCleanDigits(localMatch.phone) === cleanMyPhone)
    );
    return { user: localMatch, isSelf: isSelfMatch };
  }

  if (isQuotaExceeded) {
    return {
      user: null,
      isSelf: false,
      isQuotaExceeded: true,
      quotaUpgradeUrl: FIRESTORE_UPGRADE_URL,
    };
  }

  return { user: null, isSelf: false };
}

/**
 * Searches for a real registered user by phone number, excluding current user.
 */
export async function findUserByPhone(
  rawPhone: string,
  currentUserId?: string,
  currentUserPhone?: string
): Promise<Partial<UserProfile> | null> {
  const result = await findUserByPhoneDetailed(rawPhone, currentUserId, currentUserPhone);
  return result.isSelf ? null : result.user;
}

/**
 * Checks if a phone number is already registered to ANOTHER user.
 */
export async function isPhoneTakenByAnotherUser(
  rawPhone: string,
  currentUserId: string,
  options?: { serverOnly?: boolean }
): Promise<boolean> {
  const normalizedPhone = ensurePhoneStartsWith16(rawPhone);
  const cleanTarget = getCleanDigits(rawPhone);
  const cleanTargetWithout16 = cleanPhoneWithoutPrefix16(rawPhone);

  try {
    const res = await fetch('/api/auth/check-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizedPhone, currentUserId }),
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        return Boolean(data?.taken);
      }
    }
  } catch {
    // fallback below when server is offline
  }

  if (options?.serverOnly) {
    return false;
  }

  // Fallback checks for offline contact/profile editing
  const known = getKnownUsers();
  for (const u of known) {
    if (!u.phone) continue;
    if (u.id && u.id === currentUserId) continue;
    const uClean = getCleanDigits(u.phone);
    const uCleanWithout16 = cleanPhoneWithoutPrefix16(u.phone);
    if (uClean === cleanTarget || (cleanTargetWithout16.length >= 7 && uCleanWithout16 === cleanTargetWithout16)) {
      return true;
    }
  }

  try {
    const q = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as UserProfile;
      if ((data.id && data.id !== currentUserId) || docSnap.id !== currentUserId) {
        return true;
      }
    }
  } catch (err: any) {
    console.warn('Firestore phone uniqueness check bypassed due to quota/offline:', err);
  }

  return false;
}
