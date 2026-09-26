import React, { useState, useRef, useEffect } from 'react';
import {
  Wallpaper as WallpaperIcon,
  Check,
  Upload,
  Link,
  Eye,
  Sparkles,
  Palette,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile, Wallpaper } from '../types';

interface WallpaperViewProps {
  wallpapers: Wallpaper[];
  user?: UserProfile;
  selectedWallpaperId: string;
  customWallpaperUrl?: string;
  onSelectWallpaper: (id: string, customUrl?: string) => void;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
}

export const WallpaperView: React.FC<WallpaperViewProps> = ({
  wallpapers,
  user,
  selectedWallpaperId,
  customWallpaperUrl,
  onSelectWallpaper,
  onUpdateUser,
}) => {
  const [activePreviewId, setActivePreviewId] = useState<string>(selectedWallpaperId || 'cosmic');
  const [customInputUrl, setCustomInputUrl] = useState<string>(customWallpaperUrl || '');
  const [appliedFeedback, setAppliedFeedback] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if user prop changes
  useEffect(() => {
    if (selectedWallpaperId) {
      setActivePreviewId(selectedWallpaperId);
    }
    if (customWallpaperUrl) {
      setCustomInputUrl(customWallpaperUrl);
    }
  }, [selectedWallpaperId, customWallpaperUrl]);

  const previewWallpaper =
    wallpapers.find((w) => w.id === activePreviewId) || wallpapers[0];

  const activeBackgroundUrl =
    activePreviewId === 'custom' && customInputUrl
      ? customInputUrl
      : previewWallpaper?.url || wallpapers[0]?.url;

  const handleApply = (id: string, url?: string) => {
    setActivePreviewId(id);
    onSelectWallpaper(id, url);
    if (onUpdateUser) {
      onUpdateUser({
        wallpaperId: id,
        customWallpaperUrl: id === 'custom' ? (url || customInputUrl) : '',
      });
    }
    setAppliedFeedback(true);
    setTimeout(() => setAppliedFeedback(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const resultUrl = event.target.result as string;
          setCustomInputUrl(resultUrl);
          setActivePreviewId('custom');
          handleApply('custom', resultUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full min-h-screen bg-transparent text-[#dfe2ee]">
      {/* 1. Header */}
      <header className="sticky top-0 w-full z-40 bg-[#0a0e16]/80 backdrop-blur-xl border-b border-white/10 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#00a6e0]/20 border border-[#00a6e0]/30 flex items-center justify-center text-[#7bd0ff] shadow-inner">
            <WallpaperIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#dfe2ee] tracking-tight">Fondos de Pantalla</h1>
            <p className="text-[11px] text-[#8d90a0]">Se aplican en tiempo real en todos tus chats</p>
          </div>
        </div>

        {appliedFeedback ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/15 px-3 py-1.5 rounded-full border border-emerald-500/30 animate-in fade-in zoom-in-95 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>¡Fondo Activo!</span>
          </span>
        ) : (
          <button
            onClick={() =>
              handleApply(
                activePreviewId,
                activePreviewId === 'custom' ? customInputUrl : undefined
              )
            }
            className="px-4 py-2 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-lg shadow-[#2563eb]/25 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Usar este Fondo</span>
          </button>
        )}
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 max-w-[640px] w-full mx-auto px-4 py-4 pb-28 flex flex-col gap-5 overflow-y-auto">
        {/* Live Chat Interactive Mock Screen */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#8d90a0] uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#7bd0ff]" />
              <span>Vista Previa del Chat</span>
            </span>
            <span className="text-[11px] font-medium text-[#7bd0ff]">
              {selectedWallpaperId === activePreviewId ? 'Actualmente en uso' : 'Vista previa'}
            </span>
          </div>

          <div
            className="w-full h-64 rounded-3xl bg-cover bg-center p-4 flex flex-col justify-between border border-white/15 shadow-2xl relative overflow-hidden transition-all duration-300"
            style={{
              backgroundImage: `url('${activeBackgroundUrl}')`,
            }}
          >
            {/* Top preview simulated bar */}
            <div className="flex items-center justify-between bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-xs">
                  U
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-tight">USUARIO NUEVO</span>
                  <span className="text-[9px] text-[#34d399] font-medium">● En línea</span>
                </div>
              </div>
              <span className="text-[10px] text-[#38bdf8] font-bold bg-[#38bdf8]/10 px-2 py-0.5 rounded-full border border-[#38bdf8]/20">
                MessengerPidgeon
              </span>
            </div>

            {/* Chat mock bubbles */}
            <div className="flex flex-col gap-2.5 my-auto">
              <div className="self-start max-w-[82%] bg-[#262a33]/90 text-[#dfe2ee] text-xs p-3 rounded-2xl rounded-bl-sm backdrop-blur-md shadow-md border border-white/5">
                ¡Hola! ¿Qué tal se ve este nuevo fondo de pantalla en la conversación? 🌟
              </div>
              <div className="self-end max-w-[82%] bg-[#2563eb] text-white text-xs p-3 rounded-2xl rounded-br-sm shadow-lg shadow-[#2563eb]/20">
                ¡Se ve increíble y súper nítido! Me encanta esta atmósfera. 🚀
              </div>
            </div>

            {/* Bottom preview info */}
            <div className="flex items-center justify-between text-[11px] text-[#c3c6d7] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <span className="font-medium truncate max-w-[60%]">
                {activePreviewId === 'custom' ? '✨ Fondo Personalizado' : previewWallpaper?.name}
              </span>
              <button
                onClick={() =>
                  handleApply(
                    activePreviewId,
                    activePreviewId === 'custom' ? customInputUrl : undefined
                  )
                }
                className="text-[#38bdf8] font-bold hover:underline cursor-pointer"
              >
                {selectedWallpaperId === activePreviewId ? '✓ Aplicado' : 'Toca para aplicar'}
              </button>
            </div>
          </div>
        </section>

        {/* Preset Wallpapers Grid */}
        <section className="flex flex-col gap-2.5">
          <span className="text-xs font-bold text-[#8d90a0] uppercase tracking-wider px-1">
            Colección Oficial MessengerPidgeon ({wallpapers.length})
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {wallpapers.map((wp) => {
              const isActive = activePreviewId === wp.id;
              const isCurrentSaved = selectedWallpaperId === wp.id;

              return (
                <div
                  key={wp.id}
                  onClick={() => {
                    setActivePreviewId(wp.id);
                    handleApply(wp.id);
                  }}
                  className={`relative h-32 rounded-2xl overflow-hidden cursor-pointer group border-2 transition-all duration-200 active:scale-95 shadow-md ${
                    isActive
                      ? 'border-[#38bdf8] ring-2 ring-[#38bdf8]/30 shadow-lg scale-[1.02]'
                      : isCurrentSaved
                      ? 'border-[#2563eb]'
                      : 'border-white/5 opacity-85 hover:opacity-100 hover:border-white/20'
                  }`}
                >
                  <img
                    src={wp.previewUrl || wp.url}
                    alt={wp.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-2.5">
                    <span className="text-xs font-bold text-white drop-shadow-sm">{wp.name}</span>
                  </div>

                  {isCurrentSaved && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-[#2563eb] text-white flex items-center gap-1 shadow-md text-[10px] font-bold">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Activo</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Custom Wallpaper Section (Upload file or link) */}
        <section className="bg-[#181c24] p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#943fe2]/20 text-[#ddb7ff] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#dfe2ee]">Sube tu propio fondo personalizado</h3>
              <p className="text-[10px] text-[#8d90a0]">
                Puedes cargar cualquier foto desde tu dispositivo o pegar un enlace
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 px-3 rounded-xl bg-[#262a33] hover:bg-[#31353e] border border-dashed border-white/20 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group active:scale-95"
            >
              <Upload className="w-5 h-5 text-[#7bd0ff] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-[#dfe2ee]">Subir foto desde tu dispositivo</span>
              <span className="text-[10px] text-[#8d90a0]">JPG, PNG, WebP, GIF</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div className="relative flex-1">
              <Link className="w-3.5 h-3.5 text-[#8d90a0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="O pega una URL de imagen (https://...)"
                value={customInputUrl}
                onChange={(e) => setCustomInputUrl(e.target.value)}
                className="w-full bg-[#0f131c] text-xs text-[#dfe2ee] placeholder:text-[#8d90a0] pl-8 pr-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
              />
            </div>
            <button
              onClick={() => {
                if (customInputUrl.trim()) {
                  setActivePreviewId('custom');
                  handleApply('custom', customInputUrl.trim());
                }
              }}
              className="px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-md shrink-0"
            >
              Aplicar URL
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
