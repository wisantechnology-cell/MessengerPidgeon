import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Camera,
  Upload,
  Check,
  Sliders,
  Image as ImageIcon,
  RotateCcw,
  Sun,
  Contrast,
  Maximize2,
  Move,
  Layers,
  Circle,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { WALLPAPERS } from '../data/mockData';

interface ProfilePhotoshopEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl: string;
  onSaveAvatar: (newAvatarUrl: string) => void;
  isNightMode?: boolean;
}

const BG_PRESETS = [
  ...WALLPAPERS.map((w) => ({ id: w.id, name: w.name, url: w.url })),
  {
    id: 'studio_blur',
    name: 'Estudio Bokeh Soft',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 'neon_city',
    name: 'Neón Nocturno',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 'golden_hour',
    name: 'Hora Dorada',
    url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 'clean_gradient',
    name: 'Degradado Moderno',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
  },
];

export const ProfilePhotoshopEditorModal: React.FC<ProfilePhotoshopEditorModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  onSaveAvatar,
  isNightMode = false,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>(currentAvatarUrl);
  const [bgUrl, setBgUrl] = useState<string>(BG_PRESETS[0].url);
  const [bgBlur, setBgBlur] = useState<number>(8); // px
  const [avatarScale, setAvatarScale] = useState<number>(1.0);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100); // %
  const [contrast, setContrast] = useState<number>(100); // %
  const [frameStyle, setFrameStyle] = useState<'none' | 'neon' | 'gold' | 'white' | 'soft'>('neon');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'photo' | 'background' | 'adjust' | 'frame'>('background');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentAvatarUrl) {
      setPhotoUrl(currentAvatarUrl);
    }
  }, [currentAvatarUrl, isOpen]);

  // Render Live Composite Canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 600;
    canvas.width = size;
    canvas.height = size;

    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.onload = () => {
      ctx.save();
      ctx.clearRect(0, 0, size, size);

      // 1. Draw Background with Blur
      ctx.filter = `blur(${bgBlur}px) brightness(${brightness}%) contrast(${contrast}%)`;
      // Cover fit
      const imgAspect = bgImg.width / bgImg.height;
      let drawW = size;
      let drawH = size;
      let drawX = 0;
      let drawY = 0;
      if (imgAspect > 1) {
        drawH = size;
        drawW = size * imgAspect;
        drawX = (size - drawW) / 2;
      } else {
        drawW = size;
        drawH = size / imgAspect;
        drawY = (size - drawH) / 2;
      }
      ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
      ctx.restore();

      // Subtle dark vignette / gradient overlay for realism
      const grad = ctx.createRadialGradient(size / 2, size / 2, size / 4, size / 2, size / 2, size / 1.2);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // 2. Draw Subject / Avatar Photo
      const avatarImg = new Image();
      avatarImg.crossOrigin = 'anonymous';
      avatarImg.onload = () => {
        ctx.save();
        const centerX = size / 2 + offsetX;
        const centerY = size / 2 + offsetY;
        const baseRadius = size * 0.34 * avatarScale;

        ctx.translate(centerX, centerY);

        // Drop shadow for realism
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 12;

        // Circular clip path for avatar
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw avatar image centered
        const avAspect = avatarImg.width / avatarImg.height;
        let avW = baseRadius * 2;
        let avH = baseRadius * 2;
        let avX = -baseRadius;
        let avY = -baseRadius;
        if (avAspect > 1) {
          avW = baseRadius * 2 * avAspect;
        } else {
          avH = baseRadius * 2 / avAspect;
          avY = -avH / 2;
        }
        ctx.drawImage(avatarImg, avX, avY, avW, avH);
        ctx.restore();

        // 3. Draw Frame / Ring Border
        if (frameStyle !== 'none') {
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.beginPath();
          ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
          ctx.closePath();

          if (frameStyle === 'neon') {
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#38bdf8';
            ctx.shadowColor = '#0284c7';
            ctx.shadowBlur = 18;
            ctx.stroke();
          } else if (frameStyle === 'gold') {
            ctx.lineWidth = 10;
            ctx.strokeStyle = '#fbbf24';
            ctx.shadowColor = '#d97706';
            ctx.shadowBlur = 12;
            ctx.stroke();
          } else if (frameStyle === 'white') {
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 10;
            ctx.stroke();
          } else if (frameStyle === 'soft') {
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.stroke();
          }
          ctx.restore();
        }
      };
      avatarImg.src = photoUrl;
    };
    bgImg.src = bgUrl;
  }, [isOpen, photoUrl, bgUrl, bgBlur, avatarScale, offsetX, offsetY, brightness, contrast, frameStyle]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBgUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsProcessing(true);
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onSaveAvatar(dataUrl);
      setIsProcessing(false);
      onClose();
    } catch {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-4xl rounded-3xl border flex flex-col overflow-hidden shadow-2xl ${
          isNightMode ? 'bg-[#121722] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#161c2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0284c7] text-white flex items-center justify-center shadow-lg shadow-sky-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Editor Photoshop de Perfil</h2>
              <p className={`text-xs ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Fusiona tu foto con fondos realistas y efectos profesionales
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left Column: Live Preview Canvas */}
          <div className="lg:col-span-6 p-6 flex flex-col items-center justify-center bg-slate-950/40 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10">
            <div className="relative w-full max-w-[360px] aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 dark:border-white/10 bg-black flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-white tracking-wide border border-white/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Vista Previa Realista</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Cambiar tu foto / selfie</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBgBlur(8);
                  setAvatarScale(1.0);
                  setOffsetX(0);
                  setOffsetY(0);
                  setBrightness(100);
                  setContrast(100);
                  setFrameStyle('neon');
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Restablecer ajustes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            </div>
          </div>

          {/* Right Column: Photoshop Tabs & Controls */}
          <div className="lg:col-span-6 p-6 flex flex-col gap-5 justify-between">
            <div className="flex flex-col gap-4">
              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#1a202c] border border-slate-200 dark:border-white/10">
                {[
                  { id: 'background', label: 'Fondos', icon: <ImageIcon className="w-3.5 h-3.5" /> },
                  { id: 'adjust', label: 'Ajustes', icon: <Sliders className="w-3.5 h-3.5" /> },
                  { id: 'frame', label: 'Marcos', icon: <Circle className="w-3.5 h-3.5" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-[#0284c7] text-white shadow-sm'
                        : isNightMode
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* TAB CONTENT: BACKGROUNDS */}
              {activeTab === 'background' && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Selecciona un fondo realista</span>
                    <input
                      type="file"
                      ref={bgFileInputRef}
                      onChange={handleCustomBgUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => bgFileInputRef.current?.click()}
                      className="text-xs font-bold text-[#0284c7] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir fondo propio</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {BG_PRESETS.map((preset) => {
                      const isSelected = bgUrl === preset.url;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => setBgUrl(preset.url)}
                          className={`group relative rounded-xl overflow-hidden aspect-square border-2 cursor-pointer transition-all ${
                            isSelected ? 'border-[#0284c7] ring-2 ring-sky-400/50 scale-105' : 'border-transparent hover:border-slate-400'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                            <span className="text-[10px] font-semibold text-white truncate">{preset.name}</span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#0284c7] text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: ADJUSTMENTS */}
              {activeTab === 'adjust' && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Desenfoque del Fondo (Bokeh)</span>
                      <span className="text-[#0284c7]">{bgBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={bgBlur}
                      onChange={(e) => setBgBlur(Number(e.target.value))}
                      className="w-full accent-[#0284c7] cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Tamaño de la Foto (Zoom)</span>
                      <span className="text-[#0284c7]">{avatarScale.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.6"
                      step="0.05"
                      value={avatarScale}
                      onChange={(e) => setAvatarScale(Number(e.target.value))}
                      className="w-full accent-[#0284c7] cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span>Posición Horizontal</span>
                        <span>{offsetX}px</span>
                      </div>
                      <input
                        type="range"
                        min="-120"
                        max="120"
                        value={offsetX}
                        onChange={(e) => setOffsetX(Number(e.target.value))}
                        className="w-full accent-[#0284c7] cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span>Posición Vertical</span>
                        <span>{offsetY}px</span>
                      </div>
                      <input
                        type="range"
                        min="-120"
                        max="120"
                        value={offsetY}
                        onChange={(e) => setOffsetY(Number(e.target.value))}
                        className="w-full accent-[#0284c7] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span>Brillo</span>
                        <span>{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full accent-[#0284c7] cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span>Contraste</span>
                        <span>{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full accent-[#0284c7] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: FRAMES */}
              {activeTab === 'frame' && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-150">
                  <span className="text-xs font-bold">Estilos de Marco Profesional</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'none', label: 'Sin Marco' },
                      { id: 'neon', label: 'Neón Azul' },
                      { id: 'gold', label: 'Oro Elegante' },
                      { id: 'white', label: 'Blanco Limpio' },
                      { id: 'soft', label: 'Borde Sutil' },
                    ].map((f) => {
                      const isSelected = frameStyle === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setFrameStyle(f.id as any)}
                          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-md'
                              : isNightMode
                              ? 'bg-[#1a202c] border-white/10 hover:border-white/30 text-slate-200'
                              : 'bg-slate-50 border-slate-200 hover:border-sky-300 text-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSave}
                className="flex-1 py-3 px-4 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Guardar Foto de Perfil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
