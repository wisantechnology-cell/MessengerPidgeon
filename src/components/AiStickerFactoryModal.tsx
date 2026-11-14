import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Camera,
  Wand2,
  Sparkles,
  Upload,
  Send,
  Plus,
  Trash2,
  Loader2,
  FolderPlus,
  Check,
} from 'lucide-react';
import { CustomStickerPack, StickerItem } from '../types';

interface AiStickerFactoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customPacks: CustomStickerPack[];
  onSavePacks: (packs: CustomStickerPack[]) => void;
  onSendSticker?: (sticker: StickerItem) => void;
  isNightMode?: boolean;
}

const EMOTIONS = [
  { id: 'happy', emoji: '😄', label: 'FELIZ', color: '#0284c7' },
  { id: 'laugh', emoji: '😂', label: 'JAJAJA', color: '#f59e0b' },
  { id: 'love', emoji: '😍', label: 'AMOR', color: '#e11d48' },
  { id: 'cool', emoji: '😎', label: 'COOL', color: '#7c3aed' },
  { id: 'fire', emoji: '🔥', label: 'ÉPICO', color: '#ea580c' },
  { id: 'wow', emoji: '🤯', label: 'WOW', color: '#059669' },
];

async function renderSelfieStickerPng(
  sourceDataUrl: string,
  emotion: { emoji: string; label: string; color: string },
  popEffect: boolean
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 320;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(sourceDataUrl);

      ctx.clearRect(0, 0, size, size);

      // Die-cut white outer sticker outline
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2 - 10, 126, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Colored inner ring
      ctx.fillStyle = emotion.color;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2 - 10, 118, 0, Math.PI * 2);
      ctx.fill();

      // Clipped circular face crop
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2 - 10, 110, 0, Math.PI * 2);
      ctx.clip();

      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      if (popEffect) {
        ctx.filter = 'contrast(1.22) saturate(1.38) brightness(1.04)';
      }
      ctx.drawImage(img, sx, sy, minDim, minDim, size / 2 - 110, size / 2 - 120, 220, 220);
      ctx.filter = 'none';
      ctx.restore();

      // Emotion badge top right
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(254, 62, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '42px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emotion.emoji, 254, 64);
      ctx.restore();

      // Label pill at bottom
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(48, 248, 224, 50, 25);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(54, 254, 212, 38, 19);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emotion.label, size / 2, 274);
      ctx.restore();

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(sourceDataUrl);
    img.src = sourceDataUrl;
  });
}

export const AiStickerFactoryModal: React.FC<AiStickerFactoryModalProps> = ({
  isOpen,
  onClose,
  customPacks,
  onSavePacks,
  onSendSticker,
  isNightMode = true,
}) => {
  const [tab, setTab] = useState<'selfie' | 'prompt' | 'packs'>('selfie');
  const [selectedPackId, setSelectedPackId] = useState<string>(customPacks[0]?.id || 'pack_personal');
  const [newPackName, setNewPackName] = useState('');

  // Selfie -> Sticker state
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [popEffect, setPopEffect] = useState(true);
  const [selectedEmotion, setSelectedEmotion] = useState(EMOTIONS[0]);
  const [generatedStickers, setGeneratedStickers] = useState<StickerItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Prompt -> Sticker AI state
  const [promptText, setPromptText] = useState('');
  const [aiStyle, setAiStyle] = useState<'pop' | 'cyber' | 'pastel' | 'dark'>('pop');
  const [aiEmoji, setAiEmoji] = useState('🚀');
  const [aiPreviewSticker, setAiPreviewSticker] = useState<StickerItem | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsCameraOn(false);
  };

  useEffect(() => {
    if (!isOpen) stopCamera();
    return () => stopCamera();
  }, [isOpen]);

  useEffect(() => {
    if (customPacks.length > 0 && !customPacks.some((p) => p.id === selectedPackId)) {
      setSelectedPackId(customPacks[0].id);
    }
  }, [customPacks, selectedPackId]);

  if (!isOpen) return null;

  const ensurePackList = (): CustomStickerPack[] => {
    if (customPacks.length > 0) return customPacks;
    return [{ id: 'pack_personal', name: 'Mis Stickers IA', stickers: [] }];
  };

  const addStickerToSelectedPack = (sticker: StickerItem) => {
    const packs = ensurePackList();
    const targetId = packs.some((p) => p.id === selectedPackId) ? selectedPackId : packs[0].id;
    const updated = packs.map((p) =>
      p.id === targetId ? { ...p, stickers: [sticker, ...p.stickers] } : p
    );
    onSavePacks(updated);
    setFeedback(`Sticker "${sticker.title}" guardado en tu paquete.`);
    setTimeout(() => setFeedback(null), 2500);
  };

  const startSelfieCamera = async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraOn(true);
    } catch {
      setFeedback('No se pudo abrir la cámara; puedes subir una selfie desde tu galería.');
    }
  };

  const snapSelfie = () => {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth || 480;
    c.height = v.videoHeight || 480;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(v, 0, 0, c.width, c.height);
      setSelfieDataUrl(c.toDataURL('image/jpeg', 0.9));
      stopCamera();
    }
  };

  const handleUploadSelfie = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      if (ev.target?.result) {
        setSelfieDataUrl(ev.target.result as string);
        stopCamera();
      }
    };
    r.readAsDataURL(f);
  };

  const handleGenerateSelfieStickers = async (allEmotions: boolean) => {
    if (!selfieDataUrl) return;
    setIsGenerating(true);
    const list = allEmotions ? EMOTIONS.slice(0, 4) : [selectedEmotion];
    const created: StickerItem[] = [];
    for (const emo of list) {
      const png = await renderSelfieStickerPng(selfieDataUrl, emo, popEffect);
      created.push({
        id: `stk_selfie_${Date.now()}_${emo.id}`,
        category: 'Mis Stickers IA',
        emojiIcon: emo.emoji,
        title: emo.label,
        subtitle: 'Selfie Sticker',
        imageUrl: png,
      });
    }
    setGeneratedStickers(created);
    const packs = ensurePackList();
    const targetId = packs.some((p) => p.id === selectedPackId) ? selectedPackId : packs[0].id;
    onSavePacks(
      packs.map((p) =>
        p.id === targetId ? { ...p, stickers: [...created, ...p.stickers] } : p
      )
    );
    setIsGenerating(false);
    setFeedback(`${created.length} sticker(s) creados y guardados en tu paquete.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleGenerateAiSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/sticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText.trim(), style: aiStyle, emoji: aiEmoji }),
      });
      if (res.ok) {
        const data = await res.json();
        const sticker: StickerItem = {
          id: `stk_ai_${Date.now()}`,
          category: 'Stickers IA',
          emojiIcon: aiEmoji,
          title: data.title || promptText.slice(0, 20),
          subtitle: data.subtitle || 'Generado con IA',
          imageUrl: data.imageUrl,
        };
        setAiPreviewSticker(sticker);
        addStickerToSelectedPack(sticker);
      } else {
        setFeedback('No se pudo generar el sticker.');
      }
    } catch {
      setFeedback('Error de conexión al generar el sticker.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreatePack = () => {
    const clean = newPackName.trim();
    if (!clean) return;
    const newPack: CustomStickerPack = {
      id: `pack_${Date.now()}`,
      name: clean,
      stickers: [],
    };
    onSavePacks([...ensurePackList(), newPack]);
    setSelectedPackId(newPack.id);
    setNewPackName('');
  };

  const handleDeleteSticker = (packId: string, stickerId: string) => {
    onSavePacks(
      ensurePackList().map((p) =>
        p.id === packId ? { ...p, stickers: p.stickers.filter((s) => s.id !== stickerId) } : p
      )
    );
  };

  const activePacks = ensurePackList();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[90vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
          isNightMode ? 'bg-[#121722] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Fábrica de Stickers con IA</h3>
              <p className="text-xs text-slate-400">Convierte selfies o ideas en paquetes de stickers listos para enviar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-black/20">
          <button
            type="button"
            onClick={() => setTab('selfie')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === 'selfie' ? 'bg-[#0284c7] text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Selfie a Stickers</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('prompt')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === 'prompt' ? 'bg-[#0284c7] text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Crear con Descripción IA</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('packs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === 'packs' ? 'bg-[#0284c7] text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Mis Paquetes ({activePacks.reduce((acc, p) => acc + p.stickers.length, 0)})</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {feedback && (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Pack selector bar */}
          {tab !== 'packs' && (
            <div className="flex items-center justify-between gap-2 flex-wrap bg-black/20 p-2.5 rounded-xl border border-white/10">
              <span className="text-xs text-slate-400">Guardar en paquete:</span>
              <select
                value={selectedPackId}
                onChange={(e) => setSelectedPackId(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#1c2333] border border-white/10 text-xs text-white focus:outline-none"
              >
                {activePacks.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.stickers.length})</option>
                ))}
              </select>
            </div>
          )}

          {tab === 'selfie' && (
            <div className="flex flex-col gap-4">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadSelfie} className="hidden" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="aspect-square rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center relative">
                  {isCameraOn ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
                      <button
                        type="button"
                        onClick={snapSelfie}
                        className="absolute bottom-3 px-4 py-2 rounded-full bg-white text-slate-900 text-xs font-bold shadow-xl cursor-pointer"
                      >
                        Capturar Selfie
                      </button>
                    </>
                  ) : selfieDataUrl ? (
                    <img src={selfieDataUrl} alt="Selfie" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4 flex flex-col items-center gap-2">
                      <Camera className="w-10 h-10 text-slate-500" />
                      <span className="text-xs text-slate-400">Toma una selfie o sube una foto</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={startSelfieCamera}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-cyan-400" />
                      <span>Usar Cámara</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>Subir Foto</span>
                    </button>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-1.5">Emoción del sticker</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {EMOTIONS.map((emo) => (
                        <button
                          key={emo.id}
                          type="button"
                          onClick={() => setSelectedEmotion(emo)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                            selectedEmotion.id === emo.id ? 'bg-[#0284c7] text-white' : 'bg-white/5 text-slate-300'
                          }`}
                        >
                          <span>{emo.emoji}</span>
                          <span>{emo.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={popEffect}
                      onChange={(e) => setPopEffect(e.target.checked)}
                      className="accent-cyan-500"
                    />
                    <span>Realzar contraste estilo cómic / sticker</span>
                  </label>

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!selfieDataUrl || isGenerating}
                      onClick={() => handleGenerateSelfieStickers(false)}
                      className="w-full py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                    >
                      Crear Sticker ({selectedEmotion.label})
                    </button>
                    <button
                      type="button"
                      disabled={!selfieDataUrl || isGenerating}
                      onClick={() => handleGenerateSelfieStickers(true)}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                    >
                      Generar Pack de 4 Emociones Automático
                    </button>
                  </div>
                </div>
              </div>

              {generatedStickers.length > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">Recién creados (toca para enviar):</span>
                  <div className="grid grid-cols-4 gap-2.5">
                    {generatedStickers.map((stk) => (
                      <button
                        key={stk.id}
                        type="button"
                        onClick={() => {
                          onSendSticker?.(stk);
                          onClose();
                        }}
                        className="p-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-105"
                      >
                        <img src={stk.imageUrl} alt={stk.title} className="w-20 h-20 object-contain" />
                        <span className="text-[11px] font-semibold truncate max-w-full">{stk.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'prompt' && (
            <form onSubmit={handleGenerateAiSticker} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Describe el sticker que quieres inventar
                </label>
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Ej. Gato astronauta celebrando, Café mañanero urgente, Victoria total..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Estilo visual</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(['pop', 'cyber', 'pastel', 'dark'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setAiStyle(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                          aiStyle === st ? 'bg-[#0284c7] text-white' : 'bg-white/5 text-slate-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Emoji central</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {['🚀', '🐱', '🔥', '❤️', '🥳', '💎', '☕', '⚡'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setAiEmoji(em)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center cursor-pointer ${
                          aiEmoji === em ? 'bg-[#0284c7] ring-2 ring-cyan-300' : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating || !promptText.trim()}
                className="w-full py-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGenerating ? 'Diseñando sticker...' : 'Generar Sticker con IA'}</span>
              </button>

              {aiPreviewSticker && (
                <div className="p-4 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={aiPreviewSticker.imageUrl} alt={aiPreviewSticker.title} className="w-24 h-24 object-contain" />
                    <div>
                      <h4 className="font-bold text-sm">{aiPreviewSticker.title}</h4>
                      <span className="text-xs text-slate-400">Guardado en tu paquete personal</span>
                    </div>
                  </div>
                  {onSendSticker && (
                    <button
                      type="button"
                      onClick={() => {
                        onSendSticker(aiPreviewSticker);
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar ahora</span>
                    </button>
                  )}
                </div>
              )}
            </form>
          )}

          {tab === 'packs' && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPackName}
                  onChange={(e) => setNewPackName(e.target.value)}
                  placeholder="Nombre del nuevo paquete..."
                  className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreatePack}
                  className="px-4 py-2 rounded-xl bg-[#0284c7] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Paquete</span>
                </button>
              </div>

              {activePacks.map((pack) => (
                <div key={pack.id} className="p-3.5 rounded-2xl bg-black/25 border border-white/10 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{pack.name}</span>
                    <span className="text-xs text-slate-400">{pack.stickers.length} stickers</span>
                  </div>
                  {pack.stickers.length === 0 ? (
                    <p className="text-xs text-slate-500">Aún no hay stickers en este paquete.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {pack.stickers.map((stk) => (
                        <div key={stk.id} className="relative group p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteSticker(pack.id, stk.id)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                            title="Eliminar sticker"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSendSticker?.(stk);
                              onClose();
                            }}
                            className="flex flex-col items-center gap-1 cursor-pointer w-full"
                          >
                            <img src={stk.imageUrl} alt={stk.title} className="w-16 h-16 object-contain" />
                            <span className="text-[11px] font-medium truncate max-w-full">{stk.title}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
