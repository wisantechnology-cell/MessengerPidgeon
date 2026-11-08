import React, { useState, useEffect, useRef } from 'react';
import {
  INITIAL_USER,
  INITIAL_CHATS,
  WALLPAPERS,
} from './data/mockData';
import { Chat, ChatCategory, Message, UserProfile, MarketplaceProduct, GroupMember } from './types';
import { StatusItem } from './types/status';
import { INITIAL_STATUSES } from './data/statusData';
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
import { StatusView } from './components/StatusView';
import { StarredMessagesView } from './components/StarredMessagesView';
import { LocalRadarView } from './components/LocalRadarView';
import { TutorialModal } from './components/TutorialModal';
import { SpotlightTour } from './components/SpotlightTour';
import { IncomingCallModal, IncomingCallData } from './components/IncomingCallModal';
import { CallModal } from './components/CallModal';
import { soundEffects } from './utils/soundEffects';
import { exportChatAsText } from './utils/exportChat';


import { ChatView } from './components/ChatView';
import { SettingsProfileView } from './components/SettingsProfileView';
import { WaitingRoomView } from './components/waitingRoom/WaitingRoomView';
import { TriviaGrupalGame } from './components/waitingRoom/TriviaGrupalGame';
import { DibujaYAdivinaGame } from './components/waitingRoom/DibujaYAdivinaGame';
import { StopGrupalGame } from './components/waitingRoom/StopGrupalGame';
import { MarketplaceView } from './components/marketplace/MarketplaceView';
import { NewsView } from './components/NewsView';
import { BottomNav, NavTab } from './components/BottomNav';
import { NewChatModal } from './components/NewChatModal';
import { NewGroupModal } from './components/NewGroupModal';
import { AddFriendModal, AddFriendData } from './components/AddFriendModal';
import { SendVoiceMessageModal } from './components/SendVoiceMessageModal';
import { StudioWatermark } from './components/StudioWatermark';
import { VirtualPetWidget } from './components/VirtualPetWidget';
import { ContactProfileModal } from './components/ContactProfileModal';
import { WeatherEffectsOverlay } from './components/WeatherEffectsOverlay';
import { TimeCapsuleModal } from './components/TimeCapsuleModal';
import { ensurePhoneStartsWith16, generateUniquePidgePhone } from './utils/phoneUtils';
import { createSvgAvatar } from './utils/avatarUtils';
import { InstallPwaModal } from './components/InstallPwaModal';
import { FlyingBirdLoader } from './components/FlyingBirdLoader';
import { BirdNotificationToast, BirdNotification } from './components/BirdNotificationToast';
import { sendNativeSystemNotification, requestNotificationPermission } from './utils/nativeNotifications';

export const getCleanPhone = (phone?: string): string => (phone || '').replace(/\D/g, '');

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

          // Ensure unique phone number per device so users and family members don't share identical numbers
          const hasCustomPhone = parsed.phone && parsed.phone !== '16 612 345 678' && parsed.phone.trim().length >= 8;
          const assignedPhone = hasCustomPhone ? ensurePhoneStartsWith16(parsed.phone) : generateUniquePidgePhone();

          return {
            ...INITIAL_USER,
            ...parsed,
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

      const saved = localStorage.getItem(CHATS_STORAGE_KEY);
      if (saved) {
        const parsed: Chat[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter((c) => {
              if (isLegacyChat(c) || c.isBlocked) return false;
              const nameLower = (c.name || '').toLowerCase();
              if (nameLower.includes('gac') || nameLower.includes('grand adventure') || nameLower.includes('gta')) return false;
              return true;
            })
            .map((c) => ({
              ...c,
              phone: c.phone ? ensurePhoneStartsWith16(c.phone) : undefined,
            }));
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_CHATS;
  });

  const [statuses, setStatuses] = useState<StatusItem[]>(() => {
    try {
      localStorage.removeItem('pidge_statuses_v1');
      const saved = localStorage.getItem('pidge_statuses_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_STATUSES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('pidge_statuses_v2', JSON.stringify(statuses));
    } catch {
      // ignore
    }
  }, [statuses]);

  const handleAddStatus = (mediaUrl: string, caption?: string, title?: string, privacy?: 'contacts' | 'everyone') => {
    const newStatus: StatusItem = {
      id: `status_${Date.now()}`,
      userId: user.id || 'me',
      userName: user.name || 'Tú',
      userAvatar: user.avatarUrl,
      mediaUrl,
      title,
      caption,
      privacy: privacy || 'everyone',
      timestamp: 'Justo ahora',
      expiresAt: '',
      replies: [],
    };
    setStatuses((prev) => [newStatus, ...prev]);
  };

  const handleDeleteStatus = (statusId: string) => {
    setStatuses((prev) => prev.filter((s) => s.id !== statusId));
  };

  const handleReplyToStatus = (statusId: string, replyText: string) => {
    const newReply = {
      id: `reply_${Date.now()}`,
      senderId: user.id || 'me',
      senderName: user.name || 'Tú',
      senderAvatar: user.avatarUrl,
      text: replyText,
      timestamp: 'Justo ahora',
    };
    setStatuses((prev) =>
      prev.map((s) =>
        s.id === statusId
          ? { ...s, replies: [...s.replies, newReply] }
          : s
      )
    );
  };

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeGroupGame, setActiveGroupGame] = useState<'triviagrupal' | 'dibujayadivina' | 'stopgrupal' | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('chats');
  const [lastTabDirection, setLastTabDirection] = useState<'left' | 'right'>('right');

  const tabIndices: Record<NavTab, number> = {
    chats: 0,
    marketplace: 1,
    games: 2,
    news: 3,
    settings: 4,
  };

  const [isStarredModalOpen, setIsStarredModalOpen] = useState<boolean>(false);

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
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(!localStorage.getItem('pidge_tutorial_seen'));
  const [isTourOpen, setIsTourOpen] = useState<boolean>(!localStorage.getItem('pidge_spotlight_seen'));
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);

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
  const [inAppNotification, setInAppNotification] = useState<BirdNotification | null>(null);

  useEffect(() => {
    try {
      localStorage.removeItem('gac');
      localStorage.removeItem('gac3d');
      localStorage.removeItem('grand_adventure');
      localStorage.removeItem('gta');
    } catch {}
  }, []);

  // Firebase Auth & Cloud Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            setUser((prev) => ({
              ...prev,
              ...data,
              id: currentUser.uid,
              email: currentUser.email || prev.email,
              name: currentUser.displayName || prev.name,
              avatarUrl: currentUser.photoURL || prev.avatarUrl,
            }));
          } else {
            await setDoc(userRef, {
              ...user,
              id: currentUser.uid,
              email: currentUser.email || user.email,
              name: currentUser.displayName || user.name,
              avatarUrl: currentUser.photoURL || user.avatarUrl,
            });
          }
          setIsCloudSynced(true);
        } catch (e) {
          console.error('Cloud sync error:', e);
        }
      } else {
        setIsCloudSynced(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync user profile changes to Firestore so other real users can find them by phone
  useEffect(() => {
    if (!user || !user.id || !user.phone) return;
    try {
      const userRef = doc(db, 'users', user.id);
      setDoc(userRef, user, { merge: true });
    } catch (e) {
      console.error('Error saving user to Firestore:', e);
    }
  }, [user]);

  // Real-time Incoming Calls Listener
  useEffect(() => {
    if (!user) return;
    const myPhoneClean = getCleanPhone(user.phone);

    const callsCol = collection(db, 'calls');
    const unsubscribe = onSnapshot(
      callsCol,
      (snapshot) => {
        const now = Date.now();
        let foundCall: IncomingCallData | null = null;

        snapshot.docs.forEach((d) => {
          const data = d.data();
          if (!data) return;

          // Ignore calls originated strictly by this exact tab session
          const isSelf = data.callerTabSessionId === tabSessionIdRef.current;
          if (isSelf) return;

          const recPhone = getCleanPhone(data.receiverPhone);
          const recId = data.receiverId;
          const recName = (data.receiverName || '').trim().toLowerCase();
          const myName = (user.name || '').trim().toLowerCase();

          const isForMe =
            (recPhone && myPhoneClean && recPhone === myPhoneClean) ||
            (recId && (recId === user.id || chats.some((c) => c.id === data.chatId || c.id === recId))) ||
            (recName && myName && (recName === myName || recName.includes(myName) || myName.includes(recName))) ||
            (data.chatId && chats.some((c) => c.id === data.chatId)) ||
            (data.status === 'ringing' && !recPhone);

          // Only detect active ringing calls created in the last 90 seconds
          if (isForMe && data.status === 'ringing' && now - (data.createdAt || 0) < 90000) {
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

        if (foundCall && (!incomingCallData || incomingCallData.id !== foundCall.id)) {
          sendNativeSystemNotification(
            `📞 Llamada de ${foundCall.callerName}`,
            foundCall.isVideo ? 'Videollamada en vivo PidgeX' : 'Llamada de voz PidgeX',
            foundCall.callerAvatar,
            foundCall.chatId
          );
        }

        setIncomingCallData(foundCall);
      },
      (err) => {
        console.warn('Real-time calls listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [user, user.phone, user.id, chats, incomingCallData]);

  // Real-time Chat Discovery (e.g. when brother adds user or initiates contact)
  useEffect(() => {
    if (!user || !user.phone) return;
    const myPhoneClean = getCleanPhone(user.phone);
    if (!myPhoneClean) return;

    const chatsCol = collection(db, 'chats');
    const unsubscribe = onSnapshot(
      chatsCol,
      (snapshot) => {
        snapshot.docs.forEach((d) => {
          const data = d.data();
          if (!data) return;
          const participantPhones: string[] = data.participantPhones || [];
          if (participantPhones.includes(myPhoneClean)) {
            const otherPhoneClean = participantPhones.find((p) => p !== myPhoneClean) || '';
            const usersMap = data.usersMap || {};
            const otherUserInfo = usersMap[otherPhoneClean] || {};

            const friendName = otherUserInfo.name || (data.name && data.name !== user.name ? data.name : 'Contacto PidgeX');
            const friendPhone = otherUserInfo.phone || otherPhoneClean;
            const friendAvatar = otherUserInfo.avatarUrl || createSvgAvatar(friendName);

            setChats((prev) => {
              const existing = prev.find((c) => c.id === d.id);
              if (existing) {
                if (data.lastMessageText && data.lastMessageText !== existing.lastMessageText) {
                  return prev.map((c) =>
                    c.id === d.id
                      ? {
                          ...c,
                          lastMessageText: data.lastMessageText,
                          lastMessageTime: data.lastMessageTime || c.lastMessageTime,
                        }
                      : c
                  );
                }
                return prev;
              }

              const newChat: Chat = {
                id: d.id,
                name: friendName,
                phone: friendPhone ? ensurePhoneStartsWith16(friendPhone) : undefined,
                isFriend: true,
                avatarUrl: friendAvatar,
                isVerified: true,
                isOnline: true,
                statusText: friendPhone ? `Amigo • ${friendPhone}` : 'Amigo en PidgeX',
                type: data.type || 'direct',
                categories: ['all', 'friends'],
                unreadCount: 1,
                lastMessageText: data.lastMessageText || '¡Nuevo mensaje!',
                lastMessageTime: data.lastMessageTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                lastMessageRead: false,
                messages: [],
              };
              return [newChat, ...prev];
            });
          }
        });
      },
      (err) => {
        console.warn('Real-time chats discovery error:', err);
      }
    );

    return () => unsubscribe();
  }, [user.phone, user.name]);

  // Real-time messages listener for active chat
  useEffect(() => {
    if (!activeChatId) return;

    const msgsQuery = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('timestampMs', 'asc')
    );

    const myPhoneClean = getCleanPhone(user.phone);

    const unsubscribe = onSnapshot(
      msgsQuery,
      (snapshot) => {
        if (snapshot.empty) return;

        const cloudMessages: Message[] = snapshot.docs.map((d) => {
          const data = d.data();
          const isMine =
            (data.senderPhone && data.senderPhone === myPhoneClean) ||
            (data.senderId && data.senderId === user.id) ||
            data.senderId === 'me';

          return {
            id: data.id || d.id,
            chatId: activeChatId,
            senderId: isMine ? 'me' : (data.senderId || 'contact'),
            senderName: isMine ? user.name : (data.senderName || 'Contacto'),
            senderAvatar: isMine ? user.avatarUrl : data.senderAvatar,
            type: data.type || 'text',
            text: data.text || undefined,
            mediaUrl: data.mediaUrl || undefined,
            mediaName: data.mediaName || undefined,
            mediaSize: data.mediaSize || undefined,
            mediaDuration: data.mediaDuration || undefined,
            filter: data.filter || undefined,
            stickerTitle: data.stickerTitle || undefined,
            stickerUrl: data.stickerUrl || undefined,
            timestamp: data.timestamp || new Date(data.timestampMs || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: true,
            reactions: data.reactions || {},
          };
        });

        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChatId) {
              const existingMap = new Map(c.messages.map((m) => [m.id, m]));
              let hasNew = false;
              cloudMessages.forEach((cm) => {
                if (!existingMap.has(cm.id)) {
                  existingMap.set(cm.id, cm);
                  hasNew = true;
                }
              });

              if (!hasNew && existingMap.size === c.messages.length) {
                return c;
              }

              const merged = Array.from(existingMap.values());
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

  // Handlers for Calls
  const handleStartCall = async (chat: Chat, isVideo: boolean) => {
    const callerPhoneClean = getCleanPhone(user.phone);
    const receiverPhoneClean = getCleanPhone(chat.phone);
    const tempCallId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Immediately open call modal synchronously for caller so call starts instantly with 0 lag
    setIsCallMinimized(false);
    setActiveCallSession({
      callId: tempCallId,
      chat,
      isVideo,
      isCaller: true,
      initialCallStatus: 'calling',
    });

    try {
      const callDocRef = await addDoc(collection(db, 'calls'), {
        callerId: user.id || 'me',
        callerName: user.name,
        callerAvatar: user.avatarUrl,
        callerPhone: callerPhoneClean,
        callerTabSessionId: tabSessionIdRef.current,
        receiverId: chat.id || '',
        receiverPhone: receiverPhoneClean,
        receiverName: chat.name,
        receiverAvatar: chat.avatarUrl,
        isVideo,
        isGroup: chat.type === 'group',
        chatId: chat.id,
        status: 'ringing', // STRICTLY ringing - caller timer will NOT start until receiver answers!
        createdAt: Date.now(),
      });

      // Update call session with actual Firestore doc ID
      setActiveCallSession((prev) => (prev ? { ...prev, callId: callDocRef.id } : null));
    } catch (e) {
      console.warn('Error syncing call to Firestore:', e);
    }
  };

  const handleAcceptIncomingCall = async (call: IncomingCallData) => {
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

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error('Google login error:', e);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Google logout error:', e);
    }
  };

  // Delete account completely (local data and cloud data)
  const handleDeleteAccount = async () => {
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
      pendingFriendRequests: [],
    };

    setUser(freshUser);
    setChats([]);
    setActiveChatId(null);
    setFirebaseUser(null);
    setIsCloudSynced(false);
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
      // ignore
    }
  }, [chats]);

  // Play authentic bird chirp sound & show toast notification when receiving a new message
  const prevMessageCountsRef = useRef<Record<string, number>>({});
  useEffect(() => {
    chats.forEach((c) => {
      const prevCount = prevMessageCountsRef.current[c.id] || c.messages.length;
      if (c.messages.length > prevCount) {
        const latestMsg = c.messages[c.messages.length - 1];
        if (latestMsg && latestMsg.senderId !== 'me') {
          const notifText = latestMsg.text || (latestMsg.type === 'voice' ? '🎵 Mensaje de voz' : latestMsg.type === 'image' ? '📷 Foto adjunta' : 'Nuevo mensaje');
          
          sendNativeSystemNotification(c.name, notifText, c.avatarUrl, c.id);

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
            alert(`¡Conexión en línea restaurada! Se han sincronizado automáticamente ${queue.length} mensajes guardados en modo offline.`);
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
        alert(`[CONTROL PARENTAL ACTIVADO]: Se ha detectado una palabra no permitida en tu mensaje ("${messageData.text}"). Se ha enviado una alerta automática a ${user.parentName || 'tus padres'} (${user.parentPhone || '16 600 000 000'}).`);
      }
    }

    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      chatId,
      senderId: messageData.senderId || 'me',
      senderName: messageData.senderName || user.name,
      senderAvatar: messageData.senderAvatar || user.avatarUrl,
      type: messageData.type || 'text',
      text: messageData.text,
      mediaUrl: messageData.mediaUrl,
      mediaName: messageData.mediaName,
      mediaSize: messageData.mediaSize,
      mediaDuration: messageData.mediaDuration,
      filter: messageData.filter,
      stickerId: messageData.stickerId,
      stickerTitle: messageData.stickerTitle,
      stickerSubtitle: messageData.stickerSubtitle,
      stickerUrl: messageData.stickerUrl,
      timestamp:
        messageData.timestamp ||
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
          const updatedMessages = [...c.messages, newMessage];
          let lastText = newMessage.text || '';
          if (newMessage.type === 'image') lastText = 'Foto adjunta';
          if (newMessage.type === 'voice') lastText = 'Mensaje de voz';
          if (newMessage.type === 'sticker') lastText = `Sticker: ${newMessage.stickerTitle || 'Sticker'}`;
          if (newMessage.type === 'video') lastText = 'Video adjunto';

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

    // Sync to Firestore in real-time
    try {
      const myPhoneClean = getCleanPhone(user.phone);
      const msgDocRef = doc(db, 'chats', chatId, 'messages', newMessage.id);
      setDoc(msgDocRef, {
        id: newMessage.id,
        chatId,
        senderId: user.id || 'me',
        senderPhone: myPhoneClean,
        senderName: user.name,
        senderAvatar: user.avatarUrl,
        type: newMessage.type,
        text: newMessage.text || null,
        mediaUrl: newMessage.mediaUrl || null,
        mediaName: newMessage.mediaName || null,
        mediaSize: newMessage.mediaSize || null,
        mediaDuration: newMessage.mediaDuration || null,
        filter: newMessage.filter || null,
        stickerTitle: newMessage.stickerTitle || null,
        stickerUrl: newMessage.stickerUrl || null,
        timestamp: newMessage.timestamp,
        timestampMs: Date.now(),
        isRead: false,
      }).catch((err) => console.warn('Error saving message doc:', err));

      let lastText = newMessage.text || '';
      if (newMessage.type === 'image') lastText = 'Foto adjunta';
      if (newMessage.type === 'voice') lastText = 'Mensaje de voz';
      if (newMessage.type === 'sticker') lastText = `Sticker: ${newMessage.stickerTitle || 'Sticker'}`;
      if (newMessage.type === 'video') lastText = 'Video adjunto';

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
  };

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

  // Delete a specific message in a chat
  const handleDeleteMessage = (chatId: string, messageId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          const filteredMessages = c.messages.filter((m) => m.id !== messageId);
          const lastMsg = filteredMessages[filteredMessages.length - 1];
          let lastText = 'Conversación vacía';
          if (lastMsg) {
            lastText = lastMsg.text || '';
            if (lastMsg.type === 'image') lastText = 'Foto adjunta';
            if (lastMsg.type === 'voice') lastText = 'Mensaje de voz';
            if (lastMsg.type === 'sticker') lastText = `Sticker: ${lastMsg.stickerTitle || 'Sticker'}`;
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
  };

  // Clear all messages in a chat
  const handleClearChatMessages = (chatId: string) => {
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
  };

  // Add reaction to message
  const handleAddReaction = (chatId: string, messageId: string, emoji: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            messages: c.messages.map((m) => {
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
      messages: initialMessage
        ? [
            {
              id: `msg_init_${Date.now()}`,
              chatId: newChatId,
              senderId: 'me',
              senderName: user.name,
              type: 'text',
              text: initialMessage,
              timestamp: firstMsgTime,
              isRead: true,
            },
          ]
        : [],
    };

    setChats((prev) => {
      const idx = prev.findIndex((c) => c.id === newChatId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...newChat };
        return copy;
      }
      return [newChat, ...prev];
    });
    setActiveChatId(newChatId);

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
    } catch (e) {
      console.warn('Firestore create chat sync error:', e);
    }
  };

  // Create Group Chat
  const handleCreateGroup = (
    groupName: string,
    members: GroupMember[],
    description?: string,
    groupAvatarUrl?: string
  ) => {
    const newChatId = `group_${Date.now()}`;
    const firstMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const avatar = groupAvatarUrl || createSvgAvatar(groupName, '#2563eb');

    const newGroupChat: Chat = {
      id: newChatId,
      name: groupName,
      avatarUrl: avatar,
      type: 'group',
      categories: ['all', 'groups'],
      unreadCount: 0,
      isVerified: true,
      lastMessageText: `Grupo "${groupName}" creado por ${user.name}`,
      lastMessageTime: firstMsgTime,
      lastMessageRead: true,
      description: description || `Grupo con ${members.length} integrantes`,
      groupMembers: members,
      messages: [
        {
          id: `msg_group_init_${Date.now()}`,
          chatId: newChatId,
          senderId: 'system',
          senderName: 'PidgeX Sistema',
          type: 'text',
          text: `¡Grupo "${groupName}" creado con éxito por ${user.name}! Agrega integrantes por contacto o por número de teléfono.`,
          timestamp: firstMsgTime,
          isRead: true,
        },
      ],
    };

    setChats((prev) => [newGroupChat, ...prev]);
    setActiveChatId(newChatId);
  };

  // Update Group Members & Roles (Leaders / Members)
  const handleUpdateGroupMembers = (chatId: string, updatedMembers: GroupMember[]) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            groupMembers: updatedMembers,
            description: `Grupo con ${updatedMembers.length} integrantes`,
          };
        }
        return c;
      })
    );
  };

  // Leave Group
  const handleLeaveGroup = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          const remainingMembers = (c.groupMembers || []).filter(
            (m) => m.id !== user.id && m.id !== 'me'
          );
          const sysMsg: Message = {
            id: `msg_sys_leave_${Date.now()}`,
            chatId,
            senderId: 'system',
            senderName: 'Sistema',
            type: 'text',
            text: `${user.name} se ha salido del grupo.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: true,
          };
          return {
            ...c,
            groupMembers: remainingMembers,
            messages: [...c.messages, sysMsg],
            lastMessageText: `${user.name} se salió del grupo`,
          };
        }
        return c;
      })
    );
    if (activeChatId === chatId) {
      setActiveChatId(null);
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
      alert(`[Control Parental Activado]: Para agregar a ${data.name}, ${user.parentName || 'tus padres'} deben aprobarlo primero. La solicitud se ha enviado al panel parental.`);
      return;
    }
    handleAddFriendDirect(data);
  };

  const handleAddFriendDirect = (data: AddFriendData) => {
    const finalPhone = data.phone ? ensurePhoneStartsWith16(data.phone) : undefined;
    const newChatId = finalPhone && user.phone
      ? getDirectChatId(user.phone, finalPhone)
      : `chat_friend_${Date.now()}`;
    const firstMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const friendCategories: ChatCategory[] = ['all', 'friends'];
    if (data.category && data.category !== 'all' && data.category !== 'friends') {
      friendCategories.push(data.category);
    }

    const initialMsgs: Message[] = data.initialMessage
      ? [
          {
            id: `msg_init_${Date.now()}`,
            chatId: newChatId,
            senderId: 'me',
            senderName: user.name,
            type: 'text',
            text: data.initialMessage,
            timestamp: firstMsgTime,
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
        copy[idx] = { ...copy[idx], ...newChat, messages: [...copy[idx].messages, ...initialMsgs] };
        return copy;
      }
      return [newChat, ...prev];
    });
    setActiveChatId(newChatId);

    // Sync to Firestore with participantPhones and usersMap so brother can discover it
    try {
      const userPhoneClean = getCleanPhone(user.phone);
      const friendPhoneClean = getCleanPhone(finalPhone);

      const chatDocRef = doc(db, 'chats', newChatId);
      setDoc(chatDocRef, {
        id: newChatId,
        name: data.name,
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
            name: data.name,
            avatarUrl: data.avatarUrl,
            phone: finalPhone,
          },
        },
        lastMessageText: newChat.lastMessageText,
        lastMessageTime: newChat.lastMessageTime,
        updatedAt: Date.now(),
      }, { merge: true }).catch((err) => console.warn('Error syncing chat doc:', err));

      if (data.initialMessage) {
        const msgDocRef = doc(db, 'chats', newChatId, 'messages', `msg_init_${Date.now()}`);
        setDoc(msgDocRef, {
          id: `msg_init_${Date.now()}`,
          chatId: newChatId,
          senderId: user.id || 'me',
          senderPhone: userPhoneClean,
          senderName: user.name,
          senderAvatar: user.avatarUrl,
          type: 'text',
          text: data.initialMessage,
          timestamp: firstMsgTime,
          timestampMs: Date.now(),
          isRead: false,
        }).catch((err) => console.warn('Error syncing initial msg doc:', err));
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

  // Block contact handler: completely removes contact so they don't show up again
  const handleBlockContact = (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setActiveChatId(null);
  };

  // Unblock & re-add as friend handler
  const handleUnblockContact = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            isFriend: true,
            isBlocked: false,
            statusText: c.phone ? `Amigo • ${c.phone}` : 'Amigo en PidgeX',
            categories: c.categories.includes('friends') ? c.categories : [...c.categories, 'friends'],
          };
        }
        return c;
      })
    );
  };

  // Start chat with seller on product inquiry (Facebook Marketplace style)
  const handleStartChatWithSeller = (product: MarketplaceProduct, inquiryMessage: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let targetChat = chats.find(
      (c) =>
        (product.sellerPhone && c.phone === product.sellerPhone) ||
        c.name.toLowerCase() === product.sellerName.toLowerCase() ||
        c.id === `chat_${product.sellerId}`
    );

    const chatId = targetChat ? targetChat.id : `chat_seller_${Date.now()}`;

    const inquiryMsgObj: Message = {
      id: `msg_prod_${Date.now()}`,
      chatId,
      senderId: user.id || 'current_user',
      senderName: user.name || 'Tú',
      type: 'text',
      text: `*Pregunta de BirdMarketplace*\nArtículo: **${product.title}**\nPrecio: $${product.price}\n\n"${inquiryMessage}"`,
      mediaUrl: product.imageUrl,
      timestamp,
      isRead: true,
      reactions: {},
    };

    if (targetChat) {
      setChats((prev) =>
        prev.map((c) =>
          c.id === targetChat!.id
            ? {
                ...c,
                messages: [...c.messages, inquiryMsgObj],
                lastMessageText: `${product.title}: ${inquiryMessage}`,
                lastMessageTime: timestamp,
                lastMessageRead: true,
                unreadCount: 0,
              }
            : c
        )
      );
      setActiveChatId(targetChat.id);
    } else {
      const newChat: Chat = {
        id: chatId,
        name: product.sellerName,
        phone: product.sellerPhone || undefined,
        isFriend: true,
        avatarUrl: product.sellerAvatarUrl,
        isVerified: true,
        isOnline: true,
        statusText: `Vendedor en BirdMarketplace • ${product.location}`,
        type: 'direct',
        categories: ['all', 'friends'],
        unreadCount: 0,
        lastMessageText: `${product.title}: ${inquiryMessage}`,
        lastMessageTime: timestamp,
        lastMessageRead: true,
        messages: [inquiryMsgObj],
      };

      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(chatId);
    }

    // Sync marketplace inquiry to Firestore so seller receives it immediately
    try {
      const userPhoneClean = getCleanPhone(user.phone);
      const sellerPhoneClean = getCleanPhone(product.sellerPhone || '');

      const chatDocRef = doc(db, 'chats', chatId);
      setDoc(chatDocRef, {
        id: chatId,
        name: product.sellerName,
        type: 'direct',
        participantPhones: [userPhoneClean, sellerPhoneClean].filter(Boolean),
        participants: [user.id || 'me', product.sellerId],
        usersMap: {
          [userPhoneClean]: {
            id: user.id || 'me',
            name: user.name,
            avatarUrl: user.avatarUrl,
            phone: user.phone,
          },
          [sellerPhoneClean]: {
            id: product.sellerId,
            name: product.sellerName,
            avatarUrl: product.sellerAvatarUrl,
            phone: product.sellerPhone,
          },
        },
        lastMessageText: `${product.title}: ${inquiryMessage}`,
        lastMessageTime: timestamp,
        updatedAt: Date.now(),
      }, { merge: true }).catch((err) => console.warn('Error syncing seller chat:', err));

      const msgDocRef = doc(db, 'chats', chatId, 'messages', inquiryMsgObj.id);
      setDoc(msgDocRef, {
        ...inquiryMsgObj,
        senderPhone: userPhoneClean,
        timestampMs: Date.now(),
      }).catch((err) => console.warn('Error syncing seller inquiry msg:', err));
    } catch (e) {
      console.warn('Firestore seller chat error:', e);
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
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            isFriend: true,
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
      {/* Dynamic Global Background Wallpaper Layer (Main menu, chats list, etc.) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {wallpaperBackgroundUrl && (
          <img
            src={wallpaperBackgroundUrl}
            alt="Fondo de pantalla"
            className="w-full h-full object-cover transition-all duration-700 ease-out scale-105"
            style={{
              filter: isNightMode
                ? 'invert(0.88) hue-rotate(180deg) brightness(0.65) contrast(1.1)'
                : 'none',
            }}
          />
        )}
      </div>

      {/* Main App Content Container */}
      <div className="relative z-10 min-h-screen w-full flex flex-col">
        {activeGroupGame === 'triviagrupal' ? (
          <div key="triviagrupal" className="w-full h-full animate-in fade-in zoom-in-80 duration-1000 ease-out">
            <TriviaGrupalGame groupName={activeChat?.name} onBack={() => setActiveGroupGame(null)} />
          </div>
        ) : activeGroupGame === 'dibujayadivina' ? (
          <div key="dibujayadivina" className="w-full h-full animate-in slide-in-from-bottom-12 duration-1000 ease-out">
            <DibujaYAdivinaGame groupName={activeChat?.name} onBack={() => setActiveGroupGame(null)} />
          </div>
        ) : activeGroupGame === 'stopgrupal' ? (
          <div key="stopgrupal" className="w-full h-full animate-in zoom-in-75 duration-1000 ease-out">
            <StopGrupalGame groupName={activeChat?.name} onBack={() => setActiveGroupGame(null)} />
          </div>
        ) : activeChat ? (
          <div key={`chat_${activeChat.id}`} className="w-full h-full animate-in slide-in-from-right-12 duration-1000 ease-out">
            <ChatView
              chat={activeChat}
              user={user}
              wallpapers={WALLPAPERS}
              allContacts={chats}
              isNightMode={isNightMode}
              onToggleNightMode={handleToggleNightMode}
              onBack={() => {
                setActiveChatId(null);
                setActiveGroupGame(null);
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
              onAddContactAsFriend={handleAddContactAsFriend}
              onOpenAddFriend={() => setIsAddFriendModalOpen(true)}
              onUpdateGroupMembers={handleUpdateGroupMembers}
              onLeaveGroup={handleLeaveGroup}
              onStartGroupGame={(gameId) => setActiveGroupGame(gameId)}
              onOpenTimeCapsule={() => setIsTimeCapsuleModalOpen(true)}
              onExportChat={(c) => exportChatAsText(c)}
              onSelectGradient={(chatId, gradient) => {
                setChats((prev) =>
                  prev.map((c) => (c.id === chatId ? { ...c, headerGradient: gradient } : c))
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
              <div key="tab_chats" className={`w-full h-full animate-in ${lastTabDirection === 'right' ? 'slide-in-from-right-16' : 'slide-in-from-left-16'} duration-1000 ease-out`}>
                <ChatsListView
                  chats={chats}
                  user={user}
                  wallpapers={WALLPAPERS}
                  statuses={statuses}
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
                  onAddStatus={handleAddStatus}
                  onDeleteStatus={handleDeleteStatus}
                  onReplyToStatus={handleReplyToStatus}
                  onOpenContactProfile={(c) => setSelectedContactForProfile(c)}
                  onOpenStarredMessages={() => setIsStarredModalOpen(true)}
                  onOpenLocalRadar={() => setIsLocalRadarOpen(true)}
                  onOpenInstallModal={() => setIsInstallModalOpen(true)}
                  onOpenAddFriend={() => setIsAddFriendModalOpen(true)}
                  isClassicMode={isClassicMode}
                />
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
                  firebaseUser={firebaseUser}
                  isCloudSynced={isCloudSynced}
                  isNightMode={isNightMode}
                  onGoogleLogin={handleGoogleLogin}
                  onGoogleLogout={handleGoogleLogout}
                  onUpdateUser={handleUpdateUser}
                  onToggleDoNotDisturb={handleToggleDoNotDisturb}
                  onApproveFriendRequest={handleApproveFriendRequest}
                  onRejectFriendRequest={handleRejectFriendRequest}
                  onDeleteAccount={handleDeleteAccount}
                  onAddScannedContact={(name, username) => {
                    handleAddFriendDirect({
                      name,
                      username,
                      avatarUrl: createSvgAvatar(name),
                      initialMessage: '¡Hola! Nos escaneamos por código QR en PidgeX.',
                    });
                    setActiveTab('chats');
                  }}
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
        />

        {/* Time Capsule Modal */}
        <TimeCapsuleModal
          isOpen={isTimeCapsuleModalOpen}
          onClose={() => setIsTimeCapsuleModalOpen(false)}
          chats={chats}
          user={user}
          isNightMode={isNightMode}
          onSendCapsuleMessage={(chatId, text) => {
            handleSendMessage(chatId, {
              senderId: 'me',
              senderName: user.name,
              senderAvatar: user.avatarUrl,
              type: 'text',
              text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isRead: true,
            });
          }}
        />

        <StarredMessagesView
          isOpen={isStarredModalOpen}
          onClose={() => setIsStarredModalOpen(false)}
          chats={chats}
          isNightMode={isNightMode}
          onJumpToChat={(chatId) => {
            setActiveChatId(chatId);
            setActiveTab('chats');
          }}
          onUnstarMessage={(chatId, messageId) => {
            setChats((prev) =>
              prev.map((c) => {
                if (c.id === chatId) {
                  return {
                    ...c,
                    messages: c.messages.map((m) => (m.id === messageId ? { ...m, isStarred: false } : m)),
                  };
                }
                return c;
              })
            );
          }}
        />

        {/* Virtual Pet Pikito */}
        <VirtualPetWidget user={user} isNightMode={isNightMode} />

        {/* Floating Studios M.A P.J Badge Symbol (auto-hidden inside chats, non-blocking) */}
        <StudioWatermark hidden={Boolean(activeChatId)} />

        {/* Real-time Outgoing & Active Call Modal */}
        {activeCallSession && (
          <CallModal
            isOpen={Boolean(activeCallSession)}
            isMinimized={isCallMinimized}
            onMinimize={() => setIsCallMinimized(true)}
            onRestore={() => setIsCallMinimized(false)}
            onClose={() => {
              if (activeCallSession.callId) {
                try {
                  const callRef = doc(db, 'calls', activeCallSession.callId);
                  updateDoc(callRef, { status: 'ended', endedAt: Date.now() }).catch(() => {});
                } catch (e) {
                  console.warn('Error ending call doc:', e);
                }
              }
              setIsCallMinimized(false);
              setActiveCallSession(null);
            }}
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

        {/* Flying Bird Loader */}
        <FlyingBirdLoader
          isLoading={isAppLoading}
          message="Eugenio volando con tus mensajes..."
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
    </div>
  );
}
