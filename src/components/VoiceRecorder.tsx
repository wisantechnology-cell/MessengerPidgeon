import React, { useState, useEffect, useRef } from 'react';
import { Mic, Trash2, Send, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { createFallbackVoiceAudio } from '../utils/audioUtils';

interface VoiceRecorderProps {
  onSendVoice: (durationText: string, audioBlobUrl?: string) => void;
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
  const [audioVolumeBars, setAudioVolumeBars] = useState<number[]>([
    30, 50, 75, 45, 85, 40, 95, 60, 80, 50, 70, 90, 45, 65, 80, 55, 35, 20
  ]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Start recording on mount
  useEffect(() => {
    let isMounted = true;

    async function startAudioRecording() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!isMounted) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          streamRef.current = stream;

          // Set up Web Audio Analyser for real-time waveform animation
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
                    // Scale from 0-255 to percentage between 15% and 100%
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

          // Setup MediaRecorder
          let mimeType = '';
          if (typeof MediaRecorder !== 'undefined') {
            if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
            else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
            else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';

            const recorder = mimeType
              ? new MediaRecorder(stream, { mimeType })
              : new MediaRecorder(stream);

            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                audioChunksRef.current.push(e.data);
              }
            };

            recorder.onstop = () => {
              if (audioChunksRef.current.length > 0) {
                const audioBlob = new Blob(audioChunksRef.current, {
                  type: mimeType || 'audio/webm',
                });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
              }
            };

            recorder.start(100);
            mediaRecorderRef.current = recorder;
          }
        }
      } catch (err) {
        console.info('Mic access not granted or unavailable, using simulated voice capture:', err);
      }
    }

    startAudioRecording();

    // Seconds timer
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
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

  // Handle Pause/Resume timer
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
    } else if (!isPreviewing && seconds > 0) {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
    }
  }, [isPaused, isPreviewing]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStopAndPreview = () => {
    setIsPreviewing(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  const handleTogglePreviewPlay = () => {
    const finalUrl = audioUrl || createFallbackVoiceAudio(Math.max(2, seconds));
    if (!audioUrl) setAudioUrl(finalUrl);

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(finalUrl);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play().then(() => {
        setIsPlayingPreview(true);
      }).catch(() => {
        setIsPlayingPreview(false);
      });
    }
  };

  const handleSend = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    const finalDuration = formatTime(Math.max(1, seconds));
    let finalAudioUrl = audioUrl;
    if (!finalAudioUrl) {
      finalAudioUrl = createFallbackVoiceAudio(Math.max(2, seconds));
    }
    onSendVoice(finalDuration, finalAudioUrl);
  };

  const handleDiscard = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onCancel();
  };

  return (
    <div className={`flex items-center justify-between w-full border rounded-2xl px-3 py-2 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 transition-colors ${
      isNightMode
        ? 'bg-[#121722] border-sky-500/30 text-[#dfe2ee]'
        : 'bg-white border-sky-300 text-sky-950 shadow-sky-900/10'
    }`}>
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

      {/* Action buttons: Pause, Preview, Send */}
      <div className="flex items-center gap-1.5 shrink-0">
        {!isPreviewing ? (
          <>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isNightMode
                  ? 'bg-white/10 hover:bg-white/20 text-[#c3c6d7] hover:text-white'
                  : 'bg-sky-100 hover:bg-sky-200 text-sky-800'
              }`}
              title={isPaused ? 'Reanudar grabación' : 'Pausar grabación'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 ml-0.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleStopAndPreview}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                isNightMode
                  ? 'bg-white/10 hover:bg-white/20 text-[#7bd0ff]'
                  : 'bg-sky-100 hover:bg-sky-200 text-sky-700'
              }`}
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
  );
};
