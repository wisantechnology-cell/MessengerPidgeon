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
  Sparkles,
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
  UserCheck,
  Wallpaper as WallpaperIcon,
  Moon,
  Bell,
  BellOff,
  Gamepad2,
} from 'lucide-react';
import { Chat, Message, Wallpaper, StickerItem, UserProfile } from '../types';
import { STICKERS } from '../data/mockData';
import { VoiceRecorder } from './VoiceRecorder';
import { VoicePlayer } from './VoicePlayer';
import { PhotoFilterModal } from './PhotoFilterModal';
import { EmojiStickerPicker } from './EmojiStickerPicker';
import { MediaModal } from './MediaModal';
import { CallModal } from './CallModal';

interface ChatViewProps {
  chat: Chat;
  user: UserProfile;
  wallpapers: Wallpaper[];
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
  onOpenAddFriend?: () => void;
}

import { BirdLogo } from './BirdLogo';

export const ChatView: React.FC<ChatViewProps> = ({
  chat,
  user,
  wallpapers,
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
  onOpenAddFriend,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [copiedRoomLink, setCopiedRoomLink] = useState<boolean>(false);
  const [showSecurityPopover, setShowSecurityPopover] = useState<boolean>(false);
  const [showBlockModal, setShowBlockModal] = useState<boolean>(false);
  const [showWallpaperDrawer, setShowWallpaperDrawer] = useState<boolean>(false);
  const [showAttachSheet, setShowAttachSheet] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, isRecordingVoice]);

  const handleSendTextMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    onSendMessage(chat.id, {
      senderId: 'me',
      senderName: user.name,
      senderAvatar: user.avatarUrl,
      type: 'text',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    });

    setInputText('');
    setShowAttachSheet(false);
    setShowEmojiPicker(false);
  };

  const handleSendPhoto = (
    photoUrl: string,
    caption: string,
    _filter: string,
    fileName: string
  ) => {
    onSendMessage(chat.id, {
      senderId: 'me',
      senderName: user.name,
      type: 'image',
      mediaUrl: photoUrl,
      mediaName: fileName,
      mediaSize: '3.2 MB',
      text: caption || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    });
  };

  const handleSendVoice = (durationText: string, audioBlobUrl?: string) => {
    onSendMessage(chat.id, {
      senderId: 'me',
      senderName: user.name,
      type: 'voice',
      mediaDuration: durationText,
      mediaUrl: audioBlobUrl,
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

  return (
    <div className={`relative flex flex-col w-full h-full min-h-screen transition-colors duration-300 ${
      isNightMode ? 'bg-[#0f131c] text-[#dfe2ee]' : 'bg-[#e0f2fe] text-[#0c2340]'
    }`}>
      {/* 1. App Navigation Header */}
      <header className={`sticky top-0 w-full z-40 backdrop-blur-xl border-b transition-colors duration-300 ${
        isNightMode ? 'bg-[#0f131c]/90 border-white/5' : 'bg-white/90 border-sky-200/80'
      }`}>
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              aria-label="Volver a chats"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-95 ${
                isNightMode ? 'text-[#dfe2ee] hover:bg-[#262a33]/70' : 'text-[#0c2340] hover:bg-sky-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <BirdLogo className="w-7 h-7" />
            <h1 className={`text-lg font-bold tracking-tight ${isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'}`}>
              Conversation Thread
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {onToggleNightMode && (
              <button
                onClick={onToggleNightMode}
                aria-label={isNightMode ? "Cambiar a Colores Claros Azules" : "Cambiar a Modo Nocturno"}
                title={isNightMode ? "Modo Nocturno activo (clic para colores claros azules)" : "Activar Modo Nocturno"}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-sm border ${
                  isNightMode
                    ? 'bg-[#1c2028] text-amber-300 hover:text-amber-200 border-white/10 hover:border-amber-400/40'
                    : 'bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-300 hover:border-sky-400'
                }`}
              >
                <Moon className={`w-4 h-4 ${isNightMode ? 'fill-amber-300 text-amber-300' : 'text-sky-700'}`} />
              </button>
            )}
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-sky-400/30"
            />
          </div>
        </div>

        {/* 2. Chat Contact Bar (active contact) */}
        <div className={`px-4 py-2 backdrop-blur-xl flex items-center justify-between border-t transition-colors ${
          isNightMode ? 'bg-[#181c24]/90 border-white/5' : 'bg-sky-50/90 border-sky-200/80'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={chat.avatarUrl}
                alt={chat.name}
                className="w-10 h-10 rounded-full object-cover shadow-sm"
              />
              {chat.isRealTime ? (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#10b981] rounded-full ring-2 ring-white dark:ring-[#181c24] shadow-[0_0_8px_#10b981]" />
              ) : (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#0284c7] rounded-full ring-2 ring-white dark:ring-[#181c24] shadow-[0_0_8px_#0284c7]" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`font-semibold text-sm truncate ${isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'}`}>
                  {chat.name}
                </span>
                {chat.isBlocked ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30 shrink-0">
                    Bloqueado
                  </span>
                ) : chat.isFriend ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-700 dark:text-[#7bd0ff] border border-sky-500/30 shrink-0">
                    Amigo
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 text-slate-600 dark:text-[#8d90a0] shrink-0">
                    No es amigo
                  </span>
                )}
                {chat.isVerified && (
                  <span className="text-[#0284c7] dark:text-[#38bdf8] text-xs" title="Verificado">
                    <Check className="w-3.5 h-3.5 stroke-[3] inline" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {chat.isBlocked ? (
                  <span className="text-[11px] font-medium text-red-500 dark:text-red-400">
                    Contacto bloqueado (no es tu amigo)
                  </span>
                ) : (
                  <>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0284c7] animate-pulse" />
                    <span className="text-[11px] font-medium text-[#0284c7] dark:text-[#38bdf8]">
                      {chat.phone ? chat.phone : 'En línea'}
                    </span>
                    {user.doNotDisturb ? (
                      <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                        <BellOff className="w-2.5 h-2.5" />
                        <span>No Molestar</span>
                      </span>
                    ) : (
                      <span className={`text-[11px] ${isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'}`}>
                        • Chat Privado Seguro
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons on contact bar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!chat.isFriend && !chat.isBlocked && onAddContactAsFriend && (
              <button
                onClick={() => onAddContactAsFriend(chat.id)}
                aria-label="Agregar a mis amigos"
                title="Agregar contacto a mis amigos"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#0284c7] to-[#00a6e0] hover:from-[#0369a1] hover:to-[#0284c7] text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-white" />
                <span>+ Agregar Amigo</span>
              </button>
            )}

            {onOpenWaitingRoom && (
              <button
                onClick={onOpenWaitingRoom}
                aria-label="Sala De Espera"
                title="Jugar en Sala De Espera mientras respondes"
                className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4" />
              </button>
            )}
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
              onClick={() => setCallConfig({ isOpen: true, isVideo: false })}
              aria-label="Llamada de voz"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                isNightMode ? 'bg-[#262a33] text-[#dfe2ee] hover:bg-[#353942]' : 'bg-white text-sky-800 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCallConfig({ isOpen: true, isVideo: true })}
              aria-label="Videollamada"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                isNightMode ? 'bg-[#262a33] text-[#dfe2ee] hover:bg-[#353942]' : 'bg-white text-sky-800 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              <VideoIcon className="w-4 h-4" />
            </button>
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

      {/* 3. Conversation Thread with Wallpaper Background */}
      <main
        className="flex-1 w-full px-4 pt-3 pb-36 flex flex-col gap-3 bg-cover bg-center overflow-y-auto transition-all duration-300"
        style={{
          backgroundImage: `url('${wallpaperBackgroundUrl}')`,
        }}
      >
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

        {/* Date / Security Tag */}
        <div className={`self-center px-3 py-1 rounded-full backdrop-blur-md shadow-sm border ${
          isNightMode ? 'bg-[#262a33]/80 border-white/5 text-[#c3c6d7]' : 'bg-white/85 border-sky-200/70 text-sky-900 font-medium'
        }`}>
          <span className="text-[11px]">Hoy • Chat Cifrado</span>
        </div>

        {/* Realtime Live Room Banner */}
        {chat.isRealTime && (
          <div className="self-center w-full max-w-md my-1 p-3.5 rounded-2xl bg-[#0c261c]/90 border border-[#10b981]/30 shadow-lg backdrop-blur-md flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                <span className="text-xs font-bold text-white">Sala en Vivo con Personas Reales</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/30">
                {chat.onlineCount && chat.onlineCount > 0
                  ? `${chat.onlineCount} ${chat.onlineCount === 1 ? 'persona en línea' : 'personas en línea'}`
                  : 'WebSockets Activos'}
              </span>
            </div>
            <p className="text-xs text-[#a0b3aa] leading-relaxed">
              Habla en directo con otras personas en tiempo real. Abre esta app en otra pestaña del navegador o comparte el enlace con amigos.
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={handleCopyRoomLink}
                className="flex-1 py-1.5 px-3 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                {copiedRoomLink ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedRoomLink ? '¡Enlace copiado al portapapeles!' : 'Copiar enlace de invitación'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Messages List */}
        {chat.messages.map((msg) => {
          const isMe = msg.senderId === 'me' || msg.senderId === user.id;

          return (
            <div
              key={msg.id}
              onMouseEnter={() => setHoveredMessageId(msg.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
              className={`relative flex flex-col max-w-[85%] group ${
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
                  {['❤️', '👍', '🔥', '🙌', '🎉'].map((emo) => (
                    <button
                      key={emo}
                      onClick={() => onAddReaction(chat.id, msg.id, emo)}
                      className="text-sm hover:scale-125 transition-transform"
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              )}

              {/* Message Content according to Type */}
              {msg.type === 'text' && (
                <div
                  className={`rounded-2xl p-3 shadow-md backdrop-blur-md transition-colors ${
                    isMe
                      ? 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white rounded-br-sm shadow-sky-950/20'
                      : isNightMode
                      ? 'bg-[#1c2028]/95 text-[#dfe2ee] rounded-bl-sm border border-white/10'
                      : 'bg-white/95 text-[#0c2340] rounded-bl-sm border border-sky-200/90 shadow-sm'
                  }`}
                >
                  <p className="text-[14px] leading-relaxed">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-[10px] ${isMe ? 'text-white/80' : isNightMode ? 'text-[#8d90a0]' : 'text-sky-700/70'}`}>
                      {msg.timestamp}
                    </span>
                    {isMe && (
                      <CheckCheck className="w-3.5 h-3.5 text-white inline" />
                    )}
                  </div>
                </div>
              )}

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
                  </div>
                </div>
              )}

              {msg.type === 'sticker' && (() => {
                const foundSticker = STICKERS.find((s) => s.id === msg.stickerId);
                const stickerUrl = msg.stickerUrl || foundSticker?.imageUrl || '/assets/stickers/sticker_01_no_me_hables.svg';
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
                    </div>
                  </div>
                );
              })()}

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
                  />
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className={`text-[10px] ${isMe ? 'text-white/75' : 'text-[#8d90a0]'}`}>
                      {msg.timestamp}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3 text-[#38bdf8]" />}
                  </div>
                </div>
              )}

              {msg.type === 'video' && (
                <div className="rounded-2xl p-1.5 bg-[#262a33]/90 shadow-md backdrop-blur-md border border-white/5 overflow-hidden">
                  <div
                    onClick={() =>
                      setActiveMediaModal({
                        url: msg.mediaUrl || '',
                        type: 'video',
                        name: msg.mediaName,
                      })
                    }
                    className="relative cursor-pointer rounded-xl overflow-hidden group/vid"
                  >
                    <video src={msg.mediaUrl} className="w-full max-h-56 object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#2563eb]/90 flex items-center justify-center text-white shadow-lg group-hover/vid:scale-110 transition-transform">
                        <VideoIcon className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                  {msg.text && (
                    <p className="px-2 py-1 text-xs text-[#dfe2ee] font-medium">{msg.text}</p>
                  )}
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] text-[#8d90a0]">
                    <span>{msg.mediaName || 'Video clip'}</span>
                    <span>{msg.timestamp}</span>
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
                    <span key={emo} className="flex items-center gap-0.5">
                      <span>{emo}</span>
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
      </main>

      {/* 6. Attach Sheet Modal */}
      {showAttachSheet && (
        <div className="fixed bottom-24 left-3 right-3 z-50 p-4 bg-[#262a33] rounded-2xl shadow-2xl border border-white/10 backdrop-blur-2xl animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-sm text-[#dfe2ee]">Compartir contenido</span>
            <button
              onClick={() => setShowAttachSheet(false)}
              className="w-7 h-7 rounded-full bg-[#1c2028] flex items-center justify-center text-[#dfe2ee]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => {
                setShowAttachSheet(false);
                setIsRecordingVoice(true);
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-[#1c2028] hover:bg-[#181c24] transition-colors group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-xs text-[#38bdf8] font-bold">Voz</span>
            </button>

            <button
              onClick={() => {
                setShowAttachSheet(false);
                setShowPhotoModal(true);
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-[#1c2028] hover:bg-[#181c24] transition-colors group cursor-pointer"
            >
              <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-black shadow-md group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-yellow-300 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-black" />
                </span>
              </div>
              <span className="text-xs text-amber-300 font-bold">Foto</span>
            </button>

            <button
              onClick={() => {
                setShowAttachSheet(false);
                onSendMessage(chat.id, {
                  senderId: 'me',
                  senderName: user.name,
                  type: 'video',
                  mediaUrl:
                    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                  mediaName: 'Video_Demo_Bird.mp4',
                  mediaDuration: '0:15',
                  text: 'Compartiendo demo de video',
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  isRead: true,
                });
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-[#1c2028] hover:bg-[#181c24] transition-colors cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-[#2563eb] flex items-center justify-center text-white shadow-md">
                <VideoIcon className="w-5 h-5" />
              </div>
              <span className="text-xs text-[#dfe2ee] font-medium">Video</span>
            </button>

            <button
              onClick={() => {
                setShowAttachSheet(false);
                handleSendTextMessage(
                  '📄 Documento adjunto: Documento_Compartido.pdf (1.2 MB)'
                );
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-[#1c2028] hover:bg-[#181c24] transition-colors cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-[#943fe2] flex items-center justify-center text-white shadow-md">
                <FileUp className="w-5 h-5" />
              </div>
              <span className="text-xs text-[#dfe2ee] font-medium">Doc / CV</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. Emoji Picker */}
      <EmojiStickerPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={(emoji) => {
          setInputText((prev) => prev + emoji);
          inputRef.current?.focus();
        }}
        onSelectSticker={handleSendSticker}
      />

      {/* 8. Floating Input Composer Dock */}
      <div className="fixed bottom-3 left-3 right-3 z-40">
        {chat.isBlocked ? (
          <div className="bg-[#1c2028]/95 backdrop-blur-2xl p-3.5 rounded-2xl shadow-2xl border border-red-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-xl mx-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                <Ban className="w-4 h-4" />
              </div>
              <p className="text-xs text-red-200/90 font-medium">
                Has bloqueado a este usuario. Ya no está en tus amigos.
              </p>
            </div>
            {onUnblockContact && (
              <button
                onClick={() => onUnblockContact(chat.id)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Desbloquear y agregar</span>
              </button>
            )}
          </div>
        ) : (
          <div className={`backdrop-blur-2xl p-1.5 rounded-2xl shadow-2xl border flex flex-col gap-1 transition-colors ${
            isNightMode ? 'bg-[#0a0e16]/90 border-white/10' : 'bg-white/95 border-sky-200 shadow-sky-950/10'
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
                  title="Adjuntar contenido"
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    isNightMode
                      ? 'bg-[#262a33] text-[#dfe2ee] hover:text-[#38bdf8]'
                      : 'bg-sky-100 text-sky-800 hover:bg-sky-200 border border-sky-200/80'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                </button>

                {/* Emoji button */}
                <button
                  onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker);
                    setShowAttachSheet(false);
                  }}
                  aria-label="Emojis"
                  title="Emojis y stickers"
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    isNightMode
                      ? 'bg-[#262a33] text-[#dfe2ee] hover:text-[#7bd0ff]'
                      : 'bg-sky-100 text-sky-800 hover:bg-sky-200 border border-sky-200/80'
                  }`}
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Snapchat Camera & Lenses quick button */}
                <button
                  onClick={() => {
                    setShowPhotoModal(true);
                    setShowAttachSheet(false);
                    setShowEmojiPicker(false);
                  }}
                  aria-label="Cámara y Lentes Snapchat"
                  title="Cámara y Lentes Snapchat"
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    isNightMode
                      ? 'bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] hover:text-amber-400'
                      : 'bg-sky-100 hover:bg-sky-200 text-sky-800 hover:text-amber-600 border border-sky-200/80'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                    <Sparkles className="w-2 h-2 text-black" />
                  </span>
                </button>

                {/* Text Input */}
                <div className={`flex-1 flex items-center px-3 py-1.5 rounded-full min-w-0 border transition-colors ${
                  isNightMode
                    ? 'bg-[#1c2028] border-white/5 text-[#dfe2ee] focus-within:border-[#2563eb]/50'
                    : 'bg-sky-50 border-sky-200 text-[#0c2340] focus-within:border-sky-500'
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
                      isNightMode ? 'text-[#dfe2ee] placeholder:text-[#8d90a0]' : 'text-[#0c2340] placeholder:text-sky-700/60'
                    }`}
                  />
                </div>

                {/* Quick Mic button when typing */}
                {inputText.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsRecordingVoice(true)}
                    aria-label="Mandar mensaje de voz"
                    title="Mandar mensaje de voz"
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                      isNightMode
                        ? 'bg-[#262a33] text-[#38bdf8] hover:bg-[#323742]'
                        : 'bg-sky-100 text-[#0284c7] hover:bg-sky-200 border border-sky-200/80'
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
                    title="Enviar mensaje"
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white flex items-center justify-center shadow-md shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsRecordingVoice(true)}
                    aria-label="Mandar mensaje de voz"
                    title="Mandar mensaje de voz (micrófono)"
                    className="relative w-10 h-10 rounded-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white flex items-center justify-center shadow-md shadow-sky-500/25 shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                  >
                    <span className="absolute inset-0 rounded-full bg-sky-400 opacity-25 group-hover:opacity-50 animate-ping pointer-events-none" />
                    <Mic className="w-4 h-4 relative" />
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

      {/* 10. Photo Upload & Camera Modal */}
      <PhotoFilterModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onSendPhoto={handleSendPhoto}
        contactName={chat.name}
      />

      {/* 11. Audio & Video Call Modal */}
      <CallModal
        isOpen={callConfig.isOpen}
        onClose={() => setCallConfig({ isOpen: false, isVideo: false })}
        contactName={chat.name}
        contactAvatar={chat.avatarUrl}
        isVideo={callConfig.isVideo}
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
              Al bloquear a <strong className="text-white">{chat.name}</strong>, ya no estará en tu lista de amigos y no podrán enviarse mensajes ni realizar llamadas en MessengerPidgeon.
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
    </div>
  );
};
