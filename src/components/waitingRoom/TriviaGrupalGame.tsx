import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  Trophy,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  Award,
  Flame,
  HelpCircle,
  Bot,
} from 'lucide-react';
import { playSound } from '../../utils/gameAudio';
import { PikitoMascot } from '../PikitoMascot';
import { TrophyVectorIcon } from '../CustomVectorIcons';

interface TriviaQuestion {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 1,
    category: 'Geografía',
    question: '¿Cuál es el río más largo del mundo?',
    options: ['Río Amazonas', 'Río Nilo', 'Río Misisipi', 'Río Yangtze'],
    correctIndex: 0,
    explanation: 'El río Amazonas es considerado el más largo y caudaloso del planeta.',
  },
  {
    id: 2,
    category: 'Tecnología',
    question: '¿Qué lenguaje de programación es famoso por ejecutarse en navegadores web?',
    options: ['Python', 'C++', 'JavaScript', 'Rust'],
    correctIndex: 2,
    explanation: 'JavaScript es el lenguaje nativo de la web para la interactividad.',
  },
  {
    id: 3,
    category: 'Cine & Entretenimiento',
    question: '¿Cuál es la película más taquillera de la historia del cine?',
    options: ['Titanic', 'Avengers: Endgame', 'Avatar', 'Star Wars: El despertar de la fuerza'],
    correctIndex: 2,
    explanation: 'Avatar (2009) dirigida por James Cameron ostenta el primer lugar.',
  },
  {
    id: 4,
    category: 'PidgeX Trivia',
    question: '¿Con qué prefijo comienzan los números de teléfono oficiales en PidgeX?',
    options: ['Prefijo 34', 'Prefijo 16', 'Prefijo 52', 'Prefijo 99'],
    correctIndex: 1,
    explanation: '¡En PidgeX todos los números registrados inician con el prefijo 16!',
  },
  {
    id: 5,
    category: 'Ciencia',
    question: '¿Cuál es el planeta más grande de nuestro Sistema Solar?',
    options: ['Saturno', 'Neptuno', 'Júpiter', 'Tierra'],
    correctIndex: 2,
    explanation: 'Júpiter es un gigante gaseoso más masivo que todos los demás planetas juntos.',
  },
  {
    id: 6,
    category: 'Arte & Historia',
    question: '¿Quién pintó la famosa obra de la Mona Lisa?',
    options: ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Claude Monet'],
    correctIndex: 1,
    explanation: 'Leonardo da Vinci la pintó a principios del siglo XVI.',
  },
  {
    id: 7,
    category: 'Deportes',
    question: '¿En qué país se celebró la Copa Mundial de Fútbol de 2022?',
    options: ['Brasil', 'Qatar', 'Alemania', 'Rusia'],
    correctIndex: 1,
    explanation: 'Qatar hospedó el mundial de la FIFA en noviembre/diciembre de 2022.',
  },
  {
    id: 8,
    category: 'Música',
    question: '¿Qué instrumento tiene 88 teclas entre blancas y negras?',
    options: ['Acordeón', 'Piano', 'Sintetizador', 'Arpa'],
    correctIndex: 1,
    explanation: 'Un piano de cola o vertical estándar tiene exactamente 88 teclas.',
  },
];

interface PlayerScore {
  id: string;
  name: string;
  initial: string;
  score: number;
  streak: number;
  isMe?: boolean;
}

interface TriviaGrupalGameProps {
  onBack: () => void;
  groupName?: string;
}

export const TriviaGrupalGame: React.FC<TriviaGrupalGameProps> = ({ onBack, groupName }) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(12);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [gameEnded, setGameEnded] = useState<boolean>(false);

  // Group players list
  const [players, setPlayers] = useState<PlayerScore[]>([
    { id: 'me', name: 'Tú (Jugador Principal)', initial: 'P', score: 0, streak: 0, isMe: true },
    { id: 'p2', name: 'Ana (Amiga)', initial: 'A', score: 0, streak: 0 },
    { id: 'p3', name: 'Carlos (Líder)', initial: 'C', score: 0, streak: 0 },
    { id: 'p4', name: 'Sofía', initial: 'S', score: 0, streak: 0 },
  ]);

  const currentQ = TRIVIA_QUESTIONS[currentQuestionIdx];

  // Timer countdown
  useEffect(() => {
    if (isAnswered || gameEnded) return;

    if (timeLeft <= 0) {
      handleSelectOption(-1); // Timeout
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswered, gameEnded]);

  const handleSelectOption = (index: number) => {
    if (isAnswered || gameEnded) return;

    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQ.correctIndex;

    // Calculate score points (faster answer = more bonus points)
    const timeBonus = Math.max(1, timeLeft) * 15;
    const basePoints = isCorrect ? 100 + timeBonus : 0;

    if (isCorrect) {
      if (soundEnabled) playSound('win');
    } else {
      if (soundEnabled) playSound('loss');
    }

    // Update player scores and simulate group opponent answers
    setPlayers((prevPlayers) => {
      return prevPlayers
        .map((p) => {
          if (p.isMe) {
            const newStreak = isCorrect ? p.streak + 1 : 0;
            const streakBonus = newStreak > 1 ? newStreak * 25 : 0;
            return {
              ...p,
              score: p.score + basePoints + streakBonus,
              streak: newStreak,
            };
          } else {
            // Simulate group member answers based on probability
            const botCorrect = Math.random() > 0.35;
            const botBonus = Math.floor(Math.random() * 80) + 80;
            const botPoints = botCorrect ? botBonus : 0;
            return {
              ...p,
              score: p.score + botPoints,
              streak: botCorrect ? p.streak + 1 : 0,
            };
          }
        })
        .sort((a, b) => b.score - a.score);
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < TRIVIA_QUESTIONS.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(12);
    } else {
      setGameEnded(true);
      if (soundEnabled) playSound('match');
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(12);
    setGameEnded(false);
    setPlayers([
      { id: 'me', name: 'Tú (Jugador Principal)', initial: 'P', score: 0, streak: 0, isMe: true },
      { id: 'p2', name: 'Ana (Amiga)', initial: 'A', score: 0, streak: 0 },
      { id: 'p3', name: 'Carlos (Líder)', initial: 'C', score: 0, streak: 0 },
      { id: 'p4', name: 'Sofía', initial: 'S', score: 0, streak: 0 },
    ]);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto p-4 select-none">
      {/* Top Navigation */}
      <div className="flex items-center justify-between w-full mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-[#8d90a0] hover:text-white px-3 py-1.5 rounded-xl bg-[#1c2028] border border-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Juegos</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{groupName ? `Grupo: ${groupName}` : 'Desafío Grupal'}</span>
          </span>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-8 h-8 rounded-full bg-[#1c2028] text-[#8d90a0] hover:text-white flex items-center justify-center border border-white/10 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#38bdf8]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Game Card Container */}
      <div className="w-full bg-[#141822] border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
        {!gameEnded ? (
          <>
            {/* Header Status & Timer */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-[#2563eb]/20 text-[#38bdf8] text-xs font-bold border border-[#2563eb]/30">
                  {currentQ.category}
                </span>
                <span className="text-xs text-[#8d90a0] font-semibold">
                  Pregunta {currentQuestionIdx + 1} de {TRIVIA_QUESTIONS.length}
                </span>
              </div>

              {/* Time Remaining Gauge */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-xs font-bold border ${
                  timeLeft <= 3
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* Question Card */}
            <div className="p-4 rounded-2xl bg-[#1c2028] border border-white/5 flex flex-col gap-2">
              <h3 className="text-base font-extrabold text-white leading-snug">
                {currentQ.question}
              </h3>
            </div>

            {/* Options List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentQ.options.map((opt, idx) => {
                let btnStyle =
                  'bg-[#1c2028] hover:bg-[#262a33] border-white/10 text-[#dfe2ee] hover:border-white/20';

                if (isAnswered) {
                  if (idx === currentQ.correctIndex) {
                    btnStyle = 'bg-emerald-600/30 border-emerald-500 text-emerald-200 font-bold';
                  } else if (idx === selectedOption) {
                    btnStyle = 'bg-red-600/30 border-red-500 text-red-200 font-bold';
                  } else {
                    btnStyle = 'bg-[#181c24]/50 border-white/5 text-[#8d90a0] opacity-50';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    className={`p-3.5 rounded-2xl border text-xs font-semibold text-left transition-all duration-150 flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && idx === currentQ.correctIndex && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation / Feedback when answered */}
            {isAnswered && (
              <div className="p-3.5 rounded-2xl bg-[#1c2028] border border-white/10 flex flex-col gap-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {selectedOption === currentQ.correctIndex ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        ¡Respuesta Correcta!
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        {selectedOption === -1 ? '¡Tiempo Agotado!' : 'Incorrecto'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleNextQuestion}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#00a6e0] hover:brightness-110 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    {currentQuestionIdx < TRIVIA_QUESTIONS.length - 1 ? 'Siguiente ➔' : 'Ver Resultados'}
                  </button>
                </div>
                <p className="text-[11px] text-[#8d90a0] italic">{currentQ.explanation}</p>
              </div>
            )}

            {/* Live Group Leaderboard */}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#8d90a0] uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tabla de Posiciones del Grupo</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                  <span>En Vivo</span>
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {players.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                      p.isMe
                        ? 'bg-[#2563eb]/20 border-[#38bdf8]/40 text-white font-bold'
                        : 'bg-[#1c2028] border-white/5 text-[#dfe2ee]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center font-bold text-[#8d90a0] text-xs">
                        #{idx + 1}
                      </span>
                      {p.isMe ? (
                        <PikitoMascot size="xs" mood="happy" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-[10px] text-sky-300">
                          {p.initial}
                        </div>
                      )}
                      <span>{p.name}</span>
                      {p.streak > 1 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold flex items-center gap-0.5">
                          <Flame className="w-3 h-3 text-orange-400" />
                          <span>x{p.streak}</span>
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-[#38bdf8]">{p.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Game Ended / Podio final */
          <div className="flex flex-col items-center gap-4 py-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-xl shadow-amber-950/40">
              <TrophyVectorIcon className="w-9 h-9" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-black text-white">¡Partida Completada!</h2>
              <p className="text-xs text-[#8d90a0]">
                {players[0]?.isMe
                  ? '¡Felicidades! Has ganado el primer lugar en la trivia del grupo.'
                  : `¡Gran esfuerzo! El ganador del grupo fue ${players[0]?.name}.`}
              </p>
            </div>

            {/* Podio list */}
            <div className="w-full flex flex-col gap-2 my-2">
              {players.map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-xs ${
                    idx === 0
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 font-bold'
                      : p.isMe
                      ? 'bg-[#2563eb]/20 border-[#38bdf8]/40 text-white font-bold'
                      : 'bg-[#1c2028] border-white/5 text-[#dfe2ee]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs text-amber-300">
                      #{idx + 1}
                    </span>
                    {p.isMe ? (
                      <PikitoMascot size="xs" mood={idx === 0 ? 'excited' : 'happy'} />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-[10px] text-sky-300">
                        {p.initial}
                      </div>
                    )}
                    <span>{p.name}</span>
                  </div>
                  <span className="font-mono font-extrabold text-sm">{p.score} pts</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleRestart}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#00a6e0] hover:brightness-110 text-white text-xs font-bold shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jugar Otra Ronda Grupal</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
