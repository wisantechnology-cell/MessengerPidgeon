import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  Sparkles,
  Zap,
  PenSquare,
  ChevronRight,
  ChevronDown,
  Check,
  Plus,
  Image as ImageIcon,
  CheckCheck,
  Lightbulb,
  Search,
  SlidersHorizontal,
  ArrowRight,
  Globe,
  UserPlus,
  UserCheck,
  Ban,
  Upload,
  Smartphone,
  Tablet,
  Radio,
  Bell,
  BellOff,
  Moon,
  Mic,
  Flame,
  WifiOff,
  Trash2,
} from 'lucide-react';
import { Chat, ChatCategory, UserProfile, Wallpaper } from '../types';
import { BirdLogo } from './BirdLogo';
import { AddFriendData } from './AddFriendModal';
import { getActiveMonthlyTheme } from '../utils/monthlyThemes';

interface ChatsListViewProps {
  chats: Chat[];
  user: UserProfile;
  wallpapers?: Wallpaper[];
  isNightMode?: boolean;
  onToggleNightMode?: () => void;
  onSelectChat: (chat: Chat) => void;
  onSelectWallpaper?: (wallpaperId: string, customUrl?: string) => void;
  onToggleDoNotDisturb?: (duration?: string) => void;
  onOpenWaitingRoom?: () => void;
  onOpenMarketplace?: () => void;
  onOpenProfile: () => void;
  onNewChat: () => void;
  onOpenAddFriend?: () => void;
  onOpenVoiceMessageModal?: () => void;
  onAddFriend?: (data: AddFriendData) => void;
  onUnblockContact?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onOpenNewGroup?: () => void;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onOpenContactProfile?: (chat: Chat) => void;
  onOpenLocalRadar?: () => void;
  onOpenInstallModal?: () => void;
  isClassicMode?: boolean;
}

export const ChatsListView: React.FC<ChatsListViewProps> = ({
  chats,
  user,
  wallpapers,
  isNightMode = false,
  isClassicMode = false,
  onToggleNightMode,
  onSelectChat,
  onSelectWallpaper,
  onToggleDoNotDisturb,
  onOpenProfile,
  onOpenLocalRadar,
  onNewChat,
  onOpenAddFriend,
  onOpenVoiceMessageModal,
  onAddFriend,
  onUnblockContact,
  onDeleteChat,
  onOpenNewGroup,
  onUpdateUser,
  onOpenContactProfile,
  onOpenInstallModal,
}) => {
  const activeFriends = chats.filter((c) => c.isFriend !== false);

  return (
    <div className={`relative flex flex-col w-full h-full min-h-screen bg-transparent transition-colors duration-300 ${
      isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'
    }`}>
      {/* 1. Header (Matching Image 3.jpeg) */}
      <header className={`sticky top-0 w-full z-40 backdrop-blur-xl border-b shadow-sm transition-colors duration-300 ${
        isNightMode
          ? 'bg-[#0a0e16]/85 border-white/10 text-[#dfe2ee]'
          : 'bg-white/85 border-sky-200/80 text-[#0c2340]'
      }`}>
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BirdLogo className="w-9 h-9" />
            <div className="flex flex-col">
              <span className={`text-xl font-serif font-black tracking-[0.14em] uppercase ${
                isNightMode ? 'text-white' : 'text-[#0c2340]'
              }`}>
                PidgeX
              </span>
              <span className="text-[8px] font-bold tracking-[0.18em] text-[#00a8ff] -mt-1 uppercase">
                NO HAY LÍMITES PARA CONECTAR.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isClassicMode && (
              <>
                {/* Modo Nocturno Button */}
                <button
                  onClick={() => onToggleNightMode?.()}
                  title={
                    isNightMode
                      ? 'Modo Nocturno ACTIVO (clic para volver al modo azul claro)'
                      : 'Activar Modo Nocturno (tonos más oscuros)'
                  }
                  aria-label="Modo Nocturno"
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isNightMode
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-950/40'
                      : 'bg-white/90 text-sky-700 hover:text-sky-900 border border-sky-200 shadow-sm hover:bg-sky-100/90'
                  }`}
                >
                  <Moon className={`w-4 h-4 ${isNightMode ? 'fill-blue-300 text-blue-300' : 'text-sky-600'}`} />
                </button>


                {/* Campanita (Modo No Molestar) */}
                <button
                  onClick={() => onToggleDoNotDisturb?.()}
                  title={
                    user.doNotDisturb
                      ? 'Modo No Molestar ACTIVO (silenciado)'
                      : 'Activar Modo No Molestar'
                  }
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    user.doNotDisturb
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-sm'
                      : isNightMode
                      ? 'bg-[#1c2028]/80 text-[#8d90a0] hover:text-[#dfe2ee] border border-white/10'
                      : 'bg-white/90 text-sky-700 hover:text-sky-900 border border-sky-200 shadow-sm hover:bg-sky-100/90'
                  }`}
                >
                  {user.doNotDisturb ? (
                    <BellOff className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </button>

                {/* Botón Instalar en Celular / Tablet */}
                {onOpenInstallModal && (
                  <button
                    onClick={onOpenInstallModal}
                    title="Instalar en Celular o Tablet"
                    aria-label="Instalar en Celular o Tablet"
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isNightMode
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/35 shadow-sm'
                        : 'bg-white/90 text-sky-700 hover:text-sky-900 border border-sky-200 shadow-sm hover:bg-sky-100/90'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-sky-400" />
                  </button>
                )}
              </>
            )}

            <div
              onClick={onOpenProfile}
              className="relative cursor-pointer group"
              title="Mi Perfil y Ajustes"
            >
              <img
                src={user.avatarUrl}
                alt={user.name}
                className={`w-8 h-8 rounded-full object-cover ring-2 transition-all ${
                  isNightMode
                    ? 'ring-white/10 group-hover:ring-[#38bdf8]'
                    : 'ring-sky-200 group-hover:ring-[#0284c7]'
                }`}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#38bdf8] ring-2 ring-white dark:ring-[#0f131c]" />
            </div>
          </div>
        </div>
      </header>

      {/* Offline Status Banner */}
      {user.status === 'offline' && (
        <div className="bg-neutral-900 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-amber-200 z-30 shadow-md">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Modo Offline activo: Los mensajes se guardan localmente y se sincronizarán al conectarte.</span>
          </div>
          {onUpdateUser && (
            <button
              onClick={() => onUpdateUser({ status: 'online' })}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition-all cursor-pointer whitespace-nowrap"
            >
              Conectar Ahora
            </button>
          )}
        </div>
      )}

      {/* 2. Main Scrollable Container (Responsive for Phones and Tablets) */}
      <main className="flex-1 w-full max-w-[760px] mx-auto px-4 pt-3 pb-28 flex flex-col gap-4 overflow-y-auto">
        {/* Botón Instalar en Celular y Tablet */}
        {onOpenInstallModal && (
          <div className={`p-3 rounded-2xl border backdrop-blur-xl flex items-center justify-between gap-3 shadow-sm ${
            isNightMode
              ? 'bg-[#141822]/90 border-sky-500/25 text-[#dfe2ee]'
              : 'bg-white/95 border-sky-200 text-[#0c2340]'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-bold text-xs truncate ${isNightMode ? 'text-white' : 'text-[#0c2340]'}`}>
                  Instalar en Celular o Tablet
                </span>
                <span className="text-[11px] text-[#8d90a0]">
                  Usa PidgeX en pantalla completa como app nativa
                </span>
              </div>
            </div>

            <button
              onClick={onOpenInstallModal}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
          </div>
        )}

        {/* Banner Modo No Molestar */}
        {user.doNotDisturb && (
          <section className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#1a1714]/80 to-[#141822]/80 backdrop-blur-xl border border-amber-500/30 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <BellOff className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-amber-200">Modo No Molestar Activado</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-amber-500/20 text-amber-300 uppercase">
                    Silenciado
                  </span>
                </div>
                <span className="text-[11px] text-[#a6aab8] truncate">
                  Sonidos de mensajes y llamadas entrantes silenciados
                </span>
              </div>
            </div>

            <button
              onClick={() => onToggleDoNotDisturb?.()}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-white border border-amber-500/40 text-xs font-bold transition-all cursor-pointer shrink-0 ml-2"
            >
              Desactivar
            </button>
          </section>
        )}

        {/* 6. Conversaciones List */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className={`font-bold text-sm ${isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'}`}>Conversaciones</h3>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isNightMode ? 'text-[#8d90a0]' : 'text-sky-700'}`}>
                Prioritarias
              </span>
            </div>
            {onOpenNewGroup && (
              <button
                onClick={onOpenNewGroup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#00a6e0] hover:brightness-110 text-white text-xs font-bold shadow-md shadow-sky-950/20 active:scale-95 transition-all cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>+ Crear Grupo</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {activeFriends.length === 0 ? (
              <div className={`flex flex-col items-center justify-center p-8 rounded-2xl backdrop-blur-xl text-center gap-3.5 my-2 shadow-sm border ${
                isNightMode
                  ? 'bg-[#141822]/85 border-white/10 text-[#dfe2ee]'
                  : 'bg-white/90 border-sky-200/80 text-[#0c2340]'
              }`}>
                <div className={`w-14 h-14 rounded-full border flex items-center justify-center shadow-inner ${
                  isNightMode
                    ? 'bg-gradient-to-tr from-[#2563eb]/20 to-[#38bdf8]/20 border-[#38bdf8]/30 text-[#7bd0ff]'
                    : 'bg-gradient-to-tr from-sky-100 to-blue-100 border-sky-300 text-sky-700'
                }`}>
                  <Users className="w-7 h-7" />
                </div>
                <div className="flex flex-col gap-1 max-w-[280px]">
                  <h4 className={`font-bold text-base ${isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'}`}>
                    Sin conversaciones activas
                  </h4>
                  <p className={`text-xs leading-relaxed ${isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'}`}>
                    Inicia un nuevo chat para enviar mensajes, fotos y audios en tiempo real.
                  </p>
                </div>
                <button
                  onClick={onNewChat}
                  className="mt-1 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#00a6e0] hover:from-[#0369a1] hover:to-[#0284c7] text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <PenSquare className="w-4 h-4" />
                  <span>+ Iniciar Nuevo Chat</span>
                </button>
              </div>
            ) : (
              activeFriends.map((c) => {
              return (
                <article
                  key={c.id}
                  onClick={() => onSelectChat(c)}
                  className={`relative flex items-center gap-3 p-3 rounded-2xl backdrop-blur-xl transition-all cursor-pointer shadow-sm active:scale-[0.99] border ${
                    isNightMode
                      ? 'bg-[#141822]/85 hover:bg-[#1c2230]/90 border-white/10 text-[#dfe2ee]'
                      : 'bg-white/90 hover:bg-sky-50/95 border-sky-200/80 text-[#0c2340]'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenContactProfile?.(c);
                    }}
                    className="relative shrink-0 w-12 h-12 cursor-pointer group"
                    title="Ver perfil de usuario"
                  >
                    {c.avatarUrl ? (
                      <img
                        src={c.avatarUrl}
                        alt={c.name}
                        className="w-12 h-12 rounded-full object-cover group-hover:brightness-110 transition-all"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isNightMode ? 'bg-[#00a6e0]/20 text-[#7bd0ff]' : 'bg-sky-100 text-sky-700'
                      }`}>
                        <Users className="w-6 h-6" />
                      </div>
                    )}
                    {c.isRealTime ? (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10b981] ring-2 ring-white dark:ring-[#1c2028] shadow-[0_0_8px_#10b981]" />
                    ) : c.isOnline ? (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#0284c7] ring-2 ring-white dark:ring-[#1c2028]" />
                    ) : null}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <h4 className={`font-semibold text-sm truncate ${
                          isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'
                        }`}>
                          {c.name}
                        </h4>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 shrink-0" title="Racha de días chateando">
                          <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>{c.streakDays || Math.floor((c.id.length * 3) % 12) + 3}d</span>
                        </span>
                        {c.isRealTime && (
                          <span className="px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] dark:text-[#34d399] border border-[#10b981]/30 text-[10px] font-bold shrink-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>En Vivo</span>
                          </span>
                        )}
                        {c.isVerified && (
                          <span className="text-[#0284c7] dark:text-[#38bdf8] text-xs">
                            <Check className="w-3 h-3 stroke-[3] inline" />
                          </span>
                        )}
                        {c.type === 'group' && !c.isRealTime && (
                          <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                            isNightMode ? 'bg-[#31353e] text-[#8d90a0]' : 'bg-sky-100 text-sky-700'
                          }`}>
                            Grupo
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs shrink-0 ${
                          c.unreadCount > 0
                            ? isNightMode ? 'text-[#7bd0ff] font-semibold' : 'text-[#0284c7] font-semibold'
                            : isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'
                        }`}
                      >
                        {c.lastMessageTime}
                      </span>
                    </div>

                    {c.isTyping ? (
                      <p
                        className={`text-xs font-semibold flex items-center gap-1.5 truncate mt-0.5 ${
                          c.isRealTime ? 'text-[#10b981]' : isNightMode ? 'text-[#7bd0ff]' : 'text-[#0284c7]'
                        }`}
                      >
                        <span>
                          {c.isRealTime ? 'escribiendo en tiempo real' : 'escribiendo'}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <span
                            className={`w-1 h-1 rounded-full animate-bounce [animation-delay:-0.3s] ${
                              c.isRealTime ? 'bg-[#10b981]' : isNightMode ? 'bg-[#7bd0ff]' : 'bg-[#0284c7]'
                            }`}
                          />
                          <span
                            className={`w-1 h-1 rounded-full animate-bounce [animation-delay:-0.15s] ${
                              c.isRealTime ? 'bg-[#10b981]' : isNightMode ? 'bg-[#7bd0ff]' : 'bg-[#0284c7]'
                            }`}
                          />
                          <span
                            className={`w-1 h-1 rounded-full animate-bounce ${
                              c.isRealTime ? 'bg-[#10b981]' : isNightMode ? 'bg-[#7bd0ff]' : 'bg-[#0284c7]'
                            }`}
                          />
                        </span>
                      </p>
                    ) : (
                      <p className={`text-xs truncate mt-0.5 ${
                        isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'
                      }`}>
                        {c.lastMessageText}
                      </p>
                    )}

                    {/* AI Suggestion Chip if available */}
                    {c.hasAiSuggestion && (
                      <div className="mt-1 inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-[#ddb7ff] text-[10px] font-medium">
                        <Lightbulb className="w-3 h-3" />
                        <span>Sugerencia IA lista</span>
                      </div>
                    )}
                  </div>

                  {/* Unread Counter Badge */}
                  {c.unreadCount > 0 && (
                    <div className="shrink-0 flex items-center justify-center pl-1">
                      <span className="w-5 h-5 rounded-full bg-[#0284c7] text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                        {c.unreadCount}
                      </span>
                    </div>
                  )}

                  {/* Delete Conversation Button */}
                  {onDeleteChat && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(c.id);
                      }}
                      title="Eliminar conversación permanentemente"
                      aria-label="Eliminar conversación"
                      className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition-colors shrink-0 cursor-pointer ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </article>
              );
            })
            )}
          </div>
        </section>



        {/* Banner de Tema Mensual y Festividad con Decoraciones (Lo del mes, abajo de los estados) */}
        {(() => {
          const activeTheme = getActiveMonthlyTheme(user.monthlyTheme);
          return (
            <div className={`relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r ${activeTheme.bannerGradient} text-white border border-white/20 shadow-xl flex items-center justify-between gap-3 animate-in fade-in duration-300`}>
              {/* Background glowing blur */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/15 rounded-full blur-2xl pointer-events-none" />

              {/* Floating decorative items */}
              <div className="absolute right-3 top-2 flex items-center gap-1.5 opacity-90 z-10 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/20">
                <span className="text-xs animate-bounce">{activeTheme.decorations[0] || '🎃'}</span>
                <span className="text-xs animate-pulse">{activeTheme.decorations[1] || '🦇'}</span>
                <span className="text-xs animate-bounce" style={{ animationDelay: '200ms' }}>{activeTheme.decorations[2] || '👻'}</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="text-[10px] font-extrabold text-amber-200 tracking-wider">Automático</span>
              </div>

              <div className="flex items-center gap-3.5 min-w-0 z-10 pr-28">
                <div className="relative w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-lg border border-white/40 transform hover:scale-105 transition-transform">
                  <span>{activeTheme.icon}</span>
                  <div className="absolute -bottom-1 -right-1 text-sm bg-black/40 rounded-full px-1 border border-white/30 animate-bounce">
                    {activeTheme.decorations[1] || '🦇'}
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-xs sm:text-sm tracking-wide text-white uppercase drop-shadow flex items-center gap-1.5">
                      {activeTheme.festivityName}
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </span>
                  </div>
                  <span className="text-[11px] text-white/90 truncate font-medium mt-0.5">
                    {activeTheme.description}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 opacity-90">
                    <span className="text-[10px] font-bold text-amber-300">Decoración temática activa:</span>
                    <div className="flex items-center gap-1 bg-black/25 px-2 py-0.5 rounded-md border border-white/10">
                      {activeTheme.decorations.map((dec, idx) => (
                        <span key={idx} className="text-xs animate-pulse" style={{ animationDelay: `${idx * 300}ms` }}>
                          {dec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </main>

      {/* 7. Floating Action Button (New Chat) */}
      <div className="fixed bottom-20 right-4 z-40 flex items-center justify-end">
        <button
          onClick={onNewChat}
          aria-label="Iniciar nuevo chat"
          title="Nuevo mensaje o conversación"
          className="flex items-center justify-center w-13 h-13 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] shadow-[0_8px_24px_-4px_rgba(2,132,199,0.45)] text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
        >
          <PenSquare className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
