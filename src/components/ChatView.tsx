import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  Video as VideoIcon,
  Shield,
  Send,
  Mic,
  Plus,
  Smile,
  Lock,
  Timer,
  Ban,
  Check,
  CheckCheck,
  X,
  FileText,
  Camera,
  FolderOpen,
  FileUp,
  Link2,
  Copy,
  Users,
  UserPlus,
  UserMinus,
  UserCheck,
  Wallpaper as WallpaperIcon,
  Moon,
  Bell,
  BellOff,
  Download,
  Gamepad2,
  Trash2,
  Play,
  ExternalLink,
  Clock,
  Palette,
  Pencil,
  BarChart2,
  Share2,
  MoreVertical,
  Maximize2,
  Sparkles,
  Image as ImageIcon,
  Wand2,
  Trophy,
} from 'lucide-react';
import {
  Chat,
  Message,
  Wallpaper,
  StickerItem,
  GifItem,
  UserProfile,
  GroupMember,
  ChatPersonalityTheme,
  EmotionalMode,
  GroupGameType,
} from '../types';
import { PrivateMessageModal } from './PrivateMessageModal';
import { PrivateMessageView } from './PrivateMessageView';
import { ForwardModal } from './ForwardModal';
import { STICKERS } from '../data/mockData';
import { VoiceRecorder } from './VoiceRecorder';
import { VoicePlayer } from './VoicePlayer';
import {
  ReactionHeartIcon,
  ReactionThumbIcon,
  ReactionFlameIcon,
  ReactionPartyIcon,
  ReactionClapIcon,
  TikTokVectorIcon,
  FacebookVectorIcon,
} from './CustomVectorIcons';

const REACTION_OPTIONS = [
  { key: '❤️', label: 'Me encanta', icon: <ReactionHeartIcon className="w-4 h-4" /> },
  { key: '👍', label: 'Me gusta', icon: <ReactionThumbIcon className="w-4 h-4" /> },
  { key: '🔥', label: 'Fuego', icon: <ReactionFlameIcon className="w-4 h-4" /> },
  { key: '🙌', label: 'Aplausos', icon: <ReactionClapIcon className="w-4 h-4" /> },
  { key: '🎉', label: 'Fiesta', icon: <ReactionPartyIcon className="w-4 h-4" /> },
];

const renderReactionIcon = (reactionKey: string) => {
  switch (reactionKey) {
    case '❤️':
    case 'love':
      return <ReactionHeartIcon className="w-3.5 h-3.5" />;
    case '👍':
    case 'like':
      return <ReactionThumbIcon className="w-3.5 h-3.5" />;
    case '🔥':
    case 'fire':
      return <ReactionFlameIcon className="w-3.5 h-3.5" />;
    case '🎉':
    case 'party':
      return <ReactionPartyIcon className="w-3.5 h-3.5" />;
    case '🙌':
    case 'clap':
      return <ReactionClapIcon className="w-3.5 h-3.5" />;
    default:
      return <span className="text-xs">{reactionKey}</span>;
  }
};
import { PhotoFilterModal } from './PhotoFilterModal';
import { EmojiStickerPicker } from './EmojiStickerPicker';
import { MediaModal } from './MediaModal';
import { CallModal } from './CallModal';
import { GroupMembersModal } from './GroupMembersModal';
import { AvatarCaptureModal } from './AvatarCaptureModal';
import { ChatThemeModal } from './ChatThemeModal';
import { DigitalAvatarStudioModal } from './DigitalAvatarStudioModal';
import { AiStickerFactoryModal } from './AiStickerFactoryModal';
import { AnimatedAvatarMessageCard } from './AnimatedAvatarMessageCard';
import { CapsuleMessageCard } from './CapsuleMessageCard';
import { EmotionalAmbienceOverlay } from './EmotionalAmbienceOverlay';
import { ChatMediaGalleryModal } from './ChatMediaGalleryModal';
import { GroupGamesModal } from './GroupGamesModal';
import { EMOTIONAL_MODES, playThemeSoundEffect } from '../utils/chatThemes';
import { applyAutoCorrect } from '../utils/autocorrectUtils';
import { realtimeClient } from '../services/realtimeClient';

interface ChatViewProps {
  chat: Chat;
  user: UserProfile;
  wallpapers: Wallpaper[];
  allContacts?: Chat[];
  isNightMode?: boolean;
  onToggleNightMode?: () => void;
  onBack: () => void;
  onSendMessage: (chatId: string, message: Partial<Message>) => void;
  onAddReaction: (chatId: string, messageId: string, emoji: string) => void;
  onTyping?: (isTyping: boolean) => void;
  onSelectWallpaper?: (id: string, customUrl?: string) => void;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onBlockContact?: (chatId: string) => void;
  onUnblockContact?: (chatId: string) => void;
  onToggleDoNotDisturb?: (duration?: string) => void;
  onOpenWaitingRoom?: () => void;
  onAddContactAsFriend?: (chatId: string) => void;
  onRemoveFriend?: (chatId: string) => void;
  onOpenAddFriend?: () => void;
  onDeleteMessage?: (chatId: string, messageId: string) => void;
  onClearChatMessages?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onUpdateGroupMembers?: (chatId: string, updatedMembers: GroupMember[]) => void;
  onUpdateGroupAvatar?: (chatId: string, newAvatarUrl: string) => void;
  onLeaveGroup?: (chatId: string) => void;
  onOpenTimeCapsule?: () => void;
  onSelectGradient?: (chatId: string, gradient: string) => void;
  onUpdatePersonalityTheme?: (chatId: string, theme: ChatPersonalityTheme) => void;
  onUpdateEmotionalMode?: (chatId: string, mode: EmotionalMode) => void;
  onUnlockCapsuleMessage?: (chatId: string, messageId: string) => void;
  onStartPrivateChat?: (memberId: string, memberName: string) => void;
  onForwardMessage?: (targetChatId: string, message: Message) => void;
  onExportChat?: (chat: Chat) => void;
  onStartCall?: (chat: Chat, isVideo: boolean) => void;
  deviceMode?: 'mobile' | 'desktop' | 'tablet';
}

interface VideoPreview {
  platform: 'youtube' | 'tiktok' | 'facebook' | 'generic';
  url: string;
  videoId?: string;
  thumbnailUrl?: string;
  title?: string;
}

function parseVideoLink(text: string): VideoPreview | null {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  if (!matches) return null;

  for (const url of matches) {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      const vidId = ytMatch[1];
      return {
        platform: 'youtube',
        url,
        videoId: vidId,
        thumbnailUrl: `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`,
        title: 'Video de YouTube',
      };
    }
    // TikTok
    if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) {
      return {
        platform: 'tiktok',
        url,
        title: 'Video de TikTok',
        thumbnailUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&auto=format&fit=crop&q=80',
      };
    }
    // Facebook
    if (url.includes('facebook.com') || url.includes('fb.watch')) {
      return {
        platform: 'facebook',
        url,
        title: 'Video de Facebook',
        thumbnailUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
      };
    }
    // Generic video
    if (url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm') || url.includes('video') || url.includes('watch')) {
      return {
        platform: 'generic',
        url,
        title: 'Video compartido',
        thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
      };
    }
  }
  return null;
}

import { BirdLogo } from './BirdLogo';

export const ChatView: React.FC<ChatViewProps> = ({
  chat,
  user,
  wallpapers,
  allContacts = [],
  isNightMode = false,
  onToggleNightMode,
  onBack,
  onSendMessage,
  onAddReaction,
  onTyping,
  onSelectWallpaper,
  onUpdateUser,
  onBlockContact,
  onUnblockContact,
  onToggleDoNotDisturb,
  onOpenWaitingRoom,
  onAddContactAsFriend,
  onRemoveFriend,
  onOpenAddFriend,
  onDeleteMessage,
  onClearChatMessages,
  onDeleteChat,
  onUpdateGroupMembers,
  onUpdateGroupAvatar,
  onLeaveGroup,
  onOpenTimeCapsule,
  onSelectGradient,
  onUpdatePersonalityTheme,
  onUpdateEmotionalMode,
  onUnlockCapsuleMessage,
  onStartPrivateChat,
  onForwardMessage,
  onExportChat,
  onStartCall,
  deviceMode = 'desktop',
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState<boolean>(false);
  const [showChatThemeModal, setShowChatThemeModal] = useState<boolean>(false);
  const [showAvatarStudio, setShowAvatarStudio] = useState<boolean>(false);
  const [showStickerFactory, setShowStickerFactory] = useState<boolean>(false);
  const [showMediaGallery, setShowMediaGallery] = useState<boolean>(false);
  const [showGroupGames, setShowGroupGames] = useState<boolean>(false);
  const [initialGroupGameType, setInitialGroupGameType] = useState<GroupGameType | null>(null);
  const [burstTrigger, setBurstTrigger] = useState<{
    id: number;
    effect: NonNullable<ChatPersonalityTheme['sendEffect']>;
  } | null>(null);
  const [showPrivateMessageModal, setShowPrivateMessageModal] = useState<boolean>(false);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [copiedRoomLink, setCopiedRoomLink] = useState<boolean>(false);
  const [showSecurityPopover, setShowSecurityPopover] = useState<boolean>(false);
  const [showBlockModal, setShowBlockModal] = useState<boolean>(false);
  const [showRemoveFriendModal, setShowRemoveFriendModal] = useState<boolean>(false);
  const [showClearChatModal, setShowClearChatModal] = useState<boolean>(false);
  const [showGroupMembersModal, setShowGroupMembersModal] = useState<boolean>(false);
  const [openGroupAddMember, setOpenGroupAddMember] = useState<boolean>(false);
  const [showGroupAvatarModal, setShowGroupAvatarModal] = useState<boolean>(false);
  const [showVideoLinkModal, setShowVideoLinkModal] = useState<boolean>(false);
  const [videoLinkInput, setVideoLinkInput] = useState<string>('');
  const [videoLinkCaption, setVideoLinkCaption] = useState<string>('');
  const [activeVideoModalUrl, setActiveVideoModalUrl] = useState<string | null>(null);
  const [showWallpaperDrawer, setShowWallpaperDrawer] = useState<boolean>(false);
  const [showAttachSheet, setShowAttachSheet] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);
  const [showCameraChoice, setShowCameraChoice] = useState<boolean>(false);
  const [cameraFilterMode, setCameraFilterMode] = useState<'with_filter' | 'no_filter'>('with_filter');
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [activeMediaModal, setActiveMediaModal] = useState<{
    url: string;
    type: 'image' | 'video';
    name?: string;
    size?: string;
  } | null>(null);
  const [callConfig, setCallConfig] = useState<{ isOpen: boolean; isVideo: boolean }>({
    isOpen: false,
    isVideo: false,
  });
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerChatEffects = () => {
    const snd = chat.personalityTheme?.soundPack;
    if (snd && snd !== 'default') {
      playThemeSoundEffect(snd, 'send');
    }
    const eff = chat.personalityTheme?.sendEffect;
    if (eff && eff !== 'none') {
      setBurstTrigger({ id: Date.now(), effect: eff });
    }
  };

  const activeEmotionSpec = EMOTIONAL_MODES.find((m) => m.id === (chat.emotionalMode || 'neutral'));
  const dynamicReactions =
    chat.emotionalMode && chat.emotionalMode !== 'neutral' && activeEmotionSpec
      ? activeEmotionSpec.reactions.map((r) => ({
          key: r.emoji,
          label: r.label,
          icon: <span className="text-sm leading-none">{r.emoji}</span>,
        }))
      : REACTION_OPTIONS;

  const handleCopyRoomLink = () => {
    const roomCode = chat.roomId || chat.id;
    const inviteUrl = `${window.location.origin}/?room=${encodeURIComponent(roomCode)}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedRoomLink(true);
      setTimeout(() => setCopiedRoomLink(false), 2500);
    });
  };

  // Get active wallpaper URL
  const activeWallpaper =
    wallpapers.find((w) => w.id === (chat.customWallpaperId || user.wallpaperId)) ||
    wallpapers[0];

  const wallpaperBackgroundUrl =
    chat.customWallpaperId === 'custom' && chat.customWallpaperUrl
      ? chat.customWallpaperUrl
      : user.wallpaperId === 'custom' && user.customWallpaperUrl
      ? user.customWallpaperUrl
      : activeWallpaper?.url || wallpapers[0]?.url;

  const [liveGroupGame, setLiveGroupGame] = useState<NonNullable<Chat['activeGroupGame']> | null>(
    chat.activeGroupGame || null
  );

  useEffect(() => {
    setLiveGroupGame(chat.activeGroupGame || null);
  }, [chat.id, chat.activeGroupGame]);

  useEffect(() => {
    if (chat.type !== 'group') return;
    let cancelled = false;
    fetch(`/api/group-games/${encodeURIComponent(chat.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const gs = data?.gameState;
        if (gs && gs.status !== 'finished') {
          setLiveGroupGame({
            gameId: gs.gameId,
            gameType: gs.gameType,
            title: gs.title,
            hostName: gs.hostName,
            status: gs.status,
            playerCount: (gs.players || []).length,
            updatedAt: gs.updatedAt,
          });
        }
      })
      .catch(() => {});

    const unsub = realtimeClient.subscribeGame((roomId, event) => {
      if (roomId !== chat.id) return;
      const gs = event?.gameState;
      if (!gs || gs.status === 'finished') {
        setLiveGroupGame(null);
      } else {
        setLiveGroupGame({
          gameId: gs.gameId,
          gameType: gs.gameType,
          title: gs.title,
          hostName: gs.hostName,
          status: gs.status,
          playerCount: (gs.players || []).length,
          updatedAt: gs.updatedAt,
        });
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [chat.id, chat.type]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, isRecordingVoice]);

  const handleSendTextMessage = (textToSend?: string) => {
    let text = textToSend || inputText;
    if (!text.trim()) return;

    if (user.autoCorrectEnabled !== false) {
      const { correctedText } = applyAutoCorrect(text);
      text = correctedText;
    }

    onSendMessage(chat.id, {
      senderId: 'me',
      senderName: user.name,
      senderAvatar: user.avatarUrl,
      type: 'text',
      text: text.trim(),
      emotionTag: chat.emotionalMode && chat.emotionalMode !== 'neutral' ? chat.emotionalMode : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    });
    triggerChatEffects();

    setInputText('');
    setShowAttachSheet(false);
    setShowEmojiPicker(false);
  };

  const handleSendPhoto = (
    photoUrl: string,
    caption: string,
    _filter: string,
    fileName: string,
    mediaType: 'image' | 'video' = 'image',
    thumbnailUrl?: string,
    mediaSize?: string
  ) => {
    onSendMessage(chat.id, {
      senderId: 'me',
      senderName: user.name,
      type: mediaType,
      mediaUrl: photoUrl,
      thumbnailUrl,
      mediaName: fileName,
      mediaSize: mediaSize || (mediaType === 'video' ? 'Video' : 'Foto'),
      text: caption || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    });
  };

  const handleSendVoice = (durationText: string, audioBlobUrl?: string, voiceFilter?: 'normal' | 'chipmunk' | 'robot' | 'deep') => {
    onSendMessage(chat.id, {
      senderId: 'me',
      senderName: user.name,
      type: 'voice',
      mediaDuration: durationText,
      mediaUrl: audioBlobUrl,
      voiceFilter: voiceFilter !== 'normal' ? voiceFilter : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    });
    setIsRecordingVoice(false);
  };

  const handleSendSticker = (sticker: StickerItem) => {
    onSendMessage(chat.id, {
      senderId: 'me',
      senderName: user.name,
      type: 'sticker',
      stickerId: sticker.id,
      stickerTitle: sticker.title,
      stickerSubtitle: sticker.subtitle,
      stickerUrl: sticker.imageUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    });
  };

  const handleSendGif = (gif: GifItem) => {
    onSendMessage(chat.id, {
      senderId: 'me',
      senderName: user.name,
      type: 'gif',
      mediaUrl: gif.url,
      mediaName: gif.title,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    });
  };

  const handleVoiceCall = () => {
    if (chat.type === 'group') {
      onSendMessage(chat.id, {
        senderId: 'me',
        senderName: user.name,
        senderAvatar: user.avatarUrl,
        type: 'text',
        text: `¡${user.name} ha iniciado una llamada de voz grupal!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: true,
      });
    } else {
      onSendMessage(chat.id, {
        senderId: 'me',
        senderName: user.name,
        senderAvatar: user.avatarUrl,
        type: 'text',
        text: `¡${user.name} ha iniciado una llamada de voz!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: true,
      });
    }
    if (onStartCall) {
      onStartCall(chat, false);
    } else {
      setCallConfig({ isOpen: true, isVideo: false });
    }
  };

  const handleVideoCall = () => {
    if (chat.type === 'group') {
      onSendMessage(chat.id, {
        senderId: 'me',
        senderName: user.name,
        senderAvatar: user.avatarUrl,
        type: 'text',
        text: `¡${user.name} ha iniciado una videollamada grupal!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: true,
      });
    } else {
      onSendMessage(chat.id, {
        senderId: 'me',
        senderName: user.name,
        senderAvatar: user.avatarUrl,
        type: 'text',
        text: `¡${user.name} ha iniciado una videollamada!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: true,
      });
    }
    if (onStartCall) {
      onStartCall(chat, true);
    } else {
      setCallConfig({ isOpen: true, isVideo: true });
    }
  };

  return (
    <div className={`relative flex flex-col w-full h-full min-h-screen transition-colors duration-300 ${
      isNightMode ? 'bg-[#0f131c] text-[#dfe2ee]' : 'bg-[#e0f2fe] text-[#0c2340]'
    }`}>
      {/* 1. App Navigation Header: Uncluttered Mobile vs Full Desktop */}
      {deviceMode === 'mobile' ? (
        <header className={`sticky top-0 w-full z-40 border-b transition-colors duration-200 ${
          chat.headerGradient ? `bg-gradient-to-r ${chat.headerGradient} text-white border-white/10` : isNightMode ? 'bg-[#121722] border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className="h-14 px-3 flex items-center justify-between gap-2">
            {/* Back + Contact Info */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={onBack}
                aria-label="Volver"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 active:scale-95 cursor-pointer ${
                  isNightMode ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div
                onClick={chat.type === 'group' ? () => setShowGroupAvatarModal(true) : undefined}
                title={chat.type === 'group' ? 'Personalizar foto del grupo' : undefined}
                className={`relative shrink-0 ${chat.type === 'group' ? 'cursor-pointer group/grpav' : ''}`}
              >
                <img
                  src={chat.avatarUrl}
                  alt={chat.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
                {chat.type === 'group' ? (
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#0284c7] text-white rounded-full flex items-center justify-center ring-2 ring-[#121722]">
                    <Camera className="w-2.5 h-2.5" />
                  </span>
                ) : (
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ${isNightMode ? 'ring-[#121722]' : 'ring-white'}`} />
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`font-semibold text-sm truncate leading-tight ${isNightMode ? 'text-white' : 'text-slate-900'}`}>
                    {chat.name}
                  </span>
                  {chat.isVerified && <Check className="w-3.5 h-3.5 text-[#0284c7] stroke-[2.5] shrink-0" />}
                </div>
                <span className={`text-[11px] truncate leading-none ${isNightMode ? 'text-[#94a3b8]' : 'text-slate-500'}`}>
                  {chat.phone || 'En línea'}
                </span>
              </div>
            </div>

            {/* Mobile Actions: Voice Call, Video Call, and 3-dots Menu */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleVoiceCall}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95 cursor-pointer ${
                  isNightMode ? 'text-[#dfe2ee] hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="Llamada de voz"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleVideoCall}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95 cursor-pointer ${
                  isNightMode ? 'text-[#dfe2ee] hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="Videollamada"
              >
                <VideoIcon className="w-4 h-4" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMobileMoreMenu(!showMobileMoreMenu)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95 cursor-pointer ${
                    isNightMode ? 'text-[#dfe2ee] hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Más opciones"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMobileMoreMenu && (
                  <div
                    className="fixed inset-0 z-50 bg-black/40"
                    onClick={() => setShowMobileMoreMenu(false)}
                  >
                    <div
                      className="absolute right-3 top-14 w-60 p-1.5 rounded-2xl bg-[#181e2c] border border-white/10 shadow-2xl z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {chat.type === 'group' && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowGroupAvatarModal(true);
                            setShowMobileMoreMenu(false);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl text-xs font-medium text-cyan-300 hover:text-white hover:bg-cyan-500/20 flex items-center gap-2.5 text-left cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-cyan-400" />
                          <span>Personalizar foto del grupo</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setInitialGroupGameType(null);
                          setShowGroupGames(true);
                          setShowMobileMoreMenu(false);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-medium text-emerald-300 hover:text-white hover:bg-emerald-500/20 flex items-center gap-2.5 text-left cursor-pointer"
                      >
                        <Gamepad2 className="w-4 h-4 text-emerald-400" />
                        <span>Juegos Grupales en Vivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowMediaGallery(true);
                          setShowMobileMoreMenu(false);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-medium text-amber-300 hover:text-white hover:bg-amber-500/20 flex items-center gap-2.5 text-left cursor-pointer"
                      >
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                        <span>Álbum de Recuerdos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowChatThemeModal(true);
                          setShowMobileMoreMenu(false);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-medium text-purple-300 hover:text-white hover:bg-purple-500/20 flex items-center gap-2.5 text-left cursor-pointer"
                      >
                        <Palette className="w-4 h-4 text-purple-400" />
                        <span>Personalidad y Emoción</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowWallpaperDrawer(true);
                          setShowMobileMoreMenu(false);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-medium text-gray-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 text-left cursor-pointer"
                      >
                        <WallpaperIcon className="w-4 h-4 text-sky-400" />
                        <span>Fondo de pantalla</span>
                      </button>

                      {onToggleNightMode && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleNightMode();
                            setShowMobileMoreMenu(false);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl text-xs font-medium text-gray-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 text-left cursor-pointer"
                        >
                          <Moon className="w-4 h-4 text-amber-400" />
                          <span>Modo {isNightMode ? 'claro' : 'nocturno'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onExportChat?.(chat);
                          setShowMobileMoreMenu(false);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-medium text-gray-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 text-left cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-sky-400" />
                        <span>Exportar chat</span>
                      </button>

                      {onOpenWaitingRoom && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenWaitingRoom();
                            setShowMobileMoreMenu(false);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl text-xs font-medium text-emerald-400 hover:bg-emerald-500/15 flex items-center gap-2.5 text-left cursor-pointer"
                        >
                          <Trophy className="w-4 h-4" />
                          <span>Sala de Espera</span>
                        </button>
                      )}

                      <div className="my-1 border-t border-white/10" />

                      {onClearChatMessages && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowClearChatModal(true);
                            setShowMobileMoreMenu(false);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2.5 text-left cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Vaciar conversación</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowBlockModal(true);
                          setShowMobileMoreMenu(false);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2.5 text-left cursor-pointer"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Bloquear contacto</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      ) : (
        <header className={`sticky top-0 w-full z-40 border-b transition-colors duration-200 ${
          chat.headerGradient ? `bg-gradient-to-r ${chat.headerGradient} text-white border-white/10` : isNightMode ? 'bg-[#121722] border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              aria-label="Volver a chats"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isNightMode ? 'text-[#dfe2ee] hover:bg-white/10' : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <BirdLogo className="w-7 h-7" />
            <h1 className={`text-base font-semibold tracking-tight ${isNightMode ? 'text-[#eef2f8]' : 'text-slate-900'}`}>
              Conversación
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {onToggleNightMode && (
              <button
                onClick={onToggleNightMode}
                aria-label={isNightMode ? "Cambiar a modo claro" : "Cambiar a modo nocturno"}
                title={isNightMode ? "Cambiar a modo claro" : "Activar modo nocturno"}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isNightMode
                    ? 'bg-[#1d2536] text-amber-300 hover:bg-[#263147]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Moon className={`w-4 h-4 ${isNightMode ? 'fill-amber-300 text-amber-300' : 'text-slate-700'}`} />
              </button>
            )}
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
        </div>

        {/* 2. Chat Contact Bar */}
        <div className={`px-4 py-2 flex items-center justify-between border-t transition-colors ${
          isNightMode ? 'bg-[#161c29] border-white/5' : 'bg-slate-50 border-slate-200/80'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              onClick={chat.type === 'group' ? () => setShowGroupAvatarModal(true) : undefined}
              title={chat.type === 'group' ? 'Personalizar foto del grupo' : undefined}
              className={`relative shrink-0 ${chat.type === 'group' ? 'cursor-pointer group/grpav' : ''}`}
            >
              <img
                src={chat.avatarUrl}
                alt={chat.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              {chat.type === 'group' ? (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#0284c7] text-white rounded-full flex items-center justify-center ring-2 ring-[#161c29]">
                  <Camera className="w-2.5 h-2.5" />
                </span>
              ) : (
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ${isNightMode ? 'ring-[#161c29]' : 'ring-slate-50'}`} />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`font-semibold text-sm truncate ${isNightMode ? 'text-[#eef2f8]' : 'text-slate-900'}`}>
                  {chat.name}
                </span>
                {chat.isVerified && (
                  <Check className="w-3.5 h-3.5 text-[#0284c7] stroke-[2.5] shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {chat.isBlocked ? (
                  <span className="text-[11px] font-medium text-red-500">
                    Contacto bloqueado
                  </span>
                ) : (
                  <>
                    <span className={`text-[11px] ${isNightMode ? 'text-[#94a3b8]' : 'text-slate-500'}`}>
                      {chat.phone ? chat.phone : 'En línea'}
                    </span>
                    {user.doNotDisturb && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-medium">
                        • <BellOff className="w-2.5 h-2.5" /> No Molestar
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons on contact bar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {chat.type === 'group' && (
              <>
                <button
                  onClick={() => {
                    setOpenGroupAddMember(true);
                    setShowGroupMembersModal(true);
                  }}
                  title="Agregar gente al grupo"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Agregar</span>
                </button>
                <button
                  onClick={() => setShowGroupAvatarModal(true)}
                  title="Personalizar foto del grupo"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Foto</span>
                </button>
                <button
                  onClick={() => {
                    setOpenGroupAddMember(false);
                    setShowGroupMembersModal(true);
                  }}
                  title="Ver integrantes del grupo"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-white" />
                  <span>{chat.groupMembers?.length || 1}</span>
                </button>
              </>
            )}

            {!chat.isFriend && !chat.isBlocked && chat.type !== 'group' && onAddContactAsFriend && (
              <button
                onClick={() => onAddContactAsFriend(chat.id)}
                aria-label="Agregar a mis amigos"
                title="Agregar contacto a mis amigos"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-white" />
                <span>Agregar</span>
              </button>
            )}

            <button
              onClick={() => {
                setInitialGroupGameType(null);
                setShowGroupGames(true);
              }}
              aria-label="Juegos Grupales"
              title="Juegos Grupales en Vivo (Trivia, Pictionary, Verdad o Reto)"
              className="flex items-center gap-1.5 px-2.5 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold transition-colors cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4" />
              <span className="hidden sm:inline">Juegos</span>
            </button>
            <button
              onClick={() => setShowMediaGallery(true)}
              aria-label="Álbum de Recuerdos"
              title="Álbum Inteligente de Recuerdos"
              className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 hover:bg-amber-500/25 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowChatThemeModal(true)}
              aria-label="Personalidad y Emoción"
              title="Tema, Burbujas y Chat Emocional"
              className="w-9 h-9 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 hover:bg-purple-500/25 transition-colors cursor-pointer"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowWallpaperDrawer(true)}
              aria-label="Cambiar fondo"
              title="Cambiar fondo de pantalla"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-sm ${
                isNightMode
                  ? 'bg-[#262a33] text-[#dfe2ee] hover:bg-[#353942] hover:text-[#7bd0ff]'
                  : 'bg-white text-sky-800 border border-sky-200 hover:bg-sky-100 hover:text-sky-950'
              }`}
            >
              <WallpaperIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onExportChat?.(chat)}
              aria-label="Exportar chat"
              title="Exportar historial de chat (TXT)"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-sm ${
                isNightMode
                  ? 'bg-[#262a33] text-[#dfe2ee] hover:bg-[#353942] hover:text-emerald-400'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 hover:text-emerald-950'
              }`}
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleVoiceCall}
              aria-label="Llamada de voz"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer ${
                isNightMode ? 'bg-[#262a33] text-[#dfe2ee] hover:bg-[#353942]' : 'bg-white text-sky-800 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={handleVideoCall}
              aria-label="Videollamada"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer ${
                isNightMode ? 'bg-[#262a33] text-[#dfe2ee] hover:bg-[#353942]' : 'bg-white text-sky-800 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              <VideoIcon className="w-4 h-4" />
            </button>

            {onClearChatMessages && (
              <button
                onClick={() => setShowClearChatModal(true)}
                aria-label="Vaciar conversación"
                title="Vaciar todos los mensajes de esta conversación"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                  isNightMode
                    ? 'bg-red-950/40 text-red-300 hover:bg-red-900/60 hover:text-red-200'
                    : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSecurityPopover(!showSecurityPopover);
                }}
                aria-label="Seguridad y Cifrado"
                className="w-9 h-9 rounded-full bg-[#93000a]/20 text-[#ffb4ab] flex items-center justify-center hover:bg-[#93000a]/35 transition-colors"
              >
                <Shield className="w-4 h-4" />
              </button>

              {/* Security popover */}
              {showSecurityPopover && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-56 p-2 bg-[#262a33] border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-[#8d90a0] uppercase tracking-wider">
                    Opciones & Privacidad
                  </div>
                  {onOpenWaitingRoom && (
                    <button
                      onClick={() => {
                        setShowSecurityPopover(false);
                        onOpenWaitingRoom();
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-emerald-300 hover:bg-emerald-500/15 flex items-center gap-2 cursor-pointer"
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sala De Espera (Mini Juegos)</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowWallpaperDrawer(true);
                      setShowSecurityPopover(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#dfe2ee] hover:bg-white/5 flex items-center gap-2 cursor-pointer"
                  >
                    <WallpaperIcon className="w-3.5 h-3.5 text-[#7bd0ff]" />
                    <span>Cambiar fondo de pantalla</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowChatThemeModal(true);
                      setShowSecurityPopover(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#dfe2ee] hover:bg-white/5 flex items-center gap-2 cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-purple-400" />
                    <span>Cambiar Tema del Chat</span>
                  </button>
                  <button
                    onClick={() => setShowSecurityPopover(false)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#dfe2ee] hover:bg-white/5 flex items-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Cifrado extremo a extremo</span>
                  </button>
                  <button
                    onClick={() => setShowSecurityPopover(false)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#dfe2ee] hover:bg-white/5 flex items-center gap-2"
                  >
                    <Timer className="w-3.5 h-3.5 text-[#8d90a0]" />
                    <span>Mensajes temporales</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onToggleDoNotDisturb) {
                        onToggleDoNotDisturb();
                      }
                      setShowSecurityPopover(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      user.doNotDisturb
                        ? 'text-amber-300 bg-amber-500/15 hover:bg-amber-500/25'
                        : 'text-[#dfe2ee] hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {user.doNotDisturb ? (
                        <BellOff className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Bell className="w-3.5 h-3.5 text-[#8d90a0]" />
                      )}
                      <span>Modo No Molestar</span>
                    </div>
                    <span className="text-[10px] font-bold opacity-75">
                      {user.doNotDisturb ? 'ACTIVO' : 'OFF'}
                    </span>
                  </button>
                  {onClearChatMessages && (
                    <button
                      onClick={() => {
                        setShowSecurityPopover(false);
                        setShowClearChatModal(true);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/15 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Vaciar todos los mensajes (Borrar chat)</span>
                    </button>
                  )}
                  <div className="h-px bg-white/10 my-1" />
                  {!chat.isFriend && !chat.isBlocked && onAddContactAsFriend && (
                    <button
                      onClick={() => {
                        setShowSecurityPopover(false);
                        onAddContactAsFriend(chat.id);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#7bd0ff] hover:bg-[#2563eb]/20 flex items-center gap-2 cursor-pointer font-semibold"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>Agregar {chat.name} a mis amigos</span>
                    </button>
                  )}
                  {onOpenAddFriend && (
                    <button
                      onClick={() => {
                        setShowSecurityPopover(false);
                        onOpenAddFriend();
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#dfe2ee] hover:bg-white/5 flex items-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-[#7bd0ff]" />
                      <span>Agregar otro amigo (+)</span>
                    </button>
                  )}
                  {chat.type !== 'group' && chat.isFriend !== false && onRemoveFriend && (
                    <button
                      onClick={() => {
                        setShowSecurityPopover(false);
                        setShowRemoveFriendModal(true);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-amber-300 hover:bg-amber-500/15 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <UserMinus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Quitar de mis amigos</span>
                    </button>
                  )}
                  {chat.isBlocked ? (
                    <button
                      onClick={() => {
                        setShowSecurityPopover(false);
                        if (onUnblockContact) {
                          onUnblockContact(chat.id);
                        }
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#7bd0ff] hover:bg-[#2563eb]/20 flex items-center gap-2 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>Desbloquear y agregar a amigos</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowSecurityPopover(false);
                        setShowBlockModal(true);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#ffb4ab] hover:bg-[#93000a]/25 flex items-center gap-2 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Bloquear contacto</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      )}

      {/* 3. Conversation Thread with Wallpaper Background */}
      <main className="relative flex-1 w-full px-4 pt-3 pb-36 flex flex-col gap-3 overflow-y-auto transition-all duration-300">
        {wallpaperBackgroundUrl && (
          <img
            src={wallpaperBackgroundUrl}
            alt="Fondo de chat"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 transition-all duration-500"
            style={{
              filter: isNightMode
                ? 'invert(0.88) hue-rotate(180deg) brightness(0.65) contrast(1.1)'
                : 'none',
            }}
          />
        )}
        <EmotionalAmbienceOverlay
          emotionalMode={chat.emotionalMode}
          animatedBg={chat.personalityTheme?.animatedBg}
          burstTrigger={burstTrigger}
        />
        <div className="relative z-10 flex flex-col gap-3 w-full">
        {/* Blocked banner in conversation thread */}
        {chat.isBlocked && (
          <div className="self-center w-full max-w-md my-1 p-3.5 rounded-2xl bg-red-950/80 border border-red-500/30 text-center flex flex-col items-center gap-2 shadow-lg backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-red-300 text-xs font-bold">
              <Ban className="w-4 h-4 text-red-400" />
              <span>Contacto Bloqueado</span>
            </div>
            <p className="text-[11px] text-red-200/80 leading-relaxed">
              Has bloqueado a este usuario. Ya no está en tu lista de amigos y no podrán comunicarse.
            </p>
            {onUnblockContact && (
              <button
                onClick={() => onUnblockContact(chat.id)}
                className="mt-0.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Desbloquear y volver a agregar a amigos</span>
              </button>
            )}
          </div>
        )}

        {/* Unadded friend banner */}
        {!chat.isFriend && !chat.isBlocked && onAddContactAsFriend && (
          <div className="self-center w-full max-w-md my-1 p-3 rounded-2xl bg-sky-950/70 dark:bg-[#141d2e]/90 border border-sky-400/30 text-center flex items-center justify-between gap-3 shadow-lg backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 text-left min-w-0">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-sky-200 truncate">{chat.name}</span>
                <span className="text-[10px] text-sky-300/80 truncate">No está en tus amigos todavía</span>
              </div>
            </div>
            <button
              onClick={() => onAddContactAsFriend(chat.id)}
              className="px-3 py-1.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Agregar</span>
            </button>
          </div>
        )}

        {/* Date Divider */}
        <div className={`self-center px-3 py-1 rounded-lg border ${
          isNightMode ? 'bg-[#171d29] border-white/10 text-[#94a3b8]' : 'bg-white border-slate-200 text-slate-600'
        }`}>
          <span className="text-[11px] font-medium">Hoy</span>
        </div>

        {/* Active Group Game Live Banner */}
        {chat.type === 'group' && liveGroupGame && liveGroupGame.status !== 'finished' && (
          <div className="self-center w-full max-w-md my-1 p-3 rounded-2xl bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90 border border-white/20 text-white shadow-lg backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-extrabold truncate">
                  {liveGroupGame.title} (En vivo)
                </span>
                <span className="text-[11px] text-white/85 truncate">
                  Host: {liveGroupGame.hostName} • {liveGroupGame.playerCount} jugando
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setInitialGroupGameType(liveGroupGame.gameType);
                setShowGroupGames(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-extrabold shadow active:scale-95 transition-all cursor-pointer shrink-0"
            >
              ¡Unirse!
            </button>
          </div>
        )}

        {/* Realtime Live Room Banner */}
        {chat.isRealTime && (
          <div className="self-center w-full max-w-md my-1 p-3.5 rounded-xl bg-[#0e241b] border border-emerald-500/25 shadow flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Sala en vivo</span>
              <span className="text-[11px] font-medium text-emerald-400">
                {chat.onlineCount && chat.onlineCount > 0
                  ? `${chat.onlineCount} ${chat.onlineCount === 1 ? 'conectado' : 'conectados'}`
                  : 'Conectado'}
              </span>
            </div>
            <p className="text-xs text-[#a0b3aa] leading-relaxed">
              Conversa en directo o comparte el enlace para invitar amigos.
            </p>
            <button
              onClick={handleCopyRoomLink}
              className="w-full py-1.5 px-3 rounded-lg bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedRoomLink ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedRoomLink ? 'Enlace copiado' : 'Copiar enlace de invitación'}</span>
            </button>
          </div>
        )}

        {/* Messages List */}
        {chat.messages.map((msg) => {
          if (msg.senderId === 'system') {
            return (
              <div key={msg.id} className="w-full flex justify-center my-1.5 px-3">
                <div
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-medium text-center border backdrop-blur-sm shadow-xs max-w-[90%] ${
                    isNightMode
                      ? 'bg-white/10 border-white/10 text-[#cbd5e1]'
                      : 'bg-sky-100/90 border-sky-200/80 text-slate-700'
                  }`}
                >
                  <span>{msg.text}</span>
                  {msg.timestamp && (
                    <span className="ml-2 text-[10px] opacity-65">{msg.timestamp}</span>
                  )}
                </div>
              </div>
            );
          }

          const isMe = msg.senderId === 'me' || msg.senderId === user.id;

          return (
            <div
              key={msg.id}
              onMouseEnter={() => setHoveredMessageId(msg.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
              className={`relative flex flex-col max-w-[85%] group rounded-2xl transition-all ${
                isMe ? 'self-end items-end' : 'self-start items-start'
              }`}
            >
              {/* Real Person / Group Member Identity */}
              {!isMe && (chat.isRealTime || chat.type === 'group') && (
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  {msg.senderAvatar ? (
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName || 'Usuario'}
                      className="w-4 h-4 rounded-full object-cover ring-1 ring-white/10"
                    />
                  ) : null}
                  <span
                    className={`text-[11px] font-semibold ${
                      chat.isRealTime ? 'text-[#10b981]' : isNightMode ? 'text-[#7bd0ff]' : 'text-sky-700'
                    }`}
                  >
                    {msg.senderName || 'Persona Real'}
                  </span>
                </div>
              )}
              {/* Quick Reactions Bar on Hover / Active */}
              {hoveredMessageId === msg.id && (
                <div
                  className={`absolute -top-7 ${
                    isMe ? 'right-2' : 'left-2'
                  } z-30 bg-[#1c2028]/95 border border-white/10 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-lg backdrop-blur-md animate-in fade-in duration-150`}
                >
                  {dynamicReactions.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => onAddReaction(chat.id, msg.id, item.key)}
                      className="p-1 rounded-full hover:bg-white/10 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer"
                      title={item.label}
                    >
                      {item.icon}
                    </button>
                  ))}

                  {onDeleteMessage && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setForwardingMessage(msg)}
                        title="Reenviar mensaje"
                        className="p-1 text-sky-400 hover:text-sky-200 hover:bg-sky-500/20 rounded-full transition-all cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteMessage(chat.id, msg.id)}
                        title="Eliminar mensaje"
                        className="p-1 text-red-400 hover:text-red-200 hover:bg-red-500/20 rounded-full transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Message Content according to Type */}
              {msg.type === 'text' && (() => {
                const videoPreview = parseVideoLink(msg.text || '');
                const customTheme = chat.personalityTheme;
                const bubbleStyle = customTheme
                  ? isMe
                    ? { backgroundColor: customTheme.bubbleMeBg, color: customTheme.bubbleMeText }
                    : { backgroundColor: customTheme.bubbleThemBg, color: customTheme.bubbleThemText }
                  : undefined;

                return (
                  <div
                    style={bubbleStyle}
                    className={`rounded-2xl px-3.5 py-2.5 shadow-sm transition-colors ${
                      customTheme
                        ? isMe
                          ? 'rounded-br-sm'
                          : 'rounded-bl-sm border border-white/10'
                        : isMe
                        ? 'bg-[#0284c7] text-white rounded-br-sm'
                        : isNightMode
                        ? 'bg-[#1c2331] text-[#eef2f8] rounded-bl-sm border border-white/10'
                        : 'bg-white text-slate-900 rounded-bl-sm border border-slate-200'
                    }`}
                  >
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    {videoPreview && (
                      <div
                        className="mt-2.5 rounded-xl overflow-hidden bg-black/40 border border-white/10 group/vidcard cursor-pointer"
                        onClick={() => {
                          if (videoPreview.platform === 'youtube' && videoPreview.videoId) {
                            setActiveVideoModalUrl(`https://www.youtube.com/embed/${videoPreview.videoId}?autoplay=1`);
                          } else {
                            window.open(videoPreview.url, '_blank');
                          }
                        }}
                      >
                        <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                          {videoPreview.thumbnailUrl && (
                            <img
                              src={videoPreview.thumbnailUrl}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover group-hover/vidcard:scale-105 transition-transform duration-300 opacity-90"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-red-600 group-hover/vidcard:bg-red-500 text-white flex items-center justify-center shadow-lg group-hover/vidcard:scale-110 transition-transform">
                              <Play className="w-6 h-6 fill-white ml-0.5" />
                            </div>
                          </div>
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 shadow-sm">
                            {videoPreview.platform === 'youtube' && <span className="text-red-500 font-extrabold flex items-center gap-1">▶ YouTube</span>}
                            {videoPreview.platform === 'tiktok' && <span className="text-pink-400 font-extrabold flex items-center gap-1"><TikTokVectorIcon className="w-3 h-3" /> TikTok</span>}
                            {videoPreview.platform === 'facebook' && <span className="text-blue-400 font-extrabold flex items-center gap-1"><FacebookVectorIcon className="w-3 h-3" /> Facebook</span>}
                            {videoPreview.platform === 'generic' && <span className="text-sky-400 font-extrabold flex items-center gap-1"><VideoIcon className="w-3 h-3" /> Video</span>}
                          </div>
                        </div>
                        <div className="p-2 bg-[#181c24] flex items-center justify-between text-xs">
                          <span className="font-medium text-[#dfe2ee] truncate">{videoPreview.url}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#8d90a0] shrink-0 ml-2" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <span className={`text-[10px] ${isMe ? 'text-white/80' : isNightMode ? 'text-[#8d90a0]' : 'text-sky-700/70'}`}>
                        {msg.timestamp}
                      </span>
                      {isMe && (
                        <CheckCheck className="w-3.5 h-3.5 text-white inline" />
                      )}
                      {onDeleteMessage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteMessage(chat.id, msg.id);
                          }}
                          title="Borrar este mensaje"
                          className="ml-1 p-0.5 text-red-300 hover:text-red-100 opacity-70 hover:opacity-100 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {msg.type === 'image' && (
                <div className="rounded-2xl p-1.5 bg-[#262a33]/90 shadow-md backdrop-blur-md border border-white/5 overflow-hidden">
                  <div
                    onClick={() =>
                      setActiveMediaModal({
                        url: msg.mediaUrl || '',
                        type: 'image',
                        name: msg.mediaName,
                        size: msg.mediaSize,
                      })
                    }
                    className="relative cursor-pointer group/img overflow-hidden rounded-xl"
                  >
                    <img
                      src={msg.mediaUrl}
                      alt={msg.mediaName || 'Foto'}
                      className="w-full max-h-56 object-cover rounded-xl transition-transform duration-300 group-hover/img:scale-102"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 text-xs text-white backdrop-blur-md">
                        Ver en grande
                      </span>
                    </div>
                  </div>
                  {msg.text && (
                    <p className="px-2 py-1 text-xs text-[#dfe2ee] font-medium">{msg.text}</p>
                  )}
                  <div className="px-2 py-1 flex items-center justify-between text-xs text-[#c3c6d7]">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span className="font-semibold text-[11px] truncate">
                        {msg.mediaName || 'Foto adjunta'}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8d90a0] shrink-0">{msg.mediaSize}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 px-2 pb-0.5">
                    <span className="text-[10px] text-[#8d90a0]">{msg.timestamp}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-[#38bdf8]" />}
                    {onDeleteMessage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMessage(chat.id, msg.id);
                        }}
                        title="Borrar este mensaje"
                        className="ml-1 p-0.5 text-red-400 hover:text-red-200 opacity-70 hover:opacity-100 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {msg.type === 'sticker' && (() => {
                const foundSticker = STICKERS.find((s) => s.id === msg.stickerId);
                const stickerUrl = msg.stickerUrl || foundSticker?.imageUrl || '/assets/aistudio/sticker_1_e00d29e3.png';
                const stickerTitle = msg.stickerTitle || foundSticker?.title || 'Sticker';
                return (
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1`}>
                    <div className="relative group cursor-pointer">
                      <img
                        src={stickerUrl}
                        alt={stickerTitle}
                        className="w-40 h-40 max-w-[180px] max-h-[180px] object-contain drop-shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-[10px] text-[#8d90a0]">{msg.timestamp}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-[#38bdf8]" />}
                      {onDeleteMessage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteMessage(chat.id, msg.id);
                          }}
                          title="Borrar este mensaje"
                          className="ml-1 p-0.5 text-red-400 hover:text-red-200 opacity-70 hover:opacity-100 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {msg.type === 'gif' && (
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1`}>
                  <div
                    onClick={() =>
                      setActiveMediaModal({
                        url: msg.mediaUrl || '',
                        type: 'image',
                        name: msg.mediaName || 'GIF animado',
                      })
                    }
                    className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-black/20 hover:scale-[1.03] active:scale-95 transition-all duration-200"
                  >
                    <img
                      src={msg.mediaUrl}
                      alt={msg.mediaName || 'GIF animado'}
                      className="max-w-[240px] sm:max-w-[270px] max-h-60 object-cover rounded-2xl"
                    />
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[9px] font-bold text-[#38bdf8] border border-white/15">
                      GIF
                    </span>
                  </div>
                  <div className="flex items-center gap-1 px-1">
                    <span className="text-[10px] text-[#8d90a0]">{msg.timestamp}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-[#38bdf8]" />}
                    {onDeleteMessage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMessage(chat.id, msg.id);
                        }}
                        title="Borrar este mensaje"
                        className="ml-1 p-0.5 text-red-400 hover:text-red-200 opacity-70 hover:opacity-100 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {msg.type === 'voice' && (
                <div
                  className={`rounded-2xl p-2.5 shadow-md backdrop-blur-md ${
                    isMe
                      ? 'bg-[#2563eb] text-white rounded-br-sm'
                      : 'bg-[#262a33]/90 text-[#dfe2ee] rounded-bl-sm border border-white/5'
                  }`}
                >
                  <VoicePlayer
                    durationText={msg.mediaDuration}
                    audioUrl={msg.mediaUrl}
                    isSender={isMe}
                    voiceFilter={msg.voiceFilter}
                  />
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className={`text-[10px] ${isMe ? 'text-white/75' : 'text-[#8d90a0]'}`}>
                      {msg.timestamp}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3 text-[#38bdf8]" />}
                    {onDeleteMessage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMessage(chat.id, msg.id);
                        }}
                        title="Borrar este mensaje"
                        className="ml-1 p-0.5 text-red-300 hover:text-red-100 opacity-70 hover:opacity-100 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}



              {msg.type === 'private' && msg.privateData && (
                <div
                  className={`rounded-2xl p-3 shadow-md backdrop-blur-md ${
                    isMe
                      ? 'bg-amber-700 text-white rounded-br-sm'
                      : 'bg-[#262a33]/90 text-[#dfe2ee] rounded-bl-sm border border-amber-500/20'
                  }`}
                >
                  <PrivateMessageView
                    privateData={msg.privateData}
                    isSender={isMe}
                    isNightMode={isNightMode}
                  />
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-[10px] ${isMe ? 'text-white/75' : 'text-[#8d90a0]'}`}>
                      {msg.timestamp}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3 text-[#38bdf8]" />}
                  </div>
                </div>
              )}

              {(msg.type === 'video' || msg.type === 'memory_reel') && (
                <div
                  className={`rounded-2xl p-2 shadow-sm border overflow-hidden max-w-[340px] sm:max-w-[420px] ${
                    isMe
                      ? 'bg-[#0c4a6e] border-sky-500/25 text-white'
                      : isNightMode
                      ? 'bg-[#1c2331] border-white/10 text-[#eef2f8]'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  {msg.type === 'memory_reel' && (
                    <div className="px-2 pb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Video de Recuerdos</span>
                    </div>
                  )}
                  <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center">
                    <video
                      key={msg.mediaUrl}
                      src={msg.mediaUrl}
                      poster={msg.thumbnailUrl}
                      controls
                      playsInline
                      preload="auto"
                      className="w-full max-h-72 object-contain rounded-xl bg-black"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMediaModal({
                          url: msg.mediaUrl || '',
                          type: 'video',
                          name: msg.mediaName,
                          size: msg.mediaSize,
                        })
                      }
                      title="Pantalla completa"
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/65 hover:bg-black/90 text-white border border-white/20 transition-colors z-10 cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                  {msg.text && (
                    <p className="px-2 pt-2 text-xs font-medium leading-relaxed">{msg.text}</p>
                  )}
                  <div className={`flex items-center justify-between px-2 pt-1.5 pb-0.5 text-[11px] ${
                    isMe ? 'text-sky-100/80' : isNightMode ? 'text-[#94a3b8]' : 'text-slate-500'
                  }`}>
                    <span className="truncate max-w-[180px]">{msg.mediaName || 'Video'}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span>{msg.timestamp}</span>
                      {onDeleteMessage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteMessage(chat.id, msg.id);
                          }}
                          title="Borrar este mensaje"
                          className="ml-1 p-0.5 text-red-400 hover:text-red-200 opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {msg.type === 'avatar_msg' && (
                <div className="flex flex-col gap-1">
                  <AnimatedAvatarMessageCard
                    config={msg.avatarPayload?.config}
                    expression={msg.avatarPayload?.expression}
                    text={msg.text}
                    audioUrl={msg.avatarPayload?.audioUrl || msg.mediaUrl}
                    isSender={isMe}
                  />
                  <div className="flex items-center justify-end gap-1 px-1">
                    <span className="text-[10px] text-[#8d90a0]">{msg.timestamp}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-[#38bdf8]" />}
                  </div>
                </div>
              )}

              {msg.type === 'capsule' && msg.capsuleData && (
                <div className="flex flex-col gap-1">
                  <CapsuleMessageCard
                    text={msg.text}
                    capsuleData={msg.capsuleData}
                    isSender={isMe}
                    onUnlockCapsule={() => onUnlockCapsuleMessage?.(chat.id, msg.id)}
                  />
                  <div className="flex items-center justify-end gap-1 px-1">
                    <span className="text-[10px] text-[#8d90a0]">{msg.timestamp}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-[#38bdf8]" />}
                  </div>
                </div>
              )}

              {msg.type === 'game_invite' && msg.gameData && (
                <div
                  className={`rounded-2xl p-3.5 border shadow-md max-w-[300px] flex flex-col gap-2.5 ${
                    isMe
                      ? 'bg-gradient-to-br from-emerald-700 to-sky-700 border-emerald-400/30 text-white'
                      : 'bg-[#1a2233] border-white/10 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-emerald-300 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{msg.gameData.title}</div>
                      {msg.gameData.scoreSummary && (
                        <div className="text-[11px] opacity-85">{msg.gameData.scoreSummary}</div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const gt = msg.gameData?.gameType;
                      setInitialGroupGameType(
                        gt === 'trivia' || gt === 'draw' || gt === 'truth_dare' ? gt : null
                      );
                      setShowGroupGames(true);
                    }}
                    className="w-full py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    ¡Unirse al Juego!
                  </button>
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-[10px] opacity-75">{msg.timestamp}</span>
                  </div>
                </div>
              )}

              {/* Message Reactions Badge */}
              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                <div
                  className={`flex items-center gap-1 mt-1 ${
                    isMe ? 'self-end' : 'self-start'
                  } bg-[#181c24]/90 border border-white/10 rounded-full px-2 py-0.5 text-xs shadow-sm`}
                >
                  {Object.entries(msg.reactions).map(([emo, count]) => (
                    <span key={emo} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/5">
                      {renderReactionIcon(emo)}
                      {Number(count) > 1 && <span className="text-[10px] text-[#8d90a0] font-bold">{Number(count)}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Dynamic Typing Indicator */}
        {chat.isTyping && (
          <div className="flex items-end gap-2 self-start max-w-[85%] my-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {chat.avatarUrl ? (
              <img
                src={chat.avatarUrl}
                alt={chat.name}
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/10 shadow-sm"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#38bdf8]/25 border border-[#38bdf8]/35 flex items-center justify-center text-xs font-bold text-[#7bd0ff] shrink-0">
                {chat.name.slice(0, 1)}
              </div>
            )}
            <div className="bg-[#1c212b]/95 text-[#dfe2ee] rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-lg border border-[#7bd0ff]/20 flex items-center gap-2.5 backdrop-blur-md">
              <span className="text-xs text-[#b4c5ff] font-medium">
                {chat.name} está escribiendo...
              </span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7bd0ff] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#7bd0ff] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#7bd0ff] animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 6. Attach Sheet Modal */}
      {showAttachSheet && (
        <div
          className={`fixed bottom-20 left-3 right-3 z-50 p-4 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-2 duration-150 ${
            isNightMode
              ? 'bg-[#171d29] border-white/10 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm">Adjuntar</span>
            <button
              onClick={() => setShowAttachSheet(false)}
              className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer ${
                isNightMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setShowAttachSheet(false);
                setIsRecordingVoice(true);
              }}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-colors cursor-pointer ${
                isNightMode ? 'bg-[#202838] hover:bg-[#273145]' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#0284c7] flex items-center justify-center text-white">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Audio</span>
            </button>

            <button
              onClick={() => {
                setShowAttachSheet(false);
                setShowCameraChoice(true);
              }}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-colors cursor-pointer ${
                isNightMode ? 'bg-[#202838] hover:bg-[#273145]' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Foto / Video</span>
            </button>

            <button
              onClick={() => {
                setShowAttachSheet(false);
                handleSendTextMessage(
                  'Documento compartido: Documento.pdf (1.2 MB)'
                );
              }}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-colors cursor-pointer ${
                isNightMode ? 'bg-[#202838] hover:bg-[#273145]' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                <FileUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Documento</span>
            </button>

            <button
              onClick={() => {
                setShowAttachSheet(false);
                setShowAvatarStudio(true);
              }}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-colors cursor-pointer ${
                isNightMode ? 'bg-[#202838] hover:bg-[#273145]' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Avatar IA</span>
            </button>

            <button
              onClick={() => {
                setShowAttachSheet(false);
                setShowStickerFactory(true);
              }}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-colors cursor-pointer ${
                isNightMode ? 'bg-[#202838] hover:bg-[#273145]' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center text-white">
                <Wand2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Stickers IA</span>
            </button>

            <button
              onClick={() => {
                setShowAttachSheet(false);
                setInitialGroupGameType(null);
                setShowGroupGames(true);
              }}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-colors cursor-pointer ${
                isNightMode ? 'bg-[#202838] hover:bg-[#273145]' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Juegos</span>
            </button>

            <button
              onClick={() => {
                setShowAttachSheet(false);
                setShowVideoLinkModal(true);
              }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer col-span-3 mt-1 border ${
                isNightMode
                  ? 'bg-[#202838] hover:bg-[#273145] border-white/5'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Play className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-xs font-medium">Compartir enlace de YouTube, TikTok o Facebook</span>
            </button>

            <button
              onClick={() => {
                setShowAttachSheet(false);
                onOpenTimeCapsule?.();
              }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer col-span-3 border ${
                isNightMode
                  ? 'bg-[#202838] hover:bg-[#273145] border-white/5'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs font-medium">Mensajes del Futuro (programar foto/video/audio)</span>
            </button>

            <button
              onClick={() => {
                setShowAttachSheet(false);
                setShowPrivateMessageModal(true);
              }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer col-span-3 border ${
                isNightMode
                  ? 'bg-[#202838] hover:bg-[#273145] border-white/5'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Lock className="w-4 h-4 text-sky-500 shrink-0" />
              <span className="text-xs font-medium">Mensaje privado con PIN</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. Emoji, Sticker & GIF Picker */}
      <EmojiStickerPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={(emoji) => {
          setInputText((prev) => prev + emoji);
          inputRef.current?.focus();
        }}
        onSelectSticker={handleSendSticker}
        onSelectGif={handleSendGif}
        customStickerPacks={user.customStickerPacks}
        onOpenStickerFactory={() => setShowStickerFactory(true)}
      />

      {/* 8. Floating Input Composer Dock */}
      <div className="fixed bottom-3 left-3 right-3 z-40">
        {chat.isBlocked ? (
          <div className="bg-[#171d29] p-3.5 rounded-2xl shadow-xl border border-red-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-xl mx-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                <Ban className="w-4 h-4" />
              </div>
              <p className="text-xs text-red-200 font-medium">
                Has bloqueado a este usuario.
              </p>
            </div>
            {onUnblockContact && (
              <button
                onClick={() => onUnblockContact(chat.id)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Desbloquear</span>
              </button>
            )}
          </div>
        ) : (
          <div className={`p-1.5 rounded-2xl shadow-lg border flex flex-col gap-1 transition-colors ${
            isNightMode ? 'bg-[#121722] border-white/10' : 'bg-white border-slate-200'
          }`}>
            {isRecordingVoice ? (
              <VoiceRecorder
                onSendVoice={handleSendVoice}
                onCancel={() => setIsRecordingVoice(false)}
                isNightMode={isNightMode}
              />
            ) : (
              <div className="flex items-center gap-1.5">
                {/* Plus / Attach */}
                <button
                  onClick={() => {
                    setShowAttachSheet(!showAttachSheet);
                    setShowEmojiPicker(false);
                  }}
                  aria-label="Adjuntar archivo o nota de voz"
                  title="Adjuntar"
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    isNightMode
                      ? 'bg-[#1d2433] text-[#dfe2ee] hover:bg-[#263044]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                </button>

                {/* Emoji / GIF button */}
                <button
                  onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker);
                    setShowAttachSheet(false);
                  }}
                  aria-label="Emojis, Stickers y GIFs"
                  title="Emojis, Stickers y GIFs"
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    isNightMode
                      ? 'bg-[#1d2433] text-[#dfe2ee] hover:bg-[#263044]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Camera (2 options: with filter or without filter) */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCameraChoice((prev) => !prev);
                    setShowAttachSheet(false);
                    setShowEmojiPicker(false);
                  }}
                  aria-label="Cámara: elegir con filtro o sin filtro"
                  title="Cámara"
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    showCameraChoice
                      ? 'bg-[#0284c7] text-white'
                      : isNightMode
                      ? 'bg-[#1d2433] text-[#dfe2ee] hover:bg-[#263044]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                </button>

                {/* Text Input */}
                <div className={`flex-1 flex items-center px-3.5 py-2 rounded-full min-w-0 border transition-colors ${
                  isNightMode
                    ? 'bg-[#1a2130] border-white/10 text-[#eef2f8] focus-within:border-[#0284c7]'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus-within:border-[#0284c7]'
                }`}>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Escribe un mensaje..."
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      if (onTyping) {
                        onTyping(e.target.value.length > 0);
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendTextMessage()}
                    className={`w-full bg-transparent text-sm focus:outline-none ${
                      isNightMode ? 'text-[#eef2f8] placeholder:text-[#64748b]' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                {/* Quick Mic button when typing */}
                {inputText.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsRecordingVoice(true)}
                    aria-label="Mandar nota de voz"
                    title="Mandar nota de voz"
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                      isNightMode
                        ? 'bg-[#1d2433] text-[#38bdf8] hover:bg-[#263044]'
                        : 'bg-slate-100 text-[#0284c7] hover:bg-slate-200'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}

                {/* Mic / Send Button */}
                {inputText.trim().length > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleSendTextMessage()}
                    aria-label="Enviar mensaje"
                    title="Enviar"
                    className="w-10 h-10 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center shrink-0 active:scale-95 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsRecordingVoice(true)}
                    aria-label="Grabar nota de voz"
                    title="Grabar nota de voz"
                    className="w-10 h-10 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center shrink-0 active:scale-95 transition-colors cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 9. Lightbox Photo & Video Modal */}
      <MediaModal
        isOpen={Boolean(activeMediaModal)}
        onClose={() => setActiveMediaModal(null)}
        mediaUrl={activeMediaModal?.url || ''}
        mediaType={activeMediaModal?.type || 'image'}
        mediaName={activeMediaModal?.name}
        mediaSize={activeMediaModal?.size}
      />

      {/* Camera 2-Option Selector Sheet (With Filter vs Without Filter) */}
      {showCameraChoice && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setShowCameraChoice(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl border p-4 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-150 ${
              isNightMode
                ? 'bg-[#151b28] border-white/10 text-[#eef2f8]'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0284c7]/15 text-[#0284c7] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Cámara PidgeX</h3>
                  <p className={`text-[11px] ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Elige cómo quieres tomar tu foto
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCameraChoice(false)}
                aria-label="Cerrar opciones de cámara"
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                  isNightMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCameraFilterMode('with_filter');
                  setShowCameraChoice(false);
                  setShowPhotoModal(true);
                }}
                className={`w-full p-3.5 rounded-xl border flex items-center gap-3 text-left transition-colors cursor-pointer ${
                  isNightMode
                    ? 'bg-[#1c2538] hover:bg-[#232f47] border-sky-500/30 text-white'
                    : 'bg-sky-50/70 hover:bg-sky-100/80 border-sky-200 text-slate-900'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold">Tomar foto con filtro</div>
                  <div className={`text-[11px] mt-0.5 ${isNightMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Filtros 3D, belleza, animales y efectos en vivo
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCameraFilterMode('no_filter');
                  setShowCameraChoice(false);
                  setShowPhotoModal(true);
                }}
                className={`w-full p-3.5 rounded-xl border flex items-center gap-3 text-left transition-colors cursor-pointer ${
                  isNightMode
                    ? 'bg-[#1b2130] hover:bg-[#242c3f] border-white/10 text-white'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isNightMode ? 'bg-white/10 text-white' : 'bg-slate-800 text-white'
                }`}>
                  <Camera className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold">Tomar foto sin filtro</div>
                  <div className={`text-[11px] mt-0.5 ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Foto o video natural directo de la cámara
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Photo Upload & Camera Modal */}
      <PhotoFilterModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onSendPhoto={handleSendPhoto}
        contactName={chat.name}
        initialFilterMode={cameraFilterMode}
      />

      {/* 11. Audio & Video Call Modal */}
      <CallModal
        isOpen={callConfig.isOpen}
        onClose={() => setCallConfig({ isOpen: false, isVideo: false })}
        contactName={chat.name}
        contactAvatar={chat.avatarUrl}
        isVideo={callConfig.isVideo}
        isGroup={chat.type === 'group'}
        groupMembers={chat.groupMembers || []}
      />

      {/* 12. In-Chat Quick Wallpaper Selector Modal */}
      {showWallpaperDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowWallpaperDrawer(false)}
        >
          <div
            className="w-full max-w-lg bg-[#181c24] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#00a6e0]/20 text-[#7bd0ff] flex items-center justify-center">
                  <WallpaperIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#dfe2ee]">Fondos para este Chat</h3>
                  <p className="text-[10px] text-[#8d90a0]">Se actualiza al instante</p>
                </div>
              </div>
              <button
                onClick={() => setShowWallpaperDrawer(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#8d90a0] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Wallpapers Grid */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-[#8d90a0] uppercase tracking-wider">
                Elige un fondo oficial
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {wallpapers.map((wp) => {
                  const isSelected =
                    (chat.customWallpaperId || user.wallpaperId) === wp.id &&
                    !user.customWallpaperUrl;
                  return (
                    <div
                      key={wp.id}
                      onClick={() => {
                        onSelectWallpaper?.(wp.id);
                        onUpdateUser?.({ wallpaperId: wp.id, customWallpaperUrl: '' });
                      }}
                      className={`relative h-24 rounded-xl overflow-hidden cursor-pointer group border-2 transition-all duration-150 active:scale-95 ${
                        isSelected
                          ? 'border-[#38bdf8] ring-2 ring-[#38bdf8]/40 shadow-lg scale-105'
                          : 'border-white/10 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={wp.previewUrl || wp.url}
                        alt={wp.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-1.5">
                        <span className="text-[10px] font-bold text-white leading-tight truncate">
                          {wp.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-md">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom URL or upload shortcut */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-[#8d90a0]">¿Quieres una foto propia?</span>
              <label className="px-3 py-1.5 rounded-xl bg-[#262a33] hover:bg-[#31353e] text-[#7bd0ff] text-xs font-bold cursor-pointer transition-colors border border-white/5">
                <span>Subir foto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          const resultUrl = ev.target.result as string;
                          onSelectWallpaper?.('custom', resultUrl);
                          onUpdateUser?.({ wallpaperId: 'custom', customWallpaperUrl: resultUrl });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
      {/* 13. Block & Remove Friend Confirmation Modal */}
      {showBlockModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowBlockModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#1c2028] border border-red-500/20 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                <Ban className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-base text-[#dfe2ee]">¿Bloquear a {chat.name}?</h3>
                <span className="text-xs text-red-400 font-medium">Se eliminará de tus amigos</span>
              </div>
            </div>

            <p className="text-xs text-[#8d90a0] leading-relaxed">
              Al bloquear a <strong className="text-white">{chat.name}</strong>, ya no estará en tu lista de amigos y no podrán enviarse mensajes ni realizar llamadas en PidgeX.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8d90a0] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  if (onBlockContact) {
                    onBlockContact(chat.id);
                  }
                  onBack();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Bloquear y Eliminar de Amigos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13b. Remove Friend Confirmation Modal */}
      {showRemoveFriendModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowRemoveFriendModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#1c2028] border border-amber-500/25 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <UserMinus className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-base text-[#dfe2ee]">¿Quitar a {chat.name} de tus amigos?</h3>
                <span className="text-xs text-amber-400 font-medium">Se borrará el historial de chat</span>
              </div>
            </div>

            <p className="text-xs text-[#8d90a0] leading-relaxed">
              Si quitas a <strong className="text-white">{chat.name}</strong> de tus amigos, se borrarán todos los mensajes anteriores. Si lo vuelves a agregar después, empezarán desde cero.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRemoveFriendModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8d90a0] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowRemoveFriendModal(false);
                  if (onRemoveFriend) {
                    onRemoveFriend(chat.id);
                  }
                  onBack();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>Quitar Amigo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14. Clear Chat Messages Confirmation Modal */}
      {showClearChatModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowClearChatModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#1c2028] border border-red-500/20 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-base text-[#dfe2ee]">¿Vaciar conversación?</h3>
                <span className="text-xs text-red-400 font-medium">Se borrarán todos los mensajes</span>
              </div>
            </div>

            <p className="text-xs text-[#8d90a0] leading-relaxed">
              Elige si deseas vaciar los mensajes o eliminar esta conversación por completo de forma permanente.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowClearChatModal(false);
                  if (onClearChatMessages) {
                    onClearChatMessages(chat.id);
                  }
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar Mensajes (Conservar contacto)</span>
              </button>

              {chat.type === 'group' && onLeaveGroup ? (
                <button
                  onClick={() => {
                    setShowClearChatModal(false);
                    onLeaveGroup(chat.id);
                    onBack();
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Salirse del Grupo</span>
                </button>
              ) : onDeleteChat ? (
                <button
                  onClick={() => {
                    setShowClearChatModal(false);
                    onDeleteChat(chat.id);
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Eliminar Conversación Permanentemente</span>
                </button>
              ) : null}

              <button
                onClick={() => setShowClearChatModal(false)}
                className="w-full py-2 rounded-xl text-xs font-semibold text-[#8d90a0] hover:text-white hover:bg-white/5 transition-colors cursor-pointer mt-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15. Group Members & Leader Management Modal */}
      {chat.type === 'group' && (
        <>
          <GroupMembersModal
            isOpen={showGroupMembersModal}
            initialShowAddMember={openGroupAddMember}
            onClose={() => {
              setShowGroupMembersModal(false);
              setOpenGroupAddMember(false);
            }}
            chat={chat}
            user={user}
            contacts={allContacts}
            onUpdateGroupMembers={(chatId, updatedMembers) => {
              if (onUpdateGroupMembers) {
                onUpdateGroupMembers(chatId, updatedMembers);
              }
            }}
            onUpdateGroupAvatar={(chatId, newAvatarUrl) => {
              onUpdateGroupAvatar?.(chatId, newAvatarUrl);
            }}
            onLeaveGroup={(chatId) => {
              if (onLeaveGroup) {
                onLeaveGroup(chatId);
              }
              onBack();
            }}
            onStartPrivateChat={(member) => {
              if (onStartPrivateChat) {
                onStartPrivateChat(member.id, member.name);
              }
            }}
          />

          <AvatarCaptureModal
            isOpen={showGroupAvatarModal}
            onClose={() => setShowGroupAvatarModal(false)}
            currentAvatarUrl={chat.avatarUrl}
            onSaveAvatar={(newUrl) => {
              onUpdateGroupAvatar?.(chat.id, newUrl);
            }}
          />
        </>
      )}

      {/* 16. Share Video Link Modal */}
      {showVideoLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#181c24] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#dfe2ee] flex items-center gap-2">
                <VideoIcon className="w-5 h-5 text-red-500" />
                Compartir Video (YouTube, TikTok, FB)
              </h3>
              <button
                onClick={() => setShowVideoLinkModal(false)}
                className="w-8 h-8 rounded-full bg-[#262a33] text-[#dfe2ee] flex items-center justify-center hover:bg-[#353942]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-[#8d90a0] mb-1 block">Enlace del video (URL)</label>
                <input
                  type="text"
                  value={videoLinkInput}
                  onChange={(e) => setVideoLinkInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... o tiktok.com/@..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#262a33] border border-white/10 text-white text-xs focus:outline-none focus:border-[#2563eb]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8d90a0] mb-1 block">Mensaje / Comentario opcional</label>
                <input
                  type="text"
                  value={videoLinkCaption}
                  onChange={(e) => setVideoLinkCaption(e.target.value)}
                  placeholder="¡Miren este video increíble!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#262a33] border border-white/10 text-white text-xs focus:outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowVideoLinkModal(false)}
                className="px-4 py-2 rounded-xl bg-[#262a33] text-xs font-semibold text-[#dfe2ee] hover:bg-[#353942]"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!videoLinkInput.trim()) return;
                  const fullText = videoLinkCaption
                    ? `${videoLinkCaption}\n${videoLinkInput.trim()}`
                    : videoLinkInput.trim();
                  handleSendTextMessage(fullText);
                  setVideoLinkInput('');
                  setVideoLinkCaption('');
                  setShowVideoLinkModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#2563eb] text-xs font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Enviar video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 17. Active Video Player Modal */}
      {activeVideoModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveVideoModalUrl(null)}
        >
          <div
            className="relative w-full max-w-3xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideoModalUrl(null)}
              className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={activeVideoModalUrl}
              title="Reproductor de Video"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Chat Theme & Emotional Mode Modal */}
      <ChatThemeModal
        isOpen={showChatThemeModal}
        onClose={() => setShowChatThemeModal(false)}
        chat={chat}
        isNightMode={isNightMode}
        onSelectGradient={onSelectGradient || (() => {})}
        onUpdatePersonalityTheme={onUpdatePersonalityTheme}
        onUpdateEmotionalMode={onUpdateEmotionalMode}
      />

      {/* Digital AI Avatar Studio */}
      <DigitalAvatarStudioModal
        isOpen={showAvatarStudio}
        onClose={() => setShowAvatarStudio(false)}
        user={user}
        isNightMode={isNightMode}
        onSaveAvatarConfig={(config) => onUpdateUser?.({ digitalAvatar: config })}
        onSendAvatarMessage={({ config, expression, text, audioUrl }) => {
          onUpdateUser?.({ digitalAvatar: config });
          onSendMessage(chat.id, {
            senderId: 'me',
            senderName: user.name,
            senderAvatar: user.avatarUrl,
            type: 'avatar_msg',
            text,
            mediaUrl: audioUrl,
            avatarPayload: { config, expression, audioUrl },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: true,
          });
          triggerChatEffects();
        }}
      />

      {/* AI Sticker Factory */}
      <AiStickerFactoryModal
        isOpen={showStickerFactory}
        onClose={() => setShowStickerFactory(false)}
        customPacks={user.customStickerPacks || []}
        onSavePacks={(packs) => onUpdateUser?.({ customStickerPacks: packs })}
        onSendSticker={handleSendSticker}
        isNightMode={isNightMode}
      />

      {/* Smart Memory Album & Video Reel Creator */}
      <ChatMediaGalleryModal
        isOpen={showMediaGallery}
        onClose={() => setShowMediaGallery(false)}
        messages={chat.messages || []}
        chatName={chat.name}
        isNightMode={isNightMode}
        onShareMemoryReel={(videoUrl, title, duration) => {
          onSendMessage(chat.id, {
            senderId: 'me',
            senderName: user.name,
            senderAvatar: user.avatarUrl,
            type: 'memory_reel',
            text: title,
            mediaUrl: videoUrl,
            mediaName: `${title}.webm`,
            mediaDuration: duration,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: true,
          });
          setShowMediaGallery(false);
          triggerChatEffects();
        }}
      />

      <PrivateMessageModal
        isOpen={showPrivateMessageModal}
        onClose={() => setShowPrivateMessageModal(false)}
        chat={chat}
        user={user}
        isNightMode={isNightMode}
        onSendPrivateMessage={(chatId, text, pin, selfDestructSecs) => {
          onSendMessage(chatId, {
            senderId: 'me',
            senderName: user.name,
            senderAvatar: user.avatarUrl,
            type: 'private',
            privateData: { text, pin, selfDestructSecs },
            text: '[Mensaje Privado Confidencial protegido con PIN]',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: true,
          });
        }}
      />

      <ForwardModal
        isOpen={Boolean(forwardingMessage)}
        onClose={() => setForwardingMessage(null)}
        message={forwardingMessage}
        chats={allContacts}
        isNightMode={isNightMode}
        onForwardMessage={(targetChatId, message) => {
          if (onForwardMessage) {
            onForwardMessage(targetChatId, message);
          }
        }}
      />
      <GroupGamesModal
        isOpen={showGroupGames}
        onClose={() => {
          setShowGroupGames(false);
          setInitialGroupGameType(null);
        }}
        chat={chat}
        user={user}
        isNightMode={isNightMode}
        initialGameType={initialGroupGameType}
        onSendGameInviteToChat={(gameType, title, summary, gameId) => {
          onSendMessage(chat.id, {
            senderId: 'me',
            senderName: user.name,
            senderAvatar: user.avatarUrl,
            type: 'game_invite',
            text: title,
            gameData: {
              gameType,
              title,
              scoreSummary: summary,
              gameId,
            },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: true,
          });
        }}
      />
    </div>
  );
};
