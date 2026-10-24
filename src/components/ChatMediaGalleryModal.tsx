import React from 'react';
import { X, Image as ImageIcon, Download, Calendar } from 'lucide-react';
import { Message } from '../types';

interface ChatMediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  chatName: string;
  isNightMode?: boolean;
}

export const ChatMediaGalleryModal: React.FC<ChatMediaGalleryModalProps> = ({
  isOpen,
  onClose,
  messages,
  chatName,
  isNightMode = false,
}) => {
  if (!isOpen) return null;

  const mediaMessages = messages.filter((m) => m.type === 'image' || (m.mediaUrl && (m.mediaUrl.startsWith('http') || m.mediaUrl.startsWith('data:'))));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`relative max-w-2xl w-full max-h-[85vh] rounded-3xl p-6 border shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 ${
        isNightMode
          ? 'bg-[#181c24] border-white/10 text-white'
          : 'bg-white border-sky-200 text-[#0c2340]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Galería Multimedia</h3>
              <span className="text-xs text-[#8d90a0]">Fotos y archivos de {chatName} ({mediaMessages.length})</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto py-4 pr-1">
          {mediaMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <ImageIcon className="w-12 h-12 text-[#8d90a0] opacity-50" />
              <p className="text-sm font-semibold text-[#8d90a0]">No hay fotos o archivos multimedia compartidos en este chat.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {mediaMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="relative group rounded-2xl overflow-hidden bg-black/20 aspect-square border border-white/10 shadow-md"
                >
                  <img
                    src={msg.mediaUrl}
                    alt={msg.mediaName || 'Media'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                    <span className="text-[11px] font-bold text-white truncate">{msg.mediaName || 'Foto compartida'}</span>
                    <span className="text-[9px] text-gray-300">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
