import React from 'react';
import { BirdLogo } from './BirdLogo';
import { PikitoMascot } from './PikitoMascot';

interface FlyingBirdLoaderProps {
  isLoading?: boolean;
  message?: string;
  isNightMode?: boolean;
}

export const FlyingBirdLoader: React.FC<FlyingBirdLoaderProps> = ({
  isLoading = true,
  message = 'Eugenio volando con tus mensajes...',
  isNightMode = true,
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0e16]/90 backdrop-blur-xl animate-fade-in select-none">
      {/* Background flying bird trail effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-[-100px] animate-fly-across duration-3000">
          <BirdLogo className="w-16 h-16 text-sky-400 opacity-60 transform -rotate-12" />
        </div>
        <div className="absolute bottom-1/3 right-[-100px] animate-fly-across-reverse duration-4000">
          <BirdLogo className="w-12 h-12 text-blue-500 opacity-40 transform rotate-12" />
        </div>
      </div>

      {/* Main Mascot Loader */}
      <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl bg-[#141822]/90 border border-sky-500/30 shadow-2xl shadow-sky-950/50 backdrop-blur-2xl max-w-sm w-full mx-4 text-center">
        {/* Animated Flying Mascot */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-sky-500/20 to-blue-600/20 blur-xl animate-pulse" />
          <div className="relative transform hover:scale-110 transition-transform animate-bounce-subtle">
            <PikitoMascot size="xl" mood="waving" />
          </div>
        </div>

        {/* Loading Spinner ring */}
        <div className="w-10 h-10 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin mb-4" />

        <h3 className="text-base font-black text-white tracking-wide mb-1">
          Cargando PidgeX
        </h3>
        <p className="text-xs text-sky-300 font-medium animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
};
