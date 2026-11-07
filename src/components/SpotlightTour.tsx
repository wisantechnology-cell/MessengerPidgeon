import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, X, HelpCircle, Compass, MousePointer, Lightbulb } from 'lucide-react';

interface SpotlightTourProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: any) => void;
  isNightMode?: boolean;
}

interface TourStep {
  title: string;
  description: string;
  targetTab: string;
  position: 'top' | 'bottom' | 'center';
  tip: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Lista de Chats y Conversaciones',
    description: 'Aquí aparecen todas tus conversaciones activas con amigos y grupos. Toca cualquier chat para abrirlo y enviar mensajes.',
    targetTab: 'chats',
    position: 'top',
    tip: 'Usa el botón superior para crear un nuevo chat o grupo.',
  },
  {
    title: 'BirdMarketplace',
    description: 'Explora nuestra tienda comunitaria integrada para intercambiar artículos, coleccionables y productos.',
    targetTab: 'marketplace',
    position: 'bottom',
    tip: '¡Publica tus propios artículos o explora ofertas en la tienda!',
  },
  {
    title: 'Sala de Espera (Mini Juegos)',
    description: 'Diviértete con amigos en partidas multijugador en tiempo real como Trivia Grupal, Dibuja y Adivina o Stop.',
    targetTab: 'games',
    position: 'bottom',
    tip: 'Entra a cualquier sala para competir y ganar puntos con amigos.',
  },
  {
    title: 'NP Noticias PidgeX',
    description: 'Mantente informado con el feed de noticias mundiales de última hora y comparte artículos directamente a tus chats.',
    targetTab: 'news',
    position: 'bottom',
    tip: 'Comparte noticias con un solo toque con tus contactos.',
  },
  {
    title: 'Ajustes y Modo Clásico',
    description: 'Personaliza tu perfil, cambia tu foto, ajusta notificaciones y activa el "Modo Clásico" si prefieres la interfaz original.',
    targetTab: 'settings',
    position: 'bottom',
    tip: 'Aquí puedes alternar entre PidgeX Pro y Modo Clásico.',
  },
];

export const SpotlightTour: React.FC<SpotlightTourProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  isNightMode = true,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onSelectTab(TOUR_STEPS[nextIndex].targetTab);
    } else {
      localStorage.setItem('pidge_spotlight_seen', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onSelectTab(TOUR_STEPS[prevIndex].targetTab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar / Skip */}
      <div className="pointer-events-auto flex items-center justify-between max-w-lg mx-auto w-full bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-white shadow-2xl">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-xs font-bold">Guía Interactiva PidgeX ({currentStepIndex + 1}/{TOUR_STEPS.length})</span>
        </div>
        <button
          onClick={() => {
            localStorage.setItem('pidge_spotlight_seen', 'true');
            onClose();
          }}
          className="text-xs text-gray-300 hover:text-white underline cursor-pointer"
        >
          Omitir Guía
        </button>
      </div>

      {/* Floating Tooltip Box pointing to respective UI area */}
      <div className="pointer-events-auto max-w-sm mx-auto w-full animate-in zoom-in-95 duration-200">
        <div className={`p-5 rounded-3xl border shadow-2xl flex flex-col gap-3 relative ${
          isNightMode ? 'bg-[#121620]/95 border-emerald-500/40 text-white shadow-emerald-950/50' : 'bg-white/95 border-sky-400 text-slate-900 shadow-sky-500/20'
        }`}>
          {/* Pointer Arrow Indicator */}
          <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border ${
            step.position === 'top' ? '-bottom-2 border-r-0 border-b-0' : '-top-2 border-l-0 border-t-0'
          } ${isNightMode ? 'bg-[#121620] border-emerald-500/40' : 'bg-white border-sky-400'}`} />

          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
              Paso {currentStepIndex + 1}
            </span>
            <MousePointer className="w-4 h-4 text-emerald-400 animate-bounce" />
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-black text-base">{step.title}</h3>
            <p className="text-xs leading-relaxed text-gray-300">{step.description}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-emerald-300 font-medium flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{step.tip}</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            {currentStepIndex > 0 ? (
              <button
                onClick={handlePrev}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            ) : <div />}

            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              <span>{currentStepIndex === TOUR_STEPS.length - 1 ? '¡Entendido!' : 'Siguiente'}</span>
              {currentStepIndex < TOUR_STEPS.length - 1 && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
