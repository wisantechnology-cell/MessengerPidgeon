import React, { useState, useEffect } from 'react';
import { RotateCcw, ArrowLeft, Volume2, VolumeX, Bot, Users } from 'lucide-react';
import { playSound } from '../../utils/gameAudio';

interface TicTacToeGameProps {
  onBack: () => void;
}

type Player = 'X' | 'O'; // X = Bird 🕊️, O = Letter ✉️
type Board = (Player | null)[];

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({ onBack }) => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [mode, setMode] = useState<'ai' | 'pvp'>('ai');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [scores, setScores] = useState({ x: 0, o: 0, draws: 0 });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const calculateWinner = (squares: Board): { winner: Player | 'draw' | null; line: number[] | null } => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }

    if (squares.every((sq) => sq !== null)) {
      return { winner: 'draw', line: null };
    }

    return { winner: null, line: null };
  };

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    if (soundEnabled) playSound('click');

    const nextBoard = [...board];
    nextBoard[index] = isXNext ? 'X' : 'O';
    setBoard(nextBoard);

    const result = calculateWinner(nextBoard);
    if (result.winner) {
      handleGameEnd(result.winner, result.line);
    } else {
      setIsXNext(!isXNext);
    }
  };

  const handleGameEnd = (gameWinner: Player | 'draw', line: number[] | null) => {
    setWinner(gameWinner);
    setWinningLine(line);

    if (gameWinner === 'draw') {
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
      if (soundEnabled) playSound('match');
    } else {
      if (gameWinner === 'X') {
        setScores((s) => ({ ...s, x: s.x + 1 }));
        if (soundEnabled) playSound('win');
      } else {
        setScores((s) => ({ ...s, o: s.o + 1 }));
        if (soundEnabled) playSound(mode === 'ai' ? 'loss' : 'win');
      }
    }
  };

  // AI Turn
  useEffect(() => {
    if (mode === 'ai' && !isXNext && !winner) {
      const timer = setTimeout(() => {
        // Smart AI Move
        const emptyIndices: number[] = [];
        board.forEach((val, idx) => {
          if (!val) emptyIndices.push(idx);
        });

        if (emptyIndices.length === 0) return;

        // 1. Can AI win in 1 move?
        for (const idx of emptyIndices) {
          const testBoard = [...board];
          testBoard[idx] = 'O';
          if (calculateWinner(testBoard).winner === 'O') {
            makeAiMove(idx);
            return;
          }
        }

        // 2. Can Player win in 1 move? Block it!
        for (const idx of emptyIndices) {
          const testBoard = [...board];
          testBoard[idx] = 'X';
          if (calculateWinner(testBoard).winner === 'X') {
            makeAiMove(idx);
            return;
          }
        }

        // 3. Take center if available
        if (emptyIndices.includes(4)) {
          makeAiMove(4);
          return;
        }

        // 4. Random move
        const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        makeAiMove(randomIdx);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isXNext, mode, winner, board]);

  const makeAiMove = (index: number) => {
    if (soundEnabled) playSound('click');
    const nextBoard = [...board];
    nextBoard[index] = 'O';
    setBoard(nextBoard);

    const result = calculateWinner(nextBoard);
    if (result.winner) {
      handleGameEnd(result.winner, result.line);
    } else {
      setIsXNext(true);
    }
  };

  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 select-none">
      {/* Header controls */}
      <div className="flex items-center justify-between w-full mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-[#8d90a0] hover:text-white px-2.5 py-1.5 rounded-xl bg-[#1c2028] border border-white/5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Mode Switch */}
          <div className="flex bg-[#141822] p-0.5 rounded-xl border border-white/5">
            <button
              onClick={() => {
                setMode('ai');
                resetBoard();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mode === 'ai' ? 'bg-[#0084ff] text-white' : 'text-[#8d90a0] hover:text-white'
              }`}
            >
              <Bot className="w-3 h-3" />
              <span>vs IA</span>
            </button>
            <button
              onClick={() => {
                setMode('pvp');
                resetBoard();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mode === 'pvp' ? 'bg-[#0084ff] text-white' : 'text-[#8d90a0] hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>2 Jugadores</span>
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-8 h-8 rounded-full bg-[#1c2028] text-[#8d90a0] hover:text-white flex items-center justify-center border border-white/5 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#7bd0ff]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 gap-2 w-full mb-4">
        <div
          className={`flex flex-col items-center p-2.5 rounded-2xl border transition-all ${
            isXNext && !winner
              ? 'bg-[#0084ff]/20 border-[#0084ff]/60 ring-2 ring-[#0084ff]/40'
              : 'bg-[#141822] border-white/5'
          }`}
        >
          <span className="text-[10px] font-bold text-[#7bd0ff] uppercase flex items-center gap-1">
            🕊️ Pájaro Azul (Tú)
          </span>
          <span className="text-xl font-black text-white">{scores.x}</span>
        </div>

        <div className="flex flex-col items-center bg-[#141822] p-2.5 rounded-2xl border border-white/5">
          <span className="text-[10px] font-bold text-[#8d90a0] uppercase">Empates</span>
          <span className="text-xl font-black text-[#8d90a0]">{scores.draws}</span>
        </div>

        <div
          className={`flex flex-col items-center p-2.5 rounded-2xl border transition-all ${
            !isXNext && !winner
              ? 'bg-amber-500/20 border-amber-500/60 ring-2 ring-amber-500/40'
              : 'bg-[#141822] border-white/5'
          }`}
        >
          <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
            ✉️ Carta ({mode === 'ai' ? 'IA' : 'J2'})
          </span>
          <span className="text-xl font-black text-white">{scores.o}</span>
        </div>
      </div>

      {/* 3x3 Board */}
      <div className="relative w-full aspect-square bg-[#0c1017] p-3 rounded-3xl border border-white/10 shadow-2xl">
        <div className="grid grid-cols-3 grid-rows-3 gap-2.5 w-full h-full">
          {board.map((cell, idx) => {
            const isWinningCell = winningLine?.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleClick(idx)}
                disabled={Boolean(cell || winner || (mode === 'ai' && !isXNext))}
                className={`relative rounded-2xl flex items-center justify-center font-bold transition-all duration-200 cursor-pointer ${
                  isWinningCell
                    ? 'bg-emerald-500/30 border-2 border-emerald-400 text-white scale-98 ring-4 ring-emerald-500/30'
                    : cell
                    ? 'bg-[#181d28] border border-white/10'
                    : 'bg-[#141822] hover:bg-[#1f2533] border border-white/5 active:scale-95'
                }`}
              >
                {cell === 'X' && (
                  <span className="text-4xl sm:text-5xl animate-in zoom-in-50 duration-150 drop-shadow-md">
                    🕊️
                  </span>
                )}
                {cell === 'O' && (
                  <span className="text-4xl sm:text-5xl animate-in zoom-in-50 duration-150 drop-shadow-md">
                    ✉️
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Winner / Draw Result Banner Overlay */}
        {winner && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            {winner === 'draw' ? (
              <>
                <span className="text-4xl mb-2">🤝</span>
                <h3 className="text-xl font-black text-white mb-1">¡Partida Empatada!</h3>
                <p className="text-xs text-[#8d90a0] mb-4">Ningún jugador cedió terreno en esta ronda.</p>
              </>
            ) : winner === 'X' ? (
              <>
                <span className="text-4xl mb-2 animate-bounce">🏆</span>
                <h3 className="text-xl font-black text-[#7bd0ff] mb-1">¡Ganó el Pájaro Azul!</h3>
                <p className="text-xs text-[#8d90a0] mb-4">¡Excelente estrategia y reflejos!</p>
              </>
            ) : (
              <>
                <span className="text-4xl mb-2">✉️</span>
                <h3 className="text-xl font-black text-amber-300 mb-1">
                  ¡Ganó {mode === 'ai' ? 'la IA' : 'el Jugador 2'}!
                </h3>
                <p className="text-xs text-[#8d90a0] mb-4">¡Revancha inmediata disponible!</p>
              </>
            )}

            <button
              onClick={resetBoard}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0084ff] to-[#00a6e0] text-white font-bold text-sm shadow-lg shadow-blue-500/30 active:scale-95 transition-transform cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jugar Otra Partida</span>
            </button>
          </div>
        )}
      </div>

      <button
        onClick={resetBoard}
        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1c2028] hover:bg-[#262a33] text-xs font-semibold text-[#8d90a0] hover:text-white border border-white/5 transition-colors cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Limpiar Tablero</span>
      </button>
    </div>
  );
};
