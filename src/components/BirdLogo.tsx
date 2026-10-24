import React from 'react';

interface BirdLogoProps {
  className?: string;
  size?: number | string;
  withBackground?: boolean;
}

export const BirdLogo: React.FC<BirdLogoProps> = ({
  className = 'w-10 h-10',
  size,
  withBackground = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden rounded-full ${
        withBackground
          ? 'bg-black ring-1 ring-[#00d4ff]/30 shadow-md shadow-black/50 p-0.5'
          : ''
      } ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="PidgeX - No hay límites para conectar."
    >
      <img
        src="/pidgex-logo.svg"
        alt="PidgeX Paloma Logo"
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  );
};

interface PidgeXFullLogoProps {
  className?: string;
  showSlogan?: boolean;
  align?: 'center' | 'left';
}

export const PidgeXFullLogo: React.FC<PidgeXFullLogoProps> = ({
  className = '',
  showSlogan = true,
  align = 'center',
}) => {
  return (
    <div
      className={`flex flex-col select-none p-6 bg-black rounded-3xl border border-white/15 shadow-2xl ${
        align === 'center' ? 'items-center text-center' : 'items-start text-left'
      } ${className}`}
    >
      {/* Large Circular Paloma Logo Badge (No text inside SVG) */}
      <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden bg-black ring-4 ring-[#00d4ff]/60 shadow-2xl flex items-center justify-center mb-2">
        <img
          src="/pidgex-logo.svg"
          alt="PidgeX Paloma Emblem"
          className="w-full h-full object-cover rounded-full"
        />
      </div>

      <span className="font-serif tracking-[0.18em] font-black text-white text-2xl sm:text-3xl mt-1 leading-tight uppercase drop-shadow-md">
        PidgeX
      </span>

      {showSlogan && (
        <span className="text-[11px] sm:text-xs tracking-[0.24em] text-[#38bdf8] font-extrabold uppercase mt-2 drop-shadow">
          NO HAY LÍMITES PARA CONECTAR.
        </span>
      )}
    </div>
  );
};

export const BIRD_APP_LOGO_DATA_URL = '/pidgex-logo.svg';
