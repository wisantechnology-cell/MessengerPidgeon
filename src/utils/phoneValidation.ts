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

  // 2. Check local cross-tab / cross-session registry (instant, 0 Firestore reads)
  const localMatch = findKnownUserByPhone(rawPhone);
  if (localMatch) {
    const isSelfMatch = Boolean(
      (currentUserId && localMatch.id === currentUserId) ||
        (cleanMyPhone && getCleanDigits(localMatch.phone) === cleanMyPhone)
    );
    if (isSelfMatch) {
      return { user: localMatch, isSelf: true };
    }
    return { user: localMatch, isSelf: false };
  }

  // 3. Query Firestore
  let isQuotaExceeded = false;
  try {
    // 3a. Search exact normalized phone in Firestore
    const q1 = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      for (const docSnap of snap1.docs) {
        const docData = docSnap.data() as UserProfile;
        if (docData && docData.phone) {
          registerKnownUser(docData);
          const isDocSelf = Boolean(
            (currentUserId && (docData.id === currentUserId || docSnap.id === currentUserId)) ||
              (cleanMyPhone && getCleanDigits(docData.phone) === cleanMyPhone)
          );
          return { user: docData, isSelf: isDocSelf };
        }
      }
    }

    // 3b. Search clean unspaced digits in Firestore
    if (cleanTarget !== normalizedPhone) {
      const q2 = query(collection(db, 'users'), where('phone', '==', cleanTarget));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        for (const docSnap of snap2.docs) {
          const docData = docSnap.data() as UserProfile;
          if (docData && docData.phone) {
            registerKnownUser(docData);
            const isDocSelf = Boolean(
              (currentUserId && (docData.id === currentUserId || docSnap.id === currentUserId)) ||
                (cleanMyPhone && getCleanDigits(docData.phone) === cleanMyPhone)
            );
            return { user: docData, isSelf: isDocSelf };
          }
        }
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
  if (result.isQuotaExceeded) {
    const formatted = ensurePhoneStartsWith16(rawPhone);
    return {
      id: `user_quota_${Date.now()}`,
      name: `Contacto (${formatted})`,
      phone: formatted,
    };
  }
  return result.isSelf ? null : result.user;
}

/**
 * Checks if a phone number is already registered to ANOTHER user.
 */
export async function isPhoneTakenByAnotherUser(
  rawPhone: string,
  currentUserId: string
): Promise<boolean> {
  const normalizedPhone = ensurePhoneStartsWith16(rawPhone);
  const cleanTarget = getCleanDigits(rawPhone);
  const cleanTargetWithout16 = cleanPhoneWithoutPrefix16(rawPhone);

  // Check local registry first
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
