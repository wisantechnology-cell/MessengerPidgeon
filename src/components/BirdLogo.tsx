import React from 'react';

export const BIRD_APP_LOGO_DATA_URL = '/assets/aistudio/Logo_de_PidgeX_5e3aa7b3.PNG';

interface BirdLogoProps {
  className?: string;
  size?: number | string;
  withBackground?: boolean;
}

export const BirdLogo: React.FC<BirdLogoProps> = ({
  className = 'w-11 h-11',
  size,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden rounded-full bg-black ring-1 ring-slate-200 dark:ring-white/20 shadow-sm ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="PidgeX"
    >
      <img
        src={BIRD_APP_LOGO_DATA_URL}
        alt="PidgeX Logo"
        className="w-full h-full object-contain rounded-full"
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
  showSlogan = false,
  align = 'left',
}) => {
  return (
    <div
      className={`flex items-center gap-3 select-none ${
        align === 'center' ? 'justify-center text-center' : 'justify-start text-left'
      } ${className}`}
    >
      <div className="w-11 h-11 rounded-full overflow-hidden bg-black ring-1 ring-slate-200 dark:ring-white/20 flex items-center justify-center shrink-0 shadow-sm">
        <img
          src={BIRD_APP_LOGO_DATA_URL}
          alt="PidgeX"
          className="w-full h-full object-contain rounded-full"
        />
      </div>
      <div className="flex flex-col">
        <span className="font-bold tracking-tight text-lg leading-tight">
          PidgeX
        </span>
        {showSlogan && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Mensajería y llamadas
          </span>
        )}
      </div>
    </div>
  );
};

