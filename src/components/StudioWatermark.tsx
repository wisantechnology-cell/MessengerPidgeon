import React, { useState, useEffect } from 'react';
import { Minimize2, Maximize2, MoveHorizontal, X } from 'lucide-react';

interface StudioWatermarkProps {
  hidden?: boolean;
}

export const StudioWatermark: React.FC<StudioWatermarkProps> = ({ hidden = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosed, setIsClosed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('messengerpidgeon_mapj_closed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem('messengerpidgeon_mapj_minimized') === 'true';
    } catch {
      return false;
    }
  });
  const [position, setPosition] = useState<'left' | 'right' | 'top-right'>(() => {
    try {
      return (localStorage.getItem('messengerpidgeon_mapj_position') as 'left' | 'right' | 'top-right') || 'left';
    } catch {
      return 'left';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('messengerpidgeon_mapj_closed', String(isClosed));
    } catch (e) {
      console.warn(e);
    }
  }, [isClosed]);

  useEffect(() => {
    try {
      localStorage.setItem('messengerpidgeon_mapj_minimized', String(isMinimized));
    } catch (e) {
      console.warn(e);
    }
  }, [isMinimized]);

  useEffect(() => {
    try {
      localStorage.setItem('messengerpidgeon_mapj_position', position);
    } catch (e) {
      console.warn(e);
    }
  }, [position]);

  // If chat is open, explicitly hidden, or closed by user, do not render so it NEVER blocks anything
  if (hidden || isClosed) {
    return null;
  }

  // Minimized Sleek Tiny Badge - Hugs screen edge safely above nav bar without covering buttons
  if (isMinimized) {
    return (
      <div
        id="studio-watermark-container"
        className={`fixed z-30 transition-all duration-200 ${
          position === 'top-right'
            ? 'top-18 right-3'
            : position === 'left'
            ? 'bottom-20 left-2'
            : 'bottom-48 right-2'
        }`}
      >
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-0.5 rounded-full border border-amber-500/30 shadow-lg">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            title="M.A.P.J STUDIOS (Clic para restaurar)"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#e57a28] to-[#b24807] text-white text-[9px] font-mono font-black opacity-85 hover:opacity-100 hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
          >
            <span>M.A.P.J</span>
            <Maximize2 className="w-2.5 h-2.5 opacity-80" />
          </button>
          <button
            type="button"
            onClick={() => setIsClosed(true)}
            title="Cerrar logo de M.A.P.J STUDIOS para que no tape nada"
            className="p-1 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="studio-watermark-container"
      className={`fixed z-30 select-none flex flex-col items-center pointer-events-auto transition-all duration-300 group ${
        position === 'top-right'
          ? 'top-20 right-3'
          : position === 'left'
          ? 'bottom-20 left-3 sm:bottom-22 sm:left-4'
          : 'bottom-48 right-3 sm:bottom-52 sm:right-4'
      }`}
      style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.45))' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Quick Non-Intrusive Controls Header (visible on hover) */}
      <div
        className={`flex items-center justify-center gap-1 mb-1 transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPosition((prev) => (prev === 'left' ? 'top-right' : prev === 'top-right' ? 'right' : 'left'));
          }}
          title="Mover de posición para que no tape nada"
          className="p-1 rounded-md bg-black/75 hover:bg-black text-white/80 hover:text-white text-[9px] backdrop-blur-sm transition-colors cursor-pointer"
        >
          <MoveHorizontal className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(true);
          }}
          title="Minimizar logo"
          className="p-1 rounded-md bg-black/75 hover:bg-black text-white/80 hover:text-white text-[9px] backdrop-blur-sm transition-colors cursor-pointer"
        >
          <Minimize2 className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsClosed(true);
          }}
          title="Ocultar logo completamente"
          className="p-1 rounded-md bg-black/75 hover:bg-red-600 text-white/80 hover:text-white text-[9px] backdrop-blur-sm transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Label above the badge */}
      <span
        className="text-[8px] sm:text-[9px] font-black tracking-[0.2em] text-[#0a0a0a] dark:text-amber-200 uppercase mb-0.5 opacity-85 transition-opacity drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)] font-mono"
      >
        STUDIOS
      </span>

      {/* Main Orange / Terracotta Square Badge */}
      <div
        id="studio-watermark-badge"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-b from-[#e57a28] via-[#cf5c15] to-[#b24807] border-2 border-[#ff9d55]/70 shadow-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 opacity-80 hover:opacity-100 ${
          isHovered ? 'scale-105 ring-2 ring-[#ffb370]/60' : ''
        }`}
        title="M.A.P.J STUDIOS (Toca para ver info / pasa el mouse para mover, minimizar o cerrar)"
      >
        {/* Subtle inner parchment texture / bevel overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/25 rounded-[6px] pointer-events-none" />

        {/* Text M.A */}
        <div className="relative z-10 leading-none flex items-center justify-center tracking-tight">
          <span className="font-extrabold text-[#1a1410] text-[12px] sm:text-[13px] font-mono drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]">
            M.A
          </span>
        </div>

        {/* Text P.J */}
        <div className="relative z-10 leading-none flex items-center justify-center tracking-tight mt-0.5">
          <span className="font-extrabold text-[#1a1410] text-[12px] sm:text-[13px] font-mono drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]">
            P.J
          </span>
        </div>
      </div>

      {/* Popover on click */}
      {isExpanded && (
        <div
          className={`absolute bottom-full mb-2 ${
            position === 'left' ? 'left-0' : 'right-0'
          } whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#181c24]/95 border border-[#f59e0b]/30 text-[11px] font-semibold text-[#fef3c7] shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex items-center gap-2`}
        >
          <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
          <span>M.A.P.J STUDIOS</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="text-[10px] text-amber-300 underline hover:text-white cursor-pointer"
          >
            Minimizar
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsClosed(true);
            }}
            className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer ml-1"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};
