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
} from 'lucide-react';
import { BirdFlightGame } from './BirdFlightGame';
import { MemoryGame } from './MemoryGame';
import { CatchLettersGame } from './CatchLettersGame';
import { TicTacToeGame } from './TicTacToeGame';
import { GrandAdventureGame } from './GrandAdventureGame';
import { BirdLogo } from '../BirdLogo';

export type MiniGameId = 'birdflight' | 'memory' | 'catchletters' | 'tictactoe' | 'gac' | null;

interface WaitingRoomViewProps {
  onBackToChats?: () => void;
}

export const WaitingRoomView: React.FC<WaitingRoomViewProps> = ({ onBackToChats }) => {
  const [activeGame, setActiveGame] = useState<MiniGameId>(null);

  // High score trackers from localStorage
  const birdFlightHigh = parseInt(localStorage.getItem('birdflight_highscore') || '0', 10);
  const catchLettersHigh = parseInt(localStorage.getItem('catchletters_highscore') || '0', 10);
  const gacHigh = parseInt(localStorage.getItem('gac_highscore') || '0', 10);

  const GAMES = [
    {
      id: 'gac' as const,
      title: 'Grand Adventure in the City',
      subtitle: 'G.A.C • Acción & Conducción',
      description: 'Conduce por las calles de la ciudad, escapa de la policía y recolecta efectivo al estilo clásico GTA.',
      icon: '🚗',
      color: 'from-red-600 to-orange-500',
      badge: gacHigh > 0 ? `Récord: ${gacHigh}` : 'Nuevo 💥',
      badgeColor: 'bg-red-500/20 text-red-300',
    },
    {
      id: 'birdflight' as const,
      title: 'Pájaro Mensajero',
      subtitle: 'Vuelo & Obstáculos',
      description: 'Guía al pájaro azul a través de las nubes y entrega tantas cartas como puedas.',
      icon: '🕊️',
      color: 'from-[#0084ff] to-[#00a6e0]',
      badge: birdFlightHigh > 0 ? `Récord: ${birdFlightHigh}` : 'Popular',
      badgeColor: 'bg-blue-500/20 text-[#7bd0ff]',
    },
    {
      id: 'catchletters' as const,
      title: 'Caza-Cartas',
      subtitle: 'Reflejos & Velocidad',
      description: 'Atrapa los sobres y sellos dorados que caen del cielo antes de que toquen el suelo.',
      icon: '📬',
      color: 'from-amber-500 to-orange-500',
      badge: catchLettersHigh > 0 ? `Récord: ${catchLettersHigh}` : 'Frenético',
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
    {
      id: 'memory' as const,
      title: 'Memoria Mensajera',
      subtitle: 'Parejas & Concentración',
      description: 'Encuentra las 8 parejas de símbolos y cartas en el menor tiempo y movimientos posibles.',
      icon: '🧠',
      color: 'from-emerald-500 to-teal-600',
      badge: 'Relajante',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
    },
    {
      id: 'tictactoe' as const,
      title: 'Tres en Raya',
      subtitle: 'Estrategia vs IA o Amigo',
      description: 'Pájaro Azul vs Sobre de Carta. Reta a la inteligencia artificial o juega con un amigo.',
      icon: '⭕',
      color: 'from-purple-500 to-indigo-600',
      badge: '1 vs 1',
      badgeColor: 'bg-purple-500/20 text-purple-300',
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
              <h1 className="text-base font-bold text-[#dfe2ee] tracking-tight">Sala De Espera</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                Mini Juegos
              </span>
            </div>
            <p className="text-[11px] text-[#8d90a0]">
              Diviértete mientras esperas las respuestas de tus amigos
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
        {activeGame === 'gac' && <GrandAdventureGame onBack={() => setActiveGame(null)} />}

        {!activeGame && (
          <>
            {/* Banner Hero */}
            <div className="relative overflow-hidden p-4 rounded-3xl bg-gradient-to-br from-[#121926] via-[#101520] to-[#0b0e14] border border-white/10 shadow-xl">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between relative z-10">
                <div className="flex flex-col gap-1 max-w-[280px]">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Zona Arcade MessengerPidgeon</span>
                  </div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    ¿Esperando un mensaje?
                  </h2>
                  <p className="text-xs text-[#a6aab8] leading-relaxed">
                    Pasa el tiempo superando tus récords en 4 entretenidos mini juegos rápidos sin salir de la app.
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg shrink-0">
                  <BirdLogo className="w-10 h-10" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[#8d90a0]">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Récord Pájaro: <strong className="text-white">{birdFlightHigh} pts</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Récord Cartas: <strong className="text-white">{catchLettersHigh} pts</strong></span>
                </div>
              </div>
            </div>

            {/* List of Game Cards */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#8d90a0] uppercase tracking-wider">
                  Elige un Mini Juego
                </span>
                <span className="text-[11px] text-[#7bd0ff] font-medium">5 Disponibles (¡Nuevo G.A.C!)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GAMES.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => setActiveGame(game.id)}
                    className="group relative flex flex-col justify-between p-4 rounded-3xl bg-[#141822]/90 hover:bg-[#191f2c] border border-white/10 hover:border-[#0084ff]/40 shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer active:scale-98"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${game.color} flex items-center justify-center text-2xl shadow-lg shadow-black/30 group-hover:scale-105 transition-transform`}
                        >
                          {game.icon}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/5 ${game.badgeColor}`}
                        >
                          {game.badge}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-[#7bd0ff] transition-colors mb-0.5">
                        {game.title}
                      </h3>
                      <span className="text-[11px] font-semibold text-[#8d90a0] block mb-2">
                        {game.subtitle}
                      </span>
                      <p className="text-xs text-[#a6aab8] leading-relaxed line-clamp-2">
                        {game.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#7bd0ff] group-hover:underline flex items-center gap-1">
                        <Play className="w-3 h-3 fill-[#7bd0ff]" />
                        <span>Jugar Ahora</span>
                      </span>
                      <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-[#0084ff] text-white flex items-center justify-center transition-colors">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
