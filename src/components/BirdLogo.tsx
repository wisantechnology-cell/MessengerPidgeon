import React from 'react';

interface BirdLogoProps {
  className?: string;
  size?: number | string;
  withBackground?: boolean;
}

export const BirdLogo: React.FC<BirdLogoProps> = ({
  className = 'w-9 h-9',
  size,
  withBackground = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        withBackground
          ? 'bg-white rounded-full shadow-md shadow-black/20 ring-1 ring-white/20 p-1'
          : ''
      } ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="MessengerPidgeon"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Blue bird gradients */}
          <linearGradient id="birdBlueGradient" x1="15" y1="20" x2="85" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00c8ff" />
            <stop offset="50%" stopColor="#0091ff" />
            <stop offset="100%" stopColor="#0055ff" />
          </linearGradient>

          <linearGradient id="wingGradient" x1="45" y1="30" x2="80" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id="envelopeGradient" x1="65" y1="65" x2="90" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f6ff" />
          </linearGradient>

          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Crisp White Circle Background when rendered as full badge */}
        <circle cx="50" cy="50" r="48" fill="#FFFFFF" />

        {/* Inner subtle rim */}
        <circle cx="50" cy="50" r="47" stroke="#E2E8F0" strokeWidth="1.5" fill="none" />

        {/* Bird Body & Silhouette (Stylized Messenger Bird based on user sketch) */}
        <g filter="url(#softShadow)">
          {/* Main Bird Body with graceful curve and tail */}
          <path
            d="M 24 38 
               C 21 39, 16 43, 15 45
               C 17 46, 21 47, 24 46
               C 25 43, 27 38, 30 35
               C 34 31, 40 31, 45 34
               C 52 38, 56 46, 62 52
               C 69 58, 77 60, 84 57
               C 80 64, 71 69, 61 68
               C 50 67, 43 60, 36 53
               C 30 46, 26 41, 24 38 Z"
            fill="url(#birdBlueGradient)"
          />

          {/* Bird Head & Beak */}
          <path
            d="M 28 36
               C 25 33, 21 34, 18 36
               C 14 38, 12 40, 10 42
               C 13 43, 17 43, 20 41
               C 22 43, 25 44, 28 42
               C 30 40, 30 37, 28 36 Z"
            fill="url(#birdBlueGradient)"
          />

          {/* Bird Eye */}
          <circle cx="23" cy="38" r="2" fill="#FFFFFF" />
          <circle cx="23" cy="38" r="1" fill="#003580" />

          {/* Upward Curved Wing (matching sketch curvature) */}
          <path
            d="M 42 36
               C 48 30, 58 24, 70 25
               C 74 25, 78 28, 78 33
               C 78 40, 70 48, 60 54
               C 52 59, 46 58, 43 51
               C 41 47, 40 41, 42 36 Z"
            fill="url(#wingGradient)"
          />

          {/* Inner Wing Feather Highlight */}
          <path
            d="M 48 37
               C 53 32, 62 28, 70 30
               C 72 34, 66 42, 58 46
               C 52 50, 48 48, 47 43
               C 46 40, 47 38, 48 37 Z"
            fill="#7dd3fc"
            opacity="0.6"
          />

          {/* Bird Legs (Claws) */}
          {/* Front Leg */}
          <path
            d="M 43 65 L 40 76 M 40 76 L 35 79 M 40 76 L 39 80 M 40 76 L 44 79"
            stroke="#0080ff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Back Leg holding the Letter/Envelope */}
          <path
            d="M 52 66 L 55 75 M 55 75 L 51 78 M 55 75 L 56 80 M 55 75 L 61 77"
            stroke="#0080ff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* String / Grip holding the envelope */}
          <path
            d="M 57 77 C 62 76, 65 74, 68 73"
            stroke="#0066cc"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Letter / Envelope Carried in Foot (From user drawing) */}
          <g transform="translate(64, 67) rotate(8)">
            {/* Envelope Base */}
            <rect
              x="0"
              y="0"
              width="24"
              height="16"
              rx="2.5"
              fill="url(#envelopeGradient)"
              stroke="#0084ff"
              strokeWidth="1.8"
            />
            {/* Envelope Flap / Lines */}
            <path
              d="M 1 1 L 12 10 L 23 1"
              stroke="#0084ff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Stamp / Little Blue Heart in envelope */}
            <circle cx="12" cy="12" r="2" fill="#00a6e0" />
          </g>
        </g>
      </svg>
    </div>
  );
};

// Raw SVG Data URI for usage anywhere (favicon, metadata, img src)
export const BIRD_APP_LOGO_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f4f8ff"/>
    </linearGradient>
    <linearGradient id="birdBlue" x1="15" y1="20" x2="85" y2="85" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00c8ff"/>
      <stop offset="50%" stop-color="#0084ff"/>
      <stop offset="100%" stop-color="#0044ff"/>
    </linearGradient>
    <linearGradient id="wing" x1="45" y1="30" x2="80" y2="70" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="url(#bg)" stroke="#dbeafe" stroke-width="2"/>
  <path d="M 24 38 C 21 39, 16 43, 15 45 C 17 46, 21 47, 24 46 C 25 43, 27 38, 30 35 C 34 31, 40 31, 45 34 C 52 38, 56 46, 62 52 C 69 58, 77 60, 84 57 C 80 64, 71 69, 61 68 C 50 67, 43 60, 36 53 C 30 46, 26 41, 24 38 Z" fill="url(#birdBlue)"/>
  <path d="M 28 36 C 25 33, 21 34, 18 36 C 14 38, 12 40, 10 42 C 13 43, 17 43, 20 41 C 22 43, 25 44, 28 42 C 30 40, 30 37, 28 36 Z" fill="url(#birdBlue)"/>
  <circle cx="23" cy="38" r="2.2" fill="#FFFFFF"/>
  <circle cx="23" cy="38" r="1.2" fill="#003580"/>
  <path d="M 42 36 C 48 30, 58 24, 70 25 C 74 25, 78 28, 78 33 C 78 40, 70 48, 60 54 C 52 59, 46 58, 43 51 C 41 47, 40 41, 42 36 Z" fill="url(#wing)"/>
  <path d="M 48 37 C 53 32, 62 28, 70 30 C 72 34, 66 42, 58 46 C 52 50, 48 48, 47 43 Z" fill="#7dd3fc" opacity="0.6"/>
  <path d="M 43 65 L 40 76 M 40 76 L 35 79 M 40 76 L 39 80 M 40 76 L 44 79" stroke="#0080ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 52 66 L 55 75 M 55 75 L 51 78 M 55 75 L 56 80 M 55 75 L 61 77" stroke="#0080ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="translate(63, 66) rotate(8)">
    <rect x="0" y="0" width="25" height="17" rx="3" fill="#ffffff" stroke="#0084ff" stroke-width="2"/>
    <path d="M 1 1 L 12.5 10.5 L 24 1" stroke="#0084ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="12.5" cy="12.5" r="2.5" fill="#00a6e0"/>
  </g>
</svg>`);
