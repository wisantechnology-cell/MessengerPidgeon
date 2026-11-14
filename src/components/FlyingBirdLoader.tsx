import React from 'react';
import { BirdLogo } from './BirdLogo';

interface FlyingBirdLoaderProps {
  isLoading?: boolean;
  message?: string;
  isNightMode?: boolean;
}

export const FlyingBirdLoader: React.FC<FlyingBirdLoaderProps> = ({
  isLoading = true,
  message = 'Cargando tus chats...',
  isNightMode = true,
}) => {
  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in select-none ${
        isNightMode ? 'bg-[#0f131c]' : 'bg-[#f4f8fc]'
      }`}
    >
      <div className="flex flex-col items-center text-center gap-4 px-6">
        <BirdLogo size={56} withBackground />
        <div className="w-6 h-6 rounded-full border-2 border-[#0284c7]/25 border-t-[#0284c7] animate-spin" />
        <div className="flex flex-col gap-0.5">
          <span
            className={`text-base font-semibold tracking-tight ${
              isNightMode ? 'text-white' : 'text-[#0c2340]'
            }`}
          >
            PidgeX
          </span>
          <p
            className={`text-xs ${
              isNightMode ? 'text-[#94a3b8]' : 'text-[#64748b]'
            }`}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};
