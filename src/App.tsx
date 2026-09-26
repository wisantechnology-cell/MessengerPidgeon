import React, { useState, useEffect, useRef } from 'react';
import {
  INITIAL_USER,
  INITIAL_CHATS,
  WALLPAPERS,
} from './data/mockData';
import { Chat, ChatCategory, Message, UserProfile, MarketplaceProduct } from './types';
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
  OperationType,
  handleFirestoreError
} from './firebase';
import { ChatsListView } from './components/ChatsListView';

import { ChatView } from './components/ChatView';
import { SettingsProfileView } from './components/SettingsProfileView';
import { WaitingRoomView } from './components/waitingRoom/WaitingRoomView';
import { MarketplaceView } from './components/marketplace/MarketplaceView';
import { BottomNav, NavTab } from './components/BottomNav';
import { NewChatModal } from './components/NewChatModal';
import { AddFriendModal, AddFriendData } from './components/AddFriendModal';
import { SendVoiceMessageModal } from './components/SendVoiceMessageModal';
import { StudioWatermark } from './components/StudioWatermark';
import { ensurePhoneStartsWith16 } from './utils/phoneUtils';

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
    nameLower === 'messengerpidgeon ai'
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

export default function App() {
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
          const currentBio = isLegacyOrEmptyBio(parsed.bio) ? 'Soy nuevo en MessengerPidgeon' : parsed.bio.trim();
          const currentUsername = !parsed.username || parsed.username === '@anarodriguez' || parsed.username === '@carlosmendoza' || parsed.username === '@elenagomez' ? '@usuarionuevo' : parsed.username;

          return {
            ...INITIAL_USER,
            ...parsed,
            name: currentName,
            bio: currentBio,
            username: currentUsername,
            avatarUrl: currentAvatar,
            phone: ensurePhoneStartsWith16(parsed.phone || INITIAL_USER.phone),
            parentPhone: parsed.parentPhone ? ensurePhoneStartsWith16(parsed.parentPhone) : INITIAL_USER.parentPhone,
          };
        }
      }
    } catch {
      // ignore
    }
    const randomId = `user_${Math.random().toString(36).substring(2, 7)}`;
    return {
      ...INITIAL_USER,
      id: randomId,
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

      const saved = localStorage.getItem(CHATS_STORAGE_KEY);
      if (saved) {
        const parsed: Chat[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter((c) => !isLegacyChat(c))
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

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('chats');
  const [activeCategory, setActiveCategory] = useState<ChatCategory>('all');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState<boolean>(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState<boolean>(false);
  const [isVoiceMessageModalOpen, setIsVoiceMessageModalOpen] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

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

  // Sync user profile changes to Firestore
  useEffect(() => {
    if (firebaseUser) {
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        setDoc(userRef, user, { merge: true });
      } catch (e) {
        console.error('Error saving user to Firestore:', e);
      }
    }
  }, [user, firebaseUser]);

  // Sync chats and acquaintances to Firestore
  useEffect(() => {
    if (firebaseUser) {
      chats.forEach(async (chat) => {
        try {
          const chatRef = doc(db, 'chats', chat.id);
          await setDoc(chatRef, chat, { merge: true });
        } catch (e) {
          console.error('Error saving chat to Firestore:', e);
        }
      });
    }
  }, [chats, firebaseUser]);

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
      bio: 'Soy nuevo en MessengerPidgeon',
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

  const activeChat = chats.find((c) => c.id === activeChatId);

  // Send message handler
  const handleSendMessage = (chatId: string, messageData: Partial<Message>) => {
    // Check bad words if parental control is active
    if (user.parentalControlEnabled && messageData.text) {
      const BAD_WORDS = ['tonto', 'estúpido', 'idiota', 'grosería', 'malapalabra', 'puta', 'mierda', 'carajo', 'imbécil', 'pendejo', 'cabrón', 'puto', 'idiot', 'shit', 'fuck', 'bitch', 'zorra', 'imbecil'];
      const textLower = messageData.text.toLowerCase();
      const hasProfanity = BAD_WORDS.some((word) => textLower.includes(word));
      if (hasProfanity) {
        alert(`⚠️ [CONTROL PARENTAL ACTIVADO]: Se ha detectado una palabra no permitida en tu mensaje ("${messageData.text}"). Se ha enviado una alerta automática a ${user.parentName || 'tus padres'} (${user.parentPhone || '16 600 000 000'}).`);
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

    setChats((prevChats) =>
      prevChats.map((c) => {
        if (c.id === chatId) {
          const updatedMessages = [...c.messages, newMessage];
          let lastText = newMessage.text || '';
          if (newMessage.type === 'image') lastText = '📷 Foto adjunta';
          if (newMessage.type === 'voice') lastText = '🎤 Mensaje de voz';
          if (newMessage.type === 'sticker') lastText = `✨ Sticker: ${newMessage.stickerTitle || 'Sticker'}`;
          if (newMessage.type === 'video') lastText = '📹 Video adjunto';

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
    const newChatId = `chat_${Date.now()}`;
    const firstMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const finalPhone = phone ? ensurePhoneStartsWith16(phone) : undefined;

    const newChat: Chat = {
      id: newChatId,
      name: contactName,
      phone: finalPhone,
      isFriend: true,
      avatarUrl,
      isVerified: true,
      isOnline: true,
      statusText: finalPhone ? `Amigo • ${finalPhone}` : 'Amigo en MessengerPidgeon',
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

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChatId);
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
      alert(`🔒 [Control Parental Activado]: Para agregar a ${data.name}, ${user.parentName || 'tus padres'} deben aprobarlo primero. La solicitud se ha enviado al panel parental.`);
      return;
    }
    handleAddFriendDirect(data);
  };

  const handleAddFriendDirect = (data: AddFriendData) => {
    const newChatId = `chat_friend_${Date.now()}`;
    const firstMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const finalPhone = data.phone ? ensurePhoneStartsWith16(data.phone) : undefined;

    const friendCategories: ChatCategory[] = ['all', 'friends'];
    if (data.category && data.category !== 'all' && data.category !== 'friends') {
      friendCategories.push(data.category);
    }

    const newChat: Chat = {
      id: newChatId,
      name: data.name,
      phone: finalPhone,
      username: data.username || undefined,
      isFriend: true,
      avatarUrl: data.avatarUrl,
      isVerified: true,
      isOnline: true,
      statusText: finalPhone ? `Amigo • ${finalPhone}` : 'Amigo en MessengerPidgeon',
      type: 'direct',
      categories: friendCategories,
      unreadCount: 0,
      lastMessageText: data.initialMessage || '¡Amigo agregado con éxito!',
      lastMessageTime: firstMsgTime,
      lastMessageRead: true,
      messages: data.initialMessage
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
        : [],
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChatId);
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

  // Block contact handler: removes friend status and marks as blocked
  const handleBlockContact = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            isFriend: false,
            isBlocked: true,
            statusText: 'Contacto bloqueado • Ya no es tu amigo',
            categories: c.categories.filter((cat) => cat !== 'friends'),
          };
        }
        return c;
      })
    );
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
            statusText: c.phone ? `Amigo • ${c.phone}` : 'Amigo en MessengerPidgeon',
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
      text: `🛒 *Pregunta de BirdMarketplace*\nArtículo: **${product.title}**\nPrecio: $${product.price}\n\n💬 "${inquiryMessage}"`,
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
                lastMessageText: `🛒 ${product.title}: ${inquiryMessage}`,
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
        lastMessageText: `🛒 ${product.title}: ${inquiryMessage}`,
        lastMessageTime: timestamp,
        lastMessageRead: true,
        messages: [inquiryMsgObj],
      };

      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(chatId);
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
            statusText: c.phone ? `Amigo • ${c.phone}` : 'Amigo en MessengerPidgeon',
            categories: Array.from(new Set([...(c.categories || ['all']), 'friends' as ChatCategory])),
          };
        }
        return c;
      })
    );
  };

  return (
    <div className={`relative min-h-screen w-full font-sans antialiased overflow-x-hidden transition-colors duration-300 ${
      isNightMode ? 'bg-[#0a0e16] text-[#dfe2ee]' : 'bg-[#e0f2fe] text-[#0c2340]'
    }`}>
      {/* Dynamic Global Background Wallpaper Layer (Main menu, chats list, etc.) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {wallpaperBackgroundUrl && (
          <img
            src={wallpaperBackgroundUrl}
            alt="Fondo de pantalla"
            className="w-full h-full object-cover transition-all duration-700 ease-out scale-105"
          />
        )}
      </div>

      {/* Main App Content Container */}
      <div className="relative z-10 min-h-screen w-full flex flex-col">
        {/* If a conversation is active, render ChatView */}
        {activeChat ? (
          <ChatView
            chat={activeChat}
            user={user}
            wallpapers={WALLPAPERS}
            isNightMode={isNightMode}
            onToggleNightMode={handleToggleNightMode}
            onBack={() => setActiveChatId(null)}
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
            onAddContactAsFriend={handleAddContactAsFriend}
            onOpenAddFriend={() => setIsAddFriendModalOpen(true)}
          />
        ) : (
          <>
            {/* Main Tabs */}
            {activeTab === 'chats' && (
              <ChatsListView
                chats={chats}
                user={user}
                wallpapers={WALLPAPERS}
                isNightMode={isNightMode}
                onToggleNightMode={handleToggleNightMode}
                onSelectChat={(c) => {
                  // Mark unread as read when opening
                  setChats((prev) =>
                    prev.map((item) => (item.id === c.id ? { ...item, unreadCount: 0 } : item))
                  );
                  setActiveChatId(c.id);
                }}
                onSelectWallpaper={(wpId, customUrl) => handleSelectWallpaper(wpId, customUrl)}
                onToggleDoNotDisturb={handleToggleDoNotDisturb}
                onOpenProfile={() => setActiveTab('settings')}
                onNewChat={() => setIsNewChatModalOpen(true)}
                onAddFriend={handleAddFriend}
                onUnblockContact={handleUnblockContact}
              />
            )}

            {activeTab === 'marketplace' && (
              <MarketplaceView
                user={user}
                chats={chats}
                isNightMode={isNightMode}
                onToggleNightMode={handleToggleNightMode}
                onStartChatWithSeller={handleStartChatWithSeller}
              />
            )}

            {activeTab === 'games' && (
              <WaitingRoomView onBackToChats={() => setActiveTab('chats')} />
            )}

            {activeTab === 'settings' && (
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
              />
            )}

            {/* Bottom Persistent Navigation Dock */}
            <BottomNav
              activeTab={activeTab}
              unreadTotal={totalUnread}
              isNightMode={isNightMode}
              onSelectTab={setActiveTab}
            />

            {/* New Chat Modal */}
            <NewChatModal
              isOpen={isNewChatModalOpen}
              onClose={() => setIsNewChatModalOpen(false)}
              onCreateChat={handleCreateChat}
            />

            {/* Add Friend Modal */}
            <AddFriendModal
              isOpen={isAddFriendModalOpen}
              onClose={() => setIsAddFriendModalOpen(false)}
              onAddFriend={handleAddFriend}
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
          </>
        )}

        {/* Floating Studios M.A P.J Badge Symbol (auto-hidden inside chats, non-blocking) */}
        <StudioWatermark hidden={Boolean(activeChatId)} />
      </div>
    </div>
  );
}
