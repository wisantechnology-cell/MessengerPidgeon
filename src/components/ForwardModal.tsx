import React, { useState } from 'react';
import { X, Share2, Send, Check } from 'lucide-react';
import { Chat, Message } from '../types';

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  chats: Chat[];
  isNightMode?: boolean;
  onForwardMessage: (targetChatId: string, message: Message) => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({
  isOpen,
  onClose,
  message,
  chats,
  isNightMode = false,
  onForwardMessage,
}) => {
  if (!isOpen || !message) return null;

  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toggleSelectChat = (chatId: string) => {
    if (selectedChatIds.includes(chatId)) {
      setSelectedChatIds(selectedChatIds.filter((id) => id !== chatId));
    } else {
      setSelectedChatIds([...selectedChatIds, chatId]);
    }
  };

  const handleSendForward = () => {
    if (selectedChatIds.length === 0) return;

    selectedChatIds.forEach((chatId) => {
      onForwardMessage(chatId, {
        ...message,
        id: `forward_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: true,
      });
    });

    setSuccessMsg('¡Mensaje reenviado con éxito!');
    setTimeout(() => {
      setSuccessMsg(null);
      setSelectedChatIds([]);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-[420px] rounded-3xl p-6 border shadow-2xl flex flex-col gap-4 ${
        isNightMode ? 'bg-[#181c24] border-white/10 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
      }`}>
        <div className="flex items-center justify-between border-b pb-3 border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Reenviar Mensaje ↗️</h3>
              <p className="text-[11px] text-[#8d90a0]">Selecciona los chats de destino</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMsg ? (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
            {successMsg}
          </div>
        ) : (
          <>
            {/* Preview of message being forwarded */}
            <div className="p-3 rounded-2xl bg-black/20 border border-white/10 text-xs text-gray-300 italic flex flex-col gap-1">
              <span className="text-[10px] text-sky-400 font-bold uppercase">Mensaje Original:</span>
              <p className="truncate">{message.text || `[${message.type}]`}</p>
            </div>

            {/* Chats list */}
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {chats.map((c) => {
                const isSelected = selectedChatIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleSelectChat(c.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/25 border-blue-500 text-white'
                        : 'bg-[#121620] border-white/5 hover:border-white/20 text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={c.avatarUrl}
                        alt={c.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold truncate">{c.name}</span>
                        <span className="text-[10px] text-[#8d90a0]">
                          {c.type === 'group' ? 'Grupo PidgeX' : 'Chat Directo'}
                        </span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-white/20'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSendForward}
              disabled={selectedChatIds.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer disabled:opacity-50 mt-1"
            >
              <Send className="w-4 h-4" />
              <span>Reenviar a {selectedChatIds.length} {selectedChatIds.length === 1 ? 'chat' : 'chats'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
