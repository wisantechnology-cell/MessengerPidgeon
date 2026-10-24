import React from 'react';
import { X, Palette, Sparkles, Check } from 'lucide-react';
import { Chat } from '../types';

interface ChatThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  isNightMode?: boolean;
  onSelectGradient: (chatId: string, gradient: string) => void;
}

export const CHAT_GRADIENTS = [
  { id: 'default', name: 'Azul Clásico PidgeX', css: 'from-[#0084ff] to-[#00a6e0]' },
  { id: 'sunset', name: 'Atardecer Naranja', css: 'from-orange-600 via-amber-600 to-yellow-500' },
  { id: 'emerald', name: 'Bosque Esmeralda', css: 'from-emerald-700 via-teal-600 to-cyan-700' },
  { id: 'purple', name: 'Noche Violeta', css: 'from-purple-800 via-indigo-700 to-blue-800' },
  { id: 'neon', name: 'Ciberpunk Neón', css: 'from-pink-600 via-purple-600 to-cyan-500' },
  { id: 'ruby', name: 'Rubí Pasión', css: 'from-red-700 via-rose-600 to-pink-700' },
];

export const ChatThemeModal: React.FC<ChatThemeModalProps> = ({
  isOpen,
  onClose,
  chat,
  isNightMode = false,
  onSelectGradient,
}) => {
  if (!isOpen) return null;

  const currentGradient = chat.headerGradient || 'from-[#0084ff] to-[#00a6e0]';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`relative max-w-sm w-full rounded-3xl p-6 border shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200 ${
        isNightMode ? 'bg-[#181c24] border-white/10 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Tema del Chat 🎨</h3>
              <span className="text-xs text-[#8d90a0]">Personaliza el color de {chat.name}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {CHAT_GRADIENTS.map((g) => {
            const isSelected = currentGradient === g.css;
            return (
              <button
                key={g.id}
                onClick={() => {
                  onSelectGradient(chat.id, g.css);
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected ? 'border-blue-500 bg-blue-500/15' : 'border-white/10 bg-black/20 hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-r ${g.css} shadow-md`} />
                  <span className="text-xs font-bold">{g.name}</span>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
