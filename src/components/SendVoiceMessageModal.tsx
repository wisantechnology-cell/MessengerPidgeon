import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Trash2,
  Send,
  Play,
  Pause,
  X,
  Volume2,
  CheckCircle2,
  Users,
  Search,
} from 'lucide-react';
import { Chat, UserProfile } from '../types';
import { createFallbackVoiceAudio } from '../utils/audioUtils';

interface SendVoiceMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  user: UserProfile;
  initialChatId?: string;
  isNightMode?: boolean;
  onSendVoiceMessage: (chatId: string, durationText: string, audioBlobUrl: string) => void;
}

export const SendVoiceMessageModal: React.FC<SendVoiceMessageModalProps> = ({
  isOpen,
  onClose,
  chats,
  user,
  initialChatId,
  isNightMode = false,
  onSendVoiceMessage,
}) => {
  const [selectedChatId, setSelectedChatId] = useState<string>(initialChatId || '');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [seconds, setSeconds] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [previewProgress, setPreviewProgress] = useState<number>(0);
  const [audioVolumeBars, setAudioVolumeBars] = useState<number[]>([
    25, 45, 70, 40, 80, 95, 60, 85, 50, 75, 90, 40, 65, 80, 50, 30, 20
  ]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Set default chat if not selected
  useEffect(() => {
    if (initialChatId) {
      setSelectedChatId(initialChatId);
    } else if (chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0].id);
    }
  }, [initialChatId, chats]);

  // Clean up on modal close or unmount
  useEffect(() => {
    if (!isOpen) {
      resetRecording();
    }
  }, [isOpen]);

  const resetRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setSeconds(0);
    setAudioUrl(null);
    setIsPlayingPreview(false);
    setPreviewProgress(0);
  };

  const startRecording = async () => {
    resetRecording();
    setIsRecording(true);
    setIsPaused(false);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Analyser for sound wave visuals
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
            const updateWaveform = () => {
              if (analyserRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
                const bars: number[] = [];
                const step = Math.floor(dataArray.length / 17) || 1;
                for (let i = 0; i < 17; i++) {
                  const val = dataArray[i * step] || 0;
                  const pct = Math.max(15, Math.min(100, Math.round((val / 255) * 100)));
                  bars.push(pct);
                }
                setAudioVolumeBars(bars);
              }
              animFrameRef.current = requestAnimationFrame(updateWaveform);
            };
            updateWaveform();
          }
        } catch (e) {
          console.warn('AudioContext error:', e);
        }

        // MediaRecorder setup
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
      console.info('Mic access fallback active:', err);
    }

    // Start timer
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);

    // Fallback if no real audio blob generated
    if (!audioUrl) {
      const fallbackUrl = createFallbackVoiceAudio(Math.max(2, seconds));
      setAudioUrl(fallbackUrl);
    }
  };

  const togglePreviewPlay = () => {
    const finalUrl = audioUrl || createFallbackVoiceAudio(Math.max(2, seconds));
    if (!audioUrl) setAudioUrl(finalUrl);

    if (!previewAudioRef.current) {
      const audio = new Audio(finalUrl);
      previewAudioRef.current = audio;
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPreviewProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      audio.onended = () => {
        setIsPlayingPreview(false);
        setPreviewProgress(0);
      };
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current
        .play()
        .then(() => setIsPlayingPreview(true))
        .catch(() => setIsPlayingPreview(false));
    }
  };

  const handleSend = () => {
    if (!selectedChatId) return;

    if (isRecording) {
      stopRecording();
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    const durationText = formatTime(Math.max(1, seconds));
    const finalUrl = audioUrl || createFallbackVoiceAudio(Math.max(2, seconds));

    onSendVoiceMessage(selectedChatId, durationText, finalUrl);
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  const validChats = chats.filter((c) => !c.isBlocked);
  const filteredChats = validChats.filter((c) =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (c.phone && c.phone.includes(searchFilter))
  );

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col transition-colors animate-in zoom-in-95 duration-200 ${
          isNightMode
            ? 'bg-[#10141d] border-white/10 text-[#dfe2ee]'
            : 'bg-white border-sky-200 text-[#0c2340]'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between transition-colors ${
          isNightMode ? 'bg-[#141a26] border-white/10' : 'bg-sky-50/80 border-sky-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Mandar Mensaje de Voz</h3>
              <p className={`text-xs ${isNightMode ? 'text-[#8d90a0]' : 'text-sky-700/80'}`}>
                Graba tu voz y envíala a cualquiera de tus contactos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isNightMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-sky-100 text-sky-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          {/* Recipient Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>Enviar mensaje de voz a:</span>
            </label>

            {/* Quick Contact Chips / Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
              {validChats.slice(0, 8).map((c) => {
                const isSelected = c.id === selectedChatId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedChatId(c.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-md shadow-sky-500/20 font-bold scale-102'
                        : isNightMode
                        ? 'bg-[#181f2c] border-white/10 text-gray-300 hover:border-sky-500/50'
                        : 'bg-sky-50 border-sky-200 text-sky-900 hover:bg-sky-100'
                    }`}
                  >
                    <img
                      src={c.avatarUrl}
                      alt={c.name}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                    <span className="text-xs max-w-[100px] truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Dropdown if many contacts */}
            {validChats.length > 8 && (
              <select
                value={selectedChatId}
                onChange={(e) => setSelectedChatId(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border font-medium focus:outline-none focus:border-[#0284c7] ${
                  isNightMode
                    ? 'bg-[#181f2c] border-white/10 text-white'
                    : 'bg-sky-50 border-sky-200 text-sky-950'
                }`}
              >
                {validChats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Active Contact Indicator */}
          {selectedChat && (
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${
              isNightMode ? 'bg-[#141b28] border-white/5' : 'bg-sky-50/70 border-sky-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedChat.avatarUrl}
                    alt={selectedChat.name}
                    className="w-10 h-10 rounded-full object-cover border border-white/20"
                  />
                  {selectedChat.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#10141d]" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-snug">{selectedChat.name}</h4>
                  <p className={`text-[11px] ${isNightMode ? 'text-[#8d90a0]' : 'text-sky-700/80'}`}>
                    {selectedChat.phone || 'Contacto MessengerPidgeon'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#0284c7] px-2.5 py-1 rounded-full bg-[#0284c7]/10">
                Destinatario
              </span>
            </div>
          )}

          {/* Recording Studio Centerpiece */}
          <div className={`p-6 rounded-3xl border flex flex-col items-center justify-center gap-5 text-center relative overflow-hidden ${
            isNightMode
              ? 'bg-gradient-to-b from-[#141a26] to-[#0c1017] border-white/10'
              : 'bg-gradient-to-b from-sky-50 to-white border-sky-200'
          }`}>
            {/* Background Ambient Glow */}
            {isRecording && (
              <div className="absolute inset-0 bg-red-500/10 pointer-events-none animate-pulse" />
            )}

            {/* Timer and Status */}
            <div className="flex flex-col items-center gap-1 z-10">
              <div className="flex items-center gap-2">
                {isRecording ? (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                ) : (
                  <Volume2 className="w-4 h-4 text-[#0284c7]" />
                )}
                <span className="font-mono text-3xl font-extrabold tracking-wider">
                  {formatTime(seconds)}
                </span>
              </div>
              <span className={`text-xs font-medium ${
                isRecording ? 'text-red-400 font-bold' : isNightMode ? 'text-[#8d90a0]' : 'text-sky-700'
              }`}>
                {isRecording
                  ? 'Grabando tu voz...'
                  : seconds > 0
                  ? 'Audio listo para enviar o escuchar'
                  : 'Pulsa el micrófono para comenzar a grabar'}
              </span>
            </div>

            {/* Sound Wave Bars */}
            <div className="flex items-center justify-center gap-1.5 h-12 w-full max-w-xs px-4 z-10">
              {audioVolumeBars.map((height, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 rounded-full transition-all duration-100 ${
                    isRecording
                      ? 'bg-gradient-to-t from-red-500 to-amber-300'
                      : seconds > 0
                      ? 'bg-gradient-to-t from-[#0284c7] to-[#38bdf8]'
                      : isNightMode
                      ? 'bg-white/15'
                      : 'bg-sky-200'
                  }`}
                  style={{
                    height: isRecording ? `${height}%` : seconds > 0 ? '45%' : '20%',
                  }}
                />
              ))}
            </div>

            {/* Main Interactive Microphone / Stop Button */}
            <div className="flex items-center gap-4 z-10">
              {seconds > 0 && !isRecording && (
                <button
                  type="button"
                  onClick={resetRecording}
                  className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  title="Borrar y reiniciar grabación"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="relative group p-6 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] text-white shadow-xl shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Comenzar a grabar nota de voz"
                >
                  <span className="absolute -inset-1 rounded-full bg-sky-400 opacity-30 group-hover:opacity-60 blur-md transition-opacity" />
                  <Mic className="relative w-8 h-8 stroke-[2.2]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="p-6 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-xl shadow-red-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
                  title="Detener grabación"
                >
                  <Pause className="w-8 h-8 fill-current" />
                </button>
              )}

              {/* Listen Preview Button */}
              {seconds > 0 && !isRecording && (
                <button
                  type="button"
                  onClick={togglePreviewPlay}
                  className="w-12 h-12 rounded-full bg-sky-500/20 text-[#0284c7] hover:bg-sky-500/30 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  title={isPlayingPreview ? 'Pausar audio' : 'Escuchar audio'}
                >
                  {isPlayingPreview ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
              )}
            </div>

            {/* Playback preview progress if playing */}
            {isPlayingPreview && (
              <div className="w-full max-w-xs h-1.5 rounded-full bg-white/20 overflow-hidden z-10">
                <div
                  className="h-full bg-[#0284c7] transition-all duration-100"
                  style={{ width: `${previewProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 ${
          isNightMode ? 'bg-[#141a26] border-white/10' : 'bg-sky-50/60 border-sky-100'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
              isNightMode ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={seconds === 0 || !selectedChatId}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white font-bold text-xs shadow-lg shadow-sky-500/25 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            <Mic className="w-4 h-4" />
            <span>Enviar mensaje de voz</span>
          </button>
        </div>
      </div>
    </div>
  );
};
