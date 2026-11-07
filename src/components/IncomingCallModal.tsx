import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, Users, Sparkles, Volume2 } from 'lucide-react';

export interface IncomingCallData {
  id: string;
  callerId: string;
  callerName: string;
  callerPhone?: string;
  callerAvatar?: string;
  isVideo?: boolean;
  isGroup?: boolean;
  chatId?: string;
}

interface IncomingCallModalProps {
  call: IncomingCallData | null;
  onAccept: (call: IncomingCallData) => void;
  onDecline: (call: IncomingCallData) => void;
  isNightMode?: boolean;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  onAccept,
  onDecline,
  isNightMode = true,
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play realistic electronic phone ringing sound using Web Audio API
  useEffect(() => {
    if (!call) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
        
        const playRingTone = () => {
          if (!audioContextRef.current) return;
          const ctx = audioContextRef.current;
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }

          const now = ctx.currentTime;
          
          // Dual tone frequency (standard telephone ring 440Hz + 480Hz)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(440, now);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(480, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
          gain.gain.setValueAtTime(0.15, now + 1.2);
          gain.gain.linearRampToValueAtTime(0, now + 1.4);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 1.4);
          osc2.stop(now + 1.4);
        };

        playRingTone();
        ringIntervalRef.current = setInterval(playRingTone, 2800);
      }
    } catch (e) {
      console.warn('Web Audio ringing error:', e);
    }

    return () => {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [call]);

  if (!call) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl flex flex-col items-center text-center relative overflow-hidden ${
        isNightMode ? 'bg-[#121620] border-emerald-500/30 text-white shadow-emerald-950/60' : 'bg-white border-sky-300 text-slate-900 shadow-2xl'
      }`}>
        {/* Ambient Ringing Glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 animate-bounce">
          {call.isVideo ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
          <span>{call.isVideo ? 'Videollamada Entrante' : 'Llamada Entrante'}</span>
        </div>

        {/* Caller Avatar with Pulse Rings */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute -inset-4 rounded-full border-2 border-emerald-400/40 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute -inset-2 rounded-full border-2 border-emerald-400/60 animate-pulse" />
          
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl relative z-10 bg-slate-800">
            {call.callerAvatar ? (
              <img src={call.callerAvatar} alt={call.callerName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white bg-gradient-to-tr from-blue-600 to-emerald-500">
                {call.callerName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Caller Details */}
        <h3 className="text-xl font-black tracking-tight mt-2 text-white">{call.callerName}</h3>
        {call.callerPhone && (
          <p className="text-xs text-emerald-400 font-mono mt-0.5">{call.callerPhone}</p>
        )}
        <p className="text-xs text-gray-300 mt-2">
          {call.isVideo
            ? 'Te está llamando para una videollamada en PidgeX...'
            : 'Te está llamando por voz en PidgeX...'}
        </p>

        {/* Accept / Decline Buttons */}
        <div className="flex items-center justify-center gap-8 mt-8 w-full">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => onDecline(call)}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-950/50 transition-all cursor-pointer group"
              title="Rechazar llamada"
            >
              <PhoneOff className="w-7 h-7 group-hover:scale-110 transition-transform" />
            </button>
            <span className="text-[11px] font-bold text-red-400">Rechazar</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => onAccept(call)}
              className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-950/50 transition-all cursor-pointer animate-bounce group"
              title="Contestar llamada"
            >
              {call.isVideo ? (
                <Video className="w-7 h-7 group-hover:scale-110 transition-transform" />
              ) : (
                <Phone className="w-7 h-7 group-hover:scale-110 transition-transform" />
              )}
            </button>
            <span className="text-[11px] font-bold text-emerald-400">Contestar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
