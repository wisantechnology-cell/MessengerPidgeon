import React, { useState } from 'react';
import { Smile, X, Sparkles, ThumbsUp, Briefcase, Dog, Image as ImageIcon } from 'lucide-react';
import { StickerItem } from '../types';
import { STICKERS } from '../data/mockData';

interface EmojiStickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  onSelectSticker?: (sticker: StickerItem) => void;
}

interface EmojiCategory {
  name: string;
  icon: React.ReactNode;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: 'Frecuentes',
    icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
    emojis: ['👍', '❤️', '🔥', '🙌', '🎉', '🚀', '✨', '😂', '😍', '👏', '💼', '💯', '🕊️', '🤝', '💀', '😭', '🤭', '🐱'],
  },
  {
    name: 'Caras & Emociones',
    icon: <Smile className="w-3.5 h-3.5 text-sky-400" />,
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😎', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🫣', '🤭', '🫢', '🤫', '🫠'],
  },
  {
    name: 'Gestos & Manos',
    icon: <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />,
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💅', '🤳', '💪'],
  },
  {
    name: 'Animales & Naturaleza',
    icon: <Dog className="w-3.5 h-3.5 text-orange-400" />,
    emojis: ['🐱', '🐶', '🐕', '🐩', '🐈', '🦁', '🐯', '🦊', '🐻', '🐼', '🐨', '🐸', '🕊️', '🦅', '🦆', '🦜', '🦉', '🦚', '🦩', '🐦', '🌸', '🌺', '🍀', '🌟', '🌙', '⚡', '🔥'],
  },
  {
    name: 'Objetos & Símbolos',
    icon: <Briefcase className="w-3.5 h-3.5 text-purple-400" />,
    emojis: ['💼', '💻', '📱', '⌨️', '🖥️', '📊', '📈', '📁', '📄', '✏️', '📌', '📎', '💡', '🔔', '🚀', '🎯', '🏆', '💯', '☕', '🍮', '🍿', '🍕', '🎉', '✨', '❤️', '🔥', '💀', '👀'],
  },
];

export const EmojiStickerPicker: React.FC<EmojiStickerPickerProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
  onSelectSticker,
}) => {
  const [activeTab, setActiveTab] = useState<'stickers' | 'emojis'>('stickers');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [stickerFilter, setStickerFilter] = useState<string>('Todos');

  if (!isOpen) return null;

  const filteredCategories = EMOJI_CATEGORIES.map((cat) => {
    if (selectedCategory !== 'Todos' && cat.name !== selectedCategory) {
      return { ...cat, emojis: [] };
    }
    return cat;
  }).filter((cat) => cat.emojis.length > 0);

  const stickerCategories = ['Todos', ...Array.from(new Set(STICKERS.map((s) => s.category)))];
  const filteredStickers = stickerFilter === 'Todos'
    ? STICKERS
    : STICKERS.filter((s) => s.category === stickerFilter);

  return (
    <div className="absolute bottom-20 left-3 right-3 z-50 bg-[#14171f]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 max-w-lg mx-auto">
      {/* Header with Tab Switcher */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-2.5 gap-2">
        <div className="flex items-center bg-[#1e232e] p-0.5 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('stickers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'stickers'
                ? 'bg-[#2563eb] text-white shadow-md'
                : 'text-[#8d90a0] hover:text-[#dfe2ee]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Stickers ({STICKERS.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('emojis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'emojis'
                ? 'bg-[#2563eb] text-white shadow-md'
                : 'text-[#8d90a0] hover:text-[#dfe2ee]'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Emojis</span>
          </button>
        </div>

        <button
          onClick={onClose}
          aria-label="Cerrar selector"
          className="w-7 h-7 rounded-full bg-[#262a33] hover:bg-[#323742] flex items-center justify-center text-[#8d90a0] hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {activeTab === 'stickers' ? (
        <div className="flex flex-col gap-2">
          {/* Stickers Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
            {stickerCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setStickerFilter(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  stickerFilter === cat
                    ? 'bg-[#2563eb] text-white shadow-sm'
                    : 'bg-[#1e232e] text-[#8d90a0] hover:text-[#dfe2ee]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stickers Grid */}
          <div className="max-h-72 overflow-y-auto pr-1 no-scrollbar grid grid-cols-3 sm:grid-cols-4 gap-2.5 py-1">
            {filteredStickers.map((sticker) => (
              <button
                key={sticker.id}
                onClick={() => {
                  onSelectSticker?.(sticker);
                  onClose();
                }}
                className="group relative flex flex-col items-center justify-center p-2 rounded-xl bg-[#1a1e27] hover:bg-[#252a37] border border-white/5 hover:border-white/20 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                title={`${sticker.title} - ${sticker.subtitle}`}
              >
                <div className="w-20 h-20 flex items-center justify-center overflow-hidden rounded-lg">
                  <img
                    src={sticker.imageUrl}
                    alt={sticker.title}
                    className="w-full h-full object-contain drop-shadow"
                    loading="lazy"
                  />
                </div>
                <span className="mt-1 text-[11px] font-medium text-[#c4c7d5] group-hover:text-white truncate max-w-full text-center">
                  {sticker.title}
                </span>
                <span className="text-[9px] text-[#8d90a0] truncate max-w-full text-center">
                  {sticker.subtitle}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
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
      )}
    </div>
  );
};

