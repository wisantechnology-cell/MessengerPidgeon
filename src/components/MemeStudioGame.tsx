import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Sparkles, Download, Send, Image as ImageIcon, Upload, Check, RefreshCw } from 'lucide-react';
import { Chat, UserProfile } from '../types';

interface MemeStudioGameProps {
  onBack: () => void;
  chats: Chat[];
  user: UserProfile;
  isNightMode?: boolean;
  onSendMemeToChat?: (chatId: string, memeDataUrl: string, caption: string) => void;
}

const MEME_TEMPLATES = [
  { name: 'Gato Divertido', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80' },
  { name: 'Perro Sorprendido', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80' },
  { name: 'Programador Ocupado', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80' },
  { name: 'Café Matutino', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80' },
];

export const MemeStudioGame: React.FC<MemeStudioGameProps> = ({
  onBack,
  chats,
  user,
  isNightMode = false,
  onSendMemeToChat,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(MEME_TEMPLATES[0].url);
  const [topText, setTopText] = useState<string>('CUANDO PROGRAMAS');
  const [bottomText, setBottomText] = useState<string>('Y COMPila A LA PRIMERA');
  const [selectedChatId, setSelectedChatId] = useState<string>(chats[0]?.id || '');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedImage;
    img.onload = () => {
      canvas.width = 600;
      canvas.height = 450;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw meme text with thick stroke
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.font = '900 36px Impact, sans-serif';
      ctx.textAlign = 'center';

      // Top text
      if (topText) {
        ctx.textBaseline = 'top';
        ctx.strokeText(topText.toUpperCase(), canvas.width / 2, 20);
        ctx.fillText(topText.toUpperCase(), canvas.width / 2, 20);
      }

      // Bottom text
      if (bottomText) {
        ctx.textBaseline = 'bottom';
        ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 20);
        ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 20);
      }
    };
  }, [selectedImage, topText, bottomText]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `pidge_meme_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setSuccessMsg('¡Meme guardado en tu galería!');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleSendToChat = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedChatId) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSendMemeToChat) {
      onSendMemeToChat(selectedChatId, dataUrl, `${topText} — ${bottomText}`);
    }
    setSuccessMsg('¡Meme enviado al chat con éxito!');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  return (
    <div className={`flex flex-col w-full h-full min-h-screen ${isNightMode ? 'bg-[#0f131c] text-[#dfe2ee]' : 'bg-[#e0f2fe] text-[#0c2340]'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b px-4 h-16 flex items-center justify-between ${
        isNightMode ? 'bg-[#0f131c]/90 border-white/5' : 'bg-white/90 border-sky-200/80'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-black/10 dark:bg-white/10 hover:bg-black/20 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base">Meme Studio 🃏</h1>
            <span className="text-xs text-[#8d90a0]">Crea y comparte tus propios memes</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[700px] w-full mx-auto px-4 py-6 pb-28 flex flex-col gap-6 overflow-y-auto">
        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-in fade-in">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Canvas Preview */}
          <div className="flex flex-col gap-3 items-center">
            <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden border-2 border-blue-500/40 bg-black shadow-2xl relative flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center gap-2 w-full">
              <button
                onClick={handleDownload}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Guardar en Galería</span>
              </button>
            </div>
          </div>

          {/* Controls & Customization */}
          <div className="flex flex-col gap-4 rounded-3xl bg-[#181c24] border border-white/10 p-5 shadow-2xl text-white">
            <h3 className="text-sm font-bold text-[#38bdf8] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Personalizar Meme</span>
            </h3>

            {/* Top Text */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#8d90a0] font-semibold">Texto Superior</label>
              <input
                type="text"
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
                className="bg-[#121620] text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500 font-bold uppercase"
              />
            </div>

            {/* Bottom Text */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#8d90a0] font-semibold">Texto Inferior</label>
              <input
                type="text"
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                className="bg-[#121620] text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500 font-bold uppercase"
              />
            </div>

            {/* Choose Template */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#8d90a0] font-semibold">Plantillas Populares</label>
              <div className="grid grid-cols-4 gap-2">
                {MEME_TEMPLATES.map((t, idx) => (
                  <img
                    key={idx}
                    src={t.url}
                    alt={t.name}
                    onClick={() => setSelectedImage(t.url)}
                    className={`w-full aspect-square rounded-xl object-cover cursor-pointer hover:scale-105 border-2 transition-all ${
                      selectedImage === t.url ? 'border-blue-500 ring-2 ring-blue-500/40' : 'border-white/10 opacity-75'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Custom Image Upload */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10">
              <label className="text-xs text-[#8d90a0] font-semibold">O sube tu propia foto</label>
              <label className="py-2.5 px-4 rounded-xl bg-[#262a33] hover:bg-[#31353e] text-xs text-[#7bd0ff] font-bold cursor-pointer border border-white/10 flex items-center justify-center gap-2 transition-colors">
                <Upload className="w-4 h-4" />
                <span>Seleccionar imagen de dispositivo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          setSelectedImage(ev.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            {/* Send to chat */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <label className="text-xs text-[#8d90a0] font-semibold">Enviar a un amigo / chat</label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedChatId}
                  onChange={(e) => setSelectedChatId(e.target.value)}
                  className="flex-1 bg-[#121620] text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                >
                  {chats.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleSendToChat}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
