import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Sparkles, Volume2, Shield } from 'lucide-react';
import { Chat, UserProfile } from '../types';

interface ActiveCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat | null;
  user: UserProfile;
  callType: 'voice' | 'video';
  isNightMode?: boolean;
}

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  isOpen,
  onClose,
  chat,
  user,
  callType,
  isNightMode = true,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(callType === 'video');
  const [seconds, setSeconds] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<'none' | 'cyber' | 'vintage' | 'noir' | 'teal'>('none');

  useEffect(() => {
    if (!isOpen) {
      setSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !chat) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  const filterStyles = {
    none: '',
    cyber: 'hue-rotate-90 contrast-125 saturate-200',
    vintage: 'sepia contrast-110',
    noir: 'grayscale contrast-150',
    teal: 'hue-rotate-180 brightness-90',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="relative w-full h-full max-w-4xl max-h-[85vh] md:rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between p-6 md:p-10 bg-[#0b0e14]">
        {/* Top Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white tracking-wider">Cifrado de extremo a extremo en PidgeX</span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-full border border-emerald-500/30 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{formatTime(seconds)}</span>
          </div>
        </div>

        {/* Center Video / Avatar Area */}
        <div className="relative flex-1 flex flex-col items-center justify-center my-auto">
          {isVideoOn ? (
            <div className="relative w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-gray-900 flex items-center justify-center">
              <img
                src={chat.avatarUrl}
                alt={chat.name}
                className={`w-full h-full object-cover transition-all duration-500 ${filterStyles[activeFilter]}`}
              />
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-white">
                {chat.name}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full p-1 bg-gradient-to-tr from-sky-500 to-emerald-400 animate-pulse">
                  <img src={chat.avatarUrl} alt={chat.name} className="w-full h-full rounded-full object-cover" />
                </div>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">{chat.name}</h2>
              <p className="text-xs text-emerald-400 font-mono tracking-widest uppercase">Llamada en curso...</p>
            </div>
          )}
        </div>

        {/* AR Filters & Controls Bar */}
        <div className="flex flex-col items-center gap-4 z-10">
          {/* AR Filters */}
          <div className="flex items-center gap-2 bg-black/50 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400 ml-2" />
            {(['none', 'cyber', 'vintage', 'noir', 'teal'] as const).map((flt) => (
              <button
                key={flt}
                onClick={() => setActiveFilter(flt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  activeFilter === flt ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                {flt === 'none' ? 'Normal' : flt}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-2xl text-white transition-all cursor-pointer shadow-lg ${
                isMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-white/10 hover:bg-white/20 border border-white/10'
              }`}
              title={isMuted ? 'Activar micrófono' : 'Silenciar'}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-4 rounded-2xl text-white transition-all cursor-pointer shadow-lg ${
                !isVideoOn ? 'bg-red-600 hover:bg-red-500' : 'bg-white/10 hover:bg-white/20 border border-white/10'
              }`}
              title={isVideoOn ? 'Apagar cámara' : 'Encender cámara'}
            >
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>

            <button
              onClick={onClose}
              className="px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 shadow-xl hover:scale-105 transition-all cursor-pointer"
              title="Colgar llamada"
            >
              <PhoneOff className="w-6 h-6" />
              <span>Colgar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
