import React, { useState, useEffect } from 'react';
import { Smile, X, Sparkles, ThumbsUp, Briefcase, Dog, Image as ImageIcon, Film, Search, Loader2, Wand2 } from 'lucide-react';
import { StickerItem, GifItem, CustomStickerPack } from '../types';
import { STICKERS } from '../data/mockData';
import { CURATED_GIFS } from '../data/gifsData';

interface EmojiStickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  onSelectSticker?: (sticker: StickerItem) => void;
  onSelectGif?: (gif: GifItem) => void;
  customStickerPacks?: CustomStickerPack[];
  onOpenStickerFactory?: () => void;
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
  onSelectGif,
  customStickerPacks = [],
  onOpenStickerFactory,
}) => {
  const [activeTab, setActiveTab] = useState<'gifs' | 'stickers' | 'emojis'>('gifs');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [stickerFilter, setStickerFilter] = useState<string>('Todos');
  const [gifFilter, setGifFilter] = useState<string>('Todos');
  const [gifSearchQuery, setGifSearchQuery] = useState<string>('');
  const [remoteGifs, setRemoteGifs] = useState<GifItem[]>([]);
  const [isSearchingGifs, setIsSearchingGifs] = useState<boolean>(false);

  // Live Tenor/Web GIF search when typing a query
  useEffect(() => {
    const q = gifSearchQuery.trim();
    if (!q || q.length < 2) {
      setRemoteGifs([]);
      setIsSearchingGifs(false);
      return;
    }

    let cancelled = false;
    setIsSearchingGifs(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/gifs/search?q=${encodeURIComponent(q)}`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (Array.isArray(data.gifs)) {
            setRemoteGifs(
              data.gifs.map((g: { id: string; title: string; url: string }) => ({
                id: g.id,
                title: g.title,
                category: 'Búsqueda',
                url: g.url,
              }))
            );
          }
        }
      } catch {
        // Fallback to local curated matches silently
      } finally {
        if (!cancelled) setIsSearchingGifs(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [gifSearchQuery]);

  if (!isOpen) return null;

  const filteredCategories = EMOJI_CATEGORIES.map((cat) => {
    if (selectedCategory !== 'Todos' && cat.name !== selectedCategory) {
      return { ...cat, emojis: [] };
    }
    return cat;
  }).filter((cat) => cat.emojis.length > 0);

  const customStickersList: StickerItem[] = customStickerPacks.flatMap((p) =>
    p.stickers.map((s) => ({ ...s, category: p.name }))
  );
  const allStickersCombined = [...customStickersList, ...STICKERS];
  const stickerCategories = ['Todos', ...Array.from(new Set(allStickersCombined.map((s) => s.category)))];
  const filteredStickers = stickerFilter === 'Todos'
    ? allStickersCombined
    : allStickersCombined.filter((s) => s.category === stickerFilter);

  const gifCategories = ['Todos', ...Array.from(new Set(CURATED_GIFS.map((g) => g.category)))];
  const qLower = gifSearchQuery.trim().toLowerCase();
  const matchingCuratedGifs = qLower
    ? CURATED_GIFS.filter(
        (g) =>
          g.title.toLowerCase().includes(qLower) ||
          g.category.toLowerCase().includes(qLower) ||
          (g.tags && g.tags.some((t) => t.toLowerCase().includes(qLower)))
      )
    : gifFilter === 'Todos'
    ? CURATED_GIFS
    : CURATED_GIFS.filter((g) => g.category === gifFilter);

  // Merge local matches first, then deduplicated remote results
  const seenUrls = new Set(matchingCuratedGifs.map((g) => g.url));
  const displayedGifs: GifItem[] = qLower
    ? [...matchingCuratedGifs, ...remoteGifs.filter((r) => !seenUrls.has(r.url))]
    : matchingCuratedGifs;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-[#14171f] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl p-4 pb-6 sm:pb-4 shadow-2xl animate-in slide-in-from-bottom duration-200 flex flex-col max-h-[85vh] sm:max-h-[600px] touch-manipulation"
      >
        {/* Mobile Pull Bar */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Header with Tab Switcher */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 gap-2 shrink-0">
          <div className="flex items-center bg-[#1e232e] p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('gifs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'gifs'
                  ? 'bg-[#2563eb] text-white shadow-md'
                  : 'text-[#8d90a0] hover:text-[#dfe2ee]'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>GIFs ({CURATED_GIFS.length}+)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stickers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'stickers'
                  ? 'bg-[#2563eb] text-white shadow-md'
                  : 'text-[#8d90a0] hover:text-[#dfe2ee]'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Stickers ({allStickersCombined.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('emojis')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'emojis'
                  ? 'bg-[#2563eb] text-white shadow-md'
                  : 'text-[#8d90a0] hover:text-[#dfe2ee]'
              }`}
            >
              <Smile className="w-4 h-4" />
              <span>Emojis</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector"
            className="w-8 h-8 rounded-full bg-[#262a33] hover:bg-[#323742] flex items-center justify-center text-[#8d90a0] hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeTab === 'gifs' ? (
          <div className="flex flex-col gap-2.5 flex-1 min-h-0">
            {/* Search input for GIFs */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-[#8d90a0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={gifSearchQuery}
                onChange={(e) => setGifSearchQuery(e.target.value)}
                placeholder="Buscar GIFs en Google / Tenor (ej. shrek, risa, gato, baile)..."
                className="w-full bg-[#1e232e] border border-white/10 focus:border-[#38bdf8] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-[#8d90a0] focus:outline-none transition-colors"
              />
              {gifSearchQuery && (
                <button
                  type="button"
                  onClick={() => setGifSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8d90a0] hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* GIF Category Filter */}
            {!qLower && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
                {gifCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setGifFilter(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      gifFilter === cat
                        ? 'bg-[#2563eb] text-white shadow-sm'
                        : 'bg-[#1e232e] text-[#8d90a0] hover:text-[#dfe2ee]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* GIFs Grid */}
            <div className="flex-1 overflow-y-auto pr-1 overscroll-contain">
              {isSearchingGifs && displayedGifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#8d90a0] gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#38bdf8]" />
                  <span className="text-xs">Buscando los mejores GIFs...</span>
                </div>
              ) : displayedGifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#8d90a0] gap-1 text-center">
                  <span className="text-sm font-medium text-[#c4c7d5]">No se encontraron GIFs</span>
                  <span className="text-xs">Prueba otra palabra como "baile", "shrek" o "gato".</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1">
                  {displayedGifs.map((gif) => (
                    <button
                      key={gif.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectGif?.(gif);
                        onClose();
                      }}
                      className="group relative flex flex-col overflow-hidden rounded-xl bg-[#1a1e27] border border-white/5 hover:border-[#38bdf8]/60 transition-all cursor-pointer hover:scale-[1.03] active:scale-95 shadow-sm touch-manipulation aspect-[4/3]"
                      title={`Enviar GIF: ${gif.title}`}
                    >
                      <img
                        src={gif.url}
                        alt={gif.title}
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 py-1.5 pointer-events-none">
                        <span className="block text-[10px] font-semibold text-white truncate text-left">
                          {gif.title}
                        </span>
                      </div>
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/65 text-[9px] font-bold text-[#38bdf8] border border-white/10 pointer-events-none">
                        GIF
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'stickers' ? (
          <div className="flex flex-col gap-2.5 flex-1 min-h-0">
            {/* Stickers Category Filter + AI Factory CTA */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar shrink-0">
              {onOpenStickerFactory && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStickerFactory();
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 cursor-pointer shrink-0 shadow"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Crear Sticker IA</span>
                </button>
              )}
              {stickerCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setStickerFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
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
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-3 sm:grid-cols-4 gap-2.5 py-1 overscroll-contain">
              {filteredStickers.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectSticker?.(sticker);
                    onClose();
                  }}
                  className="group relative flex flex-col items-center justify-center p-2 rounded-2xl bg-[#1a1e27] hover:bg-[#252a37] active:bg-[#2e3444] border border-white/5 hover:border-white/20 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm touch-manipulation min-h-[105px]"
                  title={`${sticker.title} - ${sticker.subtitle}`}
                >
                  <div className="w-20 h-20 flex items-center justify-center overflow-hidden rounded-xl pointer-events-none">
                    <img
                      src={sticker.imageUrl}
                      alt={sticker.title}
                      className="w-full h-full object-contain drop-shadow"
                      loading="lazy"
                    />
                  </div>
                  <span className="mt-1 text-[11px] font-medium text-[#c4c7d5] group-hover:text-white truncate max-w-full text-center pointer-events-none">
                    {sticker.title}
                  </span>
                  <span className="text-[9px] text-[#8d90a0] truncate max-w-full text-center pointer-events-none">
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
    </div>
  );
};
