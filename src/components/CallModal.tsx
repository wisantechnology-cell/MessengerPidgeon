import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  Volume2,
  Sparkles,
  Glasses,
  Crown,
  PartyPopper,
} from 'lucide-react';
import { GroupMember } from '../types';
import { db, doc, onSnapshot, updateDoc } from '../firebase';
import {
  ReactionHeartIcon,
  ReactionThumbIcon,
  ReactionFlameIcon,
  ReactionPartyIcon,
  ReactionClapIcon,
} from './CustomVectorIcons';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  contactAvatar: string;
  isVideo: boolean;
  isGroup?: boolean;
  groupMembers?: GroupMember[];
  callId?: string;
  isCaller?: boolean;
  initialCallStatus?: 'calling' | 'connected';
}

interface FloatingReaction {
  id: number;
  reactionType: 'heart' | 'flame' | 'party' | 'thumb' | 'clap';
  left: number;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  contactName,
  contactAvatar,
  isVideo,
  isGroup = false,
  groupMembers = [],
  callId,
  isCaller = true,
  initialCallStatus = 'calling',
}) => {
  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'declined'>(initialCallStatus);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(!isVideo);
  const [videoFilter, setVideoFilter] = useState<'none' | 'sunglasses' | 'crown' | 'hat'>('none');
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [declineReason, setDeclineReason] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const outRingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setCallStatus('calling');
      setCallDuration(0);
      setIsVideoOff(!isVideo);
      setVideoFilter('none');
      setReactions([]);
      setDeclineReason(null);
      return;
    }
    setCallStatus(initialCallStatus);
  }, [isOpen, initialCallStatus, isVideo]);

  // Outgoing ringing audio (tuuuu... tuuuu...) when caller is waiting for receiver to pick up
  useEffect(() => {
    if (!isOpen || callStatus !== 'calling' || !isCaller) {
      if (outRingIntervalRef.current) clearInterval(outRingIntervalRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();

        const playTone = () => {
          if (!audioCtxRef.current) return;
          const ctx = audioCtxRef.current;
          if (ctx.state === 'suspended') ctx.resume().catch(() => {});

          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(425, now); // European/LatAm standard ring tone 425Hz

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
          gain.gain.setValueAtTime(0.08, now + 1.0);
          gain.gain.linearRampToValueAtTime(0, now + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 1.2);
        };

        playTone();
        outRingIntervalRef.current = setInterval(playTone, 3500);
      }
    } catch (e) {
      console.warn('Outgoing ring audio error:', e);
    }

    return () => {
      if (outRingIntervalRef.current) clearInterval(outRingIntervalRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [isOpen, callStatus, isCaller]);

  // Real-time Firestore sync with calls/{callId}
  useEffect(() => {
    if (!isOpen || !callId) return;

    const callDocRef = doc(db, 'calls', callId);
    const unsubscribe = onSnapshot(callDocRef, (snap) => {
      if (!snap.exists()) {
        onClose();
        return;
      }
      const data = snap.data();
      if (!data) return;

      if (data.status === 'accepted') {
        setCallStatus('connected');
      } else if (data.status === 'declined') {
        setCallStatus('declined');
        setDeclineReason(`${contactName} ha rechazado la llamada.`);
        setTimeout(() => {
          onClose();
        }, 2200);
      } else if (data.status === 'ended') {
        onClose();
      }
    }, (err) => {
      console.warn('Call snapshot error:', err);
    });

    return () => unsubscribe();
  }, [isOpen, callId, contactName, onClose]);

  // Call timer - ONLY counts up when callStatus is strictly 'connected'
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, callStatus]);

  const handleHangUp = async () => {
    if (callId) {
      try {
        await updateDoc(doc(db, 'calls', callId), { status: 'ended' });
      } catch (e) {
        console.warn('Error ending call:', e);
      }
    }
    onClose();
  };

  const sendReaction = (reactionType: 'heart' | 'flame' | 'party' | 'thumb' | 'clap') => {
    const newReaction: FloatingReaction = {
      id: Date.now() + Math.random(),
      reactionType,
      left: Math.floor(Math.random() * 80) + 10,
    };
    setReactions((prev) => [...prev, newReaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 3000);
  };

  const renderReactionSvg = (type: 'heart' | 'flame' | 'party' | 'thumb' | 'clap') => {
    switch (type) {
      case 'heart':
        return <ReactionHeartIcon className="w-9 h-9 drop-shadow-lg" />;
      case 'flame':
        return <ReactionFlameIcon className="w-9 h-9 drop-shadow-lg" />;
      case 'party':
        return <ReactionPartyIcon className="w-9 h-9 drop-shadow-lg" />;
      case 'thumb':
        return <ReactionThumbIcon className="w-9 h-9 drop-shadow-lg" />;
      case 'clap':
        return <ReactionClapIcon className="w-9 h-9 drop-shadow-lg" />;
    }
  };

  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isVideoCallActive = isVideo && !isVideoOff;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0e16]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-6 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
      {/* Floating Reactions overlay */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-24 animate-bounce duration-1000 transition-all"
            style={{
              left: `${r.left}%`,
              animation: 'floatUp 3s ease-out forwards',
            }}
          >
            {renderReactionSvg(r.reactionType)}
          </div>
        ))}
      </div>

      {/* Top indicator */}
      <div className="flex flex-col items-center gap-1.5 mt-6 z-20">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-[#38bdf8] border border-blue-500/30 text-[11px] font-bold uppercase tracking-wider shadow-md">
          {isGroup ? <Users className="w-3.5 h-3.5" /> : isVideoCallActive ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
          <span>{isGroup ? 'Llamada Grupal Cifrada PidgeX' : isVideoCallActive ? 'Videollamada AR PidgeX' : 'Llamada de Voz Cifrada PidgeX'}</span>
        </div>
        <h3 className="text-2xl font-black text-white tracking-tight mt-1">{contactName}</h3>

        <div className="flex items-center gap-2">
          {callStatus === 'calling' && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          )}
          {callStatus === 'connected' && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
          <span className={`text-sm font-medium ${callStatus === 'declined' ? 'text-red-400 font-bold' : callStatus === 'connected' ? 'text-emerald-300' : 'text-amber-300'}`}>
            {callStatus === 'declined'
              ? (declineReason || 'Llamada rechazada')
              : callStatus === 'calling'
              ? isCaller
                ? 'Llamando... (Esperando a que conteste)'
                : 'Conectando llamada...'
              : isGroup
              ? `En llamada grupal • ${groupMembers.length + 1} en línea • ${formatDuration(callDuration)}`
              : isVideoCallActive
              ? `Videollamada AR en vivo • ${formatDuration(callDuration)}`
              : `Conectado • ${formatDuration(callDuration)}`}
          </span>
        </div>
      </div>

      {/* Main Area: Video feed or Group grid or Audio Avatar */}
      <div className="relative flex items-center justify-center my-auto w-full max-w-4xl px-4 h-full z-10">
        {isGroup ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
            <div className="relative flex flex-col items-center p-3 rounded-2xl bg-[#141822]/80 border border-white/10 shadow-xl">
              <img
                src={contactAvatar}
                alt={contactName}
                className="w-16 h-16 rounded-full object-cover border-2 border-purple-500 shadow-md mb-2"
              />
              <span className="text-xs font-bold text-white truncate max-w-[120px]">{contactName}</span>
              <span className="text-[10px] text-purple-400 font-semibold">Grupo Principal</span>
            </div>

            {groupMembers.map((member) => (
              <div
                key={member.id}
                className="relative flex flex-col items-center p-3 rounded-2xl bg-[#141822]/80 border border-white/10 shadow-xl"
              >
                <div className="relative">
                  {callStatus === 'connected' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#141822]" />
                  )}
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-md mb-2"
                  />
                </div>
                <span className="text-xs font-bold text-white truncate max-w-[120px]">{member.name}</span>
                <span className="text-[10px] text-[#8d90a0]">
                  {member.isLeader ? (
                    <span className="inline-flex items-center gap-0.5 text-amber-400 font-bold">
                      <Crown className="w-3 h-3 fill-amber-400" /> Líder
                    </span>
                  ) : (
                    'Integrante'
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : isVideoCallActive ? (
          <div className="relative w-full h-[460px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#141822] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-slate-900/80 flex flex-col items-center justify-center">
              <div className="relative">
                <img
                  src={contactAvatar}
                  alt={contactName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-500/80 shadow-2xl mb-4 animate-pulse"
                />
                {/* AR Filter Mask overlay */}
                {videoFilter === 'sunglasses' && (
                  <div className="absolute top-11 left-1/2 -translate-x-1/2 p-2 rounded-2xl bg-black/60 border border-white/20 select-none animate-bounce">
                    <Glasses className="w-10 h-10 text-white" />
                  </div>
                )}
                {videoFilter === 'crown' && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 p-2 rounded-2xl bg-amber-500/20 border border-amber-400/40 select-none animate-bounce">
                    <Crown className="w-10 h-10 text-amber-400 fill-amber-400" />
                  </div>
                )}
                {videoFilter === 'hat' && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 p-2 rounded-2xl bg-purple-500/20 border border-purple-400/40 select-none animate-bounce">
                    <PartyPopper className="w-10 h-10 text-purple-300" />
                  </div>
                )}
              </div>
              <span className="text-lg font-bold text-white tracking-wide">{contactName}</span>
              <span className="text-xs text-blue-300 mt-1">Transmisión AR segura PidgeX HD</span>
            </div>

            <div className="absolute bottom-4 right-4 w-32 h-24 rounded-2xl bg-[#1c2028] border-2 border-white/20 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mb-1 shadow">
                Tú
              </div>
              <span className="text-[10px] text-gray-300">Cámara Activa</span>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center">
            {callStatus === 'calling' && (
              <div className="absolute -inset-8 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '2.5s' }} />
            )}
            {callStatus === 'connected' && (
              <div className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-pulse" />
            )}
            <img
              src={contactAvatar}
              alt={contactName}
              className={`w-36 h-36 rounded-full object-cover border-4 shadow-2xl relative z-10 transition-all ${
                callStatus === 'connected' ? 'border-emerald-500 scale-105' : 'border-[#2563eb]'
              }`}
            />
          </div>
        )}
      </div>

      {/* AR Filter Masks Selector Bar (for video calls) */}
      {isVideoCallActive && callStatus === 'connected' && (
        <div className="flex items-center gap-2 bg-[#1c2028]/80 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md mb-2 z-20 shadow-lg">
          <span className="text-[11px] font-bold text-[#8d90a0] mr-1">Filtros AR:</span>
          {[
            { id: 'none', label: 'Normal', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'sunglasses', label: 'Gafas', icon: <Glasses className="w-3.5 h-3.5" /> },
            { id: 'crown', label: 'Corona', icon: <Crown className="w-3.5 h-3.5" /> },
            { id: 'hat', label: 'Fiesta', icon: <PartyPopper className="w-3.5 h-3.5" /> },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setVideoFilter(f.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                videoFilter === f.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white/5 text-[#8d90a0] hover:text-white'
              }`}
            >
              {f.icon}
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Quick Emoji Reactions Bar */}
      {callStatus === 'connected' && (
        <div className="flex items-center gap-2 bg-[#1c2028]/80 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md mb-3 z-20 shadow-lg">
          <span className="text-[11px] font-bold text-[#8d90a0] mr-1">Reaccionar:</span>
          {[
            { type: 'heart' as const, label: 'Corazón', icon: <ReactionHeartIcon className="w-5 h-5" /> },
            { type: 'flame' as const, label: 'Fuego', icon: <ReactionFlameIcon className="w-5 h-5" /> },
            { type: 'party' as const, label: 'Fiesta', icon: <ReactionPartyIcon className="w-5 h-5" /> },
            { type: 'thumb' as const, label: 'Bien', icon: <ReactionThumbIcon className="w-5 h-5" /> },
            { type: 'clap' as const, label: 'Aplausos', icon: <ReactionClapIcon className="w-5 h-5" /> },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => sendReaction(item.type)}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-all hover:scale-125 active:scale-95 cursor-pointer shadow"
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex items-center gap-4 bg-[#1c2028]/90 p-3 rounded-full border border-white/10 backdrop-blur-xl mb-6 shadow-2xl z-20">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isMuted ? 'bg-red-500/20 text-red-400' : 'bg-[#262a33] text-white hover:bg-[#31353e]'
          }`}
          title={isMuted ? 'Activar micrófono' : 'Silenciar'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {isVideo && (
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-[#262a33] text-white hover:bg-[#31353e]'
            }`}
            title={isVideoOff ? 'Activar video' : 'Desactivar video'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}

        <button
          onClick={handleHangUp}
          className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-600/40 cursor-pointer"
          title="Colgar"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
