import React, { useState } from 'react';
import { Sparkles, MessageSquare, Radio, Gamepad2, Video, ShoppingBag, Shield, Check, ArrowRight, ArrowLeft, X } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNightMode?: boolean;
}

interface TutorialStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  gradient: string;
}

const STEPS: TutorialStep[] = [
  {
    title: '¡Bienvenido a PidgeX!',
    subtitle: 'La evolución definitiva de la mensajería',
    description: 'Descubre una plataforma ultrarrápida que combina chats globales seguros con minijuegos en tiempo real, videollamadas con filtros AR y mucho más.',
    icon: <Sparkles className="w-10 h-10 text-amber-300 animate-pulse" />,
    badge: 'Inicio',
    gradient: 'from-blue-600 to-indigo-700',
  },
  {
    title: 'Chats Globales y Red Mesh P2P',
    subtitle: 'Comunicación sin límites',
    description: 'Envía mensajes a cualquier persona al otro lado del mundo al instante a través de la nube, o descubre el Radar Local P2P para chatear cercanamente incluso sin internet.',
    icon: <Radio className="w-10 h-10 text-emerald-400 animate-pulse" />,
    badge: 'Conectividad',
    gradient: 'from-emerald-600 to-teal-700',
  },
  {
    title: 'Minijuegos en Sala de Espera',
    subtitle: 'Diviértete mientras conversas',
    description: 'Entra a la Sala de Espera y juega a Pájaro Mensajero, Caza-Cartas, Memoria, Tres en Raya y Meme Studio directamente desde la app.',
    icon: <Gamepad2 className="w-10 h-10 text-purple-400 animate-bounce" />,
    badge: 'Entretenimiento',
    gradient: 'from-purple-600 to-pink-700',
  },
  {
    title: 'Videollamadas y Llamadas HD',
    subtitle: 'Conéctate cara a cara',
    description: 'Disfruta de llamadas de voz y videollamadas fluidas de alta definición, notas de voz de cualquier duración y envío de fotos y videos.',
    icon: <Video className="w-10 h-10 text-cyan-400 animate-pulse" />,
    badge: 'Multimedia',
    gradient: 'from-cyan-600 to-blue-700',
  },
  {
    title: 'Modo Clásico y Personalización',
    subtitle: 'Tu app a tu manera',
    description: 'Personaliza tus fondos de pantalla, sonidos en vivo, exporta tus chats a texto y usa el botón de "Modo Clásico" en los Ajustes cuando prefieras una interfaz minimalista.',
    icon: <Shield className="w-10 h-10 text-amber-400 animate-bounce" />,
    badge: 'Ajustes',
    gradient: 'from-amber-600 to-orange-700',
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  isNightMode = true,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('pidge_tutorial_seen', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`w-full max-w-lg rounded-3xl border shadow-2xl flex flex-col overflow-hidden relative ${
        isNightMode ? 'bg-[#121620] border-white/15 text-white' : 'bg-white border-sky-200 text-slate-900'
      }`}>
        {/* Close Button */}
        <button
          onClick={() => {
            localStorage.setItem('pidge_tutorial_seen', 'true');
            onClose();
          }}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Banner */}
        <div className={`relative h-48 w-full bg-gradient-to-tr ${step.gradient} flex flex-col items-center justify-center p-6 text-center text-white shadow-inner`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/40 pointer-events-none" />
          <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase mb-3 border border-white/30 shadow">
            {step.badge} ({currentStep + 1} de {STEPS.length})
          </span>
          <div className="relative z-10 p-3 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 shadow-xl mb-1">
            {step.icon}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 flex flex-col gap-4 text-center">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">{step.title}</h2>
            <h3 className="text-xs sm:text-sm font-semibold text-emerald-400">{step.subtitle}</h3>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-gray-300 px-2">
            {step.description}
          </p>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 my-2">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-8 bg-emerald-400' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <span>{currentStep === STEPS.length - 1 ? '¡Comenzar a Usar PidgeX!' : 'Siguiente'}</span>
              {currentStep < STEPS.length - 1 && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
