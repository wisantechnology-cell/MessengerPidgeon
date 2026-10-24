import React, { useState, useEffect } from 'react';
import { X, Clock, Sparkles, Send, Lock, Unlock, Calendar, Gift } from 'lucide-react';
import { UserProfile, Chat, Message } from '../types';

interface TimeCapsule {
  id: string;
  chatId: string;
  chatName: string;
  messageText: string;
  unlockTime: number; // timestamp
  createdAt: number;
  isUnlocked: boolean;
}

interface TimeCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  user: UserProfile;
  isNightMode?: boolean;
  onSendCapsuleMessage: (chatId: string, text: string) => void;
}

export const TimeCapsuleModal: React.FC<TimeCapsuleModalProps> = ({
  isOpen,
  onClose,
  chats,
  user,
  isNightMode = false,
  onSendCapsuleMessage,
}) => {
  if (!isOpen) return null;

  const [selectedChatId, setSelectedChatId] = useState<string>(chats[0]?.id || '');
  const [capsuleText, setCapsuleText] = useState<string>('');
  const [delayMinutes, setDelayMinutes] = useState<number>(5); // default 5 mins for demo
  const [capsules, setCapsules] = useState<TimeCapsule[]>(() => {
    try {
      const saved = localStorage.getItem('pidge_time_capsules_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  useEffect(() => {
    try {
      localStorage.setItem('pidge_time_capsules_v1', JSON.stringify(capsules));
    } catch {}
  }, [capsules]);

  // Check capsules unlock time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCapsules((prev) =>
        prev.map((cap) => {
          if (!cap.isUnlocked && now >= cap.unlockTime) {
            return { ...cap, isUnlocked: true };
          }
          return cap;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSealCapsule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capsuleText.trim()) return;

    const targetChat = chats.find((c) => c.id === selectedChatId);
    const newCap: TimeCapsule = {
      id: `cap_${Date.now()}`,
      chatId: selectedChatId,
      chatName: targetChat?.name || 'Chat Privado',
      messageText: capsuleText.trim(),
      unlockTime: Date.now() + delayMinutes * 60 * 1000,
      createdAt: Date.now(),
      isUnlocked: false,
    };

    setCapsules([newCap, ...capsules]);
    setCapsuleText('');
    setActiveTab('list');
  };

  const handleSendUnlocked = (cap: TimeCapsule) => {
    onSendCapsuleMessage(cap.chatId, `⏳ [Cápsula del Tiempo Abierta]: "${cap.messageText}"`);
    setCapsules((prev) => prev.filter((c) => c.id !== cap.id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`relative max-w-md w-full rounded-3xl p-6 border shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200 ${
        isNightMode ? 'bg-[#181c24] border-white/10 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Cápsula del Tiempo ⏳</h3>
              <span className="text-xs text-[#8d90a0]">Envía mensajes que se abren en el futuro</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-black/10 dark:bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'create' ? 'bg-amber-600 text-white shadow' : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            Sellar Nueva Cápsula
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list' ? 'bg-amber-600 text-white shadow' : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            Mis Cápsulas ({capsules.length})
          </button>
        </div>

        {activeTab === 'create' ? (
          <form onSubmit={handleSealCapsule} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#8d90a0]">Seleccionar Chat Destino</label>
              <select
                value={selectedChatId}
                onChange={(e) => setSelectedChatId(e.target.value)}
                className="bg-[#121620] text-xs text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {chats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#8d90a0]">Mensaje Secreto del Futuro</label>
              <textarea
                rows={3}
                value={capsuleText}
                onChange={(e) => setCapsuleText(e.target.value)}
                placeholder="Escribe algo especial que se revelará más tarde..."
                className="bg-[#121620] text-xs text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#8d90a0]">Tiempo de Apertura</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '2 min', val: 2 },
                  { label: '5 min', val: 5 },
                  { label: '1 hora', val: 60 },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.val}
                    onClick={() => setDelayMinutes(item.val)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      delayMinutes === item.val ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-[#121620] border-white/10 text-[#8d90a0]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-1"
            >
              <Lock className="w-4 h-4" />
              <span>Sellar Cápsula del Tiempo ⏳</span>
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
            {capsules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <Clock className="w-10 h-10 text-[#8d90a0] opacity-40" />
                <p className="text-xs text-[#8d90a0]">No tienes cápsulas del tiempo activas.</p>
              </div>
            ) : (
              capsules.map((cap) => {
                const timeLeft = Math.max(0, Math.ceil((cap.unlockTime - Date.now()) / 1000));
                const mins = Math.floor(timeLeft / 60);
                const secs = timeLeft % 60;

                return (
                  <div key={cap.id} className="flex flex-col gap-2 p-3.5 rounded-2xl bg-black/20 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">Para: {cap.chatName}</span>
                      {cap.isUnlocked ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> ¡Desbloqueada!
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> {mins}m {secs}s restantes
                        </span>
                      )}
                    </div>
                    <p className="text-xs italic text-gray-300">"{cap.messageText}"</p>
                    {cap.isUnlocked && (
                      <button
                        onClick={() => handleSendUnlocked(cap)}
                        className="mt-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow cursor-pointer self-end"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar al Chat</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
