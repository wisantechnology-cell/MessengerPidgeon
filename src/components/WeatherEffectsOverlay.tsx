import React, { useEffect, useState } from 'react';

interface WeatherEffectsOverlayProps {
  effect: 'none' | 'rain' | 'snow' | 'stars';
}

export const WeatherEffectsOverlay: React.FC<WeatherEffectsOverlayProps> = ({ effect }) => {
  if (effect === 'none') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {effect === 'rain' && (
        <div className="absolute inset-0 opacity-40">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-gradient-to-b from-transparent via-blue-300 to-white w-[1px] h-8 animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDuration: `${Math.random() * 0.8 + 0.5}s`,
                animationDelay: `${Math.random() * 2}s`,
                animationIterationCount: 'infinite',
              }}
            />
          ))}
        </div>
      )}

      {effect === 'snow' && (
        <div className="absolute inset-0 opacity-60">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full w-1.5 h-1.5 animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                animationDelay: `${Math.random() * 3}s`,
                animationIterationCount: 'infinite',
              }}
            />
          ))}
        </div>
      )}

      {effect === 'stars' && (
        <div className="absolute inset-0 opacity-50">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-amber-200 rounded-full w-1 h-1 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 2 + 1}s`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
