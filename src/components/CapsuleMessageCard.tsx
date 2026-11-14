import React, { useState } from 'react';
import { Lock, Unlock, Gift, Sparkles, Clock } from 'lucide-react';
import { TimeCapsuleData } from '../types';
import { VoicePlayer } from './VoicePlayer';

interface CapsuleMessageCardProps {
  text?: string;
  capsuleData: TimeCapsuleData;
  isSender: boolean;
  onUnlockCapsule?: () => void;
}

export const CapsuleMessageCard: React.FC<CapsuleMessageCardProps> = ({
  text,
  capsuleData,
  isSender,
  onUnlockCapsule,
}) => {
  const [opened, setOpened] = useState(Boolean(capsuleData.unlocked));
  const [bursting, setBursting] = useState(false);

  const isTimeReady = Date.now() >= (capsuleData.unlockTime || 0);
  const canOpen = isTimeReady || !capsuleData.unlockTime;
  const unlockDateStr = capsuleData.unlockTime
    ? new Date(capsuleData.unlockTime).toLocaleString([], {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Hoy';

  const handleOpen = () => {
    if (!canOpen) return;
    setBursting(true);
    setOpened(true);
    onUnlockCapsule?.();
    setTimeout(() => setBursting(false), 1400);
  };

  return (
    <div
      className={`relative rounded-2xl p-3.5 border shadow-lg max-w-[320px] sm:max-w-[360px] overflow-hidden transition-all ${
        opened
          ? 'bg-gradient-to-br from-amber-950/90 via-[#1a1f2e] to-indigo-950/90 border-amber-400/40 text-white'
          : isSender
          ? 'bg-gradient-to-br from-amber-600 to-orange-600 border-amber-300/40 text-white'
          : 'bg-[#1a2233] border-amber-500/30 text-[#eef2f8]'
      }`}
    >
      {/* Celebratory particle burst on unlock */}
      {bursting && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20">
          {['✨', '🎉', '⏳', '🌟', '🎁', '💫'].map((emo, i) => (
            <span
              key={i}
              className="absolute text-xl animate-ping"
              style={{
                left: `${15 + i * 14}%`,
                top: `${20 + (i % 3) * 22}%`,
                animationDuration: '0.9s',
              }}
            >
              {emo}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
          {opened ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>{capsuleData.occasion || 'Mensaje del Futuro'}</span>
        </div>
        <span className="text-[10px] opacity-80 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{unlockDateStr}</span>
        </span>
      </div>

      {!opened ? (
        <div className="flex flex-col items-center text-center gap-2 py-2">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <Gift className="w-6 h-6 text-amber-200" />
          </div>
          <p className="text-xs font-medium">
            {capsuleData.isSurprise
              ? '¡Tienes un mensaje sorpresa del futuro!'
              : 'Cápsula temporal lista para descubrir'}
          </p>
          {canOpen ? (
            <button
              type="button"
              onClick={handleOpen}
              className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer active:scale-95 transition-transform"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Abrir Mensaje del Futuro</span>
            </button>
          ) : (
            <span className="text-[11px] opacity-85">Se desbloqueará el {unlockDateStr}</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 animate-in zoom-in-95 duration-300">
          {text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>}
          {capsuleData.attachments && capsuleData.attachments.length > 0 && (
            <div className="flex flex-col gap-2 pt-1">
              {capsuleData.attachments.map((att, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden bg-black/30 border border-white/10">
                  {att.type === 'image' && (
                    <img src={att.url} alt={att.name || 'Recuerdo'} className="w-full max-h-48 object-cover" />
                  )}
                  {att.type === 'video' && (
                    <video src={att.url} controls playsInline className="w-full max-h-48 bg-black" />
                  )}
                  {att.type === 'voice' && (
                    <div className="p-2">
                      <VoicePlayer durationText={att.duration || '0:05'} audioUrl={att.url} isSender={isSender} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
