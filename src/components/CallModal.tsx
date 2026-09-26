import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  contactAvatar: string;
  isVideo: boolean;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  contactName,
  contactAvatar,
  isVideo,
}) => {
  const [callStatus, setCallStatus] = useState<'calling' | 'connected'>('calling');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(!isVideo);

  useEffect(() => {
    if (!isOpen) {
      setCallStatus('calling');
      setCallDuration(0);
      return;
    }

    const timer = setTimeout(() => {
      setCallStatus('connected');
    }, 2500);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, callStatus]);

  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0e16]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Top indicator */}
      <div className="flex flex-col items-center gap-1 mt-6">
        <span className="text-xs uppercase tracking-widest text-[#38bdf8] font-semibold">
          MessengerPidgeon Encrypted Call
        </span>
        <h3 className="text-2xl font-bold text-white">{contactName}</h3>
        <span className="text-sm text-[#8d90a0]">
          {callStatus === 'calling' ? 'Llamando...' : `Conectado • ${formatDuration(callDuration)}`}
        </span>
      </div>

      {/* Avatar or Video Preview */}
      <div className="relative flex items-center justify-center my-auto">
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
      </div>

      {/* Controls Bar */}
      <div className="flex items-center gap-4 bg-[#1c2028]/90 p-3 rounded-full border border-white/10 backdrop-blur-xl mb-6 shadow-2xl">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? 'bg-red-500/20 text-red-400' : 'bg-[#262a33] text-white hover:bg-[#31353e]'
          }`}
          title={isMuted ? 'Activar micrófono' : 'Silenciar'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {isVideo && (
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-[#262a33] text-white hover:bg-[#31353e]'
            }`}
            title={isVideoOff ? 'Activar video' : 'Desactivar video'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}

        <button
          onClick={onClose}
          className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-600/40"
          title="Colgar"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
