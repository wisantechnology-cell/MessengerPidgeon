import { db, collection, getDocs, query, where } from '../firebase';
import { UserProfile } from '../types';
import { ensurePhoneStartsWith16 } from './phoneUtils';

/**
 * Searches Firestore for a real registered user by phone number, excluding the current user.
 * Returns the matching UserProfile if found AND already registered by someone else, or null if the number does not exist or belongs to the current user.
 */
export async function findUserByPhone(rawPhone: string, currentUserId?: string): Promise<Partial<UserProfile> | null> {
  const normalizedPhone = ensurePhoneStartsWith16(rawPhone);

  try {
    const q = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      for (const docSnap of snapshot.docs) {
        const docData = docSnap.data() as UserProfile;
        if (docData && docData.phone) {
          // If the phone belongs to the current user themselves, don't allow adding yourself
          if (currentUserId && (docData.id === currentUserId || docSnap.id === currentUserId)) {
            continue;
          }
          return docData;
        }
      }
    }
  } catch (err) {
    console.error('Firestore user lookup error:', err);
  }

  return null;
}

/**
 * Checks if a phone number is already registered to ANOTHER user in Firestore.
 */
export async function isPhoneTakenByAnotherUser(
  rawPhone: string,
  currentUserId: string
): Promise<boolean> {
  const normalizedPhone = ensurePhoneStartsWith16(rawPhone);

  try {
    const q = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as UserProfile;
      if ((data.id && data.id !== currentUserId) || docSnap.id !== currentUserId) {
        return true;
      }
    }
  } catch (err) {
    console.error('Firestore phone check error:', err);
  }

  return false;
}
