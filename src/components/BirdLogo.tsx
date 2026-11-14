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
          ? 'bg-slate-900 ring-1 ring-slate-200 dark:ring-white/15 shadow-sm p-0.5'
          : ''
      } ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="PidgeX"
    >
      <img
        src="/pidgex-logo.svg"
        alt="PidgeX Logo"
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
  showSlogan = false,
  align = 'left',
}) => {
  return (
    <div
      className={`flex items-center gap-3 select-none ${
        align === 'center' ? 'justify-center text-center' : 'justify-start text-left'
      } ${className}`}
    >
      <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-900 ring-1 ring-slate-200 dark:ring-white/15 flex items-center justify-center shrink-0">
        <img
          src="/pidgex-logo.svg"
          alt="PidgeX"
          className="w-full h-full object-cover rounded-full"
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

export const BIRD_APP_LOGO_DATA_URL = '/pidgex-logo.svg';
