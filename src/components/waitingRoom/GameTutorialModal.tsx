import React from 'react';
import {
  X,
  Sparkles,
  Gamepad2,
  Trophy,
  CheckCircle2,
  HelpCircle,
  Play,
  Flame,
  Zap,
  MousePointer,
  Keyboard,
  Smartphone,
  Award,
  Mail,
  Brain,
  Grid,
  Image as ImageIcon,
  Lightbulb,
} from 'lucide-react';
import { PikitoMascot } from '../PikitoMascot';

export interface GameTutorialInfo {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  objective: string;
  steps: string[];
  controls: { type: 'touch' | 'keyboard' | 'mouse'; label: string; desc: string }[];
  scoring: string[];
  proTips: string[];
}

export const GAME_TUTORIALS: Record<string, GameTutorialInfo> = {
  birdflight: {
    id: 'birdflight',
    title: 'Pájaro Mensajero',
    subtitle: 'Vuelo, Reflejos & Entrega de Cartas',
    icon: <PikitoMascot size="md" mood="waving" />,
    gradient: 'from-[#0084ff] to-[#00a6e0]',
    objective: 'Guía al pájaro mensajero a través de los cielos esquivando las tuberías y recolectando tantas cartas como puedas.',
    steps: [
      'Al iniciar el juego, el pájaro comenzará a descender por efecto de la gravedad.',
      'Toca la pantalla o presiona el botón para dar un aleteo y ganar altura.',
      'Atraviesa los huecos entre las tuberías y recolecta los sobres dorados para obtener bonificaciones especiales.',
    ],
    controls: [
      { type: 'touch', label: 'Tocar Pantalla', desc: 'Aletear hacia arriba' },
      { type: 'keyboard', label: 'Espacio / Flecha Arriba', desc: 'Aletear hacia arriba' },
      { type: 'mouse', label: 'Clic Izquierdo', desc: 'Aletear hacia arriba' },
    ],
    scoring: [
      '1 punto por cada par de tuberías superado con éxito.',
      '5 puntos de bonificación por cada sobre de carta dorado recogido.',
      'Tu puntuación máxima se guarda automáticamente en tu récord personal.',
    ],
    proTips: [
      'Mantén un ritmo constante de toques cortos en lugar de tocar desesperadamente.',
      'No vueles demasiado cerca del techo o perderás visibilidad para el siguiente obstáculo.',
      'Apunta al centro del hueco entre tuberías con medio segundo de anticipación.',
    ],
  },
  catchletters: {
    id: 'catchletters',
    title: 'Caza-Cartas',
    subtitle: 'Velocidad, Coordinación & Reflejos',
    icon: <Mail className="w-8 h-8 text-white" />,
    gradient: 'from-amber-500 to-orange-500',
    objective: 'Mueve tu buzón mensajero para atrapar todos los sobres que caen del cielo antes de que toquen el suelo y esquiva los peligros.',
    steps: [
      'Las cartas comenzarán a caer a diferentes velocidades desde la parte superior.',
      'Desplaza tu buzón de izquierda a derecha para atraparlas antes de que caigan al vacío.',
      'Si una carta toca el suelo, perderás una de tus 3 vidas disponibles.',
    ],
    controls: [
      { type: 'touch', label: 'Deslizar Dedo', desc: 'Mover el buzón horizontalmente' },
      { type: 'mouse', label: 'Mover Cursor', desc: 'El buzón sigue tu puntero suavemente' },
      { type: 'keyboard', label: 'Flechas ← / →', desc: 'Mover buzón a izquierda y derecha' },
    ],
    scoring: [
      '10 puntos por cada sobre postal blanco recogido.',
      '50 puntos por sobres dorados relucientes.',
      'El juego termina cuando se te acaban las 3 vidas.',
    ],
    proTips: [
      'Colócate en el centro de la pantalla mientras esperas las siguientes cartas.',
      'No arriesgues una vida por alcanzar una carta lejana si tienes otra más cerca cayendo.',
      'A mayor puntuación, la velocidad de caída irá en aumento progresivo.',
    ],
  },
  memory: {
    id: 'memory',
    title: 'Memoria Mensajera',
    subtitle: 'Parejas, Concentración & Retención Visual',
    icon: <Brain className="w-8 h-8 text-white" />,
    gradient: 'from-emerald-500 to-teal-600',
    objective: 'Descubre y empareja las 8 parejas de cartas (16 cartas en total) en el menor número de movimientos y segundos posibles.',
    steps: [
      'Todas las cartas están boca abajo en una cuadrícula de 4x4.',
      'Toca una primera carta para revelar su símbolo secreto.',
      'Toca una segunda carta: si coinciden, quedarán descubiertas; si no, volverán a voltearse.',
    ],
    controls: [
      { type: 'touch', label: 'Tocar Carta', desc: 'Voltear para ver su imagen' },
      { type: 'mouse', label: 'Clic en Carta', desc: 'Voltear para ver su imagen' },
    ],
    scoring: [
      'El objetivo es emparejar las 8 parejas completas.',
      'El cronómetro y el contador de movimientos miden tu eficiencia mental.',
      'Al completar el tablero escucharás la fanfarria de victoria.',
    ],
    proTips: [
      'Asocia cada símbolo con su posición en la cuadrícula (ej. "Estrella arriba a la derecha").',
      'Despeja primero las filas superiores para que te resulte más fácil memorizar las restantes.',
      'Tómate 1 segundo para observar cada carta antes de apresurarte a voltear la siguiente.',
    ],
  },
  tictactoe: {
    id: 'tictactoe',
    title: 'Tres en Raya',
    subtitle: 'Estrategia 1 vs 1 o Contra la IA',
    icon: <Grid className="w-8 h-8 text-white" />,
    gradient: 'from-purple-500 to-indigo-600',
    objective: 'Consigue colocar tres de tus fichas (Eugenio o Carta) en una línea horizontal, vertical o diagonal antes que tu rival.',
    steps: [
      'Elige jugar contra la Inteligencia Artificial de PidgeX o contra un amigo en el mismo dispositivo.',
      'Los jugadores se turnan para colocar una ficha en cualquier casilla vacía de 3x3.',
      'El primero en formar una línea continua de 3 fichas gana la partida.',
    ],
    controls: [
      { type: 'touch', label: 'Tocar Casilla', desc: 'Colocar tu ficha en el tablero' },
      { type: 'mouse', label: 'Clic en Casilla', desc: 'Colocar tu ficha en el tablero' },
    ],
    scoring: [
      '1 punto de victoria por cada partida ganada.',
      'El marcador lleva la cuenta de victorias de X, O y empates en tiempo real.',
    ],
    proTips: [
      'Comenzar en el centro o en una esquina te da el mayor número de combinaciones ganadoras.',
      'Presta atención a bloquear a tu oponente cuando tenga dos fichas alineadas.',
      'Intenta crear una "trampa de dos vías" donde tengas dos formas distintas de ganar a la vez.',
    ],
  },
  memestudio: {
    id: 'memestudio',
    title: 'Meme Studio',
    subtitle: 'Editor Creativo & Compartir al Instante',
    icon: <ImageIcon className="w-8 h-8 text-white" />,
    gradient: 'from-pink-600 to-purple-600',
    objective: 'Crea memes cómicos y originales usando plantillas populares o tus propias imágenes, y compártelos directo en tus chats.',
    steps: [
      'Selecciona una plantilla graciosa o sube cualquier foto de tu galería.',
      'Escribe el texto superior y el texto inferior para darle el remate humorístico.',
      'Previsualiza el meme renderizado con estilo Impact y pulsa "Enviar al Chat" o "Descargar".',
    ],
    controls: [
      { type: 'touch', label: 'Tocar & Escribir', desc: 'Editar textos y seleccionar plantilla' },
      { type: 'mouse', label: 'Escribir & Clic', desc: 'Personalizar tu meme en tiempo real' },
    ],
    scoring: [
      'Herramienta de creatividad social libre.',
      'Comparte risas ilimitadas con tus grupos y amigos de PidgeX.',
    ],
    proTips: [
      'Los mejores memes tienen textos cortos, directos y en mayúsculas.',
      'Combina situaciones cotidianas con las fotos divertidas de gatos o perros.',
    ],
  },
};

interface GameTutorialModalProps {
  gameId: string | null;
  isOpen: boolean;
  onClose: () => void;
  isNightMode?: boolean;
}

export const GameTutorialModal: React.FC<GameTutorialModalProps> = ({
  gameId,
  isOpen,
  onClose,
  isNightMode = true,
}) => {
  if (!isOpen || !gameId) return null;

  const tutorial = GAME_TUTORIALS[gameId] || GAME_TUTORIALS['birdflight'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden relative ${
          isNightMode
            ? 'bg-[#10141e] border-white/15 text-white'
            : 'bg-white border-sky-200 text-slate-900'
        }`}
      >
        {/* Header Hero Banner */}
        <div
          className={`relative p-5 sm:p-6 bg-gradient-to-r ${tutorial.gradient} text-white flex items-center justify-between shadow-md shrink-0`}
        >
          <div className="flex items-center gap-3.5 relative z-10 min-w-0">
            <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl shadow-lg shrink-0">
              {tutorial.icon}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/80 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Tutorial & Guía de Juego</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight truncate">
                {tutorial.title}
              </h2>
              <p className="text-xs text-white/90 truncate">{tutorial.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5 text-left text-xs sm:text-sm">
          {/* Objetivo */}
          <section className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold uppercase tracking-wider text-[11px]">
              <Trophy className="w-3.5 h-3.5" />
              <span>Objetivo del Juego</span>
            </div>
            <p className="text-gray-200 leading-relaxed">{tutorial.objective}</p>
          </section>

          {/* Cómo Jugar Paso a Paso */}
          <section className="flex flex-col gap-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cómo Jugar (Paso a Paso)</span>
            </h4>
            <div className="flex flex-col gap-2">
              {tutorial.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-gray-300 leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Controles */}
          <section className="flex flex-col gap-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Controles del Juego</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tutorial.controls.map((ctrl, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                    {ctrl.type === 'touch' && <Smartphone className="w-3.5 h-3.5" />}
                    {ctrl.type === 'keyboard' && <Keyboard className="w-3.5 h-3.5" />}
                    {ctrl.type === 'mouse' && <MousePointer className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-[11px]">{ctrl.label}</span>
                    <span className="text-[10px] text-gray-400">{ctrl.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Puntuación y Reglas */}
          <section className="flex flex-col gap-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Puntuación & Reglas</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-gray-300 pl-1 leading-relaxed">
              {tutorial.scoring.map((item, idx) => (
                <li key={idx} className="marker:text-amber-400">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Consejos Pro */}
          <section className="flex flex-col gap-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-amber-300">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Consejos Pro para Ganar</span>
            </div>
            <ul className="space-y-1.5 text-xs text-amber-100/90 pl-1">
              {tutorial.proTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer Action Button */}
        <div
          className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 ${
            isNightMode ? 'bg-[#0b0e14] border-white/10' : 'bg-gray-50 border-sky-100'
          }`}
        >
          <span className="text-[11px] text-gray-400">
            ¡Ya estás listo para conseguir un nuevo récord!
          </span>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-2xl bg-gradient-to-r ${tutorial.gradient} text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform cursor-pointer`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>¡Entendido, a jugar!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
