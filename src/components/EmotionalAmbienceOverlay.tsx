import React, { useEffect, useState } from 'react';
import { ChatPersonalityTheme, EmotionalMode } from '../types';
import { EMOTIONAL_MODES } from '../utils/chatThemes';

interface EmotionalAmbienceOverlayProps {
  emotionalMode?: EmotionalMode;
  animatedBg?: ChatPersonalityTheme['animatedBg'];
  burstTrigger?: { id: number; effect: NonNullable<ChatPersonalityTheme['sendEffect']> } | null;
}

export const EmotionalAmbienceOverlay: React.FC<EmotionalAmbienceOverlayProps> = ({
  emotionalMode = 'neutral',
  animatedBg = 'none',
  burstTrigger,
}) => {
  const [activeBurst, setActiveBurst] = useState<{ id: number; icons: string[] } | null>(null);

  useEffect(() => {
    if (!burstTrigger || burstTrigger.effect === 'none') return;
    const map: Record<string, string[]> = {
      hearts: ['❤️', '💖', '💘', '✨', '💕'],
      confetti: ['🎉', '🎊', '✨', '🌟', '🥳'],
      sparks: ['⚡', '✨', '💫', '💎', '🌟'],
      bubbles: ['🫧', '💧', '✨', '🌊', '🫧'],
    };
    setActiveBurst({
      id: burstTrigger.id,
      icons: map[burstTrigger.effect] || ['✨', '⚡', '🌟'],
    });
    const t = setTimeout(() => setActiveBurst(null), 1100);
    return () => clearTimeout(t);
  }, [burstTrigger]);

  const modeSpec = EMOTIONAL_MODES.find((m) => m.id === emotionalMode);

  const floatGlyph =
    emotionalMode === 'romantico'
      ? '❤'
      : emotionalMode === 'divertido'
      ? '✦'
      : emotionalMode === 'misterioso'
      ? '◈'
      : emotionalMode === 'relajante'
      ? '○'
      : emotionalMode === 'futurista' || animatedBg === 'stars'
      ? '✧'
      : '';

  return (
    <>
      {modeSpec && modeSpec.backdropClass && (
        <div
          className={`absolute inset-0 pointer-events-none z-[1] bg-gradient-to-b ${modeSpec.backdropClass}`}
        />
      )}

      {(animatedBg !== 'none' || floatGlyph) && (
        <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden opacity-45">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-xs sm:text-sm animate-bounce"
              style={{
                left: `${8 + i * 12}%`,
                top: `${12 + ((i * 23) % 72)}%`,
                color: modeSpec?.accentHex || '#38bdf8',
                animationDuration: `${3.2 + (i % 4) * 0.9}s`,
                animationDelay: `${i * 0.35}s`,
              }}
            >
              {floatGlyph || '✦'}
            </span>
          ))}
        </div>
      )}

      {activeBurst && (
        <div
          key={activeBurst.id}
          className="fixed inset-x-0 bottom-24 pointer-events-none z-50 flex justify-center gap-6"
        >
          {activeBurst.icons.map((ico, idx) => (
            <span
              key={idx}
              className="text-2xl animate-ping"
              style={{
                animationDuration: '0.85s',
                animationDelay: `${idx * 60}ms`,
              }}
            >
              {ico}
            </span>
          ))}
        </div>
      )}
    </>
  );
};
