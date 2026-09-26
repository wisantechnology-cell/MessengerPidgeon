import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, ArrowLeft, Volume2, VolumeX, Heart } from 'lucide-react';
import { playSound } from '../../utils/gameAudio';

interface CatchLettersGameProps {
  onBack: () => void;
}

interface FallingItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  type: 'letter' | 'gold' | 'storm';
  radius: number;
}

export const CatchLettersGame: React.FC<CatchLettersGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('catchletters_highscore') || '0', 10);
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const gameRef = useRef({
    playerX: 180,
    playerWidth: 64,
    items: [] as FallingItem[],
    spawnTimer: 0,
    score: 0,
    lives: 3,
    frame: 0,
    speedMultiplier: 1,
    animationFrameId: 0,
    itemIdCounter: 0,
  });

  const startGame = () => {
    const g = gameRef.current;
    g.playerX = 180;
    g.items = [];
    g.spawnTimer = 0;
    g.score = 0;
    g.lives = 3;
    g.frame = 0;
    g.speedMultiplier = 1;
    setScore(0);
    setLives(3);
    setGameState('playing');
  };

  const handlePointerMove = (clientX: number) => {
    if (gameState !== 'playing' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const relativeX = ((clientX - rect.left) / rect.width) * canvasRef.current.width;
    const clampedX = Math.max(36, Math.min(canvasRef.current.width - 36, relativeX));
    gameRef.current.playerX = clampedX;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      const step = 24;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        gameRef.current.playerX = Math.max(36, gameRef.current.playerX - step);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        gameRef.current.playerX = Math.min(360 - 36, gameRef.current.playerX + step);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const g = gameRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Draw dynamic starry background
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#060d17');
      grad.addColorStop(1, '#0e243d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Star particles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < 20; i++) {
        const sx = (i * 37 + g.frame * 0.1) % width;
        const sy = (i * 53) % height;
        ctx.fillRect(sx, sy, 2, 2);
      }

      if (gameState === 'playing') {
        g.frame++;
        g.spawnTimer++;
        g.speedMultiplier = 1 + Math.min(1.5, g.score * 0.03);

        // Spawn items
        const spawnThreshold = Math.max(28, 55 - Math.floor(g.score / 4));
        if (g.spawnTimer > spawnThreshold) {
          g.spawnTimer = 0;
          const roll = Math.random();
          let type: 'letter' | 'gold' | 'storm' = 'letter';
          if (roll > 0.82) type = 'gold';
          else if (roll > 0.6) type = 'storm';

          const randomX = Math.floor(Math.random() * (width - 60)) + 30;
          const baseSpeed = type === 'gold' ? 3.5 : type === 'storm' ? 3.0 : 2.5;

          g.items.push({
            id: g.itemIdCounter++,
            x: randomX,
            y: -20,
            speed: baseSpeed * g.speedMultiplier,
            type,
            radius: type === 'gold' ? 16 : 14,
          });
        }

        // Update and draw falling items
        const playerY = height - 45;
        const playerHalfW = g.playerWidth / 2;

        for (let i = g.items.length - 1; i >= 0; i--) {
          const item = g.items[i];
          item.y += item.speed;

          // Check Catch by player basket/bird
          if (
            item.y >= playerY - 14 &&
            item.y <= playerY + 16 &&
            item.x >= g.playerX - playerHalfW &&
            item.x <= g.playerX + playerHalfW
          ) {
            // Collision with player!
            if (item.type === 'letter') {
              g.score += 1;
              setScore(g.score);
              if (soundEnabled) playSound('score');
            } else if (item.type === 'gold') {
              g.score += 5;
              setScore(g.score);
              if (soundEnabled) playSound('match');
            } else if (item.type === 'storm') {
              g.lives -= 1;
              setLives(g.lives);
              if (soundEnabled) playSound('hit');
              if (g.lives <= 0) {
                endGame();
              }
            }
            g.items.splice(i, 1);
            continue;
          }

          // Check if missed regular letter
          if (item.y > height + 20) {
            if (item.type === 'letter') {
              // Missed a standard letter -> lose a life
              g.lives -= 1;
              setLives(g.lives);
              if (soundEnabled) playSound('hit');
              if (g.lives <= 0) {
                endGame();
              }
            }
            g.items.splice(i, 1);
            continue;
          }

          // Draw item
          ctx.save();
          ctx.translate(item.x, item.y);

          if (item.type === 'letter') {
            // White envelope
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 1.5;
            ctx.fillRect(-12, -8, 24, 16);
            ctx.strokeRect(-12, -8, 24, 16);
            ctx.beginPath();
            ctx.moveTo(-12, -8);
            ctx.lineTo(0, 1);
            ctx.lineTo(12, -8);
            ctx.stroke();
          } else if (item.type === 'gold') {
            // Golden message
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#fef08a';
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 2;
            ctx.fillRect(-13, -9, 26, 18);
            ctx.strokeRect(-13, -9, 26, 18);
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else if (item.type === 'storm') {
            // Storm cloud with thunderbolt
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(-6, 0, 8, 0, Math.PI * 2);
            ctx.arc(6, 0, 8, 0, Math.PI * 2);
            ctx.arc(0, -6, 10, 0, Math.PI * 2);
            ctx.fill();
            // Yellow thunder
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(4, 7);
            ctx.lineTo(0, 7);
            ctx.lineTo(2, 14);
            ctx.lineTo(-4, 6);
            ctx.lineTo(0, 6);
            ctx.closePath();
            ctx.fill();
          }

          ctx.restore();
        }
      }

      // Draw Player Catcher (White/Blue Delivery Nest / Bird)
      const px = g.playerX;
      const py = height - 45;

      ctx.save();
      ctx.translate(px, py);

      // Glow shadow
      ctx.shadowColor = '#00a6e0';
      ctx.shadowBlur = 12;

      // Outer White Saucer/Basket
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 4, 30, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Blue Rim
      ctx.strokeStyle = '#0084ff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Mini Blue Bird inside catcher
      ctx.fillStyle = '#0091ff';
      ctx.beginPath();
      ctx.arc(0, -6, 10, 0, Math.PI * 2);
      ctx.fill();
      // Wing
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(-3, -6, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(5, -8);
      ctx.lineTo(10, -5);
      ctx.lineTo(5, -3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Bottom Bar Ground
      ctx.fillStyle = '#09111c';
      ctx.fillRect(0, height - 16, width, 16);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, height - 16, width, 2);

      g.animationFrameId = requestAnimationFrame(render);
    };

    const endGame = () => {
      const g = gameRef.current;
      setGameState('gameover');
      if (soundEnabled) playSound('loss');
      if (g.score > highScore) {
        setHighScore(g.score);
        localStorage.setItem('catchletters_highscore', g.score.toString());
      }
    };

    render();

    return () => {
      isRunning = false;
      cancelAnimationFrame(gameRef.current.animationFrameId);
    };
  }, [gameState, highScore, soundEnabled]);

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
          {/* Lives Indicator */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
            {[1, 2, 3].map((heart) => (
              <Heart
                key={heart}
                className={`w-3.5 h-3.5 transition-all ${
                  heart <= lives
                    ? 'text-rose-500 fill-rose-500 scale-100'
                    : 'text-white/20 fill-transparent scale-75'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{highScore}</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-8 h-8 rounded-full bg-[#1c2028] text-[#8d90a0] hover:text-white flex items-center justify-center border border-white/5 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#7bd0ff]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Canvas Game Stage */}
      <div
        onMouseMove={(e) => handlePointerMove(e.clientX)}
        onTouchMove={(e) => {
          if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
        }}
        className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl bg-black cursor-crosshair touch-none"
      >
        <canvas
          ref={canvasRef}
          width={360}
          height={450}
          className="w-full h-full block"
        />

        {/* Live Score Overlay */}
        {gameState === 'playing' && (
          <div className="absolute top-4 left-4 pointer-events-none">
            <div className="px-3.5 py-1 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white font-extrabold text-xl shadow-lg">
              ✉️ {score}
            </div>
          </div>
        )}

        {/* Idle Start Overlay */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center shadow-xl shadow-amber-500/30 mb-3 animate-pulse">
              <span className="text-3xl">📬</span>
            </div>
            <h3 className="text-xl font-black text-white mb-1">Caza-Cartas</h3>
            <p className="text-xs text-[#94a3b8] mb-5 max-w-[240px]">
              Mueve el nido para atrapar las cartas que caen y sobres dorados. ¡Cuidado con las nubes de tormenta!
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/30 active:scale-95 transition-transform cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>¡Comenzar a Cazar!</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <span className="text-4xl mb-2">⚡</span>
            <h3 className="text-xl font-black text-white mb-1">¡Juego Terminado!</h3>
            <div className="flex items-center gap-4 my-4 bg-[#141822]/80 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-[#8d90a0]">Cartas Atrapadas</span>
                <span className="text-2xl font-black text-amber-300">{score}</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-amber-400">Récord</span>
                <span className="text-2xl font-black text-white">{highScore}</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/30 active:scale-95 transition-transform cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Intentar de Nuevo</span>
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-[#8d90a0] mt-3 text-center">
        Desliza el dedo o usa las flechas del teclado <kbd className="px-1 py-0.5 bg-[#1c2028] rounded text-white text-[10px]">◀</kbd> <kbd className="px-1 py-0.5 bg-[#1c2028] rounded text-white text-[10px]">▶</kbd> para moverte.
      </p>
    </div>
  );
};
