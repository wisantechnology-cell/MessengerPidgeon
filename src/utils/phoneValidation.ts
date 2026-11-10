import { db, collection, getDocs, query, where } from '../firebase';
import { UserProfile } from '../types';
import { ensurePhoneStartsWith16 } from './phoneUtils';

export interface PhoneLookupResult {
  user: Partial<UserProfile> | null;
  isSelf: boolean;
}

/**
 * Detailed user search by phone: checks exact match and clean numeric digits
 * against registered users in Firestore. Detects whether the number is the user's own number.
 */
export async function findUserByPhoneDetailed(
  rawPhone: string,
  currentUserId?: string,
  currentUserPhone?: string
): Promise<PhoneLookupResult> {
  const normalizedPhone = ensurePhoneStartsWith16(rawPhone);
  const cleanTarget = rawPhone.replace(/\D/g, '');
  const cleanMyPhone = currentUserPhone ? currentUserPhone.replace(/\D/g, '') : '';

  if (cleanTarget.length < 5) {
    return { user: null, isSelf: false };
  }

  // Check if target is current user's own phone
  if (cleanMyPhone && cleanTarget === cleanMyPhone) {
    return { user: null, isSelf: true };
  }

  try {
    // 1. First attempt: Direct indexed query in Firestore
    const q = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      for (const docSnap of snapshot.docs) {
        const docData = docSnap.data() as UserProfile;
        if (docData && docData.phone) {
          if (currentUserId && (docData.id === currentUserId || docSnap.id === currentUserId)) {
            return { user: null, isSelf: true };
          }
          return { user: docData, isSelf: false };
        }
      }
    }

    // 2. Second attempt: Check clean numeric digits across all registered users
    // This ensures variations in spacing (e.g. "16 612 345 678" vs "16612345678") match accurately
    const allUsersSnap = await getDocs(collection(db, 'users'));
    for (const docSnap of allUsersSnap.docs) {
      const docData = docSnap.data() as UserProfile;
      if (docData && docData.phone) {
        const cleanUserPhone = docData.phone.replace(/\D/g, '');
        if (cleanUserPhone === cleanTarget) {
          if (currentUserId && (docData.id === currentUserId || docSnap.id === currentUserId)) {
            return { user: null, isSelf: true };
          }
          return { user: docData, isSelf: false };
        }
      }
    }
  } catch (err) {
    console.error('Firestore user lookup error:', err);
  }

  return { user: null, isSelf: false };
}

/**
 * Searches Firestore for a real registered user by phone number, excluding the current user.
 * Returns the matching UserProfile if found AND already registered by someone else, or null if the number does not exist.
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
 * Checks if a phone number is already registered to ANOTHER user in Firestore.
 */
export async function isPhoneTakenByAnotherUser(
  rawPhone: string,
  currentUserId: string
): Promise<boolean> {
  const normalizedPhone = ensurePhoneStartsWith16(rawPhone);
  const cleanTarget = rawPhone.replace(/\D/g, '');

  try {
    const q = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as UserProfile;
      if ((data.id && data.id !== currentUserId) || docSnap.id !== currentUserId) {
        return true;
      }
    }

    const allUsersSnap = await getDocs(collection(db, 'users'));
    for (const docSnap of allUsersSnap.docs) {
      const data = docSnap.data() as UserProfile;
      if (data && data.phone && (data.id !== currentUserId && docSnap.id !== currentUserId)) {
        if (data.phone.replace(/\D/g, '') === cleanTarget) {
          return true;
        }
      }
    }
  } catch (err) {
    console.error('Firestore phone check error:', err);
  }

  return false;
}
