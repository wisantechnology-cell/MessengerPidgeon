import React, { useState } from 'react';
import { Smile, X, Sparkles, Search } from 'lucide-react';
import { StickerItem } from '../types';

interface EmojiStickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  onSelectSticker?: (sticker: StickerItem) => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Frecuentes',
    icon: '✨',
    emojis: ['👍', '❤️', '🔥', '🙌', '🎉', '🚀', '✨', '😂', '😍', '👏', '💼', '💯', '🕊️', '🤝', '💀', '😭', '🤭', '🐱'],
  },
  {
    name: 'Caras & Emociones',
    icon: '😀',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😎', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🫣', '🤭', '🫢', '🤫', '🫠'],
  },
  {
    name: 'Gestos & Manos',
    icon: '👍',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💅', '🤳', '💪'],
  },
  {
    name: 'Animales & Naturaleza',
    icon: '🐱',
    emojis: ['🐱', '🐶', '🐕', '🐩', '🐈', '🦁', '🐯', '🦊', '🐻', '🐼', '🐨', '🐸', '🕊️', '🦅', '🦆', '🦜', '🦉', '🦚', '🦩', '🐦', '🌸', '🌺', '🍀', '🌟', '🌙', '⚡', '🔥'],
  },
  {
    name: 'Objetos & Símbolos',
    icon: '💼',
    emojis: ['💼', '💻', '📱', '⌨️', '🖥️', '📊', '📈', '📁', '📄', '✏️', '📌', '📎', '💡', '🔔', '🚀', '🎯', '🏆', '💯', '☕', '🍮', '🍿', '🍕', '🎉', '✨', '❤️', '🔥', '💀', '👀'],
  },
];

export const EmojiStickerPicker: React.FC<EmojiStickerPickerProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const filteredCategories = EMOJI_CATEGORIES.map((cat) => {
    if (selectedCategory !== 'Todos' && cat.name !== selectedCategory) {
      return { ...cat, emojis: [] };
    }
    if (!searchQuery.trim()) return cat;
    return cat;
  }).filter((cat) => cat.emojis.length > 0);

  return (
    <div className="absolute bottom-20 left-3 right-3 z-50 bg-[#14171f]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#2563eb]/20 text-[#38bdf8] flex items-center justify-center">
            <Smile className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-[#dfe2ee]">Selector de Emojis</span>
        </div>

        <button
          onClick={onClose}
          aria-label="Cerrar selector"
          className="w-7 h-7 rounded-full bg-[#262a33] hover:bg-[#323742] flex items-center justify-center text-[#8d90a0] hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('Todos')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === 'Todos'
              ? 'bg-[#2563eb] text-white shadow-sm'
              : 'bg-[#1e232e] text-[#8d90a0] hover:text-[#dfe2ee]'
          }`}
        >
          Todos
        </button>
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setSelectedCategory(cat.name)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.name
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'bg-[#1e232e] text-[#8d90a0] hover:text-[#dfe2ee]'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="max-h-64 overflow-y-auto pr-1 no-scrollbar flex flex-col gap-3">
        {filteredCategories.map((cat, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-[#8d90a0] uppercase tracking-wider flex items-center gap-1">
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </span>
            <div className="grid grid-cols-8 gap-1">
              {cat.emojis.map((emoji, eIdx) => (
                <button
                  key={eIdx}
                  onClick={() => onSelectEmoji(emoji)}
                  className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-xl hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
