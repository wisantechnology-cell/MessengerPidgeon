import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  INITIAL_USER,
  INITIAL_CHATS,
  WALLPAPERS,
} from './data/mockData';
import {
  Chat,
  ChatCategory,
  Message,
  UserProfile,
  MarketplaceProduct,
  GroupMember,
  ChatPersonalityTheme,
  EmotionalMode,
  TimeCapsuleData,
} from './types';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  deleteUser,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  onSnapshot,
  orderBy,
  OperationType,
  handleFirestoreError
} from './firebase';
import { ChatsListView } from './components/ChatsListView';
import { LocalRadarView } from './components/LocalRadarView';
import { TutorialModal } from './components/TutorialModal';
import { SpotlightTour } from './components/SpotlightTour';
import { IncomingCallModal, IncomingCallData } from './components/IncomingCallModal';
import { CallModal } from './components/CallModal';
import { soundEffects } from './utils/soundEffects';
import { exportChatAsText } from './utils/exportChat';
import { realtimeClient } from './services/realtimeClient';
import { ringtoneManager } from './utils/ringtoneAudio';


import { ChatView } from './components/ChatView';
import { SettingsProfileView } from './components/SettingsProfileView';
import { WaitingRoomView } from './components/waitingRoom/WaitingRoomView';
import { MarketplaceView } from './components/marketplace/MarketplaceView';
import { NewsView } from './components/NewsView';
import { BottomNav, NavTab } from './components/BottomNav';
import { NewChatModal } from './components/NewChatModal';
import { NewGroupModal } from './components/NewGroupModal';
import { AddFriendModal, AddFriendData } from './components/AddFriendModal';
import { SendVoiceMessageModal } from './components/SendVoiceMessageModal';
import { VirtualPetWidget } from './components/VirtualPetWidget';
import { ContactProfileModal } from './components/ContactProfileModal';
import { WeatherEffectsOverlay } from './components/WeatherEffectsOverlay';
import { TimeCapsuleModal, StoredTimeCapsule } from './components/TimeCapsuleModal';
import { ensurePhoneStartsWith16, generateUniquePidgePhone, getCleanPhone, phonesMatch } from './utils/phoneUtils';
import { createSvgAvatar } from './utils/avatarUtils';
import { InstallPwaModal } from './components/InstallPwaModal';
import { FlyingBirdLoader } from './components/FlyingBirdLoader';
import { BirdNotificationToast, BirdNotification } from './components/BirdNotificationToast';
import { AccountOnboardingView, AccountRegistrationPayload } from './components/AccountOnboardingView';
import {
  sendNativeCallNotification,
  sendNativeMessageNotification,
  sendNativeSystemNotification,
  requestNotificationPermission,
} from './utils/nativeNotifications';
import { NotificationPermissionBanner } from './components/NotificationPermissionBanner';
import {
  registerKnownUser,
  unregisterKnownUser,
  broadcastUserPresence,
  initPresenceListener,
  registerChatsContacts,
} from './utils/localUserRegistry';
import { registerPushSubscription } from './utils/pushManager';
import { unlockCallAudio } from './utils/callAudioBridge';

export { getCleanPhone, phonesMatch };

const isPhoneInList = (phones: unknown, targetPhone?: string): boolean => {
  if (!Array.isArray(phones) || !targetPhone) return false;
  return phones.some((p) => typeof p === 'string' && phonesMatch(p, targetPhone));
};

const extractPeerPhoneFromDirectId = (chatId?: string, myPhone?: string): string => {
  if (!chatId || !chatId.startsWith('direct_')) return '';
  const parts = chatId.split('_').slice(1).filter(Boolean);
  if (parts.length < 2) return '';
  const peer = parts.find((p) => !phonesMatch(p, myPhone));
  return peer || '';
};

const sanitizeAvatarForFirestore = (
  avatarUrl?: string,
  fallbackName = 'PidgeX',
  color = '#2563eb'
): string => {
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return createSvgAvatar(fallbackName, color);
  }
  if (avatarUrl.startsWith('data:image/') && avatarUrl.length > 120000) {
    return createSvgAvatar(fallbackName, color);
  }
  return avatarUrl;
};

const uploadAvatarIfLargeDataUrl = async (
  avatarUrl: string,
  fallbackName: string,
  color = '#2563eb'
): Promise<string> => {
  if (!avatarUrl || !avatarUrl.startsWith('data:image/') || avatarUrl.length <= 120000) {
    return avatarUrl || createSvgAvatar(fallbackName, color);
  }
  try {
    const res = await fetch('/api/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataUrl: avatarUrl,
        filename: `group_avatar_${Date.now()}.jpg`,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.mediaUrl) return data.mediaUrl;
    }
  } catch (err) {
    console.warn('Could not upload group avatar, using compact fallback:', err);
  }
  return createSvgAvatar(fallbackName, color);
};

export const getDirectChatId = (phoneA?: string, phoneB?: string): string => {
  const cleanA = getCleanPhone(phoneA);
  const cleanB = getCleanPhone(phoneB);
  if (!cleanA || !cleanB) {
    return `chat_direct_${Date.now()}`;
  }
  const sorted = [cleanA, cleanB].sort();
  return `direct_${sorted[0]}_${sorted[1]}`;
};

const USER_STORAGE_KEY = 'birdmessage_user_profile_v1';
const CHATS_STORAGE_KEY = 'birdmessage_chats_data_v7';
const CLEARED_CUTOFFS_STORAGE_PREFIX = 'birdmessage_cleared_chat_cutoffs_v1_';

interface ClearedCutoffsMap {
  byChatId: Record<string, number>;
  byPeerPhone: Record<string, number>;
}

const readClearedCutoffs = (userId?: string): ClearedCutoffsMap => {
  try {
    const raw = localStorage.getItem(`${CLEARED_CUTOFFS_STORAGE_PREFIX}${userId || 'default'}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        byChatId: parsed?.byChatId && typeof parsed.byChatId === 'object' ? parsed.byChatId : {},
        byPeerPhone:
          parsed?.byPeerPhone && typeof parsed.byPeerPhone === 'object' ? parsed.byPeerPhone : {},
      };
    }
  } catch {}
  return { byChatId: {}, byPeerPhone: {} };
};

const writeClearedCutoffs = (userId: string | undefined, data: ClearedCutoffsMap) => {
  try {
    localStorage.setItem(
      `${CLEARED_CUTOFFS_STORAGE_PREFIX}${userId || 'default'}`,
      JSON.stringify(data)
    );
  } catch {}
};

const LEGACY_AI_IDS = new Set([
  'chat_ai',
  'chat_carlos',
  'chat_sofia',
  'chat_lucas',
  'chat_elena',
  'chat_team',
  'chat_real_community',
]);

const isLegacyChat = (c: Chat) => {
  if (!c) return true;
  if (LEGACY_AI_IDS.has(c.id)) return true;
  if (c.roomId === 'real_community' || c.id === 'chat_real_community') return true;
  const nameLower = (c.name || '').toLowerCase();
  if (
    nameLower.includes('carlos mendoza') ||
    nameLower.includes('sofia ben') ||
    nameLower.includes('lucas dev') ||
    nameLower.includes('elena g') ||
    nameLower.includes('equipo de proyecto') ||
    nameLower.includes('gente real') ||
    nameLower.includes('comunidad en vivo') ||
    nameLower === 'birdmessage ai' ||
    nameLower === 'pidgex ai'
  ) {
    return true;
  }
  return false;
};

const isLegacyOrEmptyName = (name?: string): boolean => {
  if (!name || !name.trim()) return true;
  const n = name.trim().toLowerCase();
  return (
    n === 'ana rodríguez' ||
    n === 'ana rodriguez' ||
    n === 'carlos mendoza' ||
    n === 'elena gómez' ||
    n === 'elena gomez' ||
    n === 'elena ay' ||
    n === 'aelen ay' ||
    n === 'aelen' ||
    n === 'nuevo usuario'
  );
};

const isLegacyOrEmptyBio = (bio?: string): boolean => {
  if (!bio || !bio.trim()) return true;
  const b = bio.trim().toLowerCase();
  return (
    b.includes('amante del diseño') ||
    b.includes('diseñadora ux') ||
    b.includes('desarrollador full stack') ||
    b.includes('acabo de crear mi cuenta') ||
    b.includes('explorando pidgeon')
  );
};

const playBirdSongSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Chirp 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2200, now);
    osc1.frequency.exponentialRampToValueAtTime(3800, now + 0.08);
    osc1.frequency.exponentialRampToValueAtTime(2600, now + 0.15);
    
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Chirp 2 (Trill)
    const start2 = now + 0.2;
    for (let i = 0; i < 4; i++) {
      const oscT = ctx.createOscillator();
      const gainT = ctx.createGain();
      oscT.type = 'triangle';
      const t0 = start2 + i * 0.06;
      oscT.frequency.setValueAtTime(3000 + (i % 2 === 0 ? 600 : -400), t0);
      oscT.frequency.exponentialRampToValueAtTime(4500, t0 + 0.05);
      
      gainT.gain.setValueAtTime(0.12, t0);
      gainT.gain.exponentialRampToValueAtTime(0.001, t0 + 0.06);
      
      oscT.connect(gainT);
      gainT.connect(ctx.destination);
      
      oscT.start(t0);
      oscT.stop(t0 + 0.06);
    }
  } catch {
    // AudioContext blocked
  }
};

const getFilterStyle = (mode?: string) => {
  switch (mode) {
    case 'protanopia': return 'url(#protanopia-filter)';
    case 'deuteranopia': return 'url(#deuteranopia-filter)';
    case 'tritanopia': return 'url(#tritanopia-filter)';
    case 'achromatopsia': return 'grayscale(100%)';
    default: return 'none';
  }
};

export default function App() {
  const tabSessionIdRef = useRef<string>(`tab_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`);
  const appLoadedTimeRef = useRef<number>(Date.now());

  // Load User Profile from localStorage or fallback
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // If stored avatar was an old unsplash or aida portrait, sanitize it
          let currentAvatar = parsed.avatarUrl || INITIAL_USER.avatarUrl;
          if (typeof currentAvatar === 'string' && (currentAvatar.includes('unsplash.com') || currentAvatar.includes('aida-public/AB6AXuAb1REqQwxrta2nSvWVKXjs77nNgIbdced7Q007QpTEJnbOOFwkcOFszqz8RPzRtMlnw330aKVEOg9wbeML7z-KBAs0fxAb_hEh74KNa_MXq7vWQUEXAhRPMHwU4IZEHJjgCcz77trNELTBRGIa6ziHn_X7aS_VmWIslUjPZLxMM7f3Geyn9UKq043zgJtv8xEpZwopsI8h8ucEcrFYi2rZT4NV8kNdjcNfo04AOZ7I-M2TmH3_su3U'))) {
            currentAvatar = INITIAL_USER.avatarUrl;
          }

          const currentName = isLegacyOrEmptyName(parsed.name) ? 'USUARIO NUEVO' : parsed.name.trim();
          const currentBio = isLegacyOrEmptyBio(parsed.bio) ? 'Soy nuevo en PidgeX' : parsed.bio.trim();
          const currentUsername = !parsed.username || parsed.username === '@anarodriguez' || parsed.username === '@carlosmendoza' || parsed.username === '@elenagomez' ? '@usuarionuevo' : parsed.username;

          // Ensure unique phone number and unique user id per device so users don't share identity
          const hasCustomPhone = parsed.phone && parsed.phone !== '16 612 345 678' && parsed.phone.trim().length >= 8;
          const assignedPhone = hasCustomPhone ? ensurePhoneStartsWith16(parsed.phone) : generateUniquePidgePhone();
          const savedUid = localStorage.getItem('birdmessage_client_uid') || `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          localStorage.setItem('birdmessage_client_uid', savedUid);
          const assignedId = (parsed.id && parsed.id !== 'user_me') ? parsed.id : savedUid;

          return {
            ...INITIAL_USER,
            ...parsed,
            id: assignedId,
            name: currentName,
            bio: currentBio,
            username: currentUsername,
            avatarUrl: currentAvatar,
            phone: assignedPhone,
            parentPhone: parsed.parentPhone ? ensurePhoneStartsWith16(parsed.parentPhone) : INITIAL_USER.parentPhone,
          };
        }
      }
    } catch {
      // ignore
    }
    const randomId = `user_${Math.random().toString(36).substring(2, 7)}`;
    const randomPhone = generateUniquePidgePhone();
    return {
      ...INITIAL_USER,
      id: randomId,
      phone: randomPhone,
    };
  });

  // Load Chats from localStorage or fallback
  const [chats, setChats] = useState<Chat[]>(() => {
    try {
      // Clean up previous storage versions
      localStorage.removeItem('birdmessage_chats_data_v1');
      localStorage.removeItem('birdmessage_chats_data_v2');
      localStorage.removeItem('birdmessage_chats_data_v3');
      localStorage.removeItem('birdmessage_chats_data_v4');
      localStorage.removeItem('birdmessage_chats_data_v5');
      localStorage.removeItem('birdmessage_chats_data_v6');
      localStorage.removeItem('gac');
      localStorage.removeItem('gac3d');
      localStorage.removeItem('grand_adventure');

      const deletedChatIds = new Set<string>(
        JSON.parse(localStorage.getItem('birdmessage_deleted_chat_ids') || '[]')
      );

      const saved = localStorage.getItem(CHATS_STORAGE_KEY);
      if (saved) {
        const parsed: Chat[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter((c) => {
              if (deletedChatIds.has(c.id)) return false;
              if (isLegacyChat(c) || c.isBlocked) return false;
              const nameLower = (c.name || '').toLowerCase();
              if (nameLower.includes('gac') || nameLower.includes('grand adventure') || nameLower.includes('gta')) return false;
              return true;
            })
            .map((c) => ({
              ...c,
              phone: c.phone ? ensurePhoneStartsWith16(c.phone) : undefined,
              messages: (c.messages || []).filter(
                (m) => !(m.text && m.text.includes('¡Jajaja me encantó ese sticker!'))
              ),
            }));
          if (cleaned.length > 0) return cleaned;
        }
      }
      return INITIAL_CHATS.filter((c) => !deletedChatIds.has(c.id));
    } catch {
      // ignore
    }
    return INITIAL_CHATS;
  });

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(activeChatId);
  activeChatIdRef.current = activeChatId;
  const [activeTab, setActiveTab] = useState<NavTab>('chats');
  const [lastTabDirection, setLastTabDirection] = useState<'left' | 'right'>('right');

  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectiveDeviceMode: 'mobile' | 'desktop' | 'tablet' = (() => {
    if (user.deviceMode === 'mobile') return 'mobile';
    if (user.deviceMode === 'desktop') return 'desktop';
    if (user.deviceMode === 'tablet') return 'tablet';
    if (windowWidth < 768) return 'mobile';
    if (windowWidth < 1024) return 'tablet';
    return 'desktop';
  })();

  const tabIndices: Record<NavTab, number> = {
    chats: 0,
    marketplace: 1,
    games: 2,
    news: 3,
    settings: 4,
  };

  const handleSelectTab = (newTab: NavTab) => {
    if (newTab !== activeTab) {
      const dir = tabIndices[newTab] > tabIndices[activeTab] ? 'right' : 'left';
      setLastTabDirection(dir);
      setActiveTab(newTab);
    }
  };
  const [activeCategory, setActiveCategory] = useState<ChatCategory>('all');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState<boolean>(false);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState<boolean>(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState<boolean>(false);
  const [isVoiceMessageModalOpen, setIsVoiceMessageModalOpen] = useState<boolean>(false);
  const [selectedContactForProfile, setSelectedContactForProfile] = useState<Chat | null>(null);
  const [isTimeCapsuleModalOpen, setIsTimeCapsuleModalOpen] = useState<boolean>(false);
  const [isLocalRadarOpen, setIsLocalRadarOpen] = useState<boolean>(false);
  const [isClassicMode, setIsClassicMode] = useState<boolean>(localStorage.getItem('pidge_classic_mode') === 'true');
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [isAccountRegistered, setIsAccountRegistered] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pidgex_account_completed_v1') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 1000);

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.info('PidgeX ServiceWorker registered:', reg);
        })
        .catch((err) => {
          console.warn('PidgeX ServiceWorker error:', err);
        });
    }

    requestNotificationPermission();

    return () => clearTimeout(timer);
  }, []);

  // Connect realtime WebSocket client and register Web Push for background calls
  useEffect(() => {
    if (user && user.id) {
      realtimeClient.connect(user);
      registerPushSubscription(user.phone, user.id);
    }
  }, [user.id, user.phone]);

  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [activeCallSession, setActiveCallSession] = useState<{
    callId: string;
    chat: Chat;
    isVideo: boolean;
    isCaller: boolean;
    initialCallStatus: 'calling' | 'connected';
  } | null>(null);
  const [isCallMinimized, setIsCallMinimized] = useState<boolean>(false);
  const [incomingCallData, setIncomingCallData] = useState<IncomingCallData | null>(null);
  const incomingCallRef = useRef<IncomingCallData | null>(null);
  incomingCallRef.current = incomingCallData;
  const activeCallSessionRef = useRef(activeCallSession);
  activeCallSessionRef.current = activeCallSession;
  const dismissedCallIdsRef = useRef<Set<string>>(new Set());
  const userRef = useRef<UserProfile>(user);
  userRef.current = user;
  const sessionTokenRef = useRef<string | null>(null);
  const sessionSignedOutRef = useRef<boolean>(false);
  const [inAppNotification, setInAppNotification] = useState<BirdNotification | null>(null);

  useEffect(() => {
    try {
      localStorage.removeItem('gac');
      localStorage.removeItem('gac3d');
      localStorage.removeItem('grand_adventure');
      localStorage.removeItem('gta');
    } catch {}
  }, []);

  // Cloud status initialization (email-free)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      setIsCloudSynced(Boolean(currentUser));
    });
    return () => unsubscribe();
  }, []);

  // Sync user profile changes to Firestore and local cross-tab registry
  useEffect(() => {
    if (!user || !isAccountRegistered) return;
    broadcastUserPresence(user);
    const unsubPresence = initPresenceListener();

    if (user.id && user.phone) {
      try {
        const userRef = doc(db, 'users', user.id);
        setDoc(userRef, user, { merge: true }).catch(() => {});
      } catch (e) {
        console.warn('Error saving user to Firestore:', e);
      }
    }

    return () => unsubPresence();
  }, [user, isAccountRegistered]);

  const saveAccountSnapshotLocal = (targetId: string, snapshotUser: UserProfile, snapshotChats: Chat[]) => {
    try {
      localStorage.setItem(
        `pidgex_account_snapshot_${targetId}`,
        JSON.stringify({ user: snapshotUser, chats: snapshotChats })
      );
    } catch {
      try {
        const compactChats = snapshotChats.map((c) => ({
          ...c,
          messages: (c.messages || []).map((m) =>
            m.mediaUrl && m.mediaUrl.startsWith('data:video/')
              ? { ...m, mediaUrl: undefined }
              : m
          ),
        }));
        localStorage.setItem(
          `pidgex_account_snapshot_${targetId}`,
          JSON.stringify({ user: snapshotUser, chats: compactChats })
        );
      } catch {
        // ignore quota errors
      }
    }
  };

  const buildCompactSyncPayload = (targetUser: UserProfile, targetChats: Chat[]) => {
    const safeUser: UserProfile = {
      ...targetUser,
      email: '',
      customWallpaperUrl:
        targetUser.customWallpaperUrl && targetUser.customWallpaperUrl.length > 400000
          ? ''
          : targetUser.customWallpaperUrl,
      customCallRingtoneUrl:
        targetUser.customCallRingtoneUrl && targetUser.customCallRingtoneUrl.length > 400000
          ? ''
          : targetUser.customCallRingtoneUrl,
      customMessageToneUrl:
        targetUser.customMessageToneUrl && targetUser.customMessageToneUrl.length > 400000
          ? ''
          : targetUser.customMessageToneUrl,
    };
    const safeChats = (targetChats || []).map((c) => ({
      ...c,
      messages: (c.messages || []).map((m) =>
        m.mediaUrl && m.mediaUrl.startsWith('data:') && m.mediaUrl.length > 400000
          ? { ...m, mediaUrl: undefined }
          : m
      ),
    }));
    return { user: safeUser, chats: safeChats };
  };

  // Iniciar sesión = Crear una cuenta nueva
  const handleCompleteCreateAccount = async (payload: AccountRegistrationPayload) => {
    const newId =
      payload.userId ||
      `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    sessionTokenRef.current = payload.sessionToken || null;

    const wasSignedOut = sessionSignedOutRef.current;
    sessionSignedOutRef.current = false;

    const accountChats: Chat[] = wasSignedOut
      ? INITIAL_CHATS
      : chatsRef.current && chatsRef.current.length > 0
      ? chatsRef.current
      : INITIAL_CHATS;

    const updatedUser: UserProfile = {
      ...INITIAL_USER,
      ...(wasSignedOut ? {} : user),
      id: newId,
      email: '',
      name: payload.name,
      username: payload.username,
      bio: payload.bio,
      phone: payload.phone,
      avatarUrl: payload.avatarUrl,
      accountCreated: true,
    };

    try {
      localStorage.setItem('birdmessage_client_uid', newId);
      localStorage.removeItem('pidgex_account_credentials_v1');
      localStorage.setItem('pidgex_account_completed_v1', 'true');
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(accountChats));
    } catch {
      // ignore storage errors
    }

    saveAccountSnapshotLocal(newId, updatedUser, accountChats);

    setUser(updatedUser);
    setChats(accountChats);
    setActiveChatId(null);
    registerKnownUser(updatedUser);
    registerChatsContacts(accountChats);
    broadcastUserPresence(updatedUser);

    if (sessionTokenRef.current) {
      fetch('/api/auth/state', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionTokenRef.current}`,
        },
        body: JSON.stringify(buildCompactSyncPayload(updatedUser, accountChats)),
      }).catch(() => {});
    }

    try {
      const userRefDoc = doc(db, 'users', newId);
      setDoc(userRefDoc, updatedUser, { merge: true }).catch((err) => {
        console.warn('Firestore profile save notice (continuing locally):', err);
      });
      const stateRefDoc = doc(db, 'userStates', newId);
      setDoc(stateRefDoc, buildCompactSyncPayload(updatedUser, accountChats), { merge: true }).catch(() => {});
    } catch (err) {
      console.warn('Firestore profile save notice (continuing locally):', err);
    }

    setIsAccountRegistered(true);
  };

  // Registrarse = Entrar a cuenta existente con su contraseña y restaurar contactos/conversaciones
  const handleCompleteExistingAccount = async (payload: AccountRegistrationPayload) => {
    const finalId =
      payload.userId ||
      (user.id && user.id !== 'user_me'
        ? user.id
        : `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

    sessionTokenRef.current = payload.sessionToken || null;
    sessionSignedOutRef.current = false;

    let cloudData: Partial<UserProfile> = {};
    let cloudState: { user?: Partial<UserProfile>; chats?: Chat[] } | null = null;
    try {
      const [userSnap, stateSnap] = await Promise.race([
        Promise.all([
          getDoc(doc(db, 'users', finalId)),
          getDoc(doc(db, 'userStates', finalId)),
        ]),
        new Promise<any>((resolve) => setTimeout(() => resolve([null, null]), 1800)),
      ]);
      if (userSnap && userSnap.exists()) {
        cloudData = userSnap.data() as Partial<UserProfile>;
      }
      if (stateSnap && stateSnap.exists()) {
        cloudState = stateSnap.data() as any;
      }
    } catch {
      // continue with server snapshot / payload if Firestore is unavailable
    }

    let localSnapshot: { user?: Partial<UserProfile>; chats?: Chat[] } | null = null;
    try {
      const rawSnap = localStorage.getItem(`pidgex_account_snapshot_${finalId}`);
      if (rawSnap) {
        localSnapshot = JSON.parse(rawSnap);
      }
    } catch {
      // ignore
    }

    const serverUser = payload.savedState?.user || cloudState?.user;
    const serverChats = payload.savedState?.chats || cloudState?.chats;

    const restoredUser: UserProfile = {
      ...INITIAL_USER,
      ...cloudData,
      ...(localSnapshot?.user || {}),
      ...(serverUser || {}),
      id: finalId,
      email: '',
      name: payload.name || serverUser?.name || cloudData.name || 'Usuario PidgeX',
      username: payload.username || serverUser?.username || cloudData.username || '@usuario',
      bio: payload.bio || serverUser?.bio || cloudData.bio || 'Disponible en PidgeX',
      phone: payload.phone || serverUser?.phone || cloudData.phone || user.phone,
      avatarUrl: payload.avatarUrl || serverUser?.avatarUrl || cloudData.avatarUrl || INITIAL_USER.avatarUrl,
      accountCreated: true,
    };

    const restoredChats: Chat[] =
      Array.isArray(serverChats) && serverChats.length > 0
        ? serverChats
        : Array.isArray(localSnapshot?.chats) && localSnapshot.chats.length > 0
        ? localSnapshot.chats
        : INITIAL_CHATS;

    try {
      localStorage.setItem('birdmessage_client_uid', finalId);
      localStorage.removeItem('pidgex_account_credentials_v1');
      localStorage.setItem('pidgex_account_completed_v1', 'true');
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(restoredUser));
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(restoredChats));
    } catch {
      // ignore storage errors
    }

    saveAccountSnapshotLocal(finalId, restoredUser, restoredChats);

    setUser(restoredUser);
    setChats(restoredChats);
    setActiveChatId(null);
    registerKnownUser(restoredUser);
    registerChatsContacts(restoredChats);
    broadcastUserPresence(restoredUser);

    try {
      setDoc(doc(db, 'users', finalId), restoredUser, { merge: true }).catch((err) => {
        console.warn('Firestore profile sync notice (continuing locally):', err);
      });
      setDoc(doc(db, 'userStates', finalId), buildCompactSyncPayload(restoredUser, restoredChats), { merge: true }).catch(() => {});
    } catch (err) {
      console.warn('Firestore profile sync notice (continuing locally):', err);
    }

    setIsAccountRegistered(true);
  };

  // Index contacts from chats into local registry
  useEffect(() => {
    registerChatsContacts(chats);
  }, [chats]);

  // Real-time Incoming Calls Listener
  useEffect(() => {
    if (!user?.id) return;
    const myPhoneClean = getCleanPhone(user.phone);
    const myUserId = user.id || 'me';
    const myNameClean = (user.name || '').trim().toLowerCase();

    const callsCol = collection(db, 'calls');
    const unsubscribe = onSnapshot(
      callsCol,
      (snapshot) => {
        const now = Date.now();
        let foundCall: IncomingCallData | null = null;
        let currentIncomingStatus: string | null = null;
        const currentIncomingId = incomingCallRef.current?.id;

        snapshot.docs.forEach((d) => {
          const data = d.data();
          if (!data) return;

          if (currentIncomingId && d.id === currentIncomingId) {
            currentIncomingStatus = data.status || null;
          }

          if (dismissedCallIdsRef.current.has(d.id)) return;
          if (activeCallSessionRef.current?.callId === d.id) return;

          // Allow slight clock skew across devices while ignoring stale calls from old sessions
          const callTime = data.createdAt || 0;
          if (callTime <= appLoadedTimeRef.current - 15000) return;

          // Ignore calls originated by this exact tab or by this user account
          const isCallerTab = data.callerTabSessionId === tabSessionIdRef.current;
          const isCallerUser =
            (data.callerId && data.callerId === myUserId) ||
            (data.callerPhone && myPhoneClean && data.callerPhone === myPhoneClean);
          if (isCallerTab || isCallerUser) return;

          // Strict target receiver matching
          const recPhone = getCleanPhone(data.receiverPhone);
          const recId = data.receiverId;
          const recName = (data.receiverName || '').trim().toLowerCase();

          const isTargetedToMe =
            (recPhone && myPhoneClean && recPhone.length >= 6 && recPhone === myPhoneClean) ||
            (recId && recId === myUserId) ||
            (recName &&
              myNameClean &&
              myNameClean !== 'usuario nuevo' &&
              (recName === myNameClean ||
                recName.includes(myNameClean) ||
                myNameClean.includes(recName)));

          // Only detect active ringing calls created live in the last 45 seconds
          if (isTargetedToMe && data.status === 'ringing' && now - callTime < 45000) {
            foundCall = {
              id: d.id,
              callerId: data.callerId || 'unknown',
              callerName: data.callerName || 'Contacto PidgeX',
              callerPhone: data.callerPhone || '',
              callerAvatar: data.callerAvatar || '',
              isVideo: Boolean(data.isVideo),
              isGroup: Boolean(data.isGroup),
              chatId: data.chatId,
            };
          }
        });

        if (foundCall) {
          if (!incomingCallRef.current || incomingCallRef.current.id !== foundCall.id) {
            sendNativeCallNotification(
              foundCall.callerName,
              foundCall.isVideo,
              foundCall.callerAvatar,
              foundCall.id,
              userRef.current
            );
            setIncomingCallData(foundCall);
          }
        } else if (
          currentIncomingId &&
          currentIncomingStatus !== null &&
          currentIncomingStatus !== 'ringing'
        ) {
          setIncomingCallData(null);
        }
      },
      (err) => {
        console.warn('Real-time calls listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [user.id, user.phone, user.name]);

  // Real-time Chat & Group Discovery via Firestore
  useEffect(() => {
    if (!user || (!user.phone && !user.id)) return;
    const myPhoneClean = getCleanPhone(ensurePhoneStartsWith16(user.phone || '')) || getCleanPhone(user.phone);
    if (!myPhoneClean && !user.id) return;

    const chatsCol = collection(db, 'chats');
    const unsubscribe = onSnapshot(
      chatsCol,
      (snapshot) => {
        snapshot.docs.forEach((d) => {
          const data = d.data();
          if (!data) return;

          const participantPhones: string[] = Array.isArray(data.participantPhones)
            ? data.participantPhones.filter((p: unknown): p is string => typeof p === 'string' && Boolean(p))
            : [];
          const participants: string[] = Array.isArray(data.participants)
            ? data.participants.filter((id: unknown): id is string => typeof id === 'string' && Boolean(id))
            : [];
          const rawGroupMembers: GroupMember[] = Array.isArray(data.groupMembers) ? data.groupMembers : [];

          const isGroup = data.type === 'group' || d.id.startsWith('group_');

          const isParticipant =
            isPhoneInList(participantPhones, myPhoneClean) ||
            (Boolean(user.id) && participants.includes(user.id)) ||
            rawGroupMembers.some(
              (m) =>
                (Boolean(user.id) && Boolean(m?.id) && m.id === user.id) ||
                phonesMatch(m?.phone, myPhoneClean)
            );

          if (isGroup) {
            if (!isParticipant) {
              // If user was removed or left this synced group, remove it locally
              if (participantPhones.length > 0 || rawGroupMembers.length > 0 || participants.length > 0) {
                setChats((prev) => {
                  if (!prev.some((c) => c.id === d.id)) return prev;
                  return prev.filter((c) => c.id !== d.id);
                });
                if (activeChatIdRef.current === d.id) {
                  setActiveChatId(null);
                }
              }
              return;
            }

            const groupName = data.name || 'Grupo PidgeX';
            const groupAvatar = data.avatarUrl || createSvgAvatar(groupName, '#2563eb');
            const groupDesc =
              data.description || `Grupo con ${rawGroupMembers.length || participantPhones.length || 1} integrantes`;
            const isIncoming = Boolean(
              data.lastMessageSenderPhone && !phonesMatch(data.lastMessageSenderPhone, myPhoneClean)
            );
            const isCreatedByMe =
              (Boolean(user.id) && data.createdBy === user.id) ||
              phonesMatch(data.createdByPhone, myPhoneClean);

            setChats((prev) => {
              const existing = prev.find((c) => c.id === d.id);
              const currentActiveId = activeChatIdRef.current;

              if (existing) {
                const textChanged = Boolean(data.lastMessageText && data.lastMessageText !== existing.lastMessageText);
                const nameChanged = groupName !== existing.name;
                const avatarChanged = Boolean(data.avatarUrl && data.avatarUrl !== existing.avatarUrl);
                const descChanged = groupDesc !== existing.description;
                const membersChanged =
                  rawGroupMembers.length > 0 &&
                  JSON.stringify(rawGroupMembers) !== JSON.stringify(existing.groupMembers || []);

                if (!textChanged && !nameChanged && !avatarChanged && !descChanged && !membersChanged) {
                  return prev;
                }

                if (textChanged && isIncoming && currentActiveId !== d.id) {
                  ringtoneManager.playIncomingMessageAlert(userRef.current);
                  soundEffects.playReceive();
                  setInAppNotification({
                    id: `notif_${Date.now()}`,
                    title: groupName,
                    body: data.lastMessageSenderName
                      ? `${data.lastMessageSenderName}: ${data.lastMessageText}`
                      : data.lastMessageText,
                    chatId: d.id,
                  });
                }

                return prev.map((c) =>
                  c.id === d.id
                    ? {
                        ...c,
                        name: groupName,
                        avatarUrl: data.avatarUrl || c.avatarUrl,
                        description: groupDesc,
                        groupMembers: rawGroupMembers.length > 0 ? rawGroupMembers : c.groupMembers,
                        type: 'group',
                        categories: ['all', 'groups'],
                        lastMessageText: data.lastMessageText || c.lastMessageText,
                        lastMessageTime: data.lastMessageTime || c.lastMessageTime,
                        lastMessageRead: textChanged ? currentActiveId === d.id : c.lastMessageRead,
                        unreadCount:
                          currentActiveId === d.id
                            ? 0
                            : textChanged && isIncoming
                            ? (c.unreadCount || 0) + 1
                            : c.unreadCount,
                      }
                    : c
                );
              }

              // Newly discovered group on this member's device!
              if (!isCreatedByMe && currentActiveId !== d.id) {
                ringtoneManager.playIncomingMessageAlert(userRef.current);
                soundEffects.playReceive();
                setInAppNotification({
                  id: `notif_group_${d.id}_${Date.now()}`,
                  title: groupName,
                  body: data.lastMessageText || `Te han agregado al grupo "${groupName}"`,
                  chatId: d.id,
                });
              }

              const newGroupChat: Chat = {
                id: d.id,
                name: groupName,
                avatarUrl: groupAvatar,
                isFriend: true,
                isVerified: true,
                isOnline: true,
                type: 'group',
                categories: ['all', 'groups'],
                description: groupDesc,
                groupMembers: rawGroupMembers,
                unreadCount: isCreatedByMe ? 0 : 1,
                lastMessageText: data.lastMessageText || `Grupo "${groupName}" creado`,
                lastMessageTime:
                  data.lastMessageTime ||
                  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                lastMessageRead: isCreatedByMe,
                messages: [],
              };

              return [newGroupChat, ...prev];
            });
            return;
          }

          // Direct 1-on-1 & Marketplace chat discovery
          if (isParticipant) {
            const otherPhoneClean = participantPhones.find((p) => !phonesMatch(p, myPhoneClean)) || '';
            const otherParticipantId = participants.find((id) => id && id !== user.id) || '';
            const usersMap = (data.usersMap || {}) as Record<string, any>;
            const usersById = (data.usersById || {}) as Record<string, any>;

            let otherUserInfo: any =
              (otherPhoneClean && usersMap[otherPhoneClean]) ||
              Object.entries(usersMap).find(([k]) => k && !phonesMatch(k, myPhoneClean))?.[1] ||
              (otherParticipantId && usersById[otherParticipantId]) ||
              Object.entries(usersById).find(([id]) => id && id !== user.id)?.[1] ||
              null;

            if (!otherUserInfo || !otherUserInfo.name) {
              const amICreator =
                (Boolean(user.id) && data.createdBy === user.id) ||
                (Boolean(myPhoneClean) && phonesMatch(data.createdByPhone, myPhoneClean));
              if (amICreator && data.sellerInfo?.name) {
                otherUserInfo = data.sellerInfo;
              } else if (!amICreator && data.buyerInfo?.name) {
                otherUserInfo = data.buyerInfo;
              } else if (data.buyerInfo?.name && !phonesMatch(data.buyerInfo.phone, myPhoneClean) && data.buyerInfo.id !== user.id) {
                otherUserInfo = data.buyerInfo;
              } else if (data.sellerInfo?.name && !phonesMatch(data.sellerInfo.phone, myPhoneClean) && data.sellerInfo.id !== user.id) {
                otherUserInfo = data.sellerInfo;
              }
            }

            const friendName =
              otherUserInfo?.name ||
              (data.lastMessageSenderName && data.lastMessageSenderName !== user.name
                ? data.lastMessageSenderName
                : '') ||
              (data.name && data.name !== user.name ? data.name : 'Contacto PidgeX');
            const friendPhone = otherUserInfo?.phone || otherPhoneClean;
            const friendAvatar = otherUserInfo?.avatarUrl || createSvgAvatar(friendName);

            const isLastFromMe = Boolean(
              (data.lastMessageSenderPhone && myPhoneClean && phonesMatch(data.lastMessageSenderPhone, myPhoneClean)) ||
              (data.lastMessageSenderId && user.id && data.lastMessageSenderId === user.id)
            );
            const isIncoming = !isLastFromMe;
            const resolvedStatusText =
              data.statusText ||
              (data.marketplaceProductTitle
                ? `PidgeX Market • ${data.marketplaceProductTitle}`
                : friendPhone
                ? `Amigo • ${friendPhone}`
                : 'Amigo en PidgeX');

            const cutoffs = readClearedCutoffs(userRef.current?.id || user.id);
            const peerClean = getCleanPhone(friendPhone);
            const chatCutoffMs = Math.max(
              cutoffs.byChatId[d.id] || 0,
              peerClean ? (cutoffs.byPeerPhone[peerClean] || 0) : 0
            );

            let isBrandNewDiscoveredChat = false;

            setChats((prev) => {
              const existing = prev.find((c) => c.id === d.id);
              const currentActiveId = activeChatIdRef.current;
              if (existing) {
                const textChanged = Boolean(data.lastMessageText && data.lastMessageText !== existing.lastMessageText);
                const isAfterCutoff = !chatCutoffMs || (data.updatedAt || 0) > chatCutoffMs;
                if (textChanged && isAfterCutoff) {
                  if (isIncoming && currentActiveId !== d.id) {
                    ringtoneManager.playIncomingMessageAlert(userRef.current);
                    soundEffects.playReceive();
                    sendNativeMessageNotification(friendName, data.lastMessageText, d.id);
                    setInAppNotification({
                      id: `notif_${d.id}_${Date.now()}`,
                      title: friendName,
                      body: data.lastMessageText,
                      chatId: d.id,
                    });
                  }
                  const updatedExisting: Chat = {
                    ...existing,
                    name: friendName || existing.name,
                    avatarUrl: otherUserInfo?.avatarUrl || existing.avatarUrl,
                    statusText: data.statusText || existing.statusText,
                    lastMessageText: data.lastMessageText,
                    lastMessageTime: data.lastMessageTime || existing.lastMessageTime,
                    lastMessageRead: isLastFromMe || currentActiveId === d.id,
                    unreadCount:
                      currentActiveId === d.id || isLastFromMe
                        ? 0
                        : (existing.unreadCount || 0) + 1,
                  };
                  return [updatedExisting, ...prev.filter((c) => c.id !== d.id)];
                }
                return prev;
              }

              // Skip resurrecting a deleted/unfriended chat unless there is a brand-new message after cutoff
              try {
                const deletedIds: string[] = JSON.parse(
                  localStorage.getItem('birdmessage_deleted_chat_ids') || '[]'
                );
                if (deletedIds.includes(d.id) && (data.updatedAt || 0) <= chatCutoffMs) {
                  return prev;
                }
              } catch {}

              isBrandNewDiscoveredChat = true;
              const unreadForNew = currentActiveId === d.id || isLastFromMe ? 0 : 1;
              if (isIncoming && currentActiveId !== d.id) {
                ringtoneManager.playIncomingMessageAlert(userRef.current);
                soundEffects.playReceive();
                sendNativeMessageNotification(
                  friendName,
                  data.lastMessageText || '¡Nuevo mensaje!',
                  d.id
                );
                setInAppNotification({
                  id: `notif_newchat_${d.id}_${Date.now()}`,
                  title: friendName,
                  body: data.lastMessageText || '¡Nuevo mensaje!',
                  chatId: d.id,
                });
              }

              const newChat: Chat = {
                id: d.id,
                name: friendName,
                phone: friendPhone ? ensurePhoneStartsWith16(friendPhone) : undefined,
                isFriend: true,
                avatarUrl: friendAvatar,
                isVerified: true,
                isOnline: true,
                statusText: resolvedStatusText,
                type: 'direct',
                categories: ['all', 'friends'],
                unreadCount: unreadForNew,
                lastMessageText: data.lastMessageText || '¡Nuevo mensaje!',
                lastMessageTime:
                  data.lastMessageTime ||
                  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                lastMessageRead: currentActiveId === d.id || isLastFromMe,
                messages: [],
              };
              return [newChat, ...prev];
            });

            // Immediately hydrate initial messages for newly discovered chats so seller sees the message right away
            if (isBrandNewDiscoveredChat) {
              getDocs(collection(db, 'chats', d.id, 'messages'))
                .then((msgsSnap) => {
                  if (msgsSnap.empty) return;
                  const hydratedMsgs: Message[] = msgsSnap.docs
                    .map((md) => {
                      const mData = md.data();
                      const isSystem = mData.senderId === 'system';
                      const isMine =
                        !isSystem &&
                        (phonesMatch(mData.senderPhone, myPhoneClean) ||
                          (Boolean(mData.senderId && user.id) && mData.senderId === user.id));
                      return {
                        id: mData.id || md.id,
                        chatId: d.id,
                        senderId: isSystem ? 'system' : isMine ? 'me' : (mData.senderId || 'contact'),
                        senderPhone: mData.senderPhone || undefined,
                        senderName: isSystem
                          ? (mData.senderName || 'PidgeX Sistema')
                          : isMine
                          ? user.name
                          : (mData.senderName || friendName),
                        senderAvatar: isSystem ? undefined : isMine ? user.avatarUrl : (mData.senderAvatar || friendAvatar),
                        type: mData.type || 'text',
                        text: mData.text || undefined,
                        mediaUrl: mData.mediaUrl || undefined,
                        thumbnailUrl: mData.thumbnailUrl || undefined,
                        mediaName: mData.mediaName || undefined,
                        timestamp:
                          mData.timestamp ||
                          new Date(mData.timestampMs || Date.now()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                        timestampMs: mData.timestampMs || 0,
                        isRead: isMine,
                        reactions: mData.reactions || {},
                      } as Message;
                    })
                    .filter((hm) => ((hm as any).timestampMs || 0) > chatCutoffMs)
                    .sort((a, b) => ((a as any).timestampMs || 0) - ((b as any).timestampMs || 0));

                  setChats((prev) =>
                    prev.map((c) => {
                      if (c.id !== d.id) return c;
                      const currentList = Array.isArray(c.messages) ? c.messages : [];
                      const mergedMap = new Map(currentList.map((m) => [m.id, m]));
                      hydratedMsgs.forEach((hm) => {
                        if (!mergedMap.has(hm.id)) mergedMap.set(hm.id, hm);
                      });
                      const merged = Array.from(mergedMap.values()).sort(
                        (a, b) => ((a as any).timestampMs || 0) - ((b as any).timestampMs || 0)
                      );
                      return { ...c, messages: merged };
                    })
                  );
                })
                .catch(() => {});
            }
          }
        });
      },
      (err) => {
        console.warn('Real-time chats discovery error:', err);
      }
    );

    return () => unsubscribe();
  }, [user.id, user.phone, user.name]);

  // One-time backfill: sync any previously created local-only groups to Firestore so friends receive them
  const syncedLocalGroupIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user || (!user.phone && !user.id)) return;
    const localGroups = chats.filter(
      (c) =>
        c.type === 'group' &&
        c.id.startsWith('group_') &&
        Array.isArray(c.groupMembers) &&
        c.groupMembers.length >= 2 &&
        !syncedLocalGroupIdsRef.current.has(c.id)
    );
    if (localGroups.length === 0) return;

    const myPhoneClean =
      getCleanPhone(ensurePhoneStartsWith16(user.phone || '')) || getCleanPhone(user.phone);

    localGroups.forEach((groupChat) => {
      syncedLocalGroupIdsRef.current.add(groupChat.id);
      const groupDocRef = doc(db, 'chats', groupChat.id);
      getDoc(groupDocRef)
        .then(async (snap) => {
          if (snap.exists()) return;
          const { cleanMembers, participantPhones, participants, usersMap } =
            buildGroupSyncPayload(groupChat.groupMembers || []);
          const syncedAvatar = await uploadAvatarIfLargeDataUrl(
            groupChat.avatarUrl,
            groupChat.name,
            '#2563eb'
          );
          await setDoc(
            groupDocRef,
            {
              id: groupChat.id,
              name: groupChat.name,
              type: 'group',
              avatarUrl: syncedAvatar,
              description:
                groupChat.description || `Grupo con ${cleanMembers.length} integrantes`,
              groupMembers: cleanMembers,
              participantPhones,
              participants,
              usersMap,
              createdBy: user.id || 'me',
              createdByPhone: myPhoneClean,
              lastMessageText: groupChat.lastMessageText || `Grupo "${groupChat.name}" creado`,
              lastMessageTime:
                groupChat.lastMessageTime ||
                new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              lastMessageSenderPhone: myPhoneClean,
              lastMessageSenderName: user.name,
              updatedAt: Date.now(),
            },
            { merge: true }
          );

          const existingMsgs = Array.isArray(groupChat.messages) ? groupChat.messages : [];
          for (let i = 0; i < existingMsgs.length; i++) {
            const msg = existingMsgs[i];
            if (!msg?.id) continue;
            await setDoc(
              doc(db, 'chats', groupChat.id, 'messages', msg.id),
              {
                id: msg.id,
                chatId: groupChat.id,
                senderId: msg.senderId === 'system' ? 'system' : user.id || 'me',
                senderPhone: msg.senderId === 'system' ? '' : myPhoneClean,
                senderName: msg.senderName || user.name,
                senderAvatar:
                  msg.senderId === 'system'
                    ? null
                    : sanitizeAvatarForFirestore(msg.senderAvatar || user.avatarUrl, msg.senderName || user.name),
                type: msg.type || 'text',
                text: msg.text || null,
                mediaUrl: msg.mediaUrl && !msg.mediaUrl.startsWith('data:') ? msg.mediaUrl : null,
                timestamp: msg.timestamp || groupChat.lastMessageTime || '',
                timestampMs: msg.timestampMs || Date.now() - (existingMsgs.length - i) * 1000,
                isRead: true,
              },
              { merge: true }
            ).catch(() => {});
          }
        })
        .catch(() => {});
    });
  }, [chats, user.id, user.phone, user.name]);

  // Real-time messages listener for active chat
  useEffect(() => {
    if (!activeChatId) return;

    const msgsCol = collection(db, 'chats', activeChatId, 'messages');
    const myPhoneClean = getCleanPhone(user.phone);

    const unsubscribe = onSnapshot(
      msgsCol,
      (snapshot) => {
        if (snapshot.empty) return;

        const activeChatObj = chatsRef.current.find((c) => c.id === activeChatId);
        const cutoffs = readClearedCutoffs(userRef.current?.id || user.id);
        const isGroupChat = activeChatId.startsWith('group_') || activeChatObj?.type === 'group';
        const peerClean = !isGroupChat ? getCleanPhone(activeChatObj?.phone) : '';
        const cutoffMs = Math.max(
          cutoffs.byChatId[activeChatId] || 0,
          peerClean ? (cutoffs.byPeerPhone[peerClean] || 0) : 0
        );

        const cloudMessages: Message[] = snapshot.docs.map((d) => {
          const data = d.data();
          const isSystem = data.senderId === 'system';
          const isMine =
            !isSystem &&
            (phonesMatch(data.senderPhone, myPhoneClean) ||
              (Boolean(data.senderId && user.id) && data.senderId === user.id));

          return {
            id: data.id || d.id,
            chatId: activeChatId,
            senderId: isSystem ? 'system' : isMine ? 'me' : (data.senderId || 'contact'),
            senderPhone: data.senderPhone || undefined,
            senderName: isSystem ? (data.senderName || 'PidgeX Sistema') : isMine ? user.name : (data.senderName || 'Contacto'),
            senderAvatar: isSystem ? undefined : isMine ? user.avatarUrl : data.senderAvatar,
            type: data.type || 'text',
            text: data.text || undefined,
            mediaUrl: data.mediaUrl || undefined,
            thumbnailUrl: data.thumbnailUrl || undefined,
            mediaName: data.mediaName || undefined,
            mediaSize: data.mediaSize || undefined,
            mediaDuration: data.mediaDuration || undefined,
            voiceFilter: data.voiceFilter || undefined,
            filter: data.filter || undefined,
            stickerTitle: data.stickerTitle || undefined,
            stickerUrl: data.stickerUrl || undefined,
            timestamp: data.timestamp || new Date(data.timestampMs || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestampMs: data.timestampMs || 0,
            isRead: true,
            reactions: data.reactions || {},
            avatarPayload: data.avatarPayload || undefined,
            capsuleData: data.capsuleData || undefined,
            gameData: data.gameData || undefined,
            translatedText: data.translatedText || undefined,
            emotionTag: data.emotionTag || undefined,
          };
        })
          .filter((m) => ((m as any).timestampMs || 0) > cutoffMs)
          .sort((a, b) => ((a as any).timestampMs || 0) - ((b as any).timestampMs || 0));

        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChatId) {
              const currentList = Array.isArray(c.messages) ? c.messages : [];
              const existingMap = new Map(currentList.map((m) => [m.id, m]));
              let hasNew = false;
              let hasNewIncoming = false;
              cloudMessages.forEach((cm) => {
                if (!existingMap.has(cm.id)) {
                  existingMap.set(cm.id, cm);
                  hasNew = true;
                  if (cm.senderId !== 'me' && cm.senderId !== 'system') {
                    hasNewIncoming = true;
                  }
                }
              });

              if (hasNewIncoming) {
                ringtoneManager.playIncomingMessageAlert(user);
                soundEffects.playReceive();
              }

              if (!hasNew && existingMap.size === currentList.length) {
                return c;
              }

              const merged = Array.from(existingMap.values()).sort(
                (a, b) => ((a as any).timestampMs || 0) - ((b as any).timestampMs || 0)
              );
              const last = merged[merged.length - 1];
              return {
                ...c,
                messages: merged,
                lastMessageText: last ? (last.text || `[${last.type}]`) : c.lastMessageText,
                lastMessageTime: last ? last.timestamp : c.lastMessageTime,
              };
            }
            return c;
          })
        );
      },
      (err) => {
        console.warn('Realtime messages listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [activeChatId, user.phone, user.id, user.name, user.avatarUrl]);

  // Centralized real-time incoming message processor (handles WebSockets and cross-tab broadcasts)
  const handleIncomingLiveMessage = (roomId: string, rawMsg: Message) => {
    if (!rawMsg) return;

    // Handle high-priority call ringing signal via WebSockets
    if (rawMsg.text && rawMsg.text.startsWith('PIDGEX_CALL_RINGING:')) {
      try {
        const payload = JSON.parse(rawMsg.text.substring('PIDGEX_CALL_RINGING:'.length));
        const myPhoneClean = getCleanPhone(user.phone);
        const myUserId = user.id || 'me';
        const recPhone = getCleanPhone(payload.receiverPhone);
        const isTargetedToMe =
          (recPhone && myPhoneClean && recPhone === myPhoneClean) ||
          (payload.receiverId && payload.receiverId === myUserId) ||
          (payload.receiverPhone && user.phone && payload.receiverPhone === user.phone);

        if (isTargetedToMe && payload.callerId !== myUserId) {
          const incomingId = payload.callId || `call_${Date.now()}`;
          if (
            !dismissedCallIdsRef.current.has(incomingId) &&
            activeCallSessionRef.current?.callId !== incomingId &&
            incomingCallRef.current?.id !== incomingId
          ) {
            const callData: IncomingCallData = {
              id: incomingId,
              callerId: payload.callerId || 'unknown',
              callerName: payload.callerName || 'Contacto PidgeX',
              callerPhone: payload.callerPhone || '',
              callerAvatar: payload.callerAvatar || '',
              isVideo: Boolean(payload.isVideo),
              chatId: payload.chatId || roomId,
            };
            sendNativeCallNotification(
              callData.callerName,
              callData.isVideo,
              callData.callerAvatar,
              callData.id,
              userRef.current
            );
            setIncomingCallData(callData);
          }
        }
      } catch (err) {
        console.warn('Failed parsing PIDGEX_CALL_RINGING payload:', err);
      }
      return;
    }

    const myPhoneClean = getCleanPhone(user.phone);
    const msgSenderPhoneClean = getCleanPhone(rawMsg.senderPhone);
    const myUserId = user.id || 'me';
    const isGroupRoom =
      roomId.startsWith('group_') || Boolean(rawMsg.chatId && rawMsg.chatId.startsWith('group_'));
    const isMarketRoom =
      roomId.startsWith('market_') || Boolean(rawMsg.chatId && rawMsg.chatId.startsWith('market_'));

    // Ignore messages originated by myself
    const isFromMe =
      phonesMatch(msgSenderPhoneClean, myPhoneClean) ||
      (Boolean(rawMsg.senderId && myUserId) && (rawMsg.senderId === myUserId || rawMsg.senderId === 'me'));

    if (isFromMe) return;

    // Ignore stale messages from before a contact/chat was removed or unfriended
    if (!isGroupRoom) {
      const cutoffs = readClearedCutoffs(userRef.current?.id || user.id);
      const cutoffMs = Math.max(
        cutoffs.byChatId[roomId] || 0,
        msgSenderPhoneClean ? (cutoffs.byPeerPhone[msgSenderPhoneClean] || 0) : 0
      );
      if ((rawMsg.timestampMs || Date.now()) <= cutoffMs) {
        return;
      }
    }

    // From recipient's perspective, preserve 'system' or mark as 'contact'
    const currentActiveId = activeChatIdRef.current;
    const incomingMsg: Message = {
      ...rawMsg,
      senderId: rawMsg.senderId === 'system' ? 'system' : 'contact',
      isRead: currentActiveId === roomId,
    };

    setChats((prev) => {
      const existingIndex = prev.findIndex(
        (c) =>
          c.id === roomId ||
          (rawMsg.chatId && c.id === rawMsg.chatId) ||
          (!isGroupRoom &&
            !isMarketRoom &&
            c.type !== 'group' &&
            !c.id.startsWith('market_') &&
            c.phone &&
            msgSenderPhoneClean &&
            phonesMatch(c.phone, msgSenderPhoneClean))
      );

      let targetChatName = '';
      let updatedChats: Chat[];

      if (existingIndex >= 0) {
        const existingChat = prev[existingIndex];
        targetChatName = existingChat.name;
        const currentList = Array.isArray(existingChat.messages) ? existingChat.messages : [];
        if (currentList.some((m) => m.id === incomingMsg.id)) {
          return prev;
        }
        const updatedChat: Chat = {
          ...existingChat,
          messages: [...currentList, incomingMsg],
          lastMessageText:
            incomingMsg.text ||
            (incomingMsg.type === 'voice'
              ? 'Mensaje de voz'
              : incomingMsg.type === 'avatar_msg'
              ? 'Mensaje de Avatar IA'
              : incomingMsg.type === 'capsule'
              ? 'Mensaje del Futuro'
              : incomingMsg.type === 'memory_reel'
              ? 'Video de Recuerdos'
              : incomingMsg.type === 'game_invite'
              ? incomingMsg.gameData?.title || 'Invitación a jugar'
              : `[${incomingMsg.type}]`),
          lastMessageTime: incomingMsg.timestamp,
          lastMessageRead: currentActiveId === existingChat.id,
          unreadCount: currentActiveId === existingChat.id ? 0 : (existingChat.unreadCount || 0) + 1,
        };
        updatedChats = [...prev];
        updatedChats[existingIndex] = updatedChat;
      } else {
        // For group rooms not yet discovered locally, wait for Firestore group doc instead of creating a fake direct chat
        if (isGroupRoom) {
          return prev;
        }
        // Auto-create chat if other person started conversation first
        const senderName =
          incomingMsg.senderName ||
          (msgSenderPhoneClean ? `Contacto (${msgSenderPhoneClean})` : 'Contacto PidgeX');
        targetChatName = senderName;
        const senderPhone = incomingMsg.senderPhone
          ? ensurePhoneStartsWith16(incomingMsg.senderPhone)
          : undefined;
        const senderAvatar =
          incomingMsg.senderAvatar || createSvgAvatar(senderName, '#0284c7');

        const newChat: Chat = {
          id: roomId,
          name: senderName,
          phone: senderPhone,
          avatarUrl: senderAvatar,
          isFriend: true,
          isOnline: true,
          statusText: isMarketRoom
            ? 'Compra en PidgeX Market'
            : senderPhone
            ? `Amigo • ${senderPhone}`
            : 'Amigo en PidgeX',
          type: 'direct',
          categories: ['all', 'friends'],
          unreadCount: 1,
          lastMessageText:
            incomingMsg.text ||
            (incomingMsg.type === 'voice'
              ? 'Mensaje de voz'
              : incomingMsg.type === 'avatar_msg'
              ? 'Mensaje de Avatar IA'
              : incomingMsg.type === 'capsule'
              ? 'Mensaje del Futuro'
              : incomingMsg.type === 'memory_reel'
              ? 'Video de Recuerdos'
              : incomingMsg.type === 'game_invite'
              ? incomingMsg.gameData?.title || 'Invitación a jugar'
              : `[${incomingMsg.type}]`),
          lastMessageTime: incomingMsg.timestamp,
          lastMessageRead: false,
          messages: [incomingMsg],
        };
        updatedChats = [newChat, ...prev];
      }

      // Audible chime & visual toast for incoming message
      soundEffects.playReceive();
      const senderDisplayName = targetChatName || incomingMsg.senderName || 'Contacto PidgeX';
      const previewText =
        incomingMsg.text ||
        (incomingMsg.type === 'voice' ? '🎙️ Mensaje de voz' : `📎 ${incomingMsg.type}`);

      // Native device vibration and screen wake lock notification (even when screen is off)
      sendNativeMessageNotification(senderDisplayName, previewText, roomId);

      if (currentActiveId !== roomId) {
        ringtoneManager.playIncomingMessageAlert(user);
        setInAppNotification({
          id: `notif_${Date.now()}`,
          title: senderDisplayName,
          body: previewText,
          chatId: roomId,
        });
      }

      return updatedChats;
    });
  };

  // Real-time WebSocket connection and active room subscription
  useEffect(() => {
    realtimeClient.setCallbacks({
      onMessage: (roomId, message) => {
        handleIncomingLiveMessage(roomId, message);
      },
    });

    if (activeChatId) {
      realtimeClient.joinRoom(activeChatId);
    }
  }, [activeChatId, user.phone, user.id]);

  // Real-time instant BroadcastChannel synchronization across tabs
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const bus = new BroadcastChannel('pidgex_channel_sync_bus');

    bus.onmessage = (event) => {
      const data = event.data;
      if (!data || !data.type) return;

      const myPhoneClean = getCleanPhone(user.phone);
      const isMeTargeted = (phones?: unknown, ids?: unknown) => {
        const hasPhones = Array.isArray(phones) && phones.length > 0;
        const hasIds = Array.isArray(ids) && ids.length > 0;
        if (!hasPhones && !hasIds) return true;
        return (
          isPhoneInList(phones, myPhoneClean) ||
          (Array.isArray(ids) && Boolean(user.id) && ids.includes(user.id))
        );
      };

      if (data.type === 'NEW_MESSAGE' && data.chatId && data.message) {
        handleIncomingLiveMessage(data.chatId, data.message);
      } else if (data.type === 'NEW_CHAT' && data.chat) {
        if (!isMeTargeted(data.participantPhones, data.participants)) return;
        setChats((prev) => {
          if (prev.some((c) => c.id === data.chat.id)) return prev;
          return [data.chat, ...prev];
        });
      } else if (data.type === 'UPDATE_GROUP' && data.chatId) {
        const stillInGroup = isMeTargeted(data.participantPhones, data.participants);
        setChats((prev) => {
          if (!stillInGroup) {
            return prev.filter((c) => c.id !== data.chatId);
          }
          return prev.map((c) =>
            c.id === data.chatId
              ? {
                  ...c,
                  groupMembers: data.groupMembers || c.groupMembers,
                  description: data.description || c.description,
                  avatarUrl: data.avatarUrl || c.avatarUrl,
                  lastMessageText: data.lastMessageText || c.lastMessageText,
                  lastMessageTime: data.lastMessageTime || c.lastMessageTime,
                }
              : c
          );
        });
      } else if (data.type === 'DELETE_CHAT' && data.chatId) {
        setChats((prev) => prev.filter((c) => c.id !== data.chatId));
        if (activeChatId === data.chatId) {
          setActiveChatId(null);
        }
      } else if (data.type === 'DELETE_MESSAGE' && data.chatId && data.messageId) {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === data.chatId) {
              return {
                ...c,
                messages: (c.messages || []).filter((m) => m.id !== data.messageId),
              };
            }
            return c;
          })
        );
      }
    };

    return () => {
      bus.close();
    };
  }, [activeChatId, user.phone, user.id]);

  const handleStartCall = async (chat: Chat, isVideo: boolean) => {
    const callerPhoneClean = getCleanPhone(user.phone);
    const receiverPhoneClean = getCleanPhone(chat.phone);

    // Synchronously unlock persistent AudioContext inside the user's tap gesture (critical for mobile Safari/Chrome)
    unlockCallAudio().catch(() => {});

    // Synchronously generate a real Firestore document reference with auto ID
    const callDocRef = doc(collection(db, 'calls'));
    const realCallId = callDocRef.id;

    // Immediately open call modal synchronously for caller with the real call ID
    setIsCallMinimized(false);
    setActiveCallSession({
      callId: realCallId,
      chat,
      isVideo,
      isCaller: true,
      initialCallStatus: 'calling',
    });

    const safeCallerAvatar = sanitizeAvatarForFirestore(user.avatarUrl, user.name);
    const safeReceiverAvatar = sanitizeAvatarForFirestore(chat.avatarUrl, chat.name);

    try {
      await setDoc(callDocRef, {
        callerId: user.id || 'me',
        callerName: user.name,
        callerAvatar: safeCallerAvatar,
        callerPhone: callerPhoneClean,
        callerTabSessionId: tabSessionIdRef.current,
        receiverId: chat.id || '',
        receiverPhone: receiverPhoneClean,
        receiverName: chat.name,
        receiverAvatar: safeReceiverAvatar,
        isVideo,
        isGroup: chat.type === 'group',
        chatId: chat.id,
        status: 'ringing', // STRICTLY ringing - caller timer will NOT start until receiver answers!
        createdAt: Date.now(),
      });
    } catch (e) {
      console.warn('Error syncing call doc to Firestore:', e);
    }

    // Also broadcast ringing signal via WebSocket and BroadcastChannel to reach phones instantly
    try {
      const callRingingPayload = {
        callId: realCallId,
        callerId: user.id || 'me',
        callerName: user.name,
        callerAvatar: safeCallerAvatar,
        callerPhone: callerPhoneClean,
        receiverId: chat.id || '',
        receiverPhone: receiverPhoneClean,
        isVideo,
        chatId: chat.id,
      };
      const ringingMsg: Message = {
        id: `call_signal_${realCallId}`,
        senderId: user.id || 'me',
        senderName: user.name,
        senderAvatar: safeCallerAvatar,
        senderPhone: callerPhoneClean,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestampMs: Date.now(),
        type: 'text',
        text: `PIDGEX_CALL_RINGING:${JSON.stringify(callRingingPayload)}`,
        chatId: chat.id,
        isRead: true,
      };
      realtimeClient.sendMessage(chat.id, ringingMsg);
      realtimeClient.sendMessage('global_calls', ringingMsg);
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('pidgex_channel_sync_bus');
        bc.postMessage({ type: 'NEW_MESSAGE', chatId: chat.id, message: ringingMsg });
        bc.close();
      }
    } catch (e) {
      console.warn('Error broadcasting call ringing signal:', e);
    }

    // Wake up receiver phone via OS Web Push notification even if app is closed or screen is off
    try {
      fetch('/api/calls/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: realCallId,
          callerName: user.name,
          callerPhone: callerPhoneClean,
          callerAvatar: safeCallerAvatar,
          receiverId: chat.id || '',
          receiverPhone: receiverPhoneClean,
          isVideo,
          chatId: chat.id,
        }),
      }).catch((err) => console.warn('Push call trigger network err:', err));
    } catch {}
  };

  const handleAcceptIncomingCall = async (call: IncomingCallData) => {
    dismissedCallIdsRef.current.add(call.id);
    ringtoneManager.stopIncomingCallAlert();
    // Synchronously unlock persistent AudioContext inside the user's "Contestar" tap gesture
    unlockCallAudio().catch(() => {});

    try {
      fetch('/api/calls/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: call.id, status: 'accepted' }),
      }).catch(() => {});
    } catch {}

    try {
      const callDocRef = doc(db, 'calls', call.id);
      await updateDoc(callDocRef, {
        status: 'accepted',
        acceptedAt: Date.now(),
      });
    } catch (e) {
      console.error('Error accepting call:', e);
    }

    let matchingChat = chats.find(
      (c) =>
        (c.phone && getCleanPhone(c.phone) === getCleanPhone(call.callerPhone)) ||
        c.name === call.callerName ||
        c.id === call.callerId
    );

    if (!matchingChat) {
      matchingChat = {
        id: call.chatId || `chat_call_${Date.now()}`,
        name: call.callerName,
        phone: call.callerPhone,
        avatarUrl: call.callerAvatar || createSvgAvatar(call.callerName),
        type: call.isGroup ? 'group' : 'direct',
        isFriend: true,
        isOnline: true,
        statusText: call.callerPhone ? `Amigo • ${call.callerPhone}` : 'En llamada PidgeX',
        categories: ['all', 'friends'],
        unreadCount: 0,
        lastMessageText: 'Llamada conectada',
        lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: [],
      };
      setChats((prev) => [matchingChat!, ...prev]);
    }

    setIncomingCallData(null);

    // Open call modal directly connected for receiver
    setIsCallMinimized(false);
    setActiveCallSession({
      callId: call.id,
      chat: matchingChat,
      isVideo: Boolean(call.isVideo),
      isCaller: false,
      initialCallStatus: 'connected',
    });
  };

  const handleDeclineIncomingCall = async (call: IncomingCallData) => {
    dismissedCallIdsRef.current.add(call.id);
    ringtoneManager.stopIncomingCallAlert();
    try {
      fetch('/api/calls/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: call.id, status: 'declined' }),
      }).catch(() => {});
    } catch {}

    try {
      const callDocRef = doc(db, 'calls', call.id);
      await updateDoc(callDocRef, {
        status: 'declined',
        declinedAt: Date.now(),
      });
    } catch (e) {
      console.error('Error declining call:', e);
    }
    setIncomingCallData(null);
  };

  const handleCloseActiveCall = useCallback(() => {
    const current = activeCallSessionRef.current;
    if (current?.callId) {
      dismissedCallIdsRef.current.add(current.callId);
      try {
        const callRef = doc(db, 'calls', current.callId);
        updateDoc(callRef, { status: 'ended', endedAt: Date.now() }).catch(() => {});
      } catch (e) {
        console.warn('Error ending call doc:', e);
      }
    }
    setIsCallMinimized(false);
    setActiveCallSession(null);
  }, []);

  const handleMinimizeActiveCall = useCallback(() => setIsCallMinimized(true), []);
  const handleRestoreActiveCall = useCallback(() => setIsCallMinimized(false), []);

  // Service Worker background action listener & URL wake-up handler (even when app was closed)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleSWMessage = (event: MessageEvent) => {
      const { type, callId } = event.data || {};
      if (type === 'ANSWER_CALL') {
        if (incomingCallData && (!callId || incomingCallData.id === callId)) {
          handleAcceptIncomingCall(incomingCallData);
        }
      } else if (type === 'DECLINE_CALL') {
        if (incomingCallData && (!callId || incomingCallData.id === callId)) {
          handleDeclineIncomingCall(incomingCallData);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);

    // Check URL parameters when opened from notification or when phone is locked/app was closed
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const openChatId = urlParams.get('chatId');
      if (openChatId) {
        setActiveChatId(openChatId);
        setActiveTab('chats');
      }

      const autoAnswerCallId = urlParams.get('autoAnswerCall') || urlParams.get('callId');
      const shouldAutoAnswer = urlParams.get('answer') === 'true' || urlParams.get('action') === 'answer';

      if (autoAnswerCallId) {
        try {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch {}

        const wakeUpAndShowCall = async () => {
          let callInfo: any = null;
          try {
            const resp = await fetch(`/api/calls/check?callId=${autoAnswerCallId}`);
            if (resp.ok) {
              const resJson = await resp.json();
              if (resJson.call) callInfo = resJson.call;
            }
          } catch {}

          if (!callInfo) {
            try {
              const snap = await getDoc(doc(db, 'calls', autoAnswerCallId));
              if (snap.exists()) {
                callInfo = { id: snap.id, ...snap.data() };
              }
            } catch {}
          }

          if (callInfo && (callInfo.status === 'ringing' || callInfo.status === 'calling')) {
            const incoming: IncomingCallData = {
              id: autoAnswerCallId,
              callerId: callInfo.callerId || '',
              callerName: callInfo.callerName || 'Contacto PidgeX',
              callerAvatar: callInfo.callerAvatar,
              callerPhone: callInfo.callerPhone,
              isVideo: Boolean(callInfo.isVideo),
              isGroup: Boolean(callInfo.isGroup),
              chatId: callInfo.chatId || '',
            };

            if (shouldAutoAnswer) {
              handleAcceptIncomingCall(incoming);
            } else {
              setIncomingCallData(incoming);
            }
          }
        };

        wakeUpAndShowCall();
      }
    } catch {}

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    };
  }, [incomingCallData]);

  const handleSignOutSession = async () => {
    // Save current account contacts and conversations before signing out
    const currentId = userRef.current?.id;
    const currentToken = sessionTokenRef.current;
    if (currentId && currentId !== 'user_me') {
      saveAccountSnapshotLocal(currentId, userRef.current, chatsRef.current);
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (currentToken) headers.Authorization = `Bearer ${currentToken}`;
        await Promise.race([
          fetch('/api/auth/state', {
            method: 'PUT',
            credentials: 'same-origin',
            headers,
            body: JSON.stringify(buildCompactSyncPayload(userRef.current, chatsRef.current)),
          }),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      } catch {
        // ignore network errors
      }
    }

    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});

    sessionTokenRef.current = null;
    sessionSignedOutRef.current = true;
    try {
      localStorage.removeItem('pidgex_account_completed_v1');
    } catch {
      // ignore
    }
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setActiveChatId(null);
    setActiveTab('chats');
    setIsAccountRegistered(false);
  };

  // Delete account completely (local data, server auth record, and cloud data)
  const handleDeleteAccount = async () => {
    const deletedId = userRef.current?.id;
    const deletedPhone = userRef.current?.phone;
    const token = sessionTokenRef.current;
    sessionTokenRef.current = null;
    unregisterKnownUser(deletedId, deletedPhone);

    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch('/api/auth/account', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers,
      });
    } catch {
      // ignore server delete errors
    }

    if (deletedId && deletedId !== 'user_me') {
      try {
        deleteDoc(doc(db, 'users', deletedId)).catch(() => {});
      } catch {}
    }

    const currentFbUser = auth.currentUser || firebaseUser;

    // 1. Delete from Firestore if synced
    if (currentFbUser) {
      const userUid = currentFbUser.uid;

      // Delete user document in Firestore
      try {
        const userDocRef = doc(db, 'users', userUid);
        await deleteDoc(userDocRef);
      } catch (err) {
        console.error('Error deleting user doc from Firestore:', err);
      }

      // Delete user's marketplace products
      try {
        const prodQuery = query(collection(db, 'marketplaceProducts'), where('sellerId', '==', userUid));
        const prodSnaps = await getDocs(prodQuery);
        for (const snap of prodSnaps.docs) {
          try {
            await deleteDoc(snap.ref);
          } catch (e) {
            console.error('Error deleting marketplace product doc:', e);
          }
        }
      } catch (err) {
        console.error('Error querying/deleting marketplace products:', err);
      }

      // Delete Firebase Auth User account
      try {
        await deleteUser(currentFbUser);
      } catch (err: any) {
        console.warn('Could not delete Firebase auth user directly (might need reauth), signing out:', err);
        try {
          await signOut(auth);
        } catch {
          // ignore
        }
      }
    }

    // 2. Wipe local storage
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(CHATS_STORAGE_KEY);
      localStorage.removeItem('birdmessage_chats_data_v1');
      localStorage.removeItem('birdmessage_chats_data_v2');
      localStorage.removeItem('birdmessage_chats_data_v3');
      localStorage.removeItem('birdmessage_chats_data_v4');
      localStorage.removeItem('birdmessage_chats_data_v5');
      localStorage.removeItem('birdmessage_chats_data_v6');
      localStorage.removeItem('birdmessage_marketplace_v1');
      localStorage.removeItem('pidgex_account_completed_v1');
      localStorage.removeItem('pidgex_account_credentials_v1');
      if (userRef.current?.id) {
        localStorage.removeItem(`pidgex_account_snapshot_${userRef.current.id}`);
      }
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }

    // 3. Reset application in-memory state to clean new state
    const newRandomId = `user_${Math.random().toString(36).substring(2, 7)}`;
    const freshUser: UserProfile = {
      ...INITIAL_USER,
      id: newRandomId,
      name: 'USUARIO NUEVO',
      username: '@usuarionuevo',
      bio: 'Soy nuevo en PidgeX',
      phone: '16 600 000 001',
      email: '',
      accountCreated: false,
      pendingFriendRequests: [],
    };

    setUser(freshUser);
    setChats([]);
    setActiveChatId(null);
    setFirebaseUser(null);
    setIsCloudSynced(false);
    setIsAccountRegistered(false);
    setActiveTab('chats');
  };

  const chatsRef = useRef<Chat[]>(chats);
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
    } catch {
      try {
        const compactChats = chats.map((c) => ({
          ...c,
          messages: (c.messages || []).map((m) =>
            m.mediaUrl && m.mediaUrl.startsWith('data:video/')
              ? { ...m, mediaUrl: undefined }
              : m
          ),
        }));
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(compactChats));
      } catch {
        // ignore quota errors gracefully
      }
    }
  }, [chats]);

  // Keep per-account contacts, conversations, and profile synchronized
  useEffect(() => {
    if (!isAccountRegistered || !user?.id || user.id === 'user_me') return;
    saveAccountSnapshotLocal(user.id, user, chats);
    const token = sessionTokenRef.current;
    const timer = setTimeout(() => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      fetch('/api/auth/state', {
        method: 'PUT',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify(buildCompactSyncPayload(user, chats)),
      }).catch(() => {});
    }, 650);
    return () => clearTimeout(timer);
  }, [user, chats, isAccountRegistered]);

  // Play notification sound & show toast when receiving a new message
  const prevMessageCountsRef = useRef<Record<string, number>>({});
  useEffect(() => {
    chats.forEach((c) => {
      const prevCount = prevMessageCountsRef.current[c.id] || c.messages.length;
      if (c.messages.length > prevCount) {
        const latestMsg = c.messages[c.messages.length - 1];
        if (latestMsg && latestMsg.senderId !== 'me') {
          const notifText =
            latestMsg.text ||
            (latestMsg.type === 'voice'
              ? 'Mensaje de voz'
              : latestMsg.type === 'video'
              ? 'Video adjunto'
              : latestMsg.type === 'image'
              ? 'Foto adjunta'
              : latestMsg.type === 'gif'
              ? `GIF${latestMsg.mediaName ? `: ${latestMsg.mediaName}` : ''}`
              : 'Nuevo mensaje');
          
          sendNativeSystemNotification(c.name, notifText, c.avatarUrl, c.id);
          ringtoneManager.playIncomingMessageAlert(user);

          setInAppNotification({
            id: `msg_notif_${Date.now()}`,
            title: c.name,
            body: notifText,
            avatarUrl: c.avatarUrl,
            chatId: c.id,
          });
        }
      }
      prevMessageCountsRef.current[c.id] = c.messages.length;
    });
  }, [chats]);

  const activeChat = chats.find((c) => c.id === activeChatId);

  // Offline status sync effect & queueing
  const prevStatusRef = useRef<string>(user.status);
  useEffect(() => {
    if (prevStatusRef.current === 'offline' && user.status === 'online') {
      try {
        const savedQueue = localStorage.getItem('birdmessage_offline_queue');
        if (savedQueue) {
          const queue = JSON.parse(savedQueue);
          if (Array.isArray(queue) && queue.length > 0) {
            localStorage.removeItem('birdmessage_offline_queue');
            setInAppNotification({
              id: `offline_sync_${Date.now()}`,
              title: 'Conexión Restaurada',
              body: `Se sincronizaron automáticamente ${queue.length} mensajes guardados en modo offline.`,
            });
          }
        }
      } catch (e) {
        console.error('Error syncing offline queue:', e);
      }
    }
    prevStatusRef.current = user.status;
  }, [user.status]);

  // Send message handler
  const handleSendMessage = (chatId: string, messageData: Partial<Message>) => {
    // Check bad words if parental control is active
    if (user.parentalControlEnabled && messageData.text) {
      const BAD_WORDS = ['tonto', 'estúpido', 'idiota', 'grosería', 'malapalabra', 'puta', 'mierda', 'carajo', 'imbécil', 'pendejo', 'cabrón', 'puto', 'idiot', 'shit', 'fuck', 'bitch', 'zorra', 'imbecil'];
      const textLower = messageData.text.toLowerCase();
      const hasProfanity = BAD_WORDS.some((word) => textLower.includes(word));
      if (hasProfanity) {
        setInAppNotification({
          id: `parental_warn_${Date.now()}`,
          title: 'Control Parental',
          body: `Palabra no permitida detectada en el mensaje.`,
        });
      }
    }

    const myPhoneClean = getCleanPhone(user.phone);
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      chatId,
      senderId: messageData.senderId || 'me',
      senderPhone: myPhoneClean || undefined,
      senderName: messageData.senderName || user.name,
      senderAvatar: messageData.senderAvatar || user.avatarUrl,
      type: messageData.type || 'text',
      text: messageData.text,
      mediaUrl: messageData.mediaUrl,
      thumbnailUrl: messageData.thumbnailUrl,
      mediaName: messageData.mediaName,
      mediaSize: messageData.mediaSize,
      mediaDuration: messageData.mediaDuration,
      voiceFilter: messageData.voiceFilter,
      filter: messageData.filter,
      stickerId: messageData.stickerId,
      stickerTitle: messageData.stickerTitle,
      stickerSubtitle: messageData.stickerSubtitle,
      stickerUrl: messageData.stickerUrl,
      avatarPayload: messageData.avatarPayload,
      capsuleData: messageData.capsuleData,
      gameData: messageData.gameData,
      translatedText: messageData.translatedText,
      emotionTag: messageData.emotionTag,
      timestamp:
        messageData.timestamp ||
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestampMs: Date.now(),
      isRead: true,
      reactions: {},
    };

    if (newMessage.senderId === 'me') {
      soundEffects.playSend();
    } else {
      soundEffects.playReceive();
    }

    if (user.status === 'offline') {
      try {
        const savedQueue = localStorage.getItem('birdmessage_offline_queue');
        const queue = savedQueue ? JSON.parse(savedQueue) : [];
        queue.push({ chatId, message: newMessage });
        localStorage.setItem('birdmessage_offline_queue', JSON.stringify(queue));
      } catch (e) {
        console.error('Error saving to offline queue:', e);
      }
    }

    setChats((prevChats) =>
      prevChats.map((c) => {
        if (c.id === chatId) {
          const currentMsgs = Array.isArray(c.messages) ? c.messages : [];
          const updatedMessages = [...currentMsgs, newMessage];
          let lastText = newMessage.text || '';
          if (newMessage.type === 'image') lastText = 'Foto adjunta';
          if (newMessage.type === 'voice') lastText = 'Mensaje de voz';
          if (newMessage.type === 'sticker') lastText = `Sticker: ${newMessage.stickerTitle || 'Sticker'}`;
          if (newMessage.type === 'gif') lastText = `GIF: ${newMessage.mediaName || 'Animación'}`;
          if (newMessage.type === 'video') lastText = 'Video adjunto';
          if (newMessage.type === 'avatar_msg') lastText = `Avatar IA: ${newMessage.text || 'Mensaje animado'}`;
          if (newMessage.type === 'capsule') lastText = `Mensaje del Futuro: ${newMessage.capsuleData?.occasion || 'Sorpresa'}`;
          if (newMessage.type === 'memory_reel') lastText = 'Video de Recuerdos';
          if (newMessage.type === 'game_invite') lastText = newMessage.gameData?.title || 'Invitación a jugar';

          return {
            ...c,
            messages: updatedMessages,
            lastMessageText: lastText,
            lastMessageTime: newMessage.timestamp,
            lastMessageRead: true,
            unreadCount: 0,
          };
        }
        return c;
      })
    );

    // Instant cross-tab broadcast
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bus = new BroadcastChannel('pidgex_channel_sync_bus');
        bus.postMessage({
          type: 'NEW_MESSAGE',
          chatId,
          message: newMessage,
        });
        bus.close();
      }
    } catch {}

    // Send through WebSocket room if active
    try {
      realtimeClient.sendMessage(chatId, newMessage);
    } catch {}

    // Sync to Firestore in real-time
    try {
      const myPhoneClean = getCleanPhone(user.phone);
      const msgDocRef = doc(db, 'chats', chatId, 'messages', newMessage.id);
      const safeSenderAvatar = sanitizeAvatarForFirestore(user.avatarUrl, user.name);
      setDoc(msgDocRef, {
        id: newMessage.id,
        chatId,
        senderId: messageData.senderId === 'system' ? 'system' : (user.id || 'me'),
        senderPhone: myPhoneClean,
        senderName: messageData.senderId === 'system' ? (messageData.senderName || 'PidgeX Sistema') : user.name,
        senderAvatar: safeSenderAvatar,
        type: newMessage.type,
        text: newMessage.text || null,
        mediaUrl: newMessage.mediaUrl || null,
        thumbnailUrl: newMessage.thumbnailUrl || null,
        mediaName: newMessage.mediaName || null,
        mediaSize: newMessage.mediaSize || null,
        mediaDuration: newMessage.mediaDuration || null,
        voiceFilter: newMessage.voiceFilter || null,
        filter: newMessage.filter || null,
        stickerTitle: newMessage.stickerTitle || null,
        stickerUrl: newMessage.stickerUrl || null,
        avatarPayload: newMessage.avatarPayload || null,
        capsuleData: newMessage.capsuleData || null,
        gameData: newMessage.gameData || null,
        translatedText: newMessage.translatedText || null,
        emotionTag: newMessage.emotionTag || null,
        timestamp: newMessage.timestamp,
        timestampMs: Date.now(),
        isRead: false,
      }).catch((err) => console.warn('Error saving message doc:', err));

      let lastText = newMessage.text || '';
      if (newMessage.type === 'image') lastText = 'Foto adjunta';
      if (newMessage.type === 'voice') lastText = 'Mensaje de voz';
      if (newMessage.type === 'sticker') lastText = `Sticker: ${newMessage.stickerTitle || 'Sticker'}`;
      if (newMessage.type === 'gif') lastText = `GIF: ${newMessage.mediaName || 'Animación'}`;
      if (newMessage.type === 'video') lastText = 'Video adjunto';
      if (newMessage.type === 'avatar_msg') lastText = `Avatar IA: ${newMessage.text || 'Mensaje animado'}`;
      if (newMessage.type === 'capsule') lastText = `Mensaje del Futuro: ${newMessage.capsuleData?.occasion || 'Sorpresa'}`;
      if (newMessage.type === 'memory_reel') lastText = 'Video de Recuerdos';
      if (newMessage.type === 'game_invite') lastText = newMessage.gameData?.title || 'Invitación a jugar';

      const chatDocRef = doc(db, 'chats', chatId);
      setDoc(chatDocRef, {
        lastMessageText: lastText,
        lastMessageTime: newMessage.timestamp,
        lastMessageSenderPhone: myPhoneClean,
        lastMessageSenderName: user.name,
        updatedAt: Date.now(),
      }, { merge: true }).catch((err) => console.warn('Error updating chat doc:', err));
    } catch (e) {
      console.warn('Firestore message sync error:', e);
    }

    // Push notification to recipient's phone when their app is closed
    try {
      const targetChat = chats.find((c) => c.id === chatId);
      if (targetChat?.type === 'group' && Array.isArray(targetChat.groupMembers)) {
        targetChat.groupMembers.forEach((member) => {
          const memberPhone = getCleanPhone(member.phone);
          if (memberPhone && !phonesMatch(memberPhone, user.phone)) {
            fetch('/api/messages/trigger', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chatId,
                message: newMessage,
                receiverPhone: memberPhone,
                receiverId: member.id,
              }),
            }).catch(() => {});
          }
        });
      } else {
        const recipientPhone = getCleanPhone(targetChat?.phone);
        if (recipientPhone || targetChat?.id) {
          fetch('/api/messages/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId,
              message: newMessage,
              receiverPhone: recipientPhone,
              receiverId: targetChat?.id,
            }),
          }).catch(() => {});
        }
      }
    } catch {}
  };

  // Automatic Time Capsule / Scheduled Future Messages delivery scheduler
  const handleSendMessageRef = useRef(handleSendMessage);
  handleSendMessageRef.current = handleSendMessage;
  useEffect(() => {
    const checkDueCapsules = () => {
      try {
        const raw = localStorage.getItem('pidge_time_capsules_v1');
        if (!raw) return;
        const list: StoredTimeCapsule[] = JSON.parse(raw);
        if (!Array.isArray(list) || list.length === 0) return;
        const now = Date.now();
        let changed = false;

        const updated = list.map((cap) => {
          if (!cap.delivered && now >= cap.unlockTime) {
            changed = true;
            handleSendMessageRef.current(cap.chatId, {
              senderId: 'me',
              senderName: userRef.current.name,
              senderAvatar: userRef.current.avatarUrl,
              type: 'capsule',
              text: cap.messageText,
              capsuleData: {
                id: cap.id,
                unlockTime: cap.unlockTime,
                occasion: cap.occasion,
                isSurprise: cap.isSurprise,
                unlocked: false,
                attachments: cap.attachments,
              },
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isRead: true,
            });
            setInAppNotification({
              id: `cap_due_${cap.id}`,
              title: 'Mensaje del Futuro desbloqueado',
              body: `Tu mensaje "${cap.occasion}" llegó a ${cap.chatName}`,
              chatId: cap.chatId,
            });
            return { ...cap, delivered: true, isUnlocked: true };
          }
          return cap;
        });

        if (changed) {
          localStorage.setItem('pidge_time_capsules_v1', JSON.stringify(updated));
        }
      } catch {
        // ignore storage errors
      }
    };

    const timer = setInterval(checkDueCapsules, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleSendVoiceMessageFromModal = (
    chatId: string,
    durationText: string,
    audioBlobUrl: string
  ) => {
    handleSendMessage(chatId, {
      senderId: 'me',
      senderName: user.name,
      type: 'voice',
      mediaDuration: durationText,
      mediaUrl: audioBlobUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    });
    setActiveChatId(chatId);
  };

  const handleShareArticleToChat = (chatId: string, title: string, url: string) => {
    handleSendMessage(chatId, {
      senderId: 'me',
      senderName: user.name,
      type: 'text',
      text: `Noticia compartida:\n"${title}"\n${url}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    });
  };

  // Delete a specific message in a chat permanently (React state + Firestore)
  const handleDeleteMessage = async (chatId: string, messageId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          const filteredMessages = (c.messages || []).filter((m) => m.id !== messageId);
          const lastMsg = filteredMessages[filteredMessages.length - 1];
          let lastText = 'Conversación vacía';
          if (lastMsg) {
            lastText = lastMsg.text || '';
            if (lastMsg.type === 'image') lastText = 'Foto adjunta';
            if (lastMsg.type === 'voice') lastText = 'Mensaje de voz';
            if (lastMsg.type === 'sticker') lastText = `Sticker: ${lastMsg.stickerTitle || 'Sticker'}`;
            if (lastMsg.type === 'gif') lastText = `GIF: ${lastMsg.mediaName || 'Animación'}`;
            if (lastMsg.type === 'video') lastText = 'Video adjunto';
          }
          return {
            ...c,
            messages: filteredMessages,
            lastMessageText: lastText,
          };
        }
        return c;
      })
    );

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bus = new BroadcastChannel('pidgex_channel_sync_bus');
        bus.postMessage({ type: 'DELETE_MESSAGE', chatId, messageId });
        bus.close();
      }
    } catch {}

    try {
      const msgDocRef = doc(db, 'chats', chatId, 'messages', messageId);
      await deleteDoc(msgDocRef);
    } catch (e) {
      console.warn('Error deleting message doc from Firestore:', e);
    }
  };

  // Clear all messages in a chat permanently (React state + Firestore subcollection)
  const handleClearChatMessages = async (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            messages: [],
            lastMessageText: 'Conversación vaciada',
          };
        }
        return c;
      })
    );

    try {
      const msgsColRef = collection(db, 'chats', chatId, 'messages');
      const msgsSnap = await getDocs(msgsColRef);
      for (const msgDoc of msgsSnap.docs) {
        try {
          await deleteDoc(msgDoc.ref);
        } catch {}
      }

      const chatDocRef = doc(db, 'chats', chatId);
      await setDoc(chatDocRef, {
        lastMessageText: 'Conversación vaciada',
        lastMessageTime: '',
        updatedAt: Date.now(),
      }, { merge: true });
    } catch (e) {
      console.warn('Error clearing chat messages from Firestore:', e);
    }
  };

  const recordClearedCutoff = (chatId?: string, peerPhone?: string, cutoffMs = Date.now()) => {
    const uid = userRef.current?.id || user.id;
    const current = readClearedCutoffs(uid);
    if (chatId) {
      current.byChatId[chatId] = Math.max(current.byChatId[chatId] || 0, cutoffMs);
    }
    const cleanPeer = getCleanPhone(peerPhone);
    if (cleanPeer && !(chatId && chatId.startsWith('group_'))) {
      current.byPeerPhone[cleanPeer] = Math.max(current.byPeerPhone[cleanPeer] || 0, cutoffMs);
    }
    writeClearedCutoffs(uid, current);
    return current;
  };

  const purgeFirestoreChatAndMessages = async (chatId: string, maxTimestampMs?: number) => {
    try {
      const msgsColRef = collection(db, 'chats', chatId, 'messages');
      const msgsSnap = await getDocs(msgsColRef);
      for (const msgDoc of msgsSnap.docs) {
        const mData = msgDoc.data() as any;
        if (maxTimestampMs === undefined || (mData?.timestampMs || 0) <= maxTimestampMs) {
          try {
            await deleteDoc(msgDoc.ref);
          } catch {}
        }
      }

      if (maxTimestampMs === undefined) {
        const chatDocRef = doc(db, 'chats', chatId);
        await deleteDoc(chatDocRef);
      }
    } catch (e) {
      console.warn('Error deleting chat doc from Firestore:', e);
    }
  };

  // Delete entire conversation permanently (React state + Firestore doc & messages subcollection)
  const handleDeleteChat = async (chatId: string) => {
    const targetChat = chatsRef.current.find((c) => c.id === chatId);
    if (targetChat?.type === 'group') {
      const myPhoneClean = getCleanPhone(user.phone);
      const remainingOthers = (targetChat.groupMembers || []).filter(
        (m) => m.id !== user.id && m.id !== 'me' && !phonesMatch(m.phone, myPhoneClean)
      );
      if (remainingOthers.length > 0) {
        await handleLeaveGroup(chatId);
        return;
      }
    }

    if (targetChat?.type !== 'group') {
      recordClearedCutoff(chatId, targetChat?.phone, Date.now());
    }

    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }

    try {
      const deletedIds: string[] = JSON.parse(
        localStorage.getItem('birdmessage_deleted_chat_ids') || '[]'
      );
      if (!deletedIds.includes(chatId)) {
        deletedIds.push(chatId);
        localStorage.setItem('birdmessage_deleted_chat_ids', JSON.stringify(deletedIds));
      }
    } catch {}

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bus = new BroadcastChannel('pidgex_channel_sync_bus');
        bus.postMessage({ type: 'DELETE_CHAT', chatId });
        bus.close();
      }
    } catch {}

    await purgeFirestoreChatAndMessages(chatId);
  };

  // Add reaction to message
  const handleAddReaction = (chatId: string, messageId: string, emoji: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            messages: (c.messages || []).map((m) => {
              if (m.id === messageId) {
                const current = m.reactions || {};
                return {
                  ...m,
                  reactions: {
                    ...current,
                    [emoji]: (current[emoji] || 0) + 1,
                  },
                };
              }
              return m;
            }),
          };
        }
        return c;
      })
    );
  };

  // Update user profile
  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updated };
      if (updated.wallpaperId && updated.wallpaperId !== 'custom' && !updated.customWallpaperUrl) {
        nextUser.customWallpaperUrl = '';
      }
      return nextUser;
    });

    if (updated.avatarUrl || updated.name) {
      try {
        const myCleanPhone = getCleanPhone(user.phone);
        const safeSyncedAvatar = sanitizeAvatarForFirestore(
          updated.avatarUrl || user.avatarUrl,
          updated.name || user.name
        );
        chats.forEach((c) => {
          if (c.type === 'direct' && (c.id.startsWith('direct_') || c.id.startsWith('market_'))) {
            const chatDocRef = doc(db, 'chats', c.id);
            setDoc(chatDocRef, {
              usersMap: {
                [myCleanPhone]: {
                  id: user.id || 'me',
                  name: updated.name || user.name,
                  avatarUrl: safeSyncedAvatar,
                  phone: user.phone,
                },
              },
            }, { merge: true }).catch(() => {});
          }
        });
      } catch {}
    }
  };

  // Dedicated Wallpaper selector
  const handleSelectWallpaper = (wallpaperId: string, customUrl?: string) => {
    setUser((prev) => ({
      ...prev,
      wallpaperId,
      customWallpaperUrl: wallpaperId === 'custom' ? (customUrl || prev.customWallpaperUrl || '') : '',
    }));
  };

  // Toggle Do Not Disturb (Modo No Molestar)
  const handleToggleDoNotDisturb = (duration?: string) => {
    setUser((prev) => {
      const nextDnd = !prev.doNotDisturb;
      return {
        ...prev,
        doNotDisturb: nextDnd,
        dndDuration: duration || prev.dndDuration || 'always',
        status: nextDnd ? 'busy' : 'online',
      };
    });
  };

  // Toggle Night Mode (Modo Nocturno)
  const handleToggleNightMode = () => {
    setUser((prev) => ({
      ...prev,
      nightMode: !prev.nightMode,
    }));
  };

  // Create new chat
  const handleCreateChat = (
    contactName: string,
    avatarUrl: string,
    initialMessage?: string,
    phone?: string
  ) => {
    const finalPhone = phone ? ensurePhoneStartsWith16(phone) : undefined;
    const newChatId = finalPhone && user.phone
      ? getDirectChatId(user.phone, finalPhone)
      : `chat_${Date.now()}`;
    const firstMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const initialMsgObj: Message | null = initialMessage
      ? {
          id: `msg_init_${Date.now()}`,
          chatId: newChatId,
          senderId: 'me',
          senderName: user.name,
          type: 'text',
          text: initialMessage,
          timestamp: firstMsgTime,
          timestampMs: Date.now(),
          isRead: true,
        }
      : null;

    const newChat: Chat = {
      id: newChatId,
      name: contactName,
      phone: finalPhone,
      isFriend: true,
      avatarUrl,
      isVerified: true,
      isOnline: true,
      statusText: finalPhone ? `Amigo • ${finalPhone}` : 'Amigo en PidgeX',
      type: 'direct',
      categories: ['all', 'friends'],
      unreadCount: 0,
      lastMessageText: initialMessage || 'Conversación iniciada',
      lastMessageTime: firstMsgTime,
      lastMessageRead: true,
      messages: initialMsgObj ? [initialMsgObj] : [],
    };

    setChats((prev) => {
      const idx = prev.findIndex((c) => c.id === newChatId);
      if (idx >= 0) {
        const copy = [...prev];
        const existingMsgs = copy[idx].messages || [];
        copy[idx] = {
          ...copy[idx],
          ...newChat,
          messages: initialMsgObj ? [...existingMsgs, initialMsgObj] : existingMsgs,
        };
        return copy;
      }
      return [newChat, ...prev];
    });
    setActiveChatId(newChatId);

    // Broadcast new chat to other tabs
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bus = new BroadcastChannel('pidgex_channel_sync_bus');
        bus.postMessage({ type: 'NEW_CHAT', chat: newChat });
        bus.close();
      }
    } catch {}

    // Sync to Firestore
    try {
      const userPhoneClean = getCleanPhone(user.phone);
      const friendPhoneClean = getCleanPhone(finalPhone);

      const chatDocRef = doc(db, 'chats', newChatId);
      setDoc(chatDocRef, {
        id: newChatId,
        name: contactName,
        type: 'direct',
        participantPhones: [userPhoneClean, friendPhoneClean].filter(Boolean),
        participants: [user.id || 'me'],
        usersMap: {
          [userPhoneClean]: {
            id: user.id || 'me',
            name: user.name,
            avatarUrl: user.avatarUrl,
            phone: user.phone,
          },
          [friendPhoneClean]: {
            name: contactName,
            avatarUrl,
            phone: finalPhone,
          },
        },
        lastMessageText: newChat.lastMessageText,
        lastMessageTime: newChat.lastMessageTime,
        updatedAt: Date.now(),
      }, { merge: true }).catch((err) => console.warn('Error syncing chat doc:', err));

      if (initialMsgObj) {
        const msgDocRef = doc(db, 'chats', newChatId, 'messages', initialMsgObj.id);
        setDoc(msgDocRef, {
          id: initialMsgObj.id,
          chatId: newChatId,
          senderId: user.id || 'me',
          senderPhone: userPhoneClean,
          senderName: user.name,
          senderAvatar: user.avatarUrl,
          type: 'text',
          text: initialMessage,
          timestamp: firstMsgTime,
          timestampMs: Date.now(),
          isRead: false,
        }).catch((err) => console.warn('Error saving initial message doc:', err));
      }
    } catch (e) {
      console.warn('Firestore create chat sync error:', e);
    }
  };

  // Helper: normalize group members & build Firestore-safe participant index (no undefined values, compact avatars)
  const buildGroupSyncPayload = (members: GroupMember[]) => {
    const myPhoneNormalized = user.phone ? ensurePhoneStartsWith16(user.phone) : '';
    const myPhoneClean = getCleanPhone(myPhoneNormalized);
    const participantPhonesSet = new Set<string>();
    const participantsSet = new Set<string>();
    const usersMap: Record<string, { id: string; name: string; avatarUrl: string; phone: string }> = {};

    const cleanMembers: GroupMember[] = members.map((m) => {
      const isSelf =
        m.id === user.id || m.id === 'me' || phonesMatch(m.phone, myPhoneClean);

      let resolvedPhone = isSelf
        ? myPhoneNormalized
        : m.phone
        ? ensurePhoneStartsWith16(m.phone)
        : '';

      if (!resolvedPhone && m.id) {
        const directPeer = extractPeerPhoneFromDirectId(m.id, myPhoneClean);
        if (directPeer) {
          resolvedPhone = ensurePhoneStartsWith16(directPeer);
        } else {
          const matchedChat = chatsRef.current.find(
            (c) => c.type === 'direct' && (c.id === m.id || (m.name && c.name === m.name))
          );
          if (matchedChat?.phone) {
            resolvedPhone = ensurePhoneStartsWith16(matchedChat.phone);
          }
        }
      }

      const cleanPhone = getCleanPhone(resolvedPhone);
      const memberName = isSelf ? user.name : m.name || 'Integrante PidgeX';
      const safeAvatar = sanitizeAvatarForFirestore(
        isSelf ? user.avatarUrl : m.avatarUrl,
        memberName,
        '#0284c7'
      );
      const memberId = isSelf ? (user.id || 'me') : m.id;

      if (cleanPhone) {
        participantPhonesSet.add(cleanPhone);
        usersMap[cleanPhone] = {
          id: memberId,
          name: memberName,
          avatarUrl: safeAvatar,
          phone: resolvedPhone,
        };
      }

      if (
        memberId &&
        memberId !== 'me' &&
        !memberId.startsWith('direct_') &&
        !memberId.startsWith('member_')
      ) {
        participantsSet.add(memberId);
      }

      const cleanMember: GroupMember = {
        id: memberId,
        name: memberName,
        avatarUrl: safeAvatar,
        isLeader: Boolean(m.isLeader),
        joinedAt: m.joinedAt || 'Hoy',
      };
      if (resolvedPhone) {
        cleanMember.phone = resolvedPhone;
      }
      if (m.addedBy) {
        cleanMember.addedBy = m.addedBy;
      }
      return cleanMember;
    });

    return {
      cleanMembers,
      participantPhones: Array.from(participantPhonesSet),
      participants: Array.from(participantsSet),
      usersMap,
    };
  };

  // Create Group Chat (synced in real-time to all members via Firestore & BroadcastChannel)
  const handleCreateGroup = async (
    groupName: string,
    members: GroupMember[],
    description?: string,
    groupAvatarUrl?: string
  ) => {
    const newChatId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const firstMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const myPhoneClean = getCleanPhone(ensurePhoneStartsWith16(user.phone || '')) || getCleanPhone(user.phone);
    const localAvatar = groupAvatarUrl || createSvgAvatar(groupName, '#2563eb');

    // Ensure creator is always included in members list
    const hasCreator = members.some(
      (m) => m.id === user.id || m.id === 'me' || phonesMatch(m.phone, myPhoneClean)
    );
    const fullMembers: GroupMember[] = hasCreator
      ? members
      : [
          {
            id: user.id || 'me',
            name: user.name || 'Tú',
            phone: user.phone ? ensurePhoneStartsWith16(user.phone) : undefined,
            avatarUrl: user.avatarUrl,
            isLeader: true,
            joinedAt: 'Ahora',
          },
          ...members,
        ];

    const { cleanMembers, participantPhones, participants, usersMap } =
      buildGroupSyncPayload(fullMembers);

    const groupDesc = description || `Grupo con ${cleanMembers.length} integrantes`;
    const lastMessageText = `Grupo "${groupName}" creado por ${user.name}`;
    const initMsg: Message = {
      id: `msg_group_init_${Date.now()}`,
      chatId: newChatId,
      senderId: 'system',
      senderName: 'PidgeX Sistema',
      type: 'text',
      text: `¡Grupo "${groupName}" creado con éxito por ${user.name}! Agrega integrantes por contacto o por número de teléfono.`,
      timestamp: firstMsgTime,
      timestampMs: Date.now(),
      isRead: true,
    };

    const newGroupChat: Chat = {
      id: newChatId,
      name: groupName,
      avatarUrl: localAvatar,
      type: 'group',
      isFriend: true,
      isOnline: true,
      categories: ['all', 'groups'],
      unreadCount: 0,
      isVerified: true,
      lastMessageText,
      lastMessageTime: firstMsgTime,
      lastMessageRead: true,
      description: groupDesc,
      groupMembers: cleanMembers,
      messages: [initMsg],
    };

    // Update UI immediately for the creator
    setChats((prev) => [newGroupChat, ...prev]);
    setActiveChatId(newChatId);

    // Join WebSocket room right away
    try {
      realtimeClient.joinRoom(newChatId);
    } catch {}

    // Upload large custom group photo so Firestore document never exceeds 1MB limit
    const syncedAvatarUrl = await uploadAvatarIfLargeDataUrl(localAvatar, groupName, '#2563eb');
    if (syncedAvatarUrl !== localAvatar) {
      setChats((prev) =>
        prev.map((c) => (c.id === newChatId ? { ...c, avatarUrl: syncedAvatarUrl } : c))
      );
    }

    // Broadcast across local tabs for instant sync
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bus = new BroadcastChannel('pidgex_channel_sync_bus');
        bus.postMessage({
          type: 'NEW_CHAT',
          chat: { ...newGroupChat, avatarUrl: syncedAvatarUrl },
          participantPhones,
          participants,
        });
        bus.close();
      }
    } catch {}

    // Persist group document & welcome system message to Firebase Firestore so every friend receives it in real time
    try {
      await setDoc(
        doc(db, 'chats', newChatId),
        {
          id: newChatId,
          name: groupName,
          type: 'group',
          avatarUrl: syncedAvatarUrl,
          description: groupDesc,
          groupMembers: cleanMembers,
          participantPhones,
          participants,
          usersMap,
          createdBy: user.id || 'me',
          createdByPhone: myPhoneClean,
          lastMessageText,
          lastMessageTime: firstMsgTime,
          lastMessageSenderPhone: myPhoneClean,
          lastMessageSenderName: user.name,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      await setDoc(doc(db, 'chats', newChatId, 'messages', initMsg.id), {
        id: initMsg.id,
        chatId: newChatId,
        senderId: 'system',
        senderName: 'PidgeX Sistema',
        type: 'text',
        text: initMsg.text,
        timestamp: firstMsgTime,
        timestampMs: Date.now(),
        isRead: true,
      });
    } catch (err) {
      console.error('Error syncing new group to Firestore:', err);
    }
  };

  // Update Group Members & Roles (Leaders / Members) and sync to Firestore
  const handleUpdateGroupMembers = (chatId: string, updatedMembers: GroupMember[]) => {
    const targetChat = chatsRef.current.find((c) => c.id === chatId);
    const previousMembers = targetChat?.groupMembers || [];
    const { cleanMembers, participantPhones, participants, usersMap } =
      buildGroupSyncPayload(updatedMembers);
    const updatedDescription = `Grupo con ${cleanMembers.length} integrantes`;

    const addedMembers = cleanMembers.filter(
      (cm) =>
        !previousMembers.some(
          (pm) =>
            (pm.id && cm.id && pm.id === cm.id) ||
            (pm.phone && cm.phone && phonesMatch(pm.phone, cm.phone))
        )
    );

    const removedMembers = previousMembers.filter(
      (pm) =>
        !cleanMembers.some(
          (cm) =>
            (pm.id && cm.id && pm.id === cm.id) ||
            (pm.phone && cm.phone && phonesMatch(pm.phone, cm.phone))
        )
    );

    const eventTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowMs = Date.now();
    const myPhoneClean = getCleanPhone(user.phone);

    const joinMessages: Message[] = addedMembers.map((am, idx) => ({
      id: `msg_sys_join_${nowMs}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      chatId,
      senderId: 'system',
      senderName: 'Sistema',
      senderPhone: myPhoneClean || undefined,
      type: 'text',
      text: `"${am.name || 'Alguien'}" se unió al grupo.`,
      timestamp: eventTime,
      timestampMs: nowMs + idx,
      isRead: true,
    }));

    const removalMessages: Message[] = removedMembers.map((rm, idx) => ({
      id: `msg_sys_leave_${nowMs}_${addedMembers.length + idx}_${Math.random().toString(36).substring(2, 6)}`,
      chatId,
      senderId: 'system',
      senderName: 'Sistema',
      senderPhone: myPhoneClean || undefined,
      type: 'text',
      text: `"${rm.name || 'Un integrante'}" abandonó el grupo.`,
      timestamp: eventTime,
      timestampMs: nowMs + addedMembers.length + idx,
      isRead: true,
    }));

    const systemEventMessages = [...joinMessages, ...removalMessages];
    const lastEventText =
      systemEventMessages.length > 0
        ? systemEventMessages[systemEventMessages.length - 1].text
        : undefined;

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            groupMembers: cleanMembers,
            description: updatedDescription,
            messages:
              systemEventMessages.length > 0
                ? [...(c.messages || []), ...systemEventMessages]
                : c.messages,
            lastMessageText: lastEventText || c.lastMessageText,
            lastMessageTime: lastEventText ? eventTime : c.lastMessageTime,
          };
        }
        return c;
      })
    );

    try {
      systemEventMessages.forEach((sysMsg) => {
        try {
          realtimeClient.sendMessage(chatId, sysMsg);
        } catch {}
      });

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bus = new BroadcastChannel('pidgex_channel_sync_bus');
        bus.postMessage({
          type: 'UPDATE_GROUP',
          chatId,
          groupMembers: cleanMembers,
          participantPhones,
          participants,
          description: updatedDescription,
          lastMessageText: lastEventText,
          lastMessageTime: lastEventText ? eventTime : undefined,
        });
        systemEventMessages.forEach((sysMsg) => {
          bus.postMessage({ type: 'NEW_MESSAGE', chatId, message: sysMsg });
        });
        bus.close();
      }
    } catch {}

    try {
      const chatUpdatePayload: Record<string, any> = {
        groupMembers: cleanMembers,
        participantPhones,
        participants,
        usersMap,
        description: updatedDescription,
        updatedAt: Date.now(),
      };
      if (lastEventText) {
        chatUpdatePayload.lastMessageText = lastEventText;
        chatUpdatePayload.lastMessageTime = eventTime;
        chatUpdatePayload.lastMessageSenderPhone = myPhoneClean;
        chatUpdatePayload.lastMessageSenderName = user.name || 'Sistema';
      }

      setDoc(doc(db, 'chats', chatId), chatUpdatePayload, { merge: true }).catch((err) =>
        console.warn('Error syncing group members to Firestore:', err)
      );

      systemEventMessages.forEach((sysMsg) => {
        setDoc(doc(db, 'chats', chatId, 'messages', sysMsg.id), {
          id: sysMsg.id,
          chatId,
          senderId: 'system',
          senderPhone: myPhoneClean || '',
          senderName: 'Sistema',
          type: 'text',
          text: sysMsg.text,
          timestamp: eventTime,
          timestampMs: sysMsg.timestampMs || Date.now(),
          isRead: true,
        }).catch(() => {});
      });
    } catch {}
  };

  // Update Group Photo / Avatar and sync to Firestore
  const handleUpdateGroupAvatar = async (chatId: string, newAvatarUrl: string) => {
    const targetChat = chatsRef.current.find((c) => c.id === chatId);
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, avatarUrl: newAvatarUrl } : c))
    );
    try {
      const syncedAvatar = await uploadAvatarIfLargeDataUrl(
        newAvatarUrl,
        targetChat?.name || 'Grupo',
        '#2563eb'
      );
      await setDoc(
        doc(db, 'chats', chatId),
        { avatarUrl: syncedAvatar, updatedAt: Date.now() },
        { merge: true }
      );
    } catch (err) {
      console.warn('Error syncing group avatar to Firestore:', err);
    }
  };

  // Leave Group and sync departure ("Nombre" abandonó el grupo.) to Firestore, BroadcastChannel, and WebSockets
  const handleLeaveGroup = async (chatId: string) => {
    const targetChat = chatsRef.current.find((c) => c.id === chatId);
    const myPhoneClean =
      getCleanPhone(ensurePhoneStartsWith16(user.phone || '')) || getCleanPhone(user.phone);
    const leaverName = (user.name || 'Alguien').trim();
    const remainingRaw = (targetChat?.groupMembers || []).filter(
      (m) => m.id !== user.id && m.id !== 'me' && !phonesMatch(m.phone, myPhoneClean)
    );
    const { cleanMembers, participantPhones, participants, usersMap } =
      buildGroupSyncPayload(remainingRaw);
    const updatedDescription = `Grupo con ${cleanMembers.length} integrantes`;

    const leaveTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowMs = Date.now();
    const leaveText = `"${leaverName}" abandonó el grupo.`;
    const sysMsg: Message = {
      id: `msg_sys_leave_${nowMs}_${Math.random().toString(36).substring(2, 6)}`,
      chatId,
      senderId: 'system',
      senderName: 'Sistema',
      senderPhone: myPhoneClean || undefined,
      type: 'text',
      text: leaveText,
      timestamp: leaveTime,
      timestampMs: nowMs,
      isRead: true,
    };

    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }

    try {
      realtimeClient.sendMessage(chatId, sysMsg);
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bus = new BroadcastChannel('pidgex_channel_sync_bus');
        bus.postMessage({
          type: 'UPDATE_GROUP',
          chatId,
          groupMembers: cleanMembers,
          participantPhones,
          participants,
          description: updatedDescription,
          lastMessageText: leaveText,
          lastMessageTime: leaveTime,
        });
        bus.postMessage({
          type: 'NEW_MESSAGE',
          chatId,
          message: sysMsg,
        });
        bus.close();
      }
    } catch {}

    try {
      await setDoc(doc(db, 'chats', chatId, 'messages', sysMsg.id), {
        id: sysMsg.id,
        chatId,
        senderId: 'system',
        senderPhone: myPhoneClean || '',
        senderName: 'Sistema',
        type: 'text',
        text: leaveText,
        timestamp: leaveTime,
        timestampMs: nowMs,
        isRead: true,
      });

      await setDoc(
        doc(db, 'chats', chatId),
        {
          groupMembers: cleanMembers,
          participantPhones,
          participants,
          usersMap,
          description: updatedDescription,
          lastMessageText: leaveText,
          lastMessageTime: leaveTime,
          lastMessageSenderPhone: myPhoneClean,
          lastMessageSenderName: leaverName,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Error syncing leave group to Firestore:', err);
    }
  };

  // Add new friend handler (only friends can be chatted with)
  const handleAddFriend = (data: AddFriendData) => {
    if (user.parentalControlEnabled) {
      const newRequest = {
        id: `req_${Date.now()}`,
        name: data.name,
        username: data.username,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        initialMessage: data.initialMessage,
        category: data.category,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setUser((prev) => ({
        ...prev,
        pendingFriendRequests: [...(prev.pendingFriendRequests || []), newRequest],
      }));
      setInAppNotification({
        id: `parental_req_${Date.now()}`,
        title: 'Control Parental',
        body: `Para agregar a ${data.name}, tus padres deben aprobarlo. Solicitud enviada.`,
      });
      return;
    }
    handleAddFriendDirect(data);
  };

  const handleAddFriendDirect = async (data: AddFriendData) => {
    const finalPhone = data.phone ? ensurePhoneStartsWith16(data.phone) : undefined;
    const friendPhoneClean = getCleanPhone(finalPhone);
    const newChatId = finalPhone && user.phone
      ? getDirectChatId(user.phone, finalPhone)
      : `chat_friend_${Date.now()}`;
    const nowMs = Date.now();
    const firstMsgTime = new Date(nowMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const initMsgId = `msg_init_${nowMs}`;

    // Check if this contact was previously removed, blocked, deleted, or unfriended
    const cutoffs = readClearedCutoffs(userRef.current?.id || user.id);
    const existingCutoff = Math.max(
      cutoffs.byChatId[newChatId] || 0,
      friendPhoneClean ? (cutoffs.byPeerPhone[friendPhoneClean] || 0) : 0
    );
    let wasDeleted = false;
    try {
      const deletedIds: string[] = JSON.parse(
        localStorage.getItem('birdmessage_deleted_chat_ids') || '[]'
      );
      wasDeleted = deletedIds.includes(newChatId);
      if (wasDeleted) {
        localStorage.setItem(
          'birdmessage_deleted_chat_ids',
          JSON.stringify(deletedIds.filter((id) => id !== newChatId))
        );
      }
    } catch {}

    const existingChatObj = chatsRef.current.find((c) => c.id === newChatId);
    const shouldResetHistory =
      existingCutoff > 0 || wasDeleted || existingChatObj?.isFriend === false;
    const freshCutoffMs = shouldResetHistory ? nowMs - 1 : 0;

    if (shouldResetHistory) {
      recordClearedCutoff(newChatId, finalPhone, freshCutoffMs);
    }

    const friendCategories: ChatCategory[] = ['all', 'friends'];
    if (data.category && data.category !== 'all' && data.category !== 'friends') {
      friendCategories.push(data.category);
    }

    const initialMsgs: Message[] = data.initialMessage
      ? [
          {
            id: initMsgId,
            chatId: newChatId,
            senderId: 'me',
            senderName: user.name,
            type: 'text',
            text: data.initialMessage,
            timestamp: firstMsgTime,
            timestampMs: nowMs,
            isRead: true,
          },
        ]
      : [];

    const newChat: Chat = {
      id: newChatId,
      name: data.name,
      phone: finalPhone,
      username: data.username || undefined,
      isFriend: true,
      avatarUrl: data.avatarUrl,
      isVerified: true,
      isOnline: true,
      statusText: finalPhone ? `Amigo • ${finalPhone}` : 'Amigo en PidgeX',
      type: 'direct',
      categories: friendCategories,
      unreadCount: 0,
      lastMessageText: data.initialMessage || '¡Amigo agregado con éxito!',
      lastMessageTime: firstMsgTime,
      lastMessageRead: true,
      messages: initialMsgs,
    };

    setChats((prev) => {
      const idx = prev.findIndex((c) => c.id === newChatId);
      if (idx >= 0) {
        const copy = [...prev];
        const existingMsgs = shouldResetHistory ? [] : (copy[idx].messages || []);
        copy[idx] = { ...copy[idx], ...newChat, messages: [...existingMsgs, ...initialMsgs] };
        return copy;
      }
      return [newChat, ...prev];
    });
    setActiveChatId(newChatId);

    // Broadcast new friend chat
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bus = new BroadcastChannel('pidgex_channel_sync_bus');
        bus.postMessage({ type: 'NEW_CHAT', chat: newChat });
        bus.close();
      }
    } catch {}

    // Purge any stale Firestore messages prior to re-adding so old messages never reappear
    if (shouldResetHistory) {
      await purgeFirestoreChatAndMessages(newChatId, freshCutoffMs);
    }

    // Sync to Firestore with participantPhones and usersMap so contact discovers the fresh chat
    try {
      const userPhoneClean = getCleanPhone(user.phone);
      const safeUserAvatar = sanitizeAvatarForFirestore(user.avatarUrl, user.name);
      const safeFriendAvatar = sanitizeAvatarForFirestore(data.avatarUrl, data.name);

      const usersMap: Record<string, any> = {};
      if (userPhoneClean) {
        usersMap[userPhoneClean] = {
          id: user.id || 'me',
          name: user.name,
          avatarUrl: safeUserAvatar,
          phone: user.phone || '',
        };
      }
      if (friendPhoneClean) {
        usersMap[friendPhoneClean] = {
          name: data.name,
          avatarUrl: safeFriendAvatar,
          phone: finalPhone || '',
        };
      }

      const chatDocRef = doc(db, 'chats', newChatId);
      await setDoc(chatDocRef, {
        id: newChatId,
        name: data.name,
        type: 'direct',
        participantPhones: [userPhoneClean, friendPhoneClean].filter(Boolean),
        participants: [user.id || 'me'].filter(Boolean),
        usersMap,
        lastMessageText: newChat.lastMessageText,
        lastMessageTime: newChat.lastMessageTime,
        lastMessageSenderPhone: userPhoneClean,
        lastMessageSenderName: user.name,
        updatedAt: nowMs,
      }, { merge: true });

      if (data.initialMessage) {
        const msgDocRef = doc(db, 'chats', newChatId, 'messages', initMsgId);
        await setDoc(msgDocRef, {
          id: initMsgId,
          chatId: newChatId,
          senderId: user.id || 'me',
          senderPhone: userPhoneClean,
          senderName: user.name,
          senderAvatar: safeUserAvatar,
          type: 'text',
          text: data.initialMessage,
          timestamp: firstMsgTime,
          timestampMs: nowMs,
          isRead: false,
        });
      }
    } catch (e) {
      console.warn('Firestore direct chat sync error:', e);
    }
  };

  const handleApproveFriendRequest = (requestId: string) => {
    const req = user.pendingFriendRequests?.find((r) => r.id === requestId);
    if (!req) return;
    handleAddFriendDirect({
      name: req.name,
      username: req.username,
      phone: req.phone,
      avatarUrl: req.avatarUrl,
      initialMessage: req.initialMessage,
      category: req.category,
    });
    setUser((prev) => ({
      ...prev,
      pendingFriendRequests: (prev.pendingFriendRequests || []).filter((r) => r.id !== requestId),
    }));
  };

  const handleRejectFriendRequest = (requestId: string) => {
    setUser((prev) => ({
      ...prev,
      pendingFriendRequests: (prev.pendingFriendRequests || []).filter((r) => r.id !== requestId),
    }));
  };

  // Remove friend handler: removes contact, purges all prior messages, and prevents old messages from coming back if re-added
  const handleRemoveFriend = async (chatId: string) => {
    const targetChat = chatsRef.current.find((c) => c.id === chatId);
    const cutoffMs = Date.now();
    recordClearedCutoff(chatId, targetChat?.phone, cutoffMs);

    try {
      const deletedIds: string[] = JSON.parse(
        localStorage.getItem('birdmessage_deleted_chat_ids') || '[]'
      );
      if (!deletedIds.includes(chatId)) {
        deletedIds.push(chatId);
        localStorage.setItem('birdmessage_deleted_chat_ids', JSON.stringify(deletedIds));
      }
    } catch {}

    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }

    await purgeFirestoreChatAndMessages(chatId);
  };

  // Block contact handler: removes contact and wipes prior messages permanently
  const handleBlockContact = async (chatId: string) => {
    await handleRemoveFriend(chatId);
  };

  // Unblock & re-add as friend handler
  const handleUnblockContact = (chatId: string) => {
    const targetChat = chatsRef.current.find((c) => c.id === chatId);
    const cutoffs = readClearedCutoffs(userRef.current?.id || user.id);
    const peerClean = getCleanPhone(targetChat?.phone);
    const cutoffMs = Math.max(
      cutoffs.byChatId[chatId] || 0,
      peerClean ? (cutoffs.byPeerPhone[peerClean] || 0) : 0
    );

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            isFriend: true,
            isBlocked: false,
            messages: cutoffMs
              ? (c.messages || []).filter((m) => ((m as any).timestampMs || 0) > cutoffMs)
              : c.messages,
            statusText: c.phone ? `Amigo • ${c.phone}` : 'Amigo en PidgeX',
            categories: c.categories.includes('friends') ? c.categories : [...c.categories, 'friends'],
          };
        }
        return c;
      })
    );
  };

  // Start chat with seller on product purchase/inquiry (always creates a dedicated chat so seller receives it as a new chat)
  const handleStartChatWithSeller = async (product: MarketplaceProduct, inquiryMessage: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowMs = Date.now();
    const userPhoneClean =
      getCleanPhone(ensurePhoneStartsWith16(user.phone || '')) || getCleanPhone(user.phone);

    let resolvedSellerName = product.sellerName || 'Vendedor PidgeX';
    let resolvedSellerPhone = product.sellerPhone ? ensurePhoneStartsWith16(product.sellerPhone) : '';
    let resolvedSellerPhoneClean = getCleanPhone(resolvedSellerPhone);
    let resolvedSellerAvatar = product.sellerAvatarUrl || createSvgAvatar(resolvedSellerName);

    const buyerKey = userPhoneClean || user.id || 'buyer';
    const sellerKey = resolvedSellerPhoneClean || product.sellerId || 'seller';
    const chatId = `market_${product.id}_${buyerKey}_${sellerKey}`;

    // Clear deleted flag if user previously removed this product chat and starts it again
    try {
      const deletedIds: string[] = JSON.parse(
        localStorage.getItem('birdmessage_deleted_chat_ids') || '[]'
      );
      if (deletedIds.includes(chatId)) {
        localStorage.setItem(
          'birdmessage_deleted_chat_ids',
          JSON.stringify(deletedIds.filter((id) => id !== chatId))
        );
      }
    } catch {}

    const inquiryMsgId = `msg_prod_${nowMs}_${Math.random().toString(36).substring(2, 6)}`;
    const inquiryText = `🛍️ *Compra / Consulta en PidgeX Market*\n📦 *Producto:* ${product.title}\n💵 *Precio:* $${product.price}\n\n"${inquiryMessage}"`;
    const previewText = `🛍️ ${product.title}: ${inquiryMessage}`;

    const inquiryMsgObj: Message = {
      id: inquiryMsgId,
      chatId,
      senderId: 'me',
      senderName: user.name || 'Tú',
      senderAvatar: user.avatarUrl,
      senderPhone: userPhoneClean || undefined,
      type: 'text',
      text: inquiryText,
      mediaUrl: product.imageUrl || undefined,
      timestamp,
      timestampMs: nowMs,
      isRead: true,
      reactions: {},
    };

    const existingMarketChat = chatsRef.current.find((c) => c.id === chatId);

    if (existingMarketChat) {
      setChats((prev) => {
        const updated: Chat = {
          ...existingMarketChat,
          messages: [...(existingMarketChat.messages || []), inquiryMsgObj],
          lastMessageText: previewText,
          lastMessageTime: timestamp,
          lastMessageRead: true,
          unreadCount: 0,
        };
        return [updated, ...prev.filter((c) => c.id !== chatId)];
      });
    } else {
      const newChat: Chat = {
        id: chatId,
        name: resolvedSellerName,
        phone: resolvedSellerPhone || undefined,
        isFriend: true,
        avatarUrl: resolvedSellerAvatar,
        isVerified: true,
        isOnline: true,
        statusText: `PidgeX Market • ${product.title}`,
        type: 'direct',
        categories: ['all', 'friends'],
        unreadCount: 0,
        lastMessageText: previewText,
        lastMessageTime: timestamp,
        lastMessageRead: true,
        messages: [inquiryMsgObj],
      };

      setChats((prev) => [newChat, ...prev.filter((c) => c.id !== chatId)]);
    }

    // Switch view to chats tab and open conversation immediately
    setActiveChatId(chatId);
    setActiveTab('chats');
    soundEffects.playSend();

    // Resolve authoritative seller info & prepare compact Firestore-safe media URLs
    try {
      if (product.sellerId && product.sellerId !== 'current_user' && db) {
        try {
          const sellerSnap = await getDoc(doc(db, 'users', product.sellerId));
          if (sellerSnap.exists()) {
            const sData = sellerSnap.data() as any;
            if (sData.name) resolvedSellerName = sData.name;
            if (sData.phone) {
              resolvedSellerPhone = ensurePhoneStartsWith16(sData.phone);
              resolvedSellerPhoneClean = getCleanPhone(resolvedSellerPhone);
            }
            if (sData.avatarUrl) resolvedSellerAvatar = sData.avatarUrl;
          }
        } catch {}
      }

      const safeUserAvatar = await uploadAvatarIfLargeDataUrl(
        user.avatarUrl,
        user.name || 'Comprador'
      );
      const safeSellerAvatar = await uploadAvatarIfLargeDataUrl(
        resolvedSellerAvatar,
        resolvedSellerName
      );

      let safeProductMediaUrl: string | null = product.imageUrl || null;
      if (safeProductMediaUrl && safeProductMediaUrl.startsWith('data:image/')) {
        try {
          const upRes = await fetch('/api/media/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataUrl: safeProductMediaUrl,
              filename: `market_chat_${product.id}_${nowMs}.jpg`,
            }),
          });
          if (upRes.ok) {
            const upData = await upRes.json();
            if (upData?.mediaUrl) safeProductMediaUrl = upData.mediaUrl;
          }
        } catch {}
        if (safeProductMediaUrl && safeProductMediaUrl.startsWith('data:image/') && safeProductMediaUrl.length > 250000) {
          safeProductMediaUrl = null;
        }
      }

      const participantPhones = Array.from(
        new Set([userPhoneClean, resolvedSellerPhoneClean].filter(Boolean))
      );
      const participants = Array.from(
        new Set(
          [user.id, product.sellerId].filter(
            (id): id is string => Boolean(id && id !== 'current_user')
          )
        )
      );

      const usersMap: Record<string, any> = {};
      if (userPhoneClean) {
        usersMap[userPhoneClean] = {
          id: user.id || 'me',
          name: user.name || 'Comprador',
          avatarUrl: safeUserAvatar,
          phone: user.phone || '',
        };
      }
      if (resolvedSellerPhoneClean) {
        usersMap[resolvedSellerPhoneClean] = {
          id: product.sellerId || '',
          name: resolvedSellerName,
          avatarUrl: safeSellerAvatar,
          phone: resolvedSellerPhone || '',
        };
      }

      const usersById: Record<string, any> = {};
      if (user.id) {
        usersById[user.id] = {
          id: user.id,
          name: user.name || 'Comprador',
          avatarUrl: safeUserAvatar,
          phone: user.phone || '',
        };
      }
      if (product.sellerId && product.sellerId !== 'current_user') {
        usersById[product.sellerId] = {
          id: product.sellerId,
          name: resolvedSellerName,
          avatarUrl: safeSellerAvatar,
          phone: resolvedSellerPhone || '',
        };
      }

      const outboundMsgForPeer: Message = {
        ...inquiryMsgObj,
        senderId: user.id || 'me',
        senderName: user.name || 'Comprador PidgeX',
        senderAvatar: safeUserAvatar,
        senderPhone: userPhoneClean || undefined,
        mediaUrl: safeProductMediaUrl || undefined,
        isRead: false,
      };

      // Broadcast in real-time via WebSockets and cross-tab BroadcastChannel
      try {
        realtimeClient.joinRoom(chatId);
        realtimeClient.sendMessage(chatId, outboundMsgForPeer);
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bus = new BroadcastChannel('pidgex_channel_sync_bus');
          bus.postMessage({
            type: 'NEW_CHAT',
            participantPhones,
            participants,
            chat: {
              id: chatId,
              name: user.name || 'Comprador PidgeX',
              phone: user.phone ? ensurePhoneStartsWith16(user.phone) : undefined,
              isFriend: true,
              avatarUrl: safeUserAvatar,
              isVerified: true,
              isOnline: true,
              statusText: `PidgeX Market • ${product.title}`,
              type: 'direct',
              categories: ['all', 'friends'],
              unreadCount: 1,
              lastMessageText: previewText,
              lastMessageTime: timestamp,
              lastMessageRead: false,
              messages: [{ ...outboundMsgForPeer, senderId: 'contact' }],
            },
          });
          bus.postMessage({ type: 'NEW_MESSAGE', chatId, message: outboundMsgForPeer });
          bus.close();
        }
      } catch (err) {
        console.warn('Realtime broadcast error on seller inquiry:', err);
      }

      // Write chat document and initial message to Firestore (zero undefined values)
      const chatDocRef = doc(db, 'chats', chatId);
      await setDoc(
        chatDocRef,
        {
          id: chatId,
          name: resolvedSellerName,
          type: 'direct',
          isMarketplaceChat: true,
          marketplaceProductId: product.id,
          marketplaceProductTitle: product.title,
          statusText: `PidgeX Market • ${product.title}`,
          participantPhones,
          participants,
          usersMap,
          usersById,
          buyerInfo: {
            id: user.id || 'me',
            name: user.name || 'Comprador',
            avatarUrl: safeUserAvatar,
            phone: user.phone || '',
          },
          sellerInfo: {
            id: product.sellerId || '',
            name: resolvedSellerName,
            avatarUrl: safeSellerAvatar,
            phone: resolvedSellerPhone || '',
          },
          createdBy: user.id || 'me',
          createdByPhone: userPhoneClean,
          lastMessageText: previewText,
          lastMessageTime: timestamp,
          lastMessageSenderPhone: userPhoneClean,
          lastMessageSenderId: user.id || 'me',
          lastMessageSenderName: user.name || 'Comprador',
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      const msgDocRef = doc(db, 'chats', chatId, 'messages', inquiryMsgId);
      await setDoc(msgDocRef, {
        id: inquiryMsgId,
        chatId,
        senderId: user.id || 'me',
        senderPhone: userPhoneClean,
        senderName: user.name || 'Comprador',
        senderAvatar: safeUserAvatar,
        type: 'text',
        text: inquiryText,
        mediaUrl: safeProductMediaUrl,
        timestamp,
        timestampMs: nowMs,
        isRead: false,
        reactions: {},
      });

      // Trigger Web Push / background alert for seller
      if (resolvedSellerPhoneClean || (product.sellerId && product.sellerId !== 'current_user')) {
        fetch('/api/messages/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId,
            message: outboundMsgForPeer,
            receiverPhone: resolvedSellerPhoneClean,
            receiverId: product.sellerId !== 'current_user' ? product.sellerId : undefined,
          }),
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore seller chat sync error:', e);
    }
  };

  // Total unread messages
  const totalUnread = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Active wallpaper calculation for whole app (Main menu, chats list, settings, etc.)
  const activeWallpaper =
    WALLPAPERS.find((w) => w.id === user.wallpaperId) || WALLPAPERS[0];

  const wallpaperBackgroundUrl =
    user.wallpaperId === 'custom' && user.customWallpaperUrl
      ? user.customWallpaperUrl
      : activeWallpaper?.url || WALLPAPERS[0]?.url;

  const isNightMode = Boolean(user.nightMode);

  // Sync document root dark class so Tailwind and CSS reflect nightMode
  useEffect(() => {
    if (isNightMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isNightMode]);

  const handleAddContactAsFriend = (chatId: string) => {
    const targetChat = chatsRef.current.find((c) => c.id === chatId);
    const cutoffs = readClearedCutoffs(userRef.current?.id || user.id);
    const peerClean = getCleanPhone(targetChat?.phone);
    const cutoffMs = Math.max(
      cutoffs.byChatId[chatId] || 0,
      peerClean ? (cutoffs.byPeerPhone[peerClean] || 0) : 0
    );

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            isFriend: true,
            messages: cutoffMs
              ? (c.messages || []).filter((m) => ((m as any).timestampMs || 0) > cutoffMs)
              : c.messages,
            statusText: c.phone ? `Amigo • ${c.phone}` : 'Amigo en PidgeX',
            categories: Array.from(new Set([...(c.categories || ['all']), 'friends' as ChatCategory])),
          };
        }
        return c;
      })
    );
  };

  return (
    <div
      style={{ filter: getFilterStyle(user.colorBlindnessMode) }}
      className={`relative min-h-screen w-full font-sans antialiased overflow-x-hidden transition-colors duration-300 ${
        isNightMode ? 'bg-[#0a0e16] text-[#dfe2ee]' : 'bg-[#e0f2fe] text-[#0c2340]'
      }`}
    >
      {/* Weather & Ambient Effects Overlay */}
      <WeatherEffectsOverlay effect={user.weatherEffect || 'none'} />
      {/* SVG Color Blindness Filters for all types of color blindness */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.56667 0.43333 0 0 0  0.55833 0.44167 0 0 0  0 0.24167 0.75833 0 0  0 0 0 1 0" />
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" />
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>
      {/* Dynamic Global Background Wallpaper Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {wallpaperBackgroundUrl && (
          <>
            <img
              src={wallpaperBackgroundUrl}
              alt="Fondo de pantalla"
              className="w-full h-full object-cover transition-opacity duration-500"
              style={{
                filter: isNightMode
                  ? 'invert(0.88) hue-rotate(180deg) brightness(0.55) contrast(1.05)'
                  : 'none',
              }}
            />
            <div
              className={`absolute inset-0 ${
                isNightMode ? 'bg-[#0b0f17]/55' : 'bg-[#f4f7fb]/45'
              }`}
            />
          </>
        )}
      </div>

      {/* Main App Content Container */}
      {!isAccountRegistered ? (
        <AccountOnboardingView
          onCompleteCreate={handleCompleteCreateAccount}
          onCompleteExisting={handleCompleteExistingAccount}
          currentChats={sessionSignedOutRef.current ? undefined : chats}
          currentUser={sessionSignedOutRef.current ? undefined : user}
          isNightMode={isNightMode}
        />
      ) : (
      <div className="relative z-10 min-h-screen w-full flex flex-col">
        {activeChat ? (
          <div key={`chat_${activeChat.id}`} className="w-full h-full animate-in slide-in-from-right-12 duration-1000 ease-out">
            <ChatView
              chat={activeChat}
              user={user}
              wallpapers={WALLPAPERS}
              allContacts={chats}
              isNightMode={isNightMode}
              deviceMode={effectiveDeviceMode}
              onToggleNightMode={handleToggleNightMode}
              onBack={() => {
                setActiveChatId(null);
              }}
              onSendMessage={handleSendMessage}
              onAddReaction={handleAddReaction}
              onSelectWallpaper={handleSelectWallpaper}
              onUpdateUser={handleUpdateUser}
              onBlockContact={handleBlockContact}
              onUnblockContact={handleUnblockContact}
              onToggleDoNotDisturb={handleToggleDoNotDisturb}
              onOpenWaitingRoom={() => {
                setActiveChatId(null);
                setActiveTab('games');
              }}
              onDeleteMessage={handleDeleteMessage}
              onClearChatMessages={handleClearChatMessages}
              onDeleteChat={handleDeleteChat}
              onAddContactAsFriend={handleAddContactAsFriend}
              onRemoveFriend={handleRemoveFriend}
              onOpenAddFriend={() => setIsAddFriendModalOpen(true)}
              onUpdateGroupMembers={handleUpdateGroupMembers}
              onUpdateGroupAvatar={handleUpdateGroupAvatar}
              onLeaveGroup={handleLeaveGroup}
              onOpenTimeCapsule={() => setIsTimeCapsuleModalOpen(true)}
              onExportChat={(c) => exportChatAsText(c)}
              onSelectGradient={(chatId, gradient) => {
                setChats((prev) =>
                  prev.map((c) => (c.id === chatId ? { ...c, headerGradient: gradient } : c))
                );
              }}
              onUpdatePersonalityTheme={(chatId, theme: ChatPersonalityTheme) => {
                setChats((prev) =>
                  prev.map((c) => (c.id === chatId ? { ...c, personalityTheme: theme, headerGradient: theme.headerGradient } : c))
                );
                try {
                  setDoc(doc(db, 'chats', chatId), { personalityTheme: theme, headerGradient: theme.headerGradient }, { merge: true }).catch(() => {});
                } catch {}
              }}
              onUpdateEmotionalMode={(chatId, mode: EmotionalMode) => {
                setChats((prev) =>
                  prev.map((c) => (c.id === chatId ? { ...c, emotionalMode: mode } : c))
                );
                try {
                  setDoc(doc(db, 'chats', chatId), { emotionalMode: mode }, { merge: true }).catch(() => {});
                } catch {}
              }}
              onUnlockCapsuleMessage={(chatId, messageId) => {
                setChats((prev) =>
                  prev.map((c) =>
                    c.id === chatId
                      ? {
                          ...c,
                          messages: (c.messages || []).map((m) =>
                            m.id === messageId && m.capsuleData
                              ? { ...m, capsuleData: { ...m.capsuleData, unlocked: true } }
                              : m
                          ),
                        }
                      : c
                  )
                );
              }}
              onStartPrivateChat={(memberId, memberName) => {
                const existing = chats.find((c) => c.type === 'direct' && (c.id === memberId || c.name === memberName));
                if (existing) {
                  setActiveChatId(existing.id);
                } else {
                  const newChatId = `direct_${Date.now()}`;
                  const newChat: Chat = {
                    id: newChatId,
                    name: memberName,
                    type: 'direct',
                    avatarUrl: createSvgAvatar(memberName),
                    isFriend: true,
                    isOnline: true,
                    statusText: 'Amigo en PidgeX',
                    categories: ['all', 'friends'],
                    unreadCount: 0,
                    lastMessageText: '¡Chat privado iniciado!',
                    lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    messages: [],
                  };
                  setChats((prev) => [newChat, ...prev]);
                  setActiveChatId(newChatId);
                }
              }}
              onForwardMessage={(targetChatId, message) => {
                setChats((prev) =>
                  prev.map((c) => {
                    if (c.id === targetChatId) {
                      return {
                        ...c,
                        messages: [...c.messages, message],
                        lastMessageText: message.text || `[${message.type}]`,
                        lastMessageTime: message.timestamp,
                      };
                    }
                    return c;
                  })
                );
              }}
              onStartCall={handleStartCall}
            />
          </div>
        ) : (
          <>
            {/* Main Tabs with 1 Second Directional Slide Transitions */}
            {activeTab === 'chats' && (
              <div key="tab_chats" className={`w-full h-full flex flex-col overflow-hidden animate-in ${lastTabDirection === 'right' ? 'slide-in-from-right-16' : 'slide-in-from-left-16'} duration-1000 ease-out`}>
                <NotificationPermissionBanner isNightMode={isNightMode} />
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ChatsListView
                    chats={chats}
                    user={user}
                    wallpapers={WALLPAPERS}
                    isNightMode={isNightMode}
                    onToggleNightMode={handleToggleNightMode}
                    onSelectChat={(c) => {
                      setChats((prev) =>
                        prev.map((item) => (item.id === c.id ? { ...item, unreadCount: 0 } : item))
                      );
                      setActiveChatId(c.id);
                    }}
                    onSelectWallpaper={(wpId, customUrl) => handleSelectWallpaper(wpId, customUrl)}
                    onToggleDoNotDisturb={handleToggleDoNotDisturb}
                    onOpenProfile={() => handleSelectTab('settings')}
                    onNewChat={() => setIsNewChatModalOpen(true)}
                    onOpenNewGroup={() => setIsNewGroupModalOpen(true)}
                    onAddFriend={handleAddFriend}
                    onUnblockContact={handleUnblockContact}
                    onDeleteChat={handleDeleteChat}
                    onOpenContactProfile={(c) => setSelectedContactForProfile(c)}
                    onOpenLocalRadar={() => setIsLocalRadarOpen(true)}
                    onOpenInstallModal={() => setIsInstallModalOpen(true)}
                    onOpenAddFriend={() => setIsAddFriendModalOpen(true)}
                    isClassicMode={isClassicMode}
                  />
                </div>
              </div>
            )}

            {isLocalRadarOpen && (
              <LocalRadarView
                user={user}
                chats={chats}
                onStartDirectChat={(target) => {
                  setIsLocalRadarOpen(false);
                  const existing = chats.find((c) => c.id === target.id || c.name === target.name);
                  if (existing) {
                    setActiveChatId(existing.id);
                  } else {
                    const newChatId = `chat_${Date.now()}`;
                    const newChat: Chat = {
                      id: newChatId,
                      name: target.name,
                      type: 'direct',
                      avatarUrl: target.avatarUrl,
                      statusText: 'Conectado por Red Mesh P2P',
                      categories: ['all', 'friends'],
                      unreadCount: 0,
                      lastMessageText: '¡Conexión local establecida!',
                      lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      messages: [],
                    };
                    setChats((prev) => [newChat, ...prev]);
                    setActiveChatId(newChatId);
                  }
                }}
                onBack={() => setIsLocalRadarOpen(false)}
                isNightMode={isNightMode}
              />
            )}









            {activeTab === 'marketplace' && (
              <div key="tab_marketplace" className={`w-full h-full animate-in ${lastTabDirection === 'right' ? 'slide-in-from-right-16' : 'slide-in-from-left-16'} duration-1000 ease-out`}>
                <MarketplaceView
                  user={user}
                  chats={chats}
                  isNightMode={isNightMode}
                  onToggleNightMode={handleToggleNightMode}
                  onStartChatWithSeller={handleStartChatWithSeller}
                />
              </div>
            )}

            {activeTab === 'games' && (
              <div key="tab_games" className={`w-full h-full animate-in ${lastTabDirection === 'right' ? 'slide-in-from-right-16' : 'slide-in-from-left-16'} duration-1000 ease-out`}>
                <WaitingRoomView
                  onBackToChats={() => handleSelectTab('chats')}
                  chats={chats}
                  user={user}
                  isNightMode={isNightMode}
                  onSendMemeToChat={(chatId, memeDataUrl, caption) => {
                    handleSendMessage(chatId, {
                      senderId: 'me',
                      senderName: user.name,
                      senderAvatar: user.avatarUrl,
                      type: 'image',
                      mediaUrl: memeDataUrl,
                      text: `Meme creado: ${caption}`,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      isRead: true,
                    });
                  }}
                />
              </div>
            )}

            {activeTab === 'news' && (
              <div key="tab_news" className={`w-full h-full animate-in ${lastTabDirection === 'right' ? 'slide-in-from-right-16' : 'slide-in-from-left-16'} duration-1000 ease-out`}>
                <NewsView
                  isNightMode={isNightMode}
                  chats={chats}
                  onShareToChat={handleShareArticleToChat}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div key="tab_settings" className={`w-full h-full animate-in ${lastTabDirection === 'right' ? 'slide-in-from-right-16' : 'slide-in-from-left-16'} duration-1000 ease-out`}>
                <SettingsProfileView
                  user={user}
                  wallpapers={WALLPAPERS}
                  isNightMode={isNightMode}
                  onUpdateUser={handleUpdateUser}
                  onToggleDoNotDisturb={handleToggleDoNotDisturb}
                  onApproveFriendRequest={handleApproveFriendRequest}
                  onRejectFriendRequest={handleRejectFriendRequest}
                  onSignOut={handleSignOutSession}
                  onDeleteAccount={handleDeleteAccount}
                  isClassicMode={isClassicMode}
                  onToggleClassicMode={() => {
                    const next = !isClassicMode;
                    setIsClassicMode(next);
                    localStorage.setItem('pidge_classic_mode', String(next));
                    setActiveTab('chats');
                  }}
                  onOpenTutorial={() => setIsTutorialOpen(true)}
                  onOpenTour={() => setIsTourOpen(true)}
                  onOpenInstallModal={() => setIsInstallModalOpen(true)}
                  onSelectWallpaper={(wpId, customUrl) => handleSelectWallpaper(wpId, customUrl)}
                />
              </div>
            )}

            {/* Bottom Persistent Navigation Dock */}
            <BottomNav
              activeTab={activeTab}
              unreadTotal={totalUnread}
              isNightMode={isNightMode}
              isClassicMode={isClassicMode}
              onSelectTab={handleSelectTab}
            />

            {/* New Chat Modal */}
            <NewChatModal
              isOpen={isNewChatModalOpen}
              onClose={() => setIsNewChatModalOpen(false)}
              onCreateChat={handleCreateChat}
              currentUserId={user.id}
              currentUserPhone={user.phone}
            />

            {/* New Group Modal */}
            <NewGroupModal
              isOpen={isNewGroupModalOpen}
              onClose={() => setIsNewGroupModalOpen(false)}
              onCreateGroup={handleCreateGroup}
              chats={chats}
              user={user}
            />

            {/* Add Friend Modal */}
            <AddFriendModal
              isOpen={isAddFriendModalOpen}
              onClose={() => setIsAddFriendModalOpen(false)}
              onAddFriend={handleAddFriend}
              currentUserId={user.id}
              currentUserPhone={user.phone}
            />

            {/* Send Voice Message Modal */}
            <SendVoiceMessageModal
              isOpen={isVoiceMessageModalOpen}
              onClose={() => setIsVoiceMessageModalOpen(false)}
              chats={chats}
              user={user}
              isNightMode={isNightMode}
              onSendVoiceMessage={handleSendVoiceMessageFromModal}
            />

            {/* Interactive Tutorial Modal */}
            <TutorialModal
              isOpen={isTutorialOpen}
              onClose={() => setIsTutorialOpen(false)}
              isNightMode={isNightMode}
            />

            {/* Interactive Spotlight Tour with Pointers */}
            <SpotlightTour
              isOpen={isTourOpen}
              onClose={() => setIsTourOpen(false)}
              activeTab={activeTab}
              onSelectTab={(tab) => setActiveTab(tab)}
              isNightMode={isNightMode}
            />


          </>
        )}

        {/* Contact Profile Modal Pop-up */}
        <ContactProfileModal
          isOpen={Boolean(selectedContactForProfile)}
          onClose={() => setSelectedContactForProfile(null)}
          contact={selectedContactForProfile}
          user={user}
          isNightMode={isNightMode}
          onStartChat={(c) => {
            setActiveChatId(c.id);
            setActiveTab('chats');
          }}
          onRemoveFriend={handleRemoveFriend}
        />

        {/* Time Capsule Modal */}
        <TimeCapsuleModal
          isOpen={isTimeCapsuleModalOpen}
          onClose={() => setIsTimeCapsuleModalOpen(false)}
          chats={chats}
          defaultChatId={activeChat?.id}
          user={user}
          isNightMode={isNightMode}
          onSendCapsuleMessage={(chatId, text, capsuleData?: TimeCapsuleData) => {
            handleSendMessage(chatId, {
              senderId: 'me',
              senderName: user.name,
              senderAvatar: user.avatarUrl,
              type: capsuleData ? 'capsule' : 'text',
              text,
              capsuleData,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isRead: true,
            });
          }}
        />


        {/* Virtual Pet Pikito */}
        <VirtualPetWidget user={user} isNightMode={isNightMode} />

        {/* Real-time Outgoing & Active Call Modal */}
        {activeCallSession && (
          <CallModal
            isOpen={Boolean(activeCallSession)}
            isMinimized={isCallMinimized}
            onMinimize={handleMinimizeActiveCall}
            onRestore={handleRestoreActiveCall}
            onClose={handleCloseActiveCall}
            contactName={activeCallSession.chat.name}
            contactAvatar={activeCallSession.chat.avatarUrl}
            isVideo={activeCallSession.isVideo}
            isGroup={activeCallSession.chat.type === 'group'}
            groupMembers={activeCallSession.chat.groupMembers || []}
            callId={activeCallSession.callId}
            isCaller={activeCallSession.isCaller}
            initialCallStatus={activeCallSession.initialCallStatus}
          />
        )}

        {/* Real-time Incoming Call Modal */}
        <IncomingCallModal
          call={incomingCallData}
          user={user}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
          isNightMode={isNightMode}
        />

        {/* PWA Mobile & Tablet Install Guide Modal */}
        <InstallPwaModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          isNightMode={isNightMode}
        />

        {/* Splash Loader */}
        <FlyingBirdLoader
          isLoading={isAppLoading}
          message="Cargando tus chats..."
          isNightMode={isNightMode}
        />

        {/* In-App Bird Notification Toast */}
        <BirdNotificationToast
          notification={inAppNotification}
          onClose={() => setInAppNotification(null)}
          onSelectChat={(chatId) => {
            setActiveChatId(chatId);
            setActiveTab('chats');
          }}
          isNightMode={isNightMode}
        />
      </div>
      )}
    </div>
  );
}
