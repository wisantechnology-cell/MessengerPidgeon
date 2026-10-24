import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Users, Volume2, Sparkles, Glasses, Crown, PartyPopper } from 'lucide-react';
import { GroupMember } from '../types';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  contactAvatar: string;
  isVideo: boolean;
  isGroup?: boolean;
  groupMembers?: GroupMember[];
}

interface FloatingReaction {
  id: number;
  emoji: string;
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
}) => {
  const [callStatus, setCallStatus] = useState<'calling' | 'connected'>('calling');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(!isVideo);
  const [videoFilter, setVideoFilter] = useState<'none' | 'sunglasses' | 'crown' | 'hat'>('none');
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setCallStatus('calling');
      setCallDuration(0);
      setIsVideoOff(!isVideo);
      setVideoFilter('none');
      setReactions([]);
      return;
    }

    const timer = setTimeout(() => {
      setCallStatus('connected');
    }, 2500);

    return () => clearTimeout(timer);
  }, [isOpen, isVideo]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    }
    return () => clearTimeout(interval);
  }, [isOpen, callStatus]);

  const sendReaction = (emoji: string) => {
    const newReaction: FloatingReaction = {
      id: Date.now() + Math.random(),
      emoji,
      left: Math.floor(Math.random() * 80) + 10,
    };
    setReactions((prev) => [...prev, newReaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 3000);
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
            className="absolute bottom-24 text-3xl animate-bounce duration-1000 transition-all"
            style={{
              left: `${r.left}%`,
              animation: 'floatUp 3s ease-out forwards',
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Top indicator */}
      <div className="flex flex-col items-center gap-1 mt-6 z-20">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-[#38bdf8] border border-blue-500/30 text-[11px] font-bold uppercase tracking-wider shadow-md">
          {isGroup ? <Users className="w-3.5 h-3.5" /> : isVideoCallActive ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
          <span>{isGroup ? 'Llamada Grupal Cifrada PidgeX' : isVideoCallActive ? 'Videollamada AR PidgeX' : 'Llamada de Voz Cifrada PidgeX'}</span>
        </div>
        <h3 className="text-2xl font-black text-white tracking-tight mt-1">{contactName}</h3>
        <span className="text-sm text-[#8d90a0]">
          {callStatus === 'calling'
            ? isGroup ? 'Conectando a los participantes del grupo...' : isVideoCallActive ? 'Iniciando videollamada AR...' : 'Llamando...'
            : isGroup
            ? `En llamada grupal • ${groupMembers.length + 1} en línea • ${formatDuration(callDuration)}`
            : isVideoCallActive
            ? `Videollamada AR en vivo • ${formatDuration(callDuration)}`
            : `Conectado • ${formatDuration(callDuration)}`}
        </span>
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
                <span className="text-[10px] text-[#8d90a0]">{member.isLeader ? '⭐ Líder' : 'Integrante'}</span>
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
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 text-4xl select-none animate-bounce">
                    🕶️
                  </div>
                )}
                {videoFilter === 'crown' && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl select-none animate-bounce">
                    👑
                  </div>
                )}
                {videoFilter === 'hat' && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-4xl select-none animate-bounce">
                    🎩
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
          <div className="relative">
            {callStatus === 'calling' && (
              <div className="absolute -inset-4 rounded-full bg-[#38bdf8]/20 animate-ping" />
            )}
            <img
              src={contactAvatar}
              alt={contactName}
              className="w-36 h-36 rounded-full object-cover border-4 border-[#2563eb] shadow-2xl relative z-10"
            />
          </div>
        )}
      </div>

      {/* AR Filter Masks Selector Bar (for video calls) */}
      {isVideoCallActive && (
        <div className="flex items-center gap-2 bg-[#1c2028]/80 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md mb-2 z-20 shadow-lg">
          <span className="text-[11px] font-bold text-[#8d90a0] mr-1">Filtros AR:</span>
          {[
            { id: 'none', label: '✨ Normal' },
            { id: 'sunglasses', label: '🕶️ Gafas' },
            { id: 'crown', label: '👑 Corona' },
            { id: 'hat', label: '🎩 Sombrero' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setVideoFilter(f.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                videoFilter === f.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white/5 text-[#8d90a0] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Quick Emoji Reactions Bar */}
      <div className="flex items-center gap-2 bg-[#1c2028]/80 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md mb-3 z-20 shadow-lg">
        <span className="text-[11px] font-bold text-[#8d90a0] mr-1">Reaccionar:</span>
        {[
          { emoji: '❤️', label: 'Corazón' },
          { emoji: '🔥', label: 'Fuego' },
          { emoji: '🎉', label: 'Fiesta' },
          { emoji: '👍', label: 'Bien' },
          { emoji: '😂', label: 'Risa' },
        ].map((item) => (
          <button
            key={item.emoji}
            onClick={() => sendReaction(item.emoji)}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-lg transition-all hover:scale-125 active:scale-95 cursor-pointer shadow"
            title={item.label}
          >
            {item.emoji}
          </button>
        ))}
      </div>

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
          onClick={onClose}
          className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-600/40 cursor-pointer"
          title="Colgar"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
