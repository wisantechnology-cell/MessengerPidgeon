import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Clock,
  Send,
  Lock,
  Unlock,
  Calendar,
  Gift,
  Image as ImageIcon,
  Video,
  Mic,
  Square,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { UserProfile, Chat, TimeCapsuleAttachment, TimeCapsuleData } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface StoredTimeCapsule {
  id: string;
  chatId: string;
  chatName: string;
  messageText: string;
  occasion: string;
  isSurprise: boolean;
  unlockTime: number;
  createdAt: number;
  isUnlocked: boolean;
  delivered?: boolean;
  attachments?: TimeCapsuleAttachment[];
}

interface TimeCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  defaultChatId?: string;
  user: UserProfile;
  isNightMode?: boolean;
  onSendCapsuleMessage: (chatId: string, text: string, capsuleData?: TimeCapsuleData) => void;
}

const OCCASIONS = [
  'Mensaje del Futuro ⏳',
  'Cumpleaños 🎂',
  'Aniversario 💝',
  'Sorpresa 🎁',
  'Meta Cumplida 🏆',
  'Año Nuevo 🎆',
];

function toDatetimeLocalValue(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const TimeCapsuleModal: React.FC<TimeCapsuleModalProps> = ({
  isOpen,
  onClose,
  chats,
  defaultChatId,
  user,
  isNightMode = true,
  onSendCapsuleMessage,
}) => {
  const [selectedChatId, setSelectedChatId] = useState<string>(defaultChatId || chats[0]?.id || '');
  const [capsuleText, setCapsuleText] = useState<string>('');
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0]);
  const [isSurprise, setIsSurprise] = useState<boolean>(true);
  const [scheduleDatetime, setScheduleDatetime] = useState<string>(() =>
    toDatetimeLocalValue(Date.now() + 2 * 60 * 1000)
  );
  const [attachments, setAttachments] = useState<TimeCapsuleAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [capsules, setCapsules] = useState<StoredTimeCapsule[]>(() => {
    try {
      const saved = localStorage.getItem('pidge_time_capsules_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);

  useEffect(() => {
    if (defaultChatId) setSelectedChatId(defaultChatId);
    else if (!selectedChatId && chats[0]?.id) setSelectedChatId(chats[0].id);
  }, [defaultChatId, chats]);

  useEffect(() => {
    try {
      localStorage.setItem('pidge_time_capsules_v1', JSON.stringify(capsules));
    } catch {}
  }, [capsules]);

  // Refresh capsules state periodically while modal is open
  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem('pidge_time_capsules_v1');
      if (saved) setCapsules(JSON.parse(saved));
    } catch {}
    const interval = setInterval(() => {
      const now = Date.now();
      setCapsules((prev) =>
        prev.map((cap) => (!cap.isUnlocked && now >= cap.unlockTime ? { ...cap, isUnlocked: true } : cap))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const setQuickDelay = (minutes: number) => {
    setScheduleDatetime(toDatetimeLocalValue(Date.now() + minutes * 60 * 1000));
  };

  const handleAttachMediaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploading(true);
    try {
      const isVid = file.type.startsWith('video/');
      const res = await fetch(`/api/media/upload-raw?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (res.ok) {
        const data = await res.json();
        setAttachments((prev) => [
          ...prev,
          { type: isVid ? 'video' : 'image', url: data.mediaUrl, name: file.name },
        ]);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            setAttachments((prev) => [
              ...prev,
              { type: isVid ? 'video' : 'image', url: ev.target!.result as string, name: file.name },
            ]);
          }
        };
        reader.readAsDataURL(file);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const toggleAudioRecord = async () => {
    if (isRecordingAudio) {
      recorderRef.current?.stop();
      setIsRecordingAudio(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recordStartRef.current = Date.now();
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const secs = Math.max(1, Math.round((Date.now() - recordStartRef.current) / 1000));
        const duration = `0:${String(secs).padStart(2, '0')}`;
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = ev.target?.result as string;
          let url = dataUrl;
          try {
            const up = await fetch('/api/audio/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dataUrl }),
            });
            if (up.ok) {
              const d = await up.json();
              if (d.audioUrl) url = d.audioUrl;
            }
          } catch {}
          setAttachments((prev) => [...prev, { type: 'voice', url, duration, name: 'Audio futuro' }]);
        };
        reader.readAsDataURL(blob);
      };
      recorderRef.current = mr;
      mr.start();
      setIsRecordingAudio(true);
    } catch {
      // mic denied
    }
  };

  const handleSealCapsule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capsuleText.trim() && attachments.length === 0) return;

    const parsedTs = new Date(scheduleDatetime).getTime();
    const unlockTime = Number.isNaN(parsedTs) ? Date.now() + 60000 : parsedTs;
    const targetChat = chats.find((c) => c.id === selectedChatId);
    const id = `cap_${Date.now()}`;

    const newCap: StoredTimeCapsule = {
      id,
      chatId: selectedChatId,
      chatName: targetChat?.name || 'Chat Privado',
      messageText: capsuleText.trim(),
      occasion,
      isSurprise,
      unlockTime,
      createdAt: Date.now(),
      isUnlocked: Date.now() >= unlockTime,
      delivered: false,
      attachments,
    };

    const updatedList = [newCap, ...capsules];
    setCapsules(updatedList);
    try {
      localStorage.setItem('pidge_time_capsules_v1', JSON.stringify(updatedList));
    } catch {}

    // Persist to Firestore timeCapsules collection
    try {
      await setDoc(doc(db, 'timeCapsules', id), {
        id,
        chatId: selectedChatId,
        senderId: user.id || 'me',
        occasion,
        messageText: newCap.messageText,
        unlockTime,
        delivered: false,
      });
    } catch {}

    setCapsuleText('');
    setAttachments([]);
    setActiveTab('list');
  };

  const handleSendNow = (cap: StoredTimeCapsule) => {
    onSendCapsuleMessage(cap.chatId, cap.messageText, {
      id: cap.id,
      unlockTime: cap.unlockTime,
      occasion: cap.occasion,
      isSurprise: cap.isSurprise,
      unlocked: false,
      attachments: cap.attachments,
    });
    const remaining = capsules.filter((c) => c.id !== cap.id);
    setCapsules(remaining);
    try {
      localStorage.setItem('pidge_time_capsules_v1', JSON.stringify(remaining));
    } catch {}
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative max-w-lg w-full max-h-[90vh] rounded-3xl p-5 border shadow-2xl flex flex-col gap-3.5 overflow-hidden ${
          isNightMode ? 'bg-[#141923] border-white/10 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Mensajes del Futuro</h3>
              <span className="text-xs text-[#8d90a0]">Programa mensajes, sorpresas, fotos, videos y audios</span>
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

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'create' ? 'bg-amber-600 text-white shadow' : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            Programar Mensaje
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list' ? 'bg-amber-600 text-white shadow' : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            Programados ({capsules.length})
          </button>
        </div>

        {activeTab === 'create' ? (
          <form onSubmit={handleSealCapsule} className="flex flex-col gap-3 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[#8d90a0]">Chat Destino</label>
                <select
                  value={selectedChatId}
                  onChange={(e) => setSelectedChatId(e.target.value)}
                  className="bg-[#0e131d] text-xs text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-amber-500"
                >
                  {chats.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[#8d90a0]">Ocasión Especial</label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="bg-[#0e131d] text-xs text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-amber-500"
                >
                  {OCCASIONS.map((occ) => (
                    <option key={occ} value={occ}>{occ}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[#8d90a0]">Fecha y Hora Exacta de Entrega</label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <input
                  type="datetime-local"
                  value={scheduleDatetime}
                  onChange={(e) => setScheduleDatetime(e.target.value)}
                  className="flex-1 bg-[#0e131d] text-xs text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-1">
                {[
                  { label: '+1 min', val: 1 },
                  { label: '+5 min', val: 5 },
                  { label: '+1 hora', val: 60 },
                  { label: '+1 día', val: 1440 },
                ].map((q) => (
                  <button
                    key={q.val}
                    type="button"
                    onClick={() => setQuickDelay(q.val)}
                    className="py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-[11px] font-semibold text-amber-300 border border-white/10 cursor-pointer"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[#8d90a0]">Mensaje del Futuro</label>
              <textarea
                rows={3}
                value={capsuleText}
                onChange={(e) => setCapsuleText(e.target.value)}
                placeholder="Escribe un mensaje especial que llegará automáticamente en la fecha elegida..."
                className="bg-[#0e131d] text-xs text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Attachments: Photo, Video, Audio */}
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleAttachMediaFile}
              className="hidden"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => mediaInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                <Video className="w-3.5 h-3.5 text-amber-400" />
                <span>{isUploading ? 'Subiendo...' : 'Adjuntar Foto / Video'}</span>
              </button>

              <button
                type="button"
                onClick={toggleAudioRecord}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  isRecordingAudio ? 'bg-red-600 text-white' : 'bg-white/10 hover:bg-white/15 text-emerald-300'
                }`}
              >
                {isRecordingAudio ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isRecordingAudio ? 'Detener Audio' : 'Grabar Audio'}</span>
              </button>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="px-2.5 py-1.5 rounded-xl bg-black/30 border border-white/10 text-xs flex items-center gap-2"
                  >
                    <span>{att.type === 'image' ? '🖼️' : att.type === 'video' ? '🎬' : '🎙️'} {att.name || att.type}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isSurprise}
                onChange={(e) => setIsSurprise(e.target.checked)}
                className="accent-amber-500"
              />
              <Gift className="w-4 h-4 text-amber-400" />
              <span>Enviar como sorpresa envuelta (requiere tocar para abrir con animación)</span>
            </label>

            <button
              type="submit"
              disabled={!capsuleText.trim() && attachments.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-1"
            >
              <Lock className="w-4 h-4" />
              <span>Programar Mensaje del Futuro</span>
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
            {capsules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <Clock className="w-10 h-10 text-[#8d90a0] opacity-40" />
                <p className="text-xs text-[#8d90a0]">No tienes mensajes del futuro pendientes.</p>
              </div>
            ) : (
              capsules.map((cap) => {
                const timeLeft = Math.max(0, Math.ceil((cap.unlockTime - Date.now()) / 1000));
                const mins = Math.floor(timeLeft / 60);
                const secs = timeLeft % 60;
                const unlockStr = new Date(cap.unlockTime).toLocaleString([], {
                  dateStyle: 'short',
                  timeStyle: 'short',
                });

                return (
                  <div key={cap.id} className="flex flex-col gap-2 p-3.5 rounded-2xl bg-black/25 border border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-300 truncate">
                        {cap.occasion} · {cap.chatName}
                      </span>
                      {cap.isUnlocked || cap.delivered ? (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                          <Unlock className="w-3.5 h-3.5" /> Lista
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-400 shrink-0 tabular-nums">
                          {mins > 60 ? unlockStr : `${mins}m ${secs}s`}
                        </span>
                      )}
                    </div>
                    {cap.messageText && <p className="text-xs text-gray-300">"{cap.messageText}"</p>}
                    {cap.attachments && cap.attachments.length > 0 && (
                      <span className="text-[11px] text-sky-300">
                        {cap.attachments.length} archivo(s) adjunto(s)
                      </span>
                    )}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendNow(cap)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Entregar Cápsula Ahora</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
