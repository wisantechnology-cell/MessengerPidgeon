import React from 'react';

export type PikitoMood = 'happy' | 'talking' | 'thinking' | 'waving' | 'excited' | 'sleepy';

interface PikitoMascotProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  mood?: PikitoMood;
  className?: string;
  isAnimated?: boolean;
}

export const PikitoMascot: React.FC<PikitoMascotProps> = ({
  size = 'md',
  mood = 'happy',
  className = '',
  isAnimated = true,
}) => {
  const sizeMap = {
    xs: 'w-5 h-5',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const dimMap = {
    xs: 20,
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };

  const dim = dimMap[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${sizeMap[size]} ${
        isAnimated ? 'transition-transform duration-300 hover:scale-110 active:scale-95' : ''
      } ${className}`}
      title="Eugenio, tu mensajero fiel"
      role="img"
      aria-label="Mascota Eugenio de PidgeX"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full drop-shadow-md ${isAnimated ? 'animate-bounce-subtle' : ''}`}
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(2, 132, 199, 0.25))',
        }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="pikitoBody" x1="20" y1="20" x2="80" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          <linearGradient id="pikitoBelly" x1="30" y1="45" x2="70" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.85" />
          </linearGradient>

          <linearGradient id="pikitoWing" x1="15" y1="45" x2="50" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>

          <linearGradient id="pikitoBeak" x1="65" y1="45" x2="90" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="pikitoCheek" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fb7185" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="envelopeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
        </defs>

        {/* Tail Feathers */}
        <path
          d="M 18 68 C 10 74 6 82 8 88 C 14 88 22 82 28 72 Z"
          fill="#0369a1"
        />
        <path
          d="M 12 62 C 4 66 2 74 5 80 C 10 80 18 74 24 66 Z"
          fill="#0284c7"
        />

        {/* Main Body Plump Oval */}
        <ellipse
          cx="48"
          cy="56"
          rx="32"
          ry="30"
          fill="url(#pikitoBody)"
        />

        {/* Head Crest / Feather Tuft */}
        <path
          d="M 52 26 C 50 16 42 12 36 10 C 37 18 42 22 47 26 Z"
          fill="#38bdf8"
        />
        <path
          d="M 58 28 C 60 18 68 14 74 12 C 70 20 66 24 58 29 Z"
          fill="#0284c7"
        />

        {/* Soft Fluffy Belly */}
        <ellipse
          cx="54"
          cy="62"
          rx="22"
          ry="20"
          fill="url(#pikitoBelly)"
        />

        {/* Wing (Animated or Waving) */}
        {mood === 'waving' ? (
          <path
            d="M 28 50 C 22 36 14 26 8 28 C 4 34 16 52 26 62 Z"
            fill="url(#pikitoWing)"
            className="origin-bottom-right animate-pulse"
          />
        ) : (
          <path
            d="M 26 48 C 22 52 20 62 25 72 C 30 80 42 78 44 72 C 46 64 38 52 26 48 Z"
            fill="url(#pikitoWing)"
          />
        )}

        {/* Cute Beak */}
        <polygon
          points="70,48 88,54 70,60"
          fill="url(#pikitoBeak)"
        />
        {/* Beak smile crease */}
        <path
          d="M 70 54 L 84 54"
          stroke="#b45309"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Rosy Cheek */}
        <circle
          cx="62"
          cy="58"
          r="5"
          fill="url(#pikitoCheek)"
        />

        {/* Eye */}
        {mood === 'sleepy' ? (
          <path
            d="M 54 46 C 56 50 62 50 64 46"
            stroke="#0f172a"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ) : (
          <g>
            {/* Eye Background */}
            <circle cx="58" cy="44" r="7" fill="#0f172a" />
            {/* Big Light Reflection */}
            <circle cx="56" cy="42" r="2.5" fill="#ffffff" />
            {/* Small Sparkle Reflection */}
            <circle cx="61" cy="46" r="1.2" fill="#ffffff" />
            {/* Playful Eyelash or Eyebrow */}
            <path
              d="M 53 36 C 56 34 62 34 65 36"
              stroke="#0369a1"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Cute Messenger Satchel / Letter */}
        <g transform="translate(42, 64) scale(0.7)">
          <rect
            x="0"
            y="0"
            width="22"
            height="15"
            rx="2.5"
            fill="url(#envelopeGrad)"
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          {/* Envelope fold */}
          <path
            d="M 1 1 L 11 9 L 21 1"
            stroke="#94a3b8"
            strokeWidth="1.2"
            fill="none"
          />
          {/* Blue PidgeX seal */}
          <circle cx="11" cy="7.5" r="2.5" fill="#0284c7" />
        </g>

        {/* Feet */}
        <path
          d="M 40 84 L 38 90 M 40 84 L 41 90 M 40 84 L 44 89"
          stroke="#d97706"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 54 84 L 52 90 M 54 84 L 55 90 M 54 84 L 58 89"
          stroke="#d97706"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
