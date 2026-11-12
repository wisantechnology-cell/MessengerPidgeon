import React, { useState } from 'react';
import {
  Gamepad2,
  Trophy,
  Sparkles,
  Flame,
  ArrowRight,
  Play,
  RotateCcw,
  Star,
  Users,
  HelpCircle,
  BookOpen,
  Mail,
  Brain,
  Grid,
  Image as ImageIcon,
  Video as VideoCam,
} from 'lucide-react';
import { BirdFlightGame } from './BirdFlightGame';
import { MemoryGame } from './MemoryGame';
import { CatchLettersGame } from './CatchLettersGame';
import { TicTacToeGame } from './TicTacToeGame';
import { MemeStudioGame } from '../MemeStudioGame';
import { GameTutorialModal } from './GameTutorialModal';
import { BirdLogo } from '../BirdLogo';
import { Chat, UserProfile } from '../../types';
import { PikitoMascot } from '../PikitoMascot';

export type MiniGameId =
  | 'birdflight'
  | 'memory'
  | 'catchletters'
  | 'tictactoe'
  | 'memestudio'
  | null;

interface WaitingRoomViewProps {
  onBackToChats?: () => void;
  chats?: Chat[];
  user?: UserProfile;
  isNightMode?: boolean;
  onSendMemeToChat?: (chatId: string, memeDataUrl: string, caption: string) => void;
}

export const WaitingRoomView: React.FC<WaitingRoomViewProps> = ({
  onBackToChats,
  chats = [],
  user = { id: 'me', name: 'Usuario', username: '@usuario', bio: '', email: '', wallpaperId: '', phone: '', avatarUrl: '', status: 'online' } as UserProfile,
  isNightMode = false,
  onSendMemeToChat,
}) => {
  const [activeGame, setActiveGame] = useState<MiniGameId>(null);
  const [tutorialGameId, setTutorialGameId] = useState<string | null>(null);

  // High score trackers from localStorage
  const birdFlightHigh = parseInt(localStorage.getItem('birdflight_highscore') || '0', 10);
  const catchLettersHigh = parseInt(localStorage.getItem('catchletters_highscore') || '0', 10);

  const GAMES = [
    {
      id: 'birdflight' as const,
      category: 'single',
      title: 'Pájaro Mensajero',
      subtitle: 'Vuelo & Obstáculos',
      description: 'Guía al pájaro mensajero a través de las nubes y entrega tantas cartas como puedas esquivando obstáculos.',
      icon: <PikitoMascot size="sm" mood="waving" />,
      color: 'from-[#0084ff] to-[#00a6e0]',
      badge: birdFlightHigh > 0 ? `Récord: ${birdFlightHigh}` : 'Arcade',
      badgeColor: 'bg-blue-500/20 text-[#7bd0ff]',
    },
    {
      id: 'catchletters' as const,
      category: 'single',
      title: 'Caza-Cartas',
      subtitle: 'Reflejos & Velocidad',
      description: 'Atrapa los sobres y sellos dorados que caen del cielo antes de que toquen el suelo.',
      icon: <Mail className="w-6 h-6 text-white" />,
      color: 'from-amber-500 to-orange-500',
      badge: catchLettersHigh > 0 ? `Récord: ${catchLettersHigh}` : 'Frenético',
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
    {
      id: 'memory' as const,
      category: 'single',
      title: 'Memoria Mensajera',
      subtitle: 'Parejas & Concentración',
      description: 'Encuentra las 8 parejas de símbolos y cartas en el menor tiempo y movimientos posibles.',
      icon: <Brain className="w-6 h-6 text-white" />,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Relajante',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
    },
    {
      id: 'tictactoe' as const,
      category: 'single',
      title: 'Tres en Raya',
      subtitle: 'Estrategia vs IA o Amigo',
      description: 'Pájaro Azul vs Sobre de Carta. Reta a la IA de PidgeX o juega 1 vs 1 en el mismo dispositivo.',
      icon: <Grid className="w-6 h-6 text-white" />,
      color: 'from-purple-500 to-indigo-600',
      badge: '1 vs 1',
      badgeColor: 'bg-purple-500/20 text-purple-300',
    },
    {
      id: 'memestudio' as const,
      category: 'single',
      title: 'Meme Studio',
      subtitle: 'Creador de Memes',
      description: 'Sube tu propia foto o usa plantillas, añade texto superior e inferior, y compártelo al instante.',
      icon: <ImageIcon className="w-6 h-6 text-white" />,
      color: 'from-pink-600 to-purple-600',
      badge: 'Creativo',
      badgeColor: 'bg-pink-500/20 text-pink-300',
    },
  ];

  return (
    <div className="relative flex flex-col w-full h-full min-h-screen bg-transparent text-[#dfe2ee]">
      {/* 1. Header */}
      <header className="sticky top-0 w-full z-40 bg-[#0a0e16]/85 backdrop-blur-xl border-b border-white/10 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2563eb] to-[#00a6e0] flex items-center justify-center text-white shadow-lg shadow-blue-950/40">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#dfe2ee] tracking-tight">Sala de Espera PidgeX</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Gamepad2 className="w-3 h-3 text-emerald-400" />
                <span>Arcade ({GAMES.length} Juegos)</span>
              </span>
            </div>
            <p className="text-[11px] text-[#8d90a0]">
              Mini juegos individuales y grupales con tutoriales completos
            </p>
          </div>
        </div>

        {onBackToChats && (
          <button
            onClick={onBackToChats}
            className="px-3 py-1.5 rounded-xl bg-[#1c2028] hover:bg-[#262a33] text-xs font-semibold text-[#8d90a0] hover:text-white border border-white/5 transition-colors cursor-pointer"
          >
            Ir a Chats
          </button>
        )}
      </header>

      {/* 2. Main Container */}
      <main className="flex-1 w-full max-w-[640px] mx-auto px-4 pt-3 pb-28 flex flex-col gap-4 overflow-y-auto">
        {activeGame === 'birdflight' && <BirdFlightGame onBack={() => setActiveGame(null)} />}
        {activeGame === 'memory' && <MemoryGame onBack={() => setActiveGame(null)} />}
        {activeGame === 'catchletters' && <CatchLettersGame onBack={() => setActiveGame(null)} />}
        {activeGame === 'tictactoe' && <TicTacToeGame onBack={() => setActiveGame(null)} />}
        {activeGame === 'memestudio' && (
          <MemeStudioGame
            onBack={() => setActiveGame(null)}
            chats={chats}
            user={user}
            isNightMode={isNightMode}
            onSendMemeToChat={onSendMemeToChat}
          />
        )}

        {!activeGame && (
          <>
            {/* Banner Hero */}
            <div className="relative overflow-hidden p-4 rounded-3xl bg-gradient-to-br from-[#121926] via-[#101520] to-[#0b0e14] border border-white/10 shadow-xl">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between relative z-10">
                <div className="flex flex-col gap-1 max-w-[280px]">
                  <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Zona de Entretenimiento & Arcade</span>
                  </div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    ¡Diviértete en la Sala de Espera!
                  </h2>
                  <p className="text-xs text-[#a6aab8] leading-relaxed">
                    Cada mini juego incluye su propio tutorial explicativo con reglas y controles.
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg shrink-0">
                  <BirdLogo className="w-10 h-10" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[#8d90a0]">
                <div className="flex items-center gap-1.5">
                  <Gamepad2 className="w-4 h-4 text-sky-400" />
                  <span>Juegos Disponibles: <strong className="text-white">{GAMES.length} Juegos Arcade</strong></span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Tutoriales incluidos</span>
                </div>
              </div>
            </div>

            {/* Games Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GAMES.map((game) => (
                <div
                  key={game.id}
                  onClick={() => setActiveGame(game.id as MiniGameId)}
                  className="group relative overflow-hidden rounded-2xl bg-[#141822] hover:bg-[#1a202c] border border-white/10 hover:border-blue-500/40 p-4 shadow-lg transition-all cursor-pointer flex flex-col justify-between gap-3 active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${game.color} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                        {game.icon}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                          {game.title}
                        </h3>
                        <span className="text-[11px] text-[#8d90a0]">{game.subtitle}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${game.badgeColor}`}>
                      {game.badge}
                    </span>
                  </div>

                  <p className="text-xs text-[#a6aab8] leading-relaxed line-clamp-2">
                    {game.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                    {/* Botón Tutorial Directo */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTutorialGameId(game.id);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[#dfe2ee] text-[11px] font-bold border border-white/10 transition-colors cursor-pointer"
                      title="Ver tutorial de este juego"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                      <span>Tutorial</span>
                    </button>

                    {/* Jugar ahora */}
                    <span className="flex items-center gap-1 text-blue-400 font-bold group-hover:translate-x-1 transition-transform">
                      <span>Jugar ahora</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Mini Game Tutorial Modal */}
      <GameTutorialModal
        gameId={tutorialGameId}
        isOpen={Boolean(tutorialGameId)}
        onClose={() => setTutorialGameId(null)}
        isNightMode={isNightMode}
      />
    </div>
  );
};
