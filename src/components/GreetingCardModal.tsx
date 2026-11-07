import React, { useState } from 'react';
import { X, Sparkles, Send, Gift, Heart, Star, PartyPopper, Trophy } from 'lucide-react';
import { UserProfile } from '../types';

interface GreetingCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  isNightMode?: boolean;
  onSendCard: (cardTitle: string, cardMessage: string, theme: string) => void;
}

interface GreetingThemeItem {
  id: string;
  title: string;
  iconType: 'birthday' | 'congrats' | 'friendship' | 'success';
  gradient: string;
  bg: string;
}

const GREETING_THEMES: GreetingThemeItem[] = [
  { id: 'birthday', title: '¡Feliz Cumpleaños!', iconType: 'birthday', gradient: 'from-pink-600 to-purple-600', bg: 'bg-pink-950/40 border-pink-500/30' },
  { id: 'congrats', title: '¡Muchas Felicidades!', iconType: 'congrats', gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-950/40 border-amber-500/30' },
  { id: 'friendship', title: '¡Gracias por tu Amistad!', iconType: 'friendship', gradient: 'from-red-600 to-rose-600', bg: 'bg-red-950/40 border-red-500/30' },
  { id: 'success', title: '¡Lo Lograste!', iconType: 'success', gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-950/40 border-emerald-500/30' },
];

export const GreetingCardModal: React.FC<GreetingCardModalProps> = ({
  isOpen,
  onClose,
  user,
  isNightMode = false,
  onSendCard,
}) => {
  if (!isOpen) return null;

  const [selectedTheme, setSelectedTheme] = useState(GREETING_THEMES[0]);
  const [customMessage, setCustomMessage] = useState('¡Te deseo un día increíble lleno de éxitos, alegría y grandes momentos en PidgeX!');

  const renderIcon = (type: string, isBig = false) => {
    const sizeCls = isBig ? 'w-12 h-12 text-white drop-shadow-md animate-bounce' : 'w-4 h-4 shrink-0';
    switch (type) {
      case 'birthday':
        return <PartyPopper className={sizeCls} />;
      case 'congrats':
        return <Trophy className={sizeCls} />;
      case 'friendship':
        return <Heart className={`${sizeCls} fill-white`} />;
      case 'success':
        return <Star className={`${sizeCls} fill-white`} />;
      default:
        return <Gift className={sizeCls} />;
    }
  };

  const handleSend = () => {
    onSendCard(selectedTheme.title, customMessage, selectedTheme.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`relative max-w-md w-full rounded-3xl p-6 border shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200 ${
        isNightMode ? 'bg-[#181c24] border-white/10 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold">Tarjeta de Felicitación Digital</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Preview */}
        <div className={`relative w-full rounded-2xl p-5 border shadow-xl bg-gradient-to-br ${selectedTheme.gradient} text-white flex flex-col items-center text-center gap-3 overflow-hidden`}>
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          {renderIcon(selectedTheme.iconType, true)}
          <h4 className="text-xl font-black tracking-tight">{selectedTheme.title}</h4>
          <p className="text-xs text-white/90 leading-relaxed italic max-w-xs">
            "{customMessage}"
          </p>
          <span className="text-[10px] text-white/70 font-mono mt-2">— De: {user.name}</span>
        </div>

        {/* Themes Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-[#8d90a0]">Estilo de Tarjeta</span>
          <div className="grid grid-cols-2 gap-2">
            {GREETING_THEMES.map((th) => (
              <button
                key={th.id}
                onClick={() => setSelectedTheme(th)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedTheme.id === th.id ? 'border-pink-500 bg-pink-500/20 text-white' : 'border-white/10 bg-black/20 text-[#8d90a0]'
                }`}
              >
                {renderIcon(th.iconType, false)}
                <span className="truncate">{th.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-[#8d90a0]">Mensaje Personalizado</label>
          <textarea
            rows={3}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="bg-[#121620] text-xs text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500 resize-none"
          />
        </div>

        <button
          onClick={handleSend}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-1"
        >
          <Send className="w-4 h-4" />
          <span>Enviar Tarjeta Animada al Chat</span>
        </button>
      </div>
    </div>
  );
};
