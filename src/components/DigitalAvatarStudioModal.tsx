import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Camera,
  Sparkles,
  Smile,
  Mic,
  Square,
  Send,
  Check,
  Loader2,
  Volume2,
  UserCheck,
} from 'lucide-react';
import { DigitalAvatarConfig, UserProfile } from '../types';
import {
  DEFAULT_DIGITAL_AVATAR,
  drawDigitalAvatar,
  extractTraitsFromPhotoCanvas,
} from '../utils/avatarRenderer';

interface DigitalAvatarStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  isNightMode?: boolean;
  onSaveAvatarConfig: (config: DigitalAvatarConfig) => void;
  onSendAvatarMessage?: (payload: {
    config: DigitalAvatarConfig;
    expression: DigitalAvatarConfig['expression'];
    text: string;
    audioUrl?: string;
  }) => void;
}

const SKIN_TONES = ['#fce0d2', '#f1c29b', '#d99b6c', '#a86b43', '#6e4229', '#4a2c1a'];
const HAIR_STYLES: { id: DigitalAvatarConfig['hairStyle']; label: string }[] = [
  { id: 'short', label: 'Corto' },
  { id: 'long', label: 'Largo' },
  { id: 'curly', label: 'Rizado' },
  { id: 'bob', label: 'Bob' },
  { id: 'spiky', label: 'Puntas' },
  { id: 'bun', label: 'Recogido' },
  { id: 'mohawk', label: 'Cresta' },
  { id: 'none', label: 'Sin pelo' },
];
const HAIR_COLORS = ['#1e1b18', '#4a2c1a', '#8c5a32', '#e0b458', '#b91c1c', '#2563eb', '#ec4899', '#e2e8f0'];
const OUTFITS: { id: DigitalAvatarConfig['outfit']; label: string }[] = [
  { id: 'cyber', label: 'Futurista' },
  { id: 'hoodie', label: 'Sudadera' },
  { id: 'suit', label: 'Ejecutivo' },
  { id: 'casual', label: 'Casual' },
  { id: 'astronaut', label: 'Espacial' },
];
const ACCESSORIES: { id: DigitalAvatarConfig['accessory']; label: string }[] = [
  { id: 'none', label: 'Ninguno' },
  { id: 'glasses', label: 'Lentes' },
  { id: 'sunglasses', label: 'Gafas Sol' },
  { id: 'headphones', label: 'Audífonos' },
  { id: 'crown', label: 'Corona' },
  { id: 'halo', label: 'Halo' },
];
const EXPRESSIONS: { id: DigitalAvatarConfig['expression']; label: string; emoji: string }[] = [
  { id: 'happy', label: 'Sonrisa', emoji: '😊' },
  { id: 'love', label: 'Enamorado', emoji: '😍' },
  { id: 'surprised', label: 'Sorpresa', emoji: '😮' },
  { id: 'cool', label: 'Cool', emoji: '😎' },
  { id: 'wink', label: 'Guiño', emoji: '😉' },
];
const AURA_COLORS = ['#38bdf8', '#22d3ee', '#ec4899', '#10b981', '#f59e0b', '#818cf8'];

export const DigitalAvatarStudioModal: React.FC<DigitalAvatarStudioModalProps> = ({
  isOpen,
  onClose,
  user,
  isNightMode = true,
  onSaveAvatarConfig,
  onSendAvatarMessage,
}) => {
  const [config, setConfig] = useState<DigitalAvatarConfig>(
    user.digitalAvatar || DEFAULT_DIGITAL_AVATAR
  );
  const [messageText, setMessageText] = useState('');
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isPreviewTalking, setIsPreviewTalking] = useState(false);

  // Voice recording for avatar message
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | undefined>(undefined);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const talkingRef = useRef(false);

  useEffect(() => {
    if (isOpen && user.digitalAvatar) {
      setConfig(user.digitalAvatar);
    }
  }, [isOpen, user.digitalAvatar]);

  useEffect(() => {
    talkingRef.current = isPreviewTalking;
  }, [isPreviewTalking]);

  useEffect(() => {
    if (!isOpen) return;
    let rafId = 0;
    const start = performance.now();

    const loop = (now: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const t = (now - start) / 1000;
          const blinkCycle = t % 3.4;
          const blink = blinkCycle > 3.22 ? Math.sin(((blinkCycle - 3.22) / 0.18) * Math.PI) : 0;
          const mouthOpen = talkingRef.current
            ? Math.abs(Math.sin(t * 14) * 0.7 + Math.cos(t * 21) * 0.3)
            : 0;
          drawDigitalAvatar(ctx, canvas.width, canvas.height, config, {
            time: t,
            blink,
            mouthOpen,
            expression: config.expression,
          });
        }
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsAnalyzingPhoto(true);
    setStatusMsg('Analizando foto para adaptar rasgos del avatar...');
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) {
        setIsAnalyzingPhoto(false);
        return;
      }

      const localTraits = await extractTraitsFromPhotoCanvas(dataUrl);
      let cloudTraits: Partial<DigitalAvatarConfig> | null = null;
      try {
        const res = await fetch('/api/ai/avatar-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageDataUrl: dataUrl }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.traits) cloudTraits = data.traits;
        }
      } catch {}

      setConfig((prev) => ({
        ...prev,
        ...localTraits,
        ...(cloudTraits || {}),
        photoSnapshotUrl: dataUrl,
      }));
      setIsAnalyzingPhoto(false);
      setStatusMsg(cloudTraits ? 'Avatar generado con IA a partir de tu foto.' : 'Colores y estilo detectados desde tu foto.');
      setTimeout(() => setStatusMsg(null), 3500);
    };
    reader.readAsDataURL(file);
  };

  const handleTestVoice = () => {
    const sample = messageText.trim() || `¡Hola! Soy el avatar digital de ${user.name}.`;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(sample);
      utter.lang = 'es-ES';
      utter.onend = () => setIsPreviewTalking(false);
      utter.onerror = () => setIsPreviewTalking(false);
      setIsPreviewTalking(true);
      window.speechSynthesis.speak(utter);
    } else {
      setIsPreviewTalking(true);
      setTimeout(() => setIsPreviewTalking(false), 2000);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = ev.target?.result as string;
          try {
            const up = await fetch('/api/audio/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dataUrl }),
            });
            if (up.ok) {
              const d = await up.json();
              setRecordedAudioUrl(d.audioUrl || dataUrl);
              return;
            }
          } catch {}
          setRecordedAudioUrl(dataUrl);
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch {
      setStatusMsg('No se pudo acceder al micrófono.');
    }
  };

  const handleSaveProfile = () => {
    onSaveAvatarConfig(config);
    setStatusMsg('Avatar digital guardado en tu perfil.');
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleSendToChat = () => {
    if (!onSendAvatarMessage) return;
    onSaveAvatarConfig(config);
    onSendAvatarMessage({
      config,
      expression: config.expression,
      text: messageText.trim() || `¡Saludos con mi avatar animado!`,
      audioUrl: recordedAudioUrl,
    });
    setMessageText('');
    setRecordedAudioUrl(undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-3xl max-h-[90vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
          isNightMode ? 'bg-[#121722] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Estudio de Avatar Digital con IA</h3>
              <p className="text-xs text-slate-400">Crea tu avatar desde una foto, personalízalo y habla en tiempo real</p>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left: Live Animated Canvas + Photo Scan + Send Message */}
          <div className="md:col-span-5 flex flex-col items-center gap-3">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={260}
                height={260}
                className="w-52 h-52 sm:w-60 sm:h-60 rounded-3xl border-2 border-cyan-500/40 shadow-2xl bg-[#090d16]"
              />
              {isAnalyzingPhoto && (
                <div className="absolute inset-0 rounded-3xl bg-black/70 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-200">Analizando rasgos...</span>
                </div>
              )}
            </div>

            {/* Expressions quick bar */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {EXPRESSIONS.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, expression: exp.id }))}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    config.expression === exp.id
                      ? 'bg-[#0284c7] text-white shadow'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <span>{exp.emoji}</span>
                  <span>{exp.label}</span>
                </button>
              ))}
            </div>

            {/* Create from photo button */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <div className="w-full flex gap-2">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Crear desde foto / selfie</span>
              </button>
              <button
                type="button"
                onClick={handleTestVoice}
                className="py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="Probar animación hablando"
              >
                <Volume2 className="w-4 h-4" />
                <span>Hablar</span>
              </button>
            </div>

            {statusMsg && (
              <p className="text-xs text-emerald-400 font-medium text-center">{statusMsg}</p>
            )}
          </div>

          {/* Right: Customization Controls */}
          <div className="md:col-span-7 flex flex-col gap-3.5">
            {/* Piel */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1.5">Tono de piel</span>
              <div className="flex items-center gap-2 flex-wrap">
                {SKIN_TONES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, skinTone: hex }))}
                    className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform ${
                      config.skinTone.toLowerCase() === hex ? 'border-cyan-400 scale-110' : 'border-white/15'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>

            {/* Estilo de Cabello */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1.5">Cabello</span>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {HAIR_STYLES.map((hs) => (
                  <button
                    key={hs.id}
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, hairStyle: hs.id }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                      config.hairStyle === hs.id ? 'bg-[#0284c7] text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {hs.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {HAIR_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, hairColor: hex }))}
                    className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                      config.hairColor.toLowerCase() === hex ? 'border-white scale-110' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>

            {/* Ropa y Color */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1.5">Atuendo</span>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {OUTFITS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, outfit: o.id }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                      config.outfit === o.id ? 'bg-[#0284c7] text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {['#0284c7', '#7c3aed', '#e11d48', '#059669', '#f59e0b', '#334155', '#0f172a'].map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, outfitColor: hex }))}
                    className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                      config.outfitColor === hex ? 'border-white scale-110' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>

            {/* Accesorios & Aura */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1.5">Accesorios</span>
                <div className="flex flex-wrap gap-1.5">
                  {ACCESSORIES.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, accessory: acc.id }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                        config.accessory === acc.id ? 'bg-[#0284c7] text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1.5">Aura luminosa</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {AURA_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, auraColor: hex }))}
                      className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                        config.auraColor === hex ? 'border-white scale-110' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Compose Animated Avatar Message */}
            {onSendAvatarMessage && (
              <div className="mt-1 pt-3 border-t border-white/10 flex flex-col gap-2">
                <span className="text-xs font-semibold text-cyan-300">Enviar mensaje con tu avatar animado</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Escribe lo que dirá tu avatar..."
                    className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      isRecording ? 'bg-red-600 text-white' : 'bg-white/10 hover:bg-white/15 text-cyan-300'
                    }`}
                    title={isRecording ? 'Detener grabación' : 'Grabar voz para el avatar'}
                  >
                    {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
                {recordedAudioUrl && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Audio grabado listo para enviar con el avatar
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 bg-black/20">
          <button
            type="button"
            onClick={handleSaveProfile}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Guardar mi Avatar</span>
          </button>

          {onSendAvatarMessage && (
            <button
              type="button"
              onClick={handleSendToChat}
              className="px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Avatar Animado al Chat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
