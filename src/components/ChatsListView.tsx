import React from 'react';
import {
  Users,
  PenSquare,
  Check,
  Smartphone,
  Bell,
  BellOff,
  Moon,
  WifiOff,
  Trash2,
} from 'lucide-react';
import { Chat, UserProfile, Wallpaper } from '../types';
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
  isNightMode = false,
  isClassicMode = false,
  onToggleNightMode,
  onSelectChat,
  onToggleDoNotDisturb,
  onOpenProfile,
  onNewChat,
  onDeleteChat,
  onOpenNewGroup,
  onUpdateUser,
  onOpenContactProfile,
  onOpenInstallModal,
}) => {
  const activeFriends = chats.filter((c) => c.isFriend !== false);
  const activeTheme = getActiveMonthlyTheme(user.monthlyTheme);

  return (
    <div
      className={`relative flex flex-col w-full h-full min-h-screen bg-transparent transition-colors duration-200 ${
        isNightMode ? 'text-[#eef2f8]' : 'text-[#0f172a]'
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 w-full z-40 border-b transition-colors duration-200 ${
          isNightMode
            ? 'bg-[#121722] border-white/10 text-[#eef2f8]'
            : 'bg-white border-slate-200 text-[#0f172a]'
        }`}
      >
        <div className="h-16 max-w-[760px] mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BirdLogo className="w-9 h-9" />
            <span className="text-xl font-bold tracking-tight">PidgeX</span>
          </div>

          <div className="flex items-center gap-2">
            {!isClassicMode && (
              <>
                <button
                  onClick={() => onToggleNightMode?.()}
                  title={isNightMode ? 'Cambiar a modo claro' : 'Cambiar a modo nocturno'}
                  aria-label="Modo nocturno"
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isNightMode
                      ? 'bg-[#1d2536] text-sky-300 hover:bg-[#263147]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Moon className={`w-4 h-4 ${isNightMode ? 'fill-sky-300' : ''}`} />
                </button>

                <button
                  onClick={() => onToggleDoNotDisturb?.()}
                  title={user.doNotDisturb ? 'Desactivar No Molestar' : 'Activar No Molestar'}
                  aria-label="No molestar"
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    user.doNotDisturb
                      ? 'bg-amber-500/20 text-amber-500'
                      : isNightMode
                      ? 'bg-[#1d2536] text-[#94a3b8] hover:text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {user.doNotDisturb ? (
                    <BellOff className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </button>

                {onOpenInstallModal && (
                  <button
                    onClick={onOpenInstallModal}
                    title="Instalar aplicación"
                    aria-label="Instalar en celular o tablet"
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isNightMode
                        ? 'bg-[#1d2536] text-sky-300 hover:bg-[#263147]'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            <button
              onClick={onOpenProfile}
              className="relative cursor-pointer rounded-full focus:outline-none"
              title="Mi perfil"
            >
              <img
                src={user.avatarUrl}
                alt={user.name}
                className={`w-9 h-9 rounded-full object-cover border ${
                  isNightMode ? 'border-white/15' : 'border-slate-200'
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Offline Status Banner */}
      {user.status === 'offline' && (
        <div className="bg-amber-950/90 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-amber-200 z-30">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Sin conexión: tus mensajes se enviarán al reconectar.</span>
          </div>
          {onUpdateUser && (
            <button
              onClick={() => onUpdateUser({ status: 'online' })}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              Conectar
            </button>
          )}
        </div>
      )}

      {/* Main Scrollable Container */}
      <main className="flex-1 w-full max-w-[760px] mx-auto px-4 pt-3 pb-28 flex flex-col gap-3.5 overflow-y-auto">
        {/* Install Prompt */}
        {onOpenInstallModal && (
          <div
            className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-3 ${
              isNightMode
                ? 'bg-[#151b28] border-white/10 text-[#eef2f8]'
                : 'bg-white border-slate-200 text-[#0f172a]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isNightMode ? 'bg-[#0284c7]/20 text-sky-400' : 'bg-sky-50 text-[#0284c7]'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs truncate">
                  Instala PidgeX en tu teléfono
                </span>
                <span className={`text-[11px] truncate ${isNightMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                  Úsala como aplicación en pantalla completa
                </span>
              </div>
            </div>

            <button
              onClick={onOpenInstallModal}
              className="px-3.5 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              Instalar
            </button>
          </div>
        )}

        {/* Banner Modo No Molestar */}
        {user.doNotDisturb && (
          <section
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${
              isNightMode
                ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <BellOff className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs">No Molestar activado</span>
                <span className="text-[11px] opacity-80 truncate">
                  Notificaciones de mensajes y llamadas silenciadas
                </span>
              </div>
            </div>

            <button
              onClick={() => onToggleDoNotDisturb?.()}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-semibold transition-colors cursor-pointer shrink-0 ml-2"
            >
              Desactivar
            </button>
          </section>
        )}

        {/* Chats Section */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-baseline gap-2">
              <h2 className="font-bold text-base">Chats</h2>
              {activeFriends.length > 0 && (
                <span className={`text-xs ${isNightMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                  ({activeFriends.length})
                </span>
              )}
            </div>
            {onOpenNewGroup && (
              <button
                onClick={onOpenNewGroup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Nuevo grupo</span>
              </button>
            )}
          </div>

          <div
            className={`rounded-2xl border overflow-hidden divide-y ${
              isNightMode
                ? 'bg-[#151b28] border-white/10 divide-white/5'
                : 'bg-white border-slate-200 divide-slate-100 shadow-sm'
            }`}
          >
            {activeFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isNightMode ? 'bg-[#1e2638] text-sky-400' : 'bg-sky-50 text-[#0284c7]'
                  }`}
                >
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex flex-col gap-1 max-w-[280px]">
                  <h4 className="font-semibold text-sm">Aún no tienes chats</h4>
                  <p className={`text-xs leading-relaxed ${isNightMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                    Empieza una conversación para enviar mensajes, fotos, videos y notas de voz.
                  </p>
                </div>
                <button
                  onClick={onNewChat}
                  className="mt-1 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <PenSquare className="w-4 h-4" />
                  <span>Nuevo chat</span>
                </button>
              </div>
            ) : (
              activeFriends.map((c) => (
                <article
                  key={c.id}
                  onClick={() => onSelectChat(c)}
                  className={`flex items-center gap-3 px-3.5 py-3 transition-colors cursor-pointer ${
                    isNightMode
                      ? 'hover:bg-[#1b2232]'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenContactProfile?.(c);
                    }}
                    className="relative shrink-0 w-12 h-12 cursor-pointer"
                    title="Ver perfil"
                  >
                    {c.avatarUrl ? (
                      <img
                        src={c.avatarUrl}
                        alt={c.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isNightMode ? 'bg-[#1e293b] text-sky-400' : 'bg-sky-100 text-[#0284c7]'
                        }`}
                      >
                        <Users className="w-5 h-5" />
                      </div>
                    )}
                    {(c.isRealTime || c.isOnline) && (
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ${
                          c.isRealTime ? 'bg-emerald-500' : 'bg-emerald-500'
                        } ${isNightMode ? 'ring-[#151b28]' : 'ring-white'}`}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{c.name}</h4>
                        {c.isVerified && (
                          <Check className="w-3.5 h-3.5 text-[#0284c7] stroke-[2.5] shrink-0" />
                        )}
                        {c.type === 'group' && (
                          <span
                            className={`text-[11px] shrink-0 ${
                              isNightMode ? 'text-[#94a3b8]' : 'text-[#64748b]'
                            }`}
                          >
                            • Grupo
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] shrink-0 tabular-nums ${
                          c.unreadCount > 0
                            ? 'text-[#0284c7] font-semibold'
                            : isNightMode
                            ? 'text-[#94a3b8]'
                            : 'text-[#64748b]'
                        }`}
                      >
                        {c.lastMessageTime}
                      </span>
                    </div>

                    {c.isTyping ? (
                      <p className="text-xs font-medium text-[#0284c7] truncate mt-0.5">
                        escribiendo...
                      </p>
                    ) : (
                      <p
                        className={`text-xs truncate mt-0.5 ${
                          isNightMode ? 'text-[#94a3b8]' : 'text-[#64748b]'
                        }`}
                      >
                        {c.lastMessageText}
                      </p>
                    )}
                  </div>

                  {/* Unread Counter Badge */}
                  {c.unreadCount > 0 && (
                    <div className="shrink-0 flex items-center justify-center">
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#0284c7] text-white text-[11px] font-semibold flex items-center justify-center tabular-nums">
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
                      title="Eliminar conversación"
                      aria-label="Eliminar conversación"
                      className={`p-2 rounded-lg transition-colors shrink-0 cursor-pointer ${
                        isNightMode
                          ? 'text-[#64748b] hover:text-red-400 hover:bg-red-500/10'
                          : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        {/* Quiet Seasonal Note */}
        <div
          className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            isNightMode
              ? 'bg-[#151b28] border-white/10 text-[#cbd5e1]'
              : 'bg-white border-slate-200 text-[#334155]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg shrink-0">{activeTheme.icon}</span>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold truncate">
                {activeTheme.name} · {activeTheme.festivityName}
              </span>
              <span className={`text-[11px] truncate ${isNightMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                {activeTheme.description}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button (New Chat) */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={onNewChat}
          aria-label="Iniciar nuevo chat"
          title="Nuevo chat"
          className="flex items-center justify-center w-13 h-13 rounded-full bg-[#0284c7] hover:bg-[#0369a1] shadow-lg text-white active:scale-95 transition-all focus:outline-none cursor-pointer"
        >
          <PenSquare className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
