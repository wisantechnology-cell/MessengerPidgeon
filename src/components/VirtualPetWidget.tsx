import React, { useState, useEffect } from 'react';
import { Sparkles, X, ChevronUp, ChevronDown, Lightbulb } from 'lucide-react';
import { UserProfile } from '../types';
import { PikitoMascot } from './PikitoMascot';

interface VirtualPetWidgetProps {
  user: UserProfile;
  isNightMode?: boolean;
}

const ACTIONS = [
  "Puedes cambiar tu fondo de pantalla favorito en los ajustes de cada chat.",
  "Prueba los efectos de voz (Ardilla, Robot y Grave) al enviar notas de voz.",
  "Puedes bloquear tus conversaciones más privadas con un PIN secreto.",
  "Recuerda que tus mensajes se sincronizan automáticamente cuando vuelve la conexión.",
  "Juega una partida rápida en la Sala de Espera arcade para superar tu récord.",
  "Comparte encuestas en tus grupos para tomar decisiones divertidas con amigos.",
  "Mantén tu perfil actualizado con tu foto y biografía para destacar.",
  "Cada nuevo día trae consigo oportunidades increíbles para conectar con los demás.",
  "Una sonrisa al día mejora tu salud mental y contagia excelente energía.",
  "Organiza tus tareas prioritarias para aprovechar al máximo tu tiempo libre.",
  "Explora el Marketplace de PidgeX para descubrir productos increíbles.",
  "Crea nuevos grupos de chat con tus amigos y asigna eventos con cuenta regresiva.",
  "Activa el modo nocturno para cuidar tu vista durante las horas de la noche.",
  "Usa estados personalizados para compartir lo que estás pensando hoy.",
  "Envía stickers divertidos para hacer sonreír a tus contactos.",
  "Recuerda que puedes traducir mensajes al instante dentro de tus chats.",
  "Envía postales digitales animadas a tus amigos en ocasiones especiales.",
  "Crea memes rápidos con plantillas divertidas para compartir en tus conversaciones.",
  "Activa los efectos de clima ambiental en ajustes para dar vida a tu pantalla.",
  "Usa el modo de videollamada con filtros AR divertidos."
];

const getTotalTipsCount = () => 1500;

const getTipByIndex = (index: number) => {
  return ACTIONS[(index * 13) % ACTIONS.length];
};

export const VirtualPetWidget: React.FC<VirtualPetWidgetProps> = ({ user, isNightMode = false }) => {
  if (user.virtualPetEnabled === false) return null;

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [tipIndex, setTipIndex] = useState<number>(() => Math.floor(Math.random() * 1500));
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % getTotalTipsCount());
        setIsAnimating(false);
      }, 300);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleNextTip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    setTimeout(() => {
      setTipIndex((prev) => (prev + 1) % getTotalTipsCount());
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="fixed bottom-36 left-3 z-30 flex flex-col items-start select-none pointer-events-auto">
      {/* Expanded speech card */}
      {isExpanded && (
        <div className={`relative max-w-[270px] w-full p-3.5 rounded-2xl shadow-xl border backdrop-blur-xl mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
          isNightMode
            ? 'bg-[#181c24]/95 border-blue-500/30 text-white shadow-blue-950/40'
            : 'bg-white/95 border-sky-300 text-[#0c2340] shadow-sky-900/15'
        }`}>
          <div className="flex items-start gap-2.5 pr-5">
            <PikitoMascot size="sm" mood="talking" className="shrink-0 -mt-1" />
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-wide text-sky-400">Pikito</span>
                <span className="text-[9px] text-[#8d90a0]">Mensajero fiel</span>
              </div>
              <p className={`text-[10px] leading-relaxed transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                {getTipByIndex(tipIndex)}
              </p>
              <button
                onClick={handleNextTip}
                className="mt-1 text-[9px] font-bold text-sky-400 hover:text-sky-300 self-start transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Lightbulb className="w-2.5 h-2.5 text-amber-400" />
                <span>Siguiente consejo</span>
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-2 right-2 w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-[9px] transition-colors cursor-pointer"
            title="Minimizar"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      )}

      {/* Floating non-intrusive pill */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181c24]/90 hover:bg-[#202530] text-white border border-sky-500/40 shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold"
        title="Ver a Pikito"
      >
        <PikitoMascot size="xs" mood="happy" className="shrink-0" />
        <span className="text-[11px] text-sky-300">Pikito</span>
        {isExpanded ? <ChevronDown className="w-3 h-3 text-[#8d90a0]" /> : <ChevronUp className="w-3 h-3 text-[#8d90a0]" />}
      </button>
    </div>
  );
};
