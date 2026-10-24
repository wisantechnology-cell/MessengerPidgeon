import React from 'react';

interface StudioWatermarkProps {
  hidden?: boolean;
}

export const StudioWatermark: React.FC<StudioWatermarkProps> = ({ hidden = false }) => {
  if (hidden) {
    return null;
  }

  return (
    <div
      id="studio-watermark-container"
      className="fixed bottom-20 left-3 z-30 pointer-events-none select-none opacity-90"
    >
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#14100c]/90 backdrop-blur-md border border-orange-500/40 shadow-xl">
        <div className="flex flex-col items-center">
          <span className="text-[7px] font-black uppercase tracking-tighter text-amber-200 -mb-0.5 font-mono">
            STUDIOS
          </span>
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 border-2 border-orange-600 shadow-md flex flex-col items-center justify-center p-0.5">
            <span className="text-[12px] font-black font-mono tracking-tighter text-black leading-none font-sans">
              M.A
            </span>
            <span className="text-[12px] font-black font-mono tracking-tighter text-black leading-none font-sans mt-0.5">
              P.J
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
