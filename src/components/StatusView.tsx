import React, { useState } from 'react';
import { Camera, Plus, Eye, Sparkles, X, Send, Image as ImageIcon } from 'lucide-react';
import { StatusStory, UserProfile } from '../types';

interface StatusViewProps {
  user: UserProfile;
  statuses: StatusStory[];
  onCreateStatus: (status: StatusStory) => void;
  isNightMode?: boolean;
}

export const StatusView: React.FC<StatusViewProps> = ({
  user,
  statuses,
  onCreateStatus,
  isNightMode = false,
}) => {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [statusMediaUrl, setStatusMediaUrl] = useState<string>('');
  const [activeStoryModal, setActiveStoryModal] = useState<StatusStory | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusText.trim() && !statusMediaUrl) return;

    const newStory: StatusStory = {
      id: `story_${Date.now()}`,
      userId: user.id || 'me',
      userName: user.name,
      userAvatar: user.avatarUrl,
      text: statusText.trim(),
      mediaUrl: statusMediaUrl || undefined,
      timestamp: 'Justo ahora',
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      viewed: false,
    };

    onCreateStatus(newStory);
    setStatusText('');
    setStatusMediaUrl('');
    setShowCreateModal(false);
  };

  // Group statuses by user
  const myStories = statuses.filter((s) => s.userId === user.id || s.userId === 'me');
  const otherStories = statuses.filter((s) => s.userId !== user.id && s.userId !== 'me');

  return (
    <div className={`w-full h-full flex flex-col p-4 md:p-6 overflow-y-auto ${
      isNightMode ? 'bg-[#0b0e14] text-white' : 'bg-[#f0f4f8] text-[#0c2340]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Estados 📱</h2>
          <p className="text-xs text-[#8d90a0]">Actualizaciones de estado que desaparecen en 24 horas</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>Subir Estado</span>
        </button>
      </div>

      {/* My Status Section */}
      <div className="flex flex-col gap-3 mb-6">
        <span className="text-xs font-bold text-[#8d90a0] uppercase tracking-wider">Mi Estado</span>
        <div
          onClick={() => {
            if (myStories.length > 0) {
              setActiveStoryModal(myStories[0]);
            } else {
              setShowCreateModal(true);
            }
          }}
          className={`flex items-center gap-4 p-4 rounded-3xl border transition-all cursor-pointer ${
            isNightMode ? 'bg-[#141822] border-white/10 hover:border-emerald-500/50' : 'bg-white border-emerald-200 hover:border-emerald-400 shadow-md'
          }`}
        >
          <div className="relative">
            <div className={`w-14 h-14 rounded-full p-0.5 ${myStories.length > 0 ? 'bg-gradient-to-tr from-emerald-500 to-cyan-400 ring-2 ring-emerald-500/50' : 'bg-gray-600'}`}>
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            {myStories.length === 0 && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                <Plus className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-bold truncate">Mi estado</span>
            <span className="text-xs text-[#8d90a0]">
              {myStories.length > 0 ? `${myStories.length} historia activa · Toca para ver` : 'Toca para añadir una actualización'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold text-[#8d90a0] uppercase tracking-wider">Actualizaciones Recientes</span>
        {otherStories.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#8d90a0] italic">
            No hay estados recientes de tus amigos. ¡Sé el primero en compartir uno!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherStories.map((story) => (
              <div
                key={story.id}
                onClick={() => setActiveStoryModal(story)}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isNightMode ? 'bg-[#141822] border-white/10 hover:border-white/30' : 'bg-white border-sky-200 hover:border-sky-300 shadow-sm'
                }`}
              >
                <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-blue-500 to-cyan-400 ring-2 ring-blue-500/40 shrink-0">
                  <img src={story.userAvatar} alt={story.userName} className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold truncate">{story.userName}</span>
                  <span className="text-[11px] text-[#8d90a0] truncate">{story.text || '📷 Foto de estado'}</span>
                  <span className="text-[10px] text-gray-500 mt-0.5">{story.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Status Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`w-full max-w-[420px] rounded-3xl p-6 border shadow-2xl flex flex-col gap-4 ${
            isNightMode ? 'bg-[#181c24] border-white/10 text-white' : 'bg-white border-emerald-200 text-[#0c2340]'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-white/10">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Nuevo Estado de 24h</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#8d90a0]">¿Qué estás pensando o haciendo?</label>
                <textarea
                  rows={3}
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  placeholder="Comparte un momento con tus amigos..."
                  className="bg-[#121620] text-xs text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#8d90a0] flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>URL de Imagen (Opcional)</span>
                </label>
                <input
                  type="url"
                  value={statusMediaUrl}
                  onChange={(e) => setStatusMediaUrl(e.target.value)}
                  placeholder="https://ejemplo.com/foto.jpg"
                  className="bg-[#121620] text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-all cursor-pointer mt-1"
              >
                <Send className="w-4 h-4" />
                <span>Publicar Estado</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {activeStoryModal && (
        <div
          onClick={() => setActiveStoryModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm aspect-[9/16] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between p-5"
          >
            {/* Top progress bar */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="w-full h-full bg-emerald-500 animate-[pulse_2s_infinite]" />
            </div>

            {/* Author info */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <img src={activeStoryModal.userAvatar} alt={activeStoryModal.userName} className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{activeStoryModal.userName}</span>
                  <span className="text-[10px] text-gray-400">{activeStoryModal.timestamp}</span>
                </div>
              </div>
              <button onClick={() => setActiveStoryModal(null)} className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 my-auto">
              {activeStoryModal.mediaUrl && (
                <img src={activeStoryModal.mediaUrl} alt="Estado" className="w-full max-h-64 object-cover rounded-2xl shadow-lg" />
              )}
              {activeStoryModal.text && (
                <p className="text-sm md:text-base font-bold text-white px-4 leading-relaxed bg-black/40 p-4 rounded-2xl border border-white/10">
                  "{activeStoryModal.text}"
                </p>
              )}
            </div>

            {/* Footer reaction */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Responder a este estado..."
                className="flex-1 bg-white/10 text-xs text-white px-4 py-3 rounded-full border border-white/10 focus:outline-none focus:border-emerald-500 placeholder:text-gray-400"
              />
              <button className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow cursor-pointer">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
