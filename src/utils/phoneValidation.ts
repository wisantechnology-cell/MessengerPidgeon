import { db, collection, getDocs, query, where } from '../firebase';
import { UserProfile } from '../types';
import { ensurePhoneStartsWith16 } from './phoneUtils';

// Known initial network users with registered phone numbers
export const REGISTERED_NETWORK_USERS: Partial<UserProfile>[] = [
  {
    id: 'user_david_silva',
    name: 'David Silva',
    username: '@davidsilva',
    phone: '16 699 123 456',
    bio: 'Desarrollador Frontend & Entusiasta UI 🚀',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'user_lucia_ramos',
    name: 'Lucía Ramos',
    username: '@luciaramos',
    phone: '16 677 889 900',
    bio: 'Fotógrafa & Diseñadora Visual 📷✨',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'user_mateo_morales',
    name: 'Mateo Morales',
    username: '@mateomorales',
    phone: '16 55 4123 8899',
    bio: 'Product Manager en Startup 📱',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'user_valentina_rios',
    name: 'Valentina Ríos',
    username: '@valerios',
    phone: '16 11 5566 7788',
    bio: 'Amante de la música y la tecnología 🎵',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'user_ana_rodriguez',
    name: 'Ana Rodríguez',
    username: '@anarodriguez',
    phone: '16 612 345 678',
    bio: 'Diseñadora UX/UI en MessengerPidgeon 🎨',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'user_carlos_mendoza',
    name: 'Carlos Mendoza',
    username: '@carlosmendoza',
    phone: '16 655 443 322',
    bio: 'Entusiasta de la tecnología 🚀',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'user_elena_gomez',
    name: 'Elena Gómez',
    username: '@aelen',
    phone: '16 688 990 011',
    bio: 'Fotógrafa & Creadora de contenido 📷',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
  },
];

/**
 * Searches Firestore and network contacts for a user by phone number.
 * Returns the matching UserProfile if found, or null if it does not exist.
 */
export async function findUserByPhone(rawPhone: string): Promise<Partial<UserProfile> | null> {
  const normalizedPhone = ensurePhoneStartsWith16(rawPhone);
  const digitsOnly = normalizedPhone.replace(/\D/g, '');

  // 1. Search in Firestore users collection first
  try {
    const q = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data() as UserProfile;
      if (docData && docData.phone) {
        return docData;
      }
    }
  } catch (err) {
    console.error('Firestore user lookup error:', err);
  }

  // 2. Check local network users
  const match = REGISTERED_NETWORK_USERS.find((u) => {
    if (!u.phone) return false;
    const uNormalized = ensurePhoneStartsWith16(u.phone);
    return uNormalized === normalizedPhone || uNormalized.replace(/\D/g, '') === digitsOnly;
  });

  return match || null;
}

/**
 * Checks if a phone number is already registered to ANOTHER user.
 * Returns true if taken by another user, false if available.
 */
export async function isPhoneTakenByAnotherUser(
  rawPhone: string,
  currentUserId: string
): Promise<boolean> {
  const normalizedPhone = ensurePhoneStartsWith16(rawPhone);
  const digitsOnly = normalizedPhone.replace(/\D/g, '');

  // 1. Check in Firestore
  try {
    const q = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as UserProfile;
      if (data.id && data.id !== currentUserId) {
        return true;
      }
    }
  } catch (err) {
    console.error('Firestore phone check error:', err);
  }

  // 2. Check in registered network users
  const networkMatch = REGISTERED_NETWORK_USERS.find((u) => {
    if (!u.phone) return false;
    const uNormalized = ensurePhoneStartsWith16(u.phone);
    const isSamePhone = uNormalized === normalizedPhone || uNormalized.replace(/\D/g, '') === digitsOnly;
    return isSamePhone && u.id !== currentUserId;
  });

  return Boolean(networkMatch);
}
