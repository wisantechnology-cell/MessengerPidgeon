import React, { useState } from 'react';
import { Plus, X, Eye, Send, Trash2, MessageCircle, Sparkles, Smile, CheckCheck, Globe, Users, Pin, Lock } from 'lucide-react';
import { StatusItem, StatusReply } from '../types/status';
import { UserProfile } from '../types';

interface StatusSectionProps {
  user: UserProfile;
  statuses: StatusItem[];
  isNightMode?: boolean;
  onAddStatus: (mediaUrl: string, caption?: string, title?: string, privacy?: 'contacts' | 'everyone') => void;
  onDeleteStatus: (statusId: string) => void;
  onReplyToStatus: (statusId: string, replyText: string) => void;
}

export const StatusSection: React.FC<StatusSectionProps> = ({
  user,
  statuses,
  isNightMode = false,
  onAddStatus,
  onDeleteStatus,
  onReplyToStatus,
}) => {
  const [activeStatusModal, setActiveStatusModal] = useState<StatusItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [statusTitleInput, setStatusTitleInput] = useState<string>('');
  const [statusCaptionInput, setStatusCaptionInput] = useState<string>('');
  const [statusPrivacyInput, setStatusPrivacyInput] = useState<'everyone' | 'contacts'>('everyone');
  const [replyInput, setReplyInput] = useState<string>('');

  // My status or other statuses
  const myStatuses = statuses.filter((s) => s.userId === 'me' || s.userId === user.id);
  const otherStatuses = statuses.filter((s) => s.userId !== 'me' && s.userId !== user.id);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTitleInput.trim()) return;
    onAddStatus(
      user.avatarUrl,
      statusCaptionInput.trim() || undefined,
      statusTitleInput.trim(),
      statusPrivacyInput
    );
    setStatusTitleInput('');
    setStatusCaptionInput('');
    setStatusPrivacyInput('everyone');
    setShowCreateModal(false);
  };

  const handleSendReply = (statusId: string) => {
    if (!replyInput.trim()) return;
    onReplyToStatus(statusId, replyInput.trim());
    setReplyInput('');
  };

  const presetPhotos = [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h3 className={`font-bold text-sm ${isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'}`}>
          Estados
        </h3>
        <span className="text-[10px] text-sky-500 font-bold uppercase tracking-wider">
          Privados y Seguros
        </span>
      </div>

      {/* Stories row */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {/* Add my status button */}
        <div
          onClick={() => setShowCreateModal(true)}
          className={`relative flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group`}
        >
          <div className={`w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-[#2563eb] to-[#00a8ff] shadow-md group-hover:scale-105 transition-transform`}>
            <div className={`w-full h-full rounded-full overflow-hidden relative ${isNightMode ? 'bg-[#181c24]' : 'bg-white'}`}>
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                <Plus className="w-6 h-6 stroke-[3]" />
              </div>
            </div>
          </div>
          <span className={`text-[11px] font-bold truncate max-w-[70px] ${isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'}`}>
            Crear Estado
          </span>
          {myStatuses.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-[#0f131c]">
              {myStatuses.length}
            </span>
          )}
        </div>

        {/* My current active status preview */}
        {myStatuses.map((st) => (
          <div
            key={st.id}
            onClick={() => setActiveStatusModal(st)}
            className="relative flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full overflow-hidden">
                <img src={st.mediaUrl} alt="Estado" className="w-full h-full object-cover" />
              </div>
            </div>
            <span className={`text-[11px] font-medium truncate max-w-[70px] ${isNightMode ? 'text-[#8d90a0]' : 'text-sky-800'}`}>
              {st.title || 'Mi Estado'}
            </span>
          </div>
        ))}

        {/* Other users statuses */}
        {otherStatuses.map((st) => (
          <div
            key={st.id}
            onClick={() => setActiveStatusModal(st)}
            className="relative flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-[#2563eb] to-cyan-400 shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full overflow-hidden">
                <img src={st.userAvatar} alt={st.userName} className="w-full h-full object-cover" />
              </div>
            </div>
            <span className={`text-[11px] font-medium truncate max-w-[70px] ${isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'}`}>
              {st.userName.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Modal to Create Status: Only Nombre del estado and Foto del estado */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            isNightMode ? 'bg-[#141822] border-white/10 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2563eb]" />
                <h3 className="font-bold text-base">Crear Estado</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center hover:opacity-70 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-1">
              {/* 1. Nombre del Estado */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#8d90a0]">Nombre del Estado</label>
                <input
                  type="text"
                  placeholder="Ej. Mi Viaje, Fiesta, Anuncio..."
                  value={statusTitleInput}
                  onChange={(e) => setStatusTitleInput(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none ${
                    isNightMode
                      ? 'bg-[#1e2330] border-white/10 text-white focus:border-[#38bdf8]'
                      : 'bg-sky-50/50 border-sky-200 text-[#0c2340] focus:border-[#2563eb]'
                  }`}
                  required
                />
              </div>



              {/* 3. Descripción (Opcional) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#8d90a0]">Descripción (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Escribe una descripción para tu estado..."
                  value={statusCaptionInput}
                  onChange={(e) => setStatusCaptionInput(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none resize-none ${
                    isNightMode
                      ? 'bg-[#1e2330] border-white/10 text-white focus:border-[#38bdf8]'
                      : 'bg-sky-50/50 border-sky-200 text-[#0c2340] focus:border-[#2563eb]'
                  }`}
                />
              </div>

              {/* 4. Privacidad: Contactos o Todos */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#8d90a0]">Privacidad del Estado</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusPrivacyInput('everyone')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      statusPrivacyInput === 'everyone'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : isNightMode ? 'bg-white/5 border-white/10 text-[#8d90a0]' : 'bg-sky-50 border-sky-200 text-sky-800'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Todos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusPrivacyInput('contacts')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      statusPrivacyInput === 'contacts'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : isNightMode ? 'bg-white/5 border-white/10 text-[#8d90a0]' : 'bg-sky-50 border-sky-200 text-sky-800'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Solo Contactos</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#00a8ff] text-white font-bold text-xs shadow-lg hover:opacity-95 active:scale-98 transition-all mt-2 cursor-pointer"
              >
                Publicar Estado
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Status Viewer Modal */}
      {activeStatusModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-between p-3 sm:p-5 select-none">
          {/* Top Header bar */}
          <div className="w-full max-w-xl flex items-center justify-between text-white z-10 pt-2 px-2">
            <div className="flex items-center gap-3">
              <img src={activeStatusModal.userAvatar} alt={activeStatusModal.userName} className="w-10 h-10 rounded-full object-cover ring-2 ring-[#2563eb]" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white drop-shadow">{activeStatusModal.userName}</span>
                  {activeStatusModal.title && (
                    <span className="text-[10px] bg-[#2563eb]/40 text-[#7bd0ff] px-2 py-0.5 rounded-full font-bold border border-[#2563eb]/40">
                      {activeStatusModal.title}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-neutral-400">{activeStatusModal.timestamp}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(activeStatusModal.userId === 'me' || activeStatusModal.userId === user.id) && (
                <button
                  onClick={() => {
                    onDeleteStatus(activeStatusModal.id);
                    setActiveStatusModal(null);
                  }}
                  title="Eliminar este estado"
                  className="w-9 h-9 rounded-full bg-red-600/30 text-red-300 flex items-center justify-center hover:bg-red-600/50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setActiveStatusModal(null)}
                className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main media container */}
          <div className="relative flex-1 w-full max-w-xl flex items-center justify-center my-2 overflow-hidden rounded-2xl bg-black border border-white/10 shadow-2xl">
            <img
              src={activeStatusModal.mediaUrl}
              alt="Estado multimedia"
              className="max-h-[50vh] max-w-full object-contain"
            />
            {activeStatusModal.title && (
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-sky-400" />
                <span>{activeStatusModal.title}</span>
              </div>
            )}
          </div>

          {/* Bottom Chat Section (Exact same design as chat window with chat bubbles and chat input bar) */}
          <div className="w-full max-w-xl flex flex-col bg-[#0f131c] rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-10">
            {(activeStatusModal.userId === 'me' || activeStatusModal.userId === user.id) ? (
              <>
                {/* Chat Message Bubbles Stream */}
                <div className="max-h-40 overflow-y-auto p-3 space-y-2.5 flex flex-col scrollbar-none bg-[#0a0e16]/60">
                  <div className="text-center py-1">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/15 text-[#7bd0ff] border border-blue-500/20">
                      Chat de tu Estado (Diseño idéntico a chats)
                    </span>
                  </div>

                  {(!activeStatusModal.replies || activeStatusModal.replies.length === 0) ? (
                    <div className="text-center py-4 text-neutral-500 text-xs italic">
                      No hay mensajes en este chat de estado aún. ¡Escribe el primero!
                    </div>
                  ) : (
                    activeStatusModal.replies.map((rep) => {
                      const isMe = rep.senderId === 'me' || rep.senderId === user.id;
                      return (
                        <div
                          key={rep.id}
                          className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                        >
                          <img
                            src={rep.senderAvatar || user.avatarUrl}
                            alt={rep.senderName}
                            className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
                          />
                          <div
                            className={`flex flex-col p-3 rounded-2xl shadow-sm text-xs ${
                              isMe
                                ? 'bg-[#2563eb] text-white rounded-br-none'
                                : 'bg-[#1c2028] text-[#dfe2ee] rounded-bl-none border border-white/15'
                            }`}
                          >
                            <span className="font-bold text-[10px] opacity-80 mb-0.5">{rep.senderName}</span>
                            <span className="break-words leading-relaxed">{rep.text}</span>
                            <div className="flex items-center justify-end gap-1 mt-1 opacity-70 text-[9px]">
                              <span>{rep.timestamp}</span>
                              {isMe && <CheckCheck className="w-3 h-3 text-sky-200" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Chat Input Bar (Exact same design as chat view bottom bar) */}
                <div className="p-2.5 bg-[#141822] border-t border-white/10 flex items-center gap-2">
                  <button
                    type="button"
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-[#8d90a0] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Emojis"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    placeholder="Escribe un mensaje como en un chat..."
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendReply(activeStatusModal.id);
                    }}
                    className="flex-1 bg-[#1e2330] text-white placeholder:text-[#8d90a0] text-xs px-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[#2563eb]"
                  />

                  <button
                    onClick={() => handleSendReply(activeStatusModal.id)}
                    className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#00a8ff] hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-3 px-4 bg-[#141822] text-[#8d90a0] text-xs italic border-t border-white/10 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Solo el creador puede chatear en este estado (modo visualización)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
