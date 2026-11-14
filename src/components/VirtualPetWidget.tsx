import React, { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, Lightbulb } from 'lucide-react';
import { UserProfile } from '../types';
import { PikitoMascot } from './PikitoMascot';

interface VirtualPetWidgetProps {
  user: UserProfile;
  isNightMode?: boolean;
}

const ACTIONS = [
  "Puedes cambiar el fondo de tus chats desde Ajustes.",
  "Prueba los filtros de voz al enviar notas de audio.",
  "Puedes proteger conversaciones privadas con un PIN.",
  "Tus mensajes se sincronizan automáticamente al volver tu conexión.",
  "Juega una partida rápida en la pestaña Juegos cuando quieras.",
  "Mantén tu perfil actualizado con tu foto y descripción.",
  "Explora la Tienda para ver artículos publicados cerca de ti.",
  "Activa el modo nocturno para descansar la vista de noche.",
  "Envía GIFs y stickers directamente desde el selector de emojis.",
  "Puedes traducir mensajes al instante dentro de cada chat."
];

const getTipByIndex = (index: number) => {
  return ACTIONS[index % ACTIONS.length];
};

export const VirtualPetWidget: React.FC<VirtualPetWidgetProps> = ({ user, isNightMode = false }) => {
  if (user.virtualPetEnabled === false) return null;

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [tipIndex, setTipIndex] = useState<number>(() => Math.floor(Math.random() * ACTIONS.length));
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % ACTIONS.length);
        setIsAnimating(false);
      }, 250);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleNextTip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    setTimeout(() => {
      setTipIndex((prev) => (prev + 1) % ACTIONS.length);
      setIsAnimating(false);
    }, 200);
  };

  return (
    <div className="fixed bottom-24 left-3 z-30 flex flex-col items-start select-none pointer-events-auto">
      {isExpanded && (
        <div
          className={`relative max-w-[260px] w-full p-3.5 rounded-2xl shadow-lg border mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            isNightMode
              ? 'bg-[#161b24] border-white/10 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-start gap-2.5 pr-5">
            <PikitoMascot size="sm" mood="talking" className="shrink-0 -mt-1" />
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0284c7] dark:text-[#38bdf8]">Eugenio</span>
              </div>
              <p className={`text-[11px] leading-relaxed transition-opacity duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                {getTipByIndex(tipIndex)}
              </p>
              <button
                onClick={handleNextTip}
                className="mt-1 text-[11px] font-semibold text-[#0284c7] dark:text-[#38bdf8] hover:underline self-start cursor-pointer flex items-center gap-1"
              >
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <span>Otro consejo</span>
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isNightMode ? 'bg-white/10 hover:bg-white/20 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title="Cerrar"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shadow-sm transition-colors cursor-pointer text-xs font-semibold ${
          isNightMode
            ? 'bg-[#161b24] hover:bg-[#1e2430] text-slate-200 border-white/10'
            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
        }`}
        title="Ver consejos"
      >
        <PikitoMascot size="xs" mood="happy" className="shrink-0" />
        <span className="text-[11px]">Eugenio</span>
        {isExpanded ? <ChevronDown className="w-3 h-3 opacity-60" /> : <ChevronUp className="w-3 h-3 opacity-60" />}
      </button>
    </div>
  );
};
