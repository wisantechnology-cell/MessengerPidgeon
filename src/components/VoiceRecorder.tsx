import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Volume2, Sparkles, Play, Pause, Send } from 'lucide-react';
import {
  createFallbackVoiceAudio,
  getBestAudioMimeType,
  stopMediaRecorderSafely,
  UniversalVoiceRecorderEngine,
} from '../utils/audioUtils';
import { SquirrelVoiceIcon, RobotVoiceIcon, DeepVoiceIcon } from './CustomVectorIcons';

interface VoiceRecorderProps {
  onSendVoice: (durationText: string, audioBlobUrl?: string, voiceFilter?: 'normal' | 'chipmunk' | 'robot' | 'deep') => void;
  onCancel: () => void;
  isNightMode?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSendVoice,
  onCancel,
  isNightMode = false,
}) => {
  const [seconds, setSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceFilter, setVoiceFilter] = useState<'normal' | 'chipmunk' | 'robot' | 'deep'>('normal');
  const [showFilterPicker, setShowFilterPicker] = useState<boolean>(false);
  const [audioVolumeBars, setAudioVolumeBars] = useState<number[]>([
    30, 50, 75, 45, 85, 40, 95, 60, 80, 50, 70, 90, 45, 65, 80, 55, 35, 20
  ]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const universalEngineRef = useRef<UniversalVoiceRecorderEngine | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function startAudioRecording() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          if (!isMounted) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          streamRef.current = stream;

          // Start the universal PCM -> WAV recorder engine
          try {
            const engine = new UniversalVoiceRecorderEngine();
            universalEngineRef.current = engine;
            await engine.start(stream);
          } catch (engineErr) {
            console.warn('UniversalVoiceRecorderEngine init notice:', engineErr);
          }

          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const audioCtx = new AudioCtx();
              audioContextRef.current = audioCtx;
              const source = audioCtx.createMediaStreamSource(stream);
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 64;
              source.connect(analyser);
              analyserRef.current = analyser;

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              const updateBars = () => {
                if (analyserRef.current && !isPaused) {
                  analyserRef.current.getByteFrequencyData(dataArray);
                  const bars: number[] = [];
                  const step = Math.floor(dataArray.length / 18) || 1;
                  for (let i = 0; i < 18; i++) {
                    const val = dataArray[i * step] || 0;
                    const pct = Math.max(15, Math.min(100, Math.round((val / 255) * 100)));
                    bars.push(pct);
                  }
                  setAudioVolumeBars(bars);
                }
                animFrameRef.current = requestAnimationFrame(updateBars);
              };
              updateBars();
            }
          } catch (audioCtxErr) {
            console.warn('AudioContext setup skipped:', audioCtxErr);
          }

          const detectedMime = getBestAudioMimeType();
          mimeTypeRef.current = detectedMime;

          if (typeof MediaRecorder !== 'undefined') {
            const recorder = detectedMime
              ? new MediaRecorder(stream, { mimeType: detectedMime, audioBitsPerSecond: 32000 })
              : new MediaRecorder(stream);

            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                audioChunksRef.current.push(e.data);
              }
            };

            recorder.start(250);
            mediaRecorderRef.current = recorder;
          }
        }
      } catch (err) {
        console.info('Mic access not granted or unavailable:', err);
      }
    }

    startAudioRecording();

    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (universalEngineRef.current) {
        universalEngineRef.current.stop().catch(() => {});
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  const handleStopAndPreview = async () => {
    setIsPreviewing(true);
    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);

    let recordedUrl: string | null = null;
    if (universalEngineRef.current) {
      recordedUrl = await universalEngineRef.current.stop();
    }

    if (!recordedUrl && mediaRecorderRef.current) {
      const result = await stopMediaRecorderSafely(
        mediaRecorderRef.current,
        audioChunksRef.current,
        streamRef.current,
        mimeTypeRef.current
      );
      if (result) {
        recordedUrl = result.dataUrl;
      }
    }

    if (recordedUrl) {
      setAudioUrl(recordedUrl);
    }
  };

  const handleTogglePreviewPlay = () => {
    const targetUrl = audioUrl || createFallbackVoiceAudio(Math.max(2, seconds));
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(targetUrl);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play().catch(() => {});
      setIsPlayingPreview(true);
    }
  };

  const handleSend = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    let finalAudioUrl = audioUrl;

    if (!finalAudioUrl && mediaRecorderRef.current) {
      try {
        const result = await stopMediaRecorderSafely(
          mediaRecorderRef.current,
          audioChunksRef.current,
          streamRef.current,
          mimeTypeRef.current
        );
        if (result && result.dataUrl && result.blob.size > 800) {
          finalAudioUrl = result.dataUrl;
        }
      } catch (e) {
        console.warn('MediaRecorder stop notice:', e);
      }
    }

    if (!finalAudioUrl && universalEngineRef.current) {
      finalAudioUrl = await universalEngineRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (!finalAudioUrl) {
      finalAudioUrl = createFallbackVoiceAudio(Math.max(2, seconds));
    }

    const finalDuration = formatTime(Math.max(1, seconds));
    onSendVoice(finalDuration, finalAudioUrl, voiceFilter);
  };

  const handleDiscard = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    onCancel();
  };

  return (
    <div className="flex flex-col w-full gap-2 border rounded-2xl p-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 transition-colors bg-[#121722] border-sky-500/30 text-[#dfe2ee]">
      <div className="flex items-center justify-between w-full">
        {/* Discard button */}
        <button
          onClick={handleDiscard}
          className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-500 hover:bg-rose-500/30 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          title="Cancelar y descartar grabación"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Recording indicator & Timer */}
        <div className="flex items-center gap-2 px-2 shrink-0">
          {!isPreviewing ? (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-sky-400" />
          )}
          <span className="text-xs font-mono font-bold">
            {formatTime(seconds)}
          </span>
          {voiceFilter !== 'normal' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
              {voiceFilter === 'chipmunk' && <><SquirrelVoiceIcon className="w-3.5 h-3.5" /> Ardilla</>}
              {voiceFilter === 'robot' && <><RobotVoiceIcon className="w-3.5 h-3.5" /> Robot</>}
              {voiceFilter === 'deep' && <><DeepVoiceIcon className="w-3.5 h-3.5" /> Grave</>}
            </span>
          )}
        </div>

        {/* Waveform graphic bars */}
        <div className="flex-1 flex items-center justify-center gap-1 px-2 overflow-hidden h-7">
          {audioVolumeBars.map((height, idx) => (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-100 ${
                isPaused
                  ? 'bg-gray-400/40'
                  : 'bg-gradient-to-t from-sky-500 to-cyan-300'
              }`}
              style={{
                height: isPaused ? '20%' : `${height}%`,
              }}
            />
          ))}
        </div>

        {/* Action buttons: Filter, Pause, Preview, Send */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowFilterPicker(!showFilterPicker)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              voiceFilter !== 'normal'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 hover:bg-white/20 text-[#c3c6d7]'
            }`}
            title="Cambiador de voz"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {!isPreviewing ? (
            <>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#c3c6d7] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title={isPaused ? 'Reanudar grabación' : 'Pausar grabación'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 ml-0.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleStopAndPreview}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-white/10 hover:bg-white/20 text-[#7bd0ff] transition-colors cursor-pointer"
                title="Escuchar audio antes de enviar"
              >
                <span>Escuchar</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleTogglePreviewPlay}
              className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-400 transition-colors cursor-pointer"
              title={isPlayingPreview ? 'Pausar reproducción' : 'Escuchar mensaje grabado'}
            >
              {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          )}

          <button
            onClick={handleSend}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white flex items-center justify-center shadow-md shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Mandar mensaje de voz"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Voice Filter Selector Modal / Drawer */}
      {showFilterPicker && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
          <span className="font-bold text-[#8d90a0]">Efecto de Voz:</span>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'normal', label: 'Normal', icon: null },
              { id: 'chipmunk', label: 'Ardilla', icon: <SquirrelVoiceIcon className="w-3.5 h-3.5" /> },
              { id: 'robot', label: 'Robot', icon: <RobotVoiceIcon className="w-3.5 h-3.5" /> },
              { id: 'deep', label: 'Grave', icon: <DeepVoiceIcon className="w-3.5 h-3.5" /> },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setVoiceFilter(f.id as any);
                  setShowFilterPicker(false);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  voiceFilter === f.id
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-white/5 text-[#8d90a0] hover:text-white'
                }`}
              >
                {f.icon}
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
