import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Square, Sparkles } from 'lucide-react';
import { DigitalAvatarConfig } from '../types';
import { DEFAULT_DIGITAL_AVATAR, drawDigitalAvatar } from '../utils/avatarRenderer';

interface AnimatedAvatarMessageCardProps {
  config?: DigitalAvatarConfig;
  expression?: DigitalAvatarConfig['expression'];
  text?: string;
  audioUrl?: string;
  isSender: boolean;
}

export const AnimatedAvatarMessageCard: React.FC<AnimatedAvatarMessageCardProps> = ({
  config,
  expression,
  text,
  audioUrl,
  isSender,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingRef = useRef(false);

  const avatarConfig = config || DEFAULT_DIGITAL_AVATAR;

  useEffect(() => {
    speakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    let rafId = 0;
    const start = performance.now();

    const renderLoop = (now: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const t = (now - start) / 1000;
          const blinkCycle = t % 3.6;
          const blink = blinkCycle > 3.42 ? Math.sin(((blinkCycle - 3.42) / 0.18) * Math.PI) : 0;
          const mouthOpen = speakingRef.current
            ? Math.abs(Math.sin(t * 14) * 0.65 + Math.sin(t * 23) * 0.35)
            : 0;

          drawDigitalAvatar(ctx, canvas.width, canvas.height, avatarConfig, {
            time: t,
            blink,
            mouthOpen,
            expression: expression || avatarConfig.expression,
          });
        }
      }
      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);
    return () => {
      cancelAnimationFrame(rafId);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [avatarConfig, expression]);

  const handleTogglePlay = () => {
    if (isSpeaking) {
      setIsSpeaking(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      audio.play().catch(() => setIsSpeaking(false));
      return;
    }

    if (text && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'es-ES';
      utter.rate = 1.02;
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utter);
    } else {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 2400);
    }
  };

  return (
    <div
      className={`rounded-2xl p-3 border shadow-md flex items-center gap-3 max-w-[300px] sm:max-w-[340px] ${
        isSender
          ? 'bg-gradient-to-br from-[#0284c7] to-[#1d4ed8] border-sky-400/30 text-white'
          : 'bg-[#1a2233] border-white/10 text-[#eef2f8]'
      }`}
    >
      <div className="relative shrink-0">
        <canvas
          ref={canvasRef}
          width={140}
          height={140}
          className="w-20 h-20 rounded-2xl border border-white/20 shadow-inner bg-[#090d16]"
        />
        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900/90 border border-white/20 flex items-center justify-center text-sky-400">
          <Sparkles className="w-3 h-3" />
        </span>
      </div>

      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <span className="text-[11px] font-semibold opacity-80">Avatar animado</span>
        {text && <p className="text-xs font-medium leading-snug break-words">{text}</p>}
        <button
          type="button"
          onClick={handleTogglePlay}
          className={`mt-0.5 self-start px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer ${
            isSender
              ? 'bg-white/20 hover:bg-white/30 text-white'
              : 'bg-[#0284c7] hover:bg-[#0369a1] text-white'
          }`}
        >
          {isSpeaking ? <Square className="w-3 h-3 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span>{isSpeaking ? 'Detener' : audioUrl ? 'Escuchar avatar' : 'Reproducir voz'}</span>
        </button>
      </div>
    </div>
  );
};
