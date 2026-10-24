import React, { useState } from 'react';
import { X, Sparkles, Send, Image as ImageIcon } from 'lucide-react';
import { UserProfile } from '../types';

interface MemeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  isNightMode?: boolean;
  onSendMeme: (memeUrl: string, caption: string) => void;
}

const MEME_TEMPLATES = [
  {
    id: 'drake',
    name: 'Drake Rechaza / Acepta',
    url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'cat',
    name: 'Gato Confundido',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'coding',
    name: 'Programador en Crisis',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'doge',
    name: 'Doge Relajado',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop',
  },
];

export const MemeGeneratorModal: React.FC<MemeGeneratorModalProps> = ({
  isOpen,
  onClose,
  user,
  isNightMode = false,
  onSendMeme,
}) => {
  if (!isOpen) return null;

  const [selectedTemplate, setSelectedTemplate] = useState(MEME_TEMPLATES[0]);
  const [topText, setTopText] = useState('CUANDO PROGRAMAS SIN ERRORES');
  const [bottomText, setBottomText] = useState('Y COMPILA A LA PRIMERA 😎');

  const handleSend = () => {
    const caption = `${topText} / ${bottomText}`;
    onSendMeme(selectedTemplate.url, caption);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`relative max-w-md w-full rounded-3xl p-6 border shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200 ${
        isNightMode ? 'bg-[#181c24] border-white/10 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold">Generador Rápido de Memes</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meme Preview */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-inner border border-white/20 flex items-center justify-center">
          <img src={selectedTemplate.url} alt={selectedTemplate.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20" />
          <span className="absolute top-3 inset-x-2 text-center text-white font-black text-sm tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-2">
            {topText}
          </span>
          <span className="absolute bottom-3 inset-x-2 text-center text-white font-black text-sm tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-2">
            {bottomText}
          </span>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#8d90a0]">Texto Superior</label>
            <input
              type="text"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              className="bg-[#121620] text-xs text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#8d90a0]">Texto Inferior</label>
            <input
              type="text"
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              className="bg-[#121620] text-xs text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Templates */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-[#8d90a0]">Plantillas</span>
          <div className="grid grid-cols-4 gap-2">
            {MEME_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`rounded-xl overflow-hidden border-2 aspect-square cursor-pointer transition-all ${
                  selectedTemplate.id === t.id ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={t.url} alt={t.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSend}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-[#00a6e0] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-1"
        >
          <Send className="w-4 h-4" />
          <span>Enviar Meme al Chat</span>
        </button>
      </div>
    </div>
  );
};
