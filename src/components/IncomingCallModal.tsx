import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video, Volume2, Vibrate, Sun } from 'lucide-react';
import { UserProfile } from '../types';
import { ringtoneManager } from '../utils/ringtoneAudio';

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
  user?: UserProfile;
  onAccept: (call: IncomingCallData) => void;
  onDecline: (call: IncomingCallData) => void;
  isNightMode?: boolean;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  user,
  onAccept,
  onDecline,
  isNightMode = true,
}) => {
  // Start custom/preset ringtone, device vibration, and screen wake lock
  useEffect(() => {
    if (!call) return;

    if (user) {
      ringtoneManager.startIncomingCallAlert(user);
    }

    return () => {
      ringtoneManager.stopIncomingCallAlert();
    };
  }, [call, user]);

  if (!call) return null;

  const shouldWakeScreen = !user || user.wakeScreenOnCall !== false;
  const isVibrating = !user || user.vibrateOnCall !== false;
  const ringtoneName =
    user?.callRingtoneId === 'custom'
      ? (user.customCallRingtoneName || 'Audio de galería')
      : (user?.callRingtoneId || 'Melodía PidgeX');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Visual Screen Wake & Flash Pulse: lights up the screen so device is visibly lit in dark */}
      {shouldWakeScreen && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-emerald-400/20 animate-pulse duration-700" />
          <div
            className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-emerald-400/20 animate-ping opacity-40"
            style={{ animationDuration: '2.4s' }}
          />
        </div>
      )}

      <div
        className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl flex flex-col items-center text-center relative z-10 overflow-hidden ${
          isNightMode
            ? 'bg-[#121620] border-emerald-500/30 text-white shadow-emerald-950/60'
            : 'bg-white border-sky-300 text-slate-900 shadow-2xl'
        }`}
      >
        {/* Ambient Ringing Glow */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-blue-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Status Badges */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold uppercase tracking-wider animate-bounce">
            {call.isVideo ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
            <span>{call.isVideo ? 'Videollamada Entrante' : 'Llamada Entrante'}</span>
          </div>

          {isVibrating && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold">
              <Vibrate className="w-3 h-3 animate-pulse" />
              <span>Vibrando</span>
            </div>
          )}

          {shouldWakeScreen && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
              <Sun className="w-3 h-3 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Pantalla Activa</span>
            </div>
          )}
        </div>

        {/* Caller Avatar with Pulse Rings */}
        <div className="relative my-4 flex items-center justify-center">
          <div
            className="absolute -inset-4 rounded-full border-2 border-emerald-400/40 animate-ping pointer-events-none"
            style={{ animationDuration: '2s' }}
          />
          <div className="absolute -inset-2 rounded-full border-2 border-emerald-400/60 animate-pulse pointer-events-none" />

          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500 shadow-2xl relative z-10 bg-slate-800">
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
        <h3 className="text-xl font-black tracking-tight mt-1 text-white">{call.callerName}</h3>
        {call.callerPhone && (
          <p className="text-xs text-emerald-400 font-mono mt-0.5">{call.callerPhone}</p>
        )}

        <div className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-xl bg-black/30 border border-white/10 text-[11px] text-gray-300">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Tono: {ringtoneName}</span>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          {call.isVideo
            ? 'Videollamada en vivo en PidgeX...'
            : 'Llamada de voz en tiempo real...'}
        </p>

        {/* Accept / Decline Buttons */}
        <div className="flex items-center justify-center gap-10 mt-7 w-full">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => {
                ringtoneManager.stopIncomingCallAlert();
                onDecline(call);
              }}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-950/60 transition-all cursor-pointer group"
              title="Rechazar llamada"
            >
              <PhoneOff className="w-7 h-7 group-hover:scale-110 transition-transform" />
            </button>
            <span className="text-[11px] font-bold text-red-400">Rechazar</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => {
                ringtoneManager.stopIncomingCallAlert();
                try {
                  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                  if (AudioCtx) {
                    const ctx = new AudioCtx();
                    ctx.resume().then(() => ctx.close()).catch(() => {});
                  }
                } catch {}
                onAccept(call);
              }}
              className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 transition-all cursor-pointer animate-bounce group"
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
