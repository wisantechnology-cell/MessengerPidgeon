export type ChatCategory = 'all' | 'friends' | 'unread' | 'groups' | 'work' | 'favorites';

export type UserStatus = 'online' | 'busy' | 'offline';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  bio: string;
  phone: string;
  email: string;
  status: UserStatus;
  wallpaperId: string;
  customWallpaperUrl?: string;
  wallpaperDim?: number; // 0 to 1, default 0.4 for clear visibility
  doNotDisturb: boolean; // Modo No Molestar
  dndDuration?: string; // '1h' | '8h' | 'always' | 'custom'
  nightMode?: boolean; // Modo nocturno (tonos oscuros vs colores claros azules)
  monthlyTheme?: string; // Tema mensual festivo ('auto' o id del tema)
  colorBlindnessMode?: 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  aiModeEnabled: boolean;
  autoReplyWithAi?: boolean;
  autoCorrectEnabled?: boolean;
  parentalControlEnabled?: boolean;
  parentName?: string;
  parentPhone?: string;
  voiceSubtitlesEnabled?: boolean;
  sharedCanvasEnabled?: boolean;
  sharedCalendarEnabled?: boolean;
  virtualPetEnabled?: boolean;
  language?: 'es' | 'en' | 'pt' | 'fr';
  weatherEffect?: 'none' | 'rain' | 'snow' | 'stars';
  pendingFriendRequests?: {
    id: string;
    name: string;
    username?: string;
    phone?: string;
    avatarUrl: string;
    initialMessage?: string;
    category?: any;
    timestamp: string;
  }[];
}

export type MessageType = 'text' | 'image' | 'sticker' | 'voice' | 'video' | 'poll' | 'private' | 'location';

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string; // 'me' or contact id
  senderName: string;
  senderAvatar?: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: string;
  mediaDuration?: string;
  filter?: 'none' | 'cyber' | 'vintage' | 'noir' | 'teal';
  stickerId?: string;
  stickerTitle?: string;
  stickerSubtitle?: string;
  stickerUrl?: string;
  timestamp: string;
  isRead: boolean;
  reactions?: Record<string, number>;
  disappearing?: boolean;
  expiresAt?: number;
  voiceFilter?: 'normal' | 'chipmunk' | 'robot' | 'deep';
  translatedText?: string;
  pollData?: PollData;
  privateData?: PrivateMessageData;
  isStarred?: boolean;
  locationData?: { lat: number; lng: number; address: string };
}

export interface GroupMember {
  id: string;
  name: string;
  phone?: string;
  avatarUrl: string;
  isLeader: boolean; // True si es líder/administrador del grupo
  addedBy?: string;
  joinedAt?: string;
}

export interface Chat {
  id: string;
  name: string;
  username?: string;
  phone?: string;
  isFriend?: boolean;
  isBlocked?: boolean;
  avatarUrl: string;
  isVerified?: boolean;
  isOnline?: boolean;
  statusText?: string;
  type: 'direct' | 'group';
  categories: ChatCategory[];
  unreadCount: number;
  pinned?: boolean;
  isArchived?: boolean;
  lastMessageText: string;
  lastMessageTime: string;
  lastMessageRead?: boolean;
  hasAiSuggestion?: boolean;
  customWallpaperId?: string;
  customWallpaperUrl?: string;
  isTyping?: boolean;
  isRealTime?: boolean;
  roomId?: string;
  onlineCount?: number;
  activeUsers?: { id: string; name: string; avatarUrl?: string }[];
  headerGradient?: string;
  messages: Message[];
  // Group Specific Properties
  creatorId?: string;
  groupMembers?: GroupMember[];
  description?: string;
  isLocked?: boolean;
  lockPin?: string;
  disappearingMessages?: boolean;
  countdownEvent?: { title: string; targetDate: string } | null;
  streakDays?: number;
}

export interface Wallpaper {
  id: string;
  name: string;
  url: string;
  previewUrl: string;
  description: string;
  category: string;
}

export interface StickerItem {
  id: string;
  category: string;
  emojiIcon: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  gradientClass?: string;
}

export type MarketplaceCategory =
  | 'all'
  | 'tech'
  | 'fashion'
  | 'vehicles'
  | 'home'
  | 'gaming'
  | 'sports'
  | 'books'
  | 'food';

export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair';

export interface MarketplaceProduct {
  id: string;
  title: string;
  price: number;
  currency?: string;
  description: string;
  category: MarketplaceCategory;
  condition: ProductCondition;
  imageUrl: string;
  location: string;
  sellerId: string;
  sellerName: string;
  sellerAvatarUrl: string;
  sellerUsername: string;
  sellerPhone?: string;
  createdAt: string;
  isAvailable: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

export interface PollData {
  question: string;
  options: PollOption[];
  isAnonymous?: boolean;
}

export interface PrivateMessageData {
  text: string;
  pin: string;
  selfDestructSecs: number;
}

export interface StatusStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl?: string;
  text?: string;
  timestamp: string;
  expiresAt: number;
  viewed?: boolean;
}

