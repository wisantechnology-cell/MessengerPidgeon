import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Timer, ArrowLeft, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { playSound } from '../../utils/gameAudio';

interface MemoryGameProps {
  onBack: () => void;
}

interface CardItem {
  id: number;
  emoji: string;
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ICONS = [
  { emoji: '🕊️', name: 'Pájaro Azul' },
  { emoji: '✉️', name: 'Sobre Carta' },
  { emoji: '💙', name: 'Corazón' },
  { emoji: '🚀', name: 'Cohete' },
  { emoji: '⭐', name: 'Estrella' },
  { emoji: '🔔', name: 'Campana' },
  { emoji: '🎧', name: 'Audio' },
  { emoji: '📸', name: 'Cámara' },
];

export const MemoryGame: React.FC<MemoryGameProps> = ({ onBack }) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Initialize and shuffle deck
  const initGame = () => {
    const deck: CardItem[] = [];
    let id = 0;
    // 8 pairs = 16 cards (4x4)
    ICONS.forEach((item) => {
      deck.push({ id: id++, emoji: item.emoji, name: item.name, isFlipped: false, isMatched: false });
      deck.push({ id: id++, emoji: item.emoji, name: item.name, isFlipped: false, isMatched: false });
    });

    // Shuffle
    const shuffled = deck.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatchedPairs(0);
    setIsWon(false);
    setSeconds(0);
    setIsRunning(true);
  };

  useEffect(() => {
    initGame();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && !isWon) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isWon]);

  const handleCardClick = (index: number) => {
    if (!isRunning || isWon) return;
    if (flippedCards.length >= 2) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    if (soundEnabled) playSound('click');

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;

      if (cards[firstIdx].emoji === cards[secondIdx].emoji) {
        // Match found!
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[firstIdx].isMatched = true;
          matchedCards[secondIdx].isMatched = true;
          setCards(matchedCards);
          setFlippedCards([]);
          const nextMatched = matchedPairs + 1;
          setMatchedPairs(nextMatched);

          if (soundEnabled) playSound('match');

          if (nextMatched === ICONS.length) {
            setIsWon(true);
            setIsRunning(false);
            if (soundEnabled) playSound('win');
          }
        }, 350);
      } else {
        // No match, flip back
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[firstIdx].isFlipped = false;
          resetCards[secondIdx].isFlipped = false;
          setCards(resetCards);
          setFlippedCards([]);
        }, 900);
      }
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
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
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-8 h-8 rounded-full bg-[#1c2028] text-[#8d90a0] hover:text-white flex items-center justify-center border border-white/5 cursor-pointer"
            title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#7bd0ff]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={initGame}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0084ff]/20 text-[#7bd0ff] hover:bg-[#0084ff]/30 text-xs font-bold border border-[#0084ff]/30 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 w-full mb-4">
        <div className="flex flex-col items-center bg-[#141822] p-2.5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-1 text-[#8d90a0] text-[10px] font-bold uppercase">
            <Timer className="w-3 h-3 text-[#38bdf8]" />
            <span>Tiempo</span>
          </div>
          <span className="text-base font-black text-white">{formatTime(seconds)}</span>
        </div>

        <div className="flex flex-col items-center bg-[#141822] p-2.5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-1 text-[#8d90a0] text-[10px] font-bold uppercase">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Movimientos</span>
          </div>
          <span className="text-base font-black text-amber-300">{moves}</span>
        </div>

        <div className="flex flex-col items-center bg-[#141822] p-2.5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-1 text-[#8d90a0] text-[10px] font-bold uppercase">
            <Trophy className="w-3 h-3 text-emerald-400" />
            <span>Parejas</span>
          </div>
          <span className="text-base font-black text-emerald-400">
            {matchedPairs}/{ICONS.length}
          </span>
        </div>
      </div>

      {/* Cards 4x4 Grid */}
      <div className="relative w-full aspect-square bg-[#0c1017] p-3 rounded-3xl border border-white/10 shadow-2xl">
        <div className="grid grid-cols-4 grid-rows-4 gap-2.5 w-full h-full">
          {cards.map((card, idx) => {
            const isShown = card.isFlipped || card.isMatched;
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                disabled={card.isMatched || isWon}
                className={`relative rounded-2xl flex items-center justify-center font-bold transition-all duration-300 transform perspective-1000 cursor-pointer ${
                  card.isMatched
                    ? 'bg-emerald-500/20 border-2 border-emerald-400/60 text-white scale-95 opacity-85'
                    : isShown
                    ? 'bg-white text-black shadow-lg shadow-blue-500/30 ring-2 ring-[#0084ff]'
                    : 'bg-[#181d28] hover:bg-[#202636] border border-white/10 active:scale-95 shadow-md'
                }`}
              >
                {isShown ? (
                  <span className="text-2xl sm:text-3xl animate-in zoom-in-75 duration-150">
                    {card.emoji}
                  </span>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#0084ff]/20 border border-[#0084ff]/40 flex items-center justify-center text-[#7bd0ff] text-[11px] font-bold">
                    ?
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Win Modal Overlay */}
        {isWon && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <span className="text-4xl mb-2 animate-bounce">🎉</span>
            <h3 className="text-xl font-black text-white mb-1">¡Memoria Prodigiosa!</h3>
            <p className="text-xs text-[#a6aab8] mb-4">
              Completaste todas las parejas en <strong className="text-white">{formatTime(seconds)}</strong> y{' '}
              <strong className="text-amber-300">{moves} movimientos</strong>.
            </p>

            <button
              onClick={initGame}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jugar Otra Ronda</span>
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-[#8d90a0] mt-3 text-center">
        Encuentra todas las 8 parejas de mensajes en el menor tiempo posible.
      </p>
    </div>
  );
};
