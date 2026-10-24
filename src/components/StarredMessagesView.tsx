import React from 'react';
import { Star, ArrowLeft, MessageSquare, Trash2 } from 'lucide-react';
import { Chat, Message } from '../types';

interface StarredMessagesViewProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  isNightMode?: boolean;
  onJumpToChat?: (chatId: string) => void;
  onUnstarMessage?: (chatId: string, messageId: string) => void;
}

export const StarredMessagesView: React.FC<StarredMessagesViewProps> = ({
  isOpen,
  onClose,
  chats,
  isNightMode = false,
  onJumpToChat,
  onUnstarMessage,
}) => {
  if (!isOpen) return null;

  // Collect all starred messages across all chats
  const starredItems: { chat: Chat; message: Message }[] = [];
  chats.forEach((c) => {
    c.messages.forEach((m) => {
      if (m.isStarred) {
        starredItems.push({ chat: c, message: m });
      }
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-[500px] max-h-[85vh] rounded-3xl p-6 border shadow-2xl flex flex-col gap-4 ${
        isNightMode ? 'bg-[#181c24] border-white/10 text-white' : 'bg-white border-amber-200 text-[#0c2340]'
      }`}>
        <div className="flex items-center justify-between border-b pb-3 border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">Mensajes Destacados ⭐</h3>
              <p className="text-[11px] text-[#8d90a0]">Tus mensajes guardados con estrella</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto pr-1 max-h-[60vh]">
          {starredItems.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#8d90a0] italic flex flex-col items-center gap-2">
              <Star className="w-8 h-8 text-amber-500/30" />
              <span>No tienes mensajes destacados todavía. Toca el ícono de estrella en cualquier mensaje para guardarlo aquí.</span>
            </div>
          ) : (
            starredItems.map(({ chat, message }) => (
              <div
                key={message.id}
                className={`flex flex-col gap-2 p-3.5 rounded-2xl border transition-all ${
                  isNightMode ? 'bg-[#121620] border-white/5 hover:border-amber-500/30' : 'bg-[#f8fafc] border-amber-100 hover:border-amber-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-[#8d90a0]">
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>Chat: {chat.name}</span>
                  </span>
                  <span>{message.timestamp}</span>
                </div>

                <p className="text-xs font-semibold text-white/90 bg-black/20 p-2.5 rounded-xl border border-white/5">
                  {message.text || `[${message.type}]`}
                </p>

                <div className="flex items-center justify-end gap-2 mt-1">
                  {onJumpToChat && (
                    <button
                      onClick={() => {
                        onJumpToChat(chat.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 shadow cursor-pointer"
                    >
                      <span>Ir al Chat</span>
                    </button>
                  )}
                  {onUnstarMessage && (
                    <button
                      onClick={() => onUnstarMessage(chat.id, message.id)}
                      className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-100 transition-colors cursor-pointer"
                      title="Quitar de destacados"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
