import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const ReactionHeartIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="heartGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#e11d48" />
      </linearGradient>
    </defs>
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill="url(#heartGrad)"
    />
  </svg>
);

export const ReactionThumbIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="thumbGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    <path
      d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8 0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.63-.8-1.12-.94l-.72-.23c-.34-.11-.7.01-.93.28L8.6 9.4c-.38.45-.6.99-.6 1.6v8c0 1.1.9 2 2 2h7.61c.83 0 1.54-.5 1.84-1.25l2.38-5.87z"
      fill="url(#thumbGrad)"
    />
  </svg>
);

export const ReactionFlameIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#ea580c" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#fef08a" />
      </linearGradient>
    </defs>
    <path
      d="M12 23c4.97 0 9-3.8 9-8.5 0-3.5-2.5-6.5-4.5-9-1.2 2-2 3.8-3.5 4.5-1.5.7-3-.5-3.5-2-.3 2.5-2 4.5-3.5 6-1.5 1.5-2.5 3.5-2.5 5.5C3.5 19.2 7.53 23 12 23z"
      fill="url(#flameGrad)"
    />
    <path
      d="M12 20c2.5 0 4.5-1.8 4.5-4 0-1.7-1-3-2-4.2-.6.9-1.2 1.6-2 1.9-.8.3-1.6-.2-1.9-.9-.2 1.1-1 2-1.7 2.7-.8.7-1.4 1.7-1.4 2.5 0 2.2 2.02 4 4.5 4z"
      fill="#ffffff"
      opacity="0.8"
    />
  </svg>
);

export const ReactionPartyIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="partyGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <path
      d="M3 21l3-11 11 3-14 8z"
      fill="url(#partyGrad)"
    />
    <circle cx="16" cy="6" r="2" fill="#eab308" />
    <circle cx="20" cy="11" r="1.5" fill="#06b6d4" />
    <circle cx="11" cy="4" r="1.5" fill="#f43f5e" />
    <path d="M14 13l3 3 M18 4l2 3 M8 6l2 2" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const ReactionClapIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="clapGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>
    <path
      d="M18.5 7.5c-.83 0-1.5.67-1.5 1.5v4.5l-3-4.5c-.5-.7-1.4-.9-2.1-.4-.7.5-.9 1.4-.4 2.1l4 5.8c.4.6.6 1.3.6 2V22h5v-5c0-1.7-.7-3.3-2-4.4V9c0-.83-.67-1.5-1.5-1.5z"
      fill="url(#clapGrad)"
    />
    <path
      d="M5.5 7.5c.83 0 1.5.67 1.5 1.5v4.5l3-4.5c.5-.7 1.4-.9 2.1-.4.7.5.9 1.4.4 2.1l-4 5.8c-.4.6-.6 1.3-.6 2V22H2v-5c0-1.7.7-3.3 2-4.4V9c0-.83.67-1.5 1.5-1.5z"
      fill="url(#clapGrad)"
      opacity="0.85"
    />
  </svg>
);

export const TrophyVectorIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="goldCup" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="40%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#ca8a04" />
      </linearGradient>
    </defs>
    <path
      d="M19 4h-2V3c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1v1H5c-1.1 0-2 .9-2 2v2c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V18H8c-.55 0-1 .45-1 1s.45 1 1 1h8c.55 0 1-.45 1-1s-.45-1-1-1h-3v-2.1c1.84-.4 3.28-1.85 3.61-3.7A4.996 4.996 0 0021 8V6c0-1.1-.9-2-2-2zM5 8V6h2v3.82C5.84 9.4 5 8.79 5 8zm14 0c0 .79-.84 1.4-2 1.82V6h2v2z"
      fill="url(#goldCup)"
    />
  </svg>
);

export const PaletteVectorIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2C6.49 2 2 6.49 2 12c0 4.97 3.66 9.09 8.43 9.87.52.09.96-.28.96-.81v-.64c0-.79.64-1.42 1.42-1.42h.77c3.54 0 6.42-2.88 6.42-6.42 0-5.83-4.51-10.58-10-10.58z"
      fill="#6366f1"
    />
    <circle cx="7" cy="8" r="1.5" fill="#f43f5e" />
    <circle cx="11.5" cy="6" r="1.5" fill="#facc15" />
    <circle cx="16" cy="8" r="1.5" fill="#10b981" />
    <circle cx="17.5" cy="12.5" r="1.5" fill="#38bdf8" />
  </svg>
);

export const ZapVectorIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M13 2L3 14h8l-2 8 10-12h-8l2-8z"
      fill="#eab308"
      stroke="#ca8a04"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

export const SquirrelVoiceIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="#f97316" />
    <ellipse cx="8" cy="7" rx="2" ry="3" fill="#ea580c" />
    <ellipse cx="16" cy="7" rx="2" ry="3" fill="#ea580c" />
    <circle cx="9" cy="11" r="1.5" fill="#ffffff" />
    <circle cx="15" cy="11" r="1.5" fill="#ffffff" />
    <circle cx="9" cy="11" r="0.8" fill="#000000" />
    <circle cx="15" cy="11" r="0.8" fill="#000000" />
    <polygon points="12,13 10,15 14,15" fill="#c2410c" />
    <rect x="11" y="15" width="2" height="2" fill="#ffffff" rx="0.5" />
  </svg>
);

export const RobotVoiceIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="6" width="16" height="14" rx="3" fill="#0284c7" />
    <circle cx="12" cy="3" r="1.5" fill="#38bdf8" />
    <line x1="12" y1="4.5" x2="12" y2="6" stroke="#38bdf8" strokeWidth="2" />
    <rect x="7" y="10" width="3" height="3" rx="0.5" fill="#38bdf8" />
    <rect x="14" y="10" width="3" height="3" rx="0.5" fill="#38bdf8" />
    <rect x="8" y="16" width="8" height="1.5" rx="0.75" fill="#ffffff" />
  </svg>
);

export const DeepVoiceIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="#7c3aed" />
    <path
      d="M6 12h2 M9 8v8 M12 6v12 M15 9v6 M18 12h-1"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const TikTokVectorIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3.1 15.68a6.34 6.34 0 0 0 10.82 4.47c1.7-1.68 2.62-3.95 2.62-6.33V8.87a8.2 8.2 0 0 0 4.82 1.56V7.01c-.61 0-1.22-.11-1.77-.32z" />
  </svg>
);

export const FacebookVectorIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
