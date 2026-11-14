import React, { useMemo, useState } from 'react';
import {
  X,
  Image as ImageIcon,
  Film,
  Sparkles,
  Calendar,
  Search,
  Download,
  Share2,
  Loader2,
  Play,
} from 'lucide-react';
import { Message } from '../types';

interface ChatMediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  chatName: string;
  isNightMode?: boolean;
  onShareMemoryReel?: (videoUrl: string, title: string, duration: string) => void;
}

export const ChatMediaGalleryModal: React.FC<ChatMediaGalleryModalProps> = ({
  isOpen,
  onClose,
  messages,
  chatName,
  isNightMode = true,
  onShareMemoryReel,
}) => {
  const [filterKind, setFilterKind] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reelTitle, setReelTitle] = useState(`Recuerdos con ${chatName}`);
  const [isCreatingReel, setIsCreatingReel] = useState(false);
  const [generatedReelUrl, setGeneratedReelUrl] = useState<string | null>(null);
  const [reelError, setReelError] = useState<string | null>(null);

  const mediaMessages = useMemo(() => {
    return (messages || []).filter(
      (m) =>
        (m.type === 'image' || m.type === 'video' || m.type === 'memory_reel') &&
        Boolean(m.mediaUrl)
    );
  }, [messages]);

  const filteredMedia = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mediaMessages.filter((m) => {
      if (filterKind === 'image' && m.type !== 'image') return false;
      if (filterKind === 'video' && m.type !== 'video' && m.type !== 'memory_reel') return false;
      if (!q) return true;
      const dateStr = m.timestampMs ? new Date(m.timestampMs).toLocaleDateString() : '';
      return (
        (m.mediaName || '').toLowerCase().includes(q) ||
        (m.text || '').toLowerCase().includes(q) ||
        (m.timestamp || '').toLowerCase().includes(q) ||
        dateStr.toLowerCase().includes(q)
      );
    });
  }, [mediaMessages, filterKind, searchQuery]);

  const groupedCollections = useMemo(() => {
    const groups: Record<string, Message[]> = {};
    filteredMedia.forEach((m) => {
      const label = m.timestampMs
        ? new Date(m.timestampMs).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
        : 'Recuerdos Recientes';
      groups[label] = groups[label] || [];
      groups[label].push(m);
    });
    return Object.entries(groups);
  }, [filteredMedia]);

  if (!isOpen) return null;

  const photoItems = mediaMessages.filter((m) => m.type === 'image' && m.mediaUrl);

  const handleGenerateMemoryReel = async () => {
    if (photoItems.length === 0) {
      setReelError('Se necesita al menos 1 foto compartida en este chat para crear un video de recuerdos.');
      return;
    }
    setReelError(null);
    setIsCreatingReel(true);
    setGeneratedReelUrl(null);

    try {
      const selected = photoItems.slice(-8);
      const loadedImgs: { img: HTMLImageElement; caption: string }[] = [];

      for (const item of selected) {
        await new Promise<void>((resolve) => {
          const im = new Image();
          im.crossOrigin = 'anonymous';
          im.onload = () => {
            loadedImgs.push({ img: im, caption: item.text || item.timestamp || 'Recuerdo' });
            resolve();
          };
          im.onerror = () => resolve();
          im.src = item.mediaUrl!;
        });
      }

      if (loadedImgs.length === 0) {
        setReelError('No se pudieron cargar las imágenes para el video.');
        setIsCreatingReel(false);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;
      const stream = canvas.captureStream(30);

      // Add subtle WebAudio synth chord track if supported
      let audioCtx: AudioContext | null = null;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioCtx();
        const dest = audioCtx.createMediaStreamDestination();
        const notes = [261.63, 329.63, 392.0, 523.25];
        notes.forEach((freq, idx) => {
          const osc = audioCtx!.createOscillator();
          const gain = audioCtx!.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.value = 0.03;
          osc.connect(gain);
          gain.connect(dest);
          osc.start(audioCtx!.currentTime + idx * 0.4);
          osc.stop(audioCtx!.currentTime + loadedImgs.length * 1.4 + 0.5);
        });
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      } catch {}

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      const donePromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      });

      recorder.start();

      const framesPerPhoto = 38;
      for (let idx = 0; idx < loadedImgs.length; idx++) {
        const { img, caption } = loadedImgs[idx];
        for (let f = 0; f < framesPerPhoto; f++) {
          const prog = f / framesPerPhoto;
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const zoom = 1 + prog * 0.08;
          const aspect = img.width / img.height;
          let drawW = canvas.width * zoom;
          let drawH = drawW / aspect;
          if (drawH < canvas.height * zoom) {
            drawH = canvas.height * zoom;
            drawW = drawH * aspect;
          }

          ctx.save();
          ctx.globalAlpha = f < 8 ? f / 8 : f > framesPerPhoto - 6 ? (framesPerPhoto - f) / 6 : 1;
          ctx.drawImage(img, (canvas.width - drawW) / 2, (canvas.height - drawH) / 2, drawW, drawH);

          // Scrim + Title overlay
          const grad = ctx.createLinearGradient(0, canvas.height - 130, 0, canvas.height);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, 'rgba(0,0,0,0.82)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, canvas.height - 130, canvas.width, 130);

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(reelTitle.toUpperCase(), 28, canvas.height - 56);

          ctx.fillStyle = '#ffffff';
          ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(caption.slice(0, 48), 28, canvas.height - 26);
          ctx.restore();

          await new Promise((r) => setTimeout(r, 33));
        }
      }

      recorder.stop();
      const webmBlob = await donePromise;
      audioCtx?.close().catch(() => {});

      let finalUrl = URL.createObjectURL(webmBlob);
      try {
        const up = await fetch(`/api/media/upload-raw?filename=${encodeURIComponent('recuerdos.webm')}`, {
          method: 'POST',
          headers: { 'Content-Type': 'video/webm' },
          body: webmBlob,
        });
        if (up.ok) {
          const d = await up.json();
          if (d.mediaUrl) finalUrl = d.mediaUrl;
        }
      } catch {}

      setGeneratedReelUrl(finalUrl);
    } catch {
      setReelError('Ocurrió un error creando el video de recuerdos.');
    } finally {
      setIsCreatingReel(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative max-w-3xl w-full max-h-[90vh] rounded-3xl p-5 border shadow-2xl flex flex-col gap-3.5 overflow-hidden ${
          isNightMode ? 'bg-[#141923] border-white/10 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Álbum Inteligente de Recuerdos</h3>
              <span className="text-xs text-[#8d90a0]">
                {mediaMessages.length} recuerdos compartidos con {chatName}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por fecha, mes o descripción..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/25 border border-white/10 text-xs focus:outline-none focus:border-sky-400"
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/25 border border-white/10">
            {(
              [
                { id: 'all', label: 'Todo' },
                { id: 'image', label: 'Fotos' },
                { id: 'video', label: 'Videos' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterKind(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterKind === f.id ? 'bg-[#0284c7] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Memory Video Reel Generator Bar */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/70 to-indigo-950/70 border border-sky-500/25 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-white">Crear Video de Recuerdos con Transiciones</span>
            </div>
            <button
              type="button"
              disabled={isCreatingReel || photoItems.length === 0}
              onClick={handleGenerateMemoryReel}
              className="px-3.5 py-1.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {isCreatingReel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isCreatingReel ? 'Renderizando video...' : `Generar Video (${Math.min(photoItems.length, 8)} fotos)`}</span>
            </button>
          </div>

          <input
            type="text"
            value={reelTitle}
            onChange={(e) => setReelTitle(e.target.value)}
            placeholder="Título de la recopilación..."
            className="w-full px-3 py-1.5 rounded-xl bg-black/30 border border-white/10 text-xs text-white focus:outline-none"
          />

          {reelError && <p className="text-xs text-amber-300">{reelError}</p>}

          {generatedReelUrl && (
            <div className="flex flex-col gap-2 pt-1">
              <video src={generatedReelUrl} controls playsInline className="w-full max-h-52 rounded-xl bg-black" />
              <div className="flex items-center justify-end gap-2">
                <a
                  href={generatedReelUrl}
                  download={`${reelTitle.replace(/\s+/g, '_')}.webm`}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </a>
                {onShareMemoryReel && (
                  <button
                    type="button"
                    onClick={() => {
                      onShareMemoryReel(generatedReelUrl, reelTitle, `${Math.min(photoItems.length, 8) * 1}s`);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartir en el Chat</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Collections Grid */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
          {groupedCollections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <Calendar className="w-10 h-10 text-slate-500 opacity-50" />
              <p className="text-xs text-slate-400">No hay recuerdos multimedia que coincidan con tu búsqueda.</p>
            </div>
          ) : (
            groupedCollections.map(([dateLabel, items]) => (
              <div key={dateLabel} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-sky-300 capitalize">
                  <span>{dateLabel}</span>
                  <span className="text-slate-400 font-normal">{items.length} elementos</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {items.map((msg) => (
                    <div
                      key={msg.id}
                      className="relative group rounded-2xl overflow-hidden bg-black/30 aspect-square border border-white/10"
                    >
                      {msg.type === 'video' || msg.type === 'memory_reel' ? (
                        <video
                          src={msg.mediaUrl}
                          poster={msg.thumbnailUrl}
                          controls
                          playsInline
                          className="w-full h-full object-cover bg-black"
                        />
                      ) : (
                        <img
                          src={msg.mediaUrl}
                          alt={msg.mediaName || 'Recuerdo'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 pointer-events-none">
                        <span className="block text-[11px] font-semibold text-white truncate">
                          {msg.text || msg.mediaName || 'Recuerdo'}
                        </span>
                        <span className="text-[10px] text-slate-300">{msg.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
