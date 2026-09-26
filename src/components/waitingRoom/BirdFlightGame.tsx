import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { playSound } from '../../utils/gameAudio';

interface BirdFlightGameProps {
  onBack: () => void;
}

export const BirdFlightGame: React.FC<BirdFlightGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('birdflight_highscore') || '0', 10);
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Game internal state ref to avoid closure issues in requestAnimationFrame
  const gameRef = useRef({
    birdY: 180,
    birdVelocity: 0,
    gravity: 0.38,
    jumpStrength: -6.5,
    pipes: [] as Array<{ x: number; topH: number; bottomY: number; passed: boolean }>,
    letters: [] as Array<{ x: number; y: number; collected: boolean }>,
    pipeSpawnTimer: 0,
    letterSpawnTimer: 0,
    frame: 0,
    score: 0,
    animationFrameId: 0,
  });

  const jump = () => {
    if (gameState === 'idle') {
      startGame();
      return;
    }
    if (gameState === 'gameover') {
      startGame();
      return;
    }
    if (gameState === 'playing') {
      gameRef.current.birdVelocity = gameRef.current.jumpStrength;
      if (soundEnabled) playSound('jump');
    }
  };

  const startGame = () => {
    const g = gameRef.current;
    g.birdY = 160;
    g.birdVelocity = 0;
    g.pipes = [];
    g.letters = [];
    g.pipeSpawnTimer = 0;
    g.letterSpawnTimer = 0;
    g.frame = 0;
    g.score = 0;
    setScore(0);
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, soundEnabled]);

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

      // 1. Clear background & draw sky gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0a192f');
      bgGrad.addColorStop(0.5, '#0f274a');
      bgGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.arc(80 + (g.frame * 0.2) % (width + 100) - 50, 60, 24, 0, Math.PI * 2);
      ctx.arc(110 + (g.frame * 0.2) % (width + 100) - 50, 50, 32, 0, Math.PI * 2);
      ctx.arc(140 + (g.frame * 0.2) % (width + 100) - 50, 60, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(260 + (g.frame * 0.3) % (width + 100) - 50, 110, 28, 0, Math.PI * 2);
      ctx.arc(295 + (g.frame * 0.3) % (width + 100) - 50, 95, 36, 0, Math.PI * 2);
      ctx.arc(330 + (g.frame * 0.3) % (width + 100) - 50, 110, 26, 0, Math.PI * 2);
      ctx.fill();

      if (gameState === 'playing') {
        g.frame++;

        // Update bird physics
        g.birdVelocity += g.gravity;
        g.birdY += g.birdVelocity;

        // Ground & ceiling collision
        if (g.birdY > height - 35 || g.birdY < 10) {
          endGame();
        }

        // Spawn pipes
        g.pipeSpawnTimer++;
        if (g.pipeSpawnTimer > 95) {
          g.pipeSpawnTimer = 0;
          const pipeGap = 120;
          const minPipeH = 40;
          const maxPipeH = height - pipeGap - minPipeH - 40;
          const topH = Math.floor(Math.random() * (maxPipeH - minPipeH + 1)) + minPipeH;
          const bottomY = topH + pipeGap;

          g.pipes.push({
            x: width + 20,
            topH,
            bottomY,
            passed: false,
          });

          // Chance to spawn a letter envelope in the gap
          if (Math.random() > 0.3) {
            g.letters.push({
              x: width + 40,
              y: topH + pipeGap / 2,
              collected: false,
            });
          }
        }

        // Update and draw pipes
        for (let i = g.pipes.length - 1; i >= 0; i--) {
          const pipe = g.pipes[i];
          pipe.x -= 2.2;

          // Check if bird passed pipe
          if (!pipe.passed && pipe.x + 46 < 80) {
            pipe.passed = true;
            g.score += 1;
            setScore(g.score);
            if (soundEnabled) playSound('score');
          }

          // Draw Top Pipe (Pillar / Cloud column)
          const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + 46, 0);
          pipeGrad.addColorStop(0, '#1e293b');
          pipeGrad.addColorStop(0.5, '#334155');
          pipeGrad.addColorStop(1, '#0f172a');
          ctx.fillStyle = pipeGrad;

          // Top pipe body
          ctx.fillRect(pipe.x, 0, 46, pipe.topH);
          // Top pipe cap
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(pipe.x - 3, pipe.topH - 12, 52, 12);

          // Bottom pipe body
          ctx.fillStyle = pipeGrad;
          ctx.fillRect(pipe.x, pipe.bottomY, 46, height - pipe.bottomY);
          // Bottom pipe cap
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(pipe.x - 3, pipe.bottomY, 52, 12);

          // Collision detection with bird (circle radius 14 at x=80, y=birdY)
          const birdBox = { x: 70, y: g.birdY - 12, w: 24, h: 24 };
          // Top rect: (pipe.x, 0, 46, pipe.topH)
          if (
            birdBox.x + birdBox.w > pipe.x &&
            birdBox.x < pipe.x + 46 &&
            birdBox.y < pipe.topH
          ) {
            endGame();
          }
          // Bottom rect: (pipe.x, pipe.bottomY, 46, height - pipe.bottomY)
          if (
            birdBox.x + birdBox.w > pipe.x &&
            birdBox.x < pipe.x + 46 &&
            birdBox.y + birdBox.h > pipe.bottomY
          ) {
            endGame();
          }

          // Remove offscreen pipes
          if (pipe.x < -60) {
            g.pipes.splice(i, 1);
          }
        }

        // Update and draw collectible letters
        for (let i = g.letters.length - 1; i >= 0; i--) {
          const letter = g.letters[i];
          letter.x -= 2.2;

          if (!letter.collected) {
            // Check collision with bird
            const dist = Math.hypot(letter.x - 80, letter.y - g.birdY);
            if (dist < 28) {
              letter.collected = true;
              g.score += 5; // Bonus for catching letters!
              setScore(g.score);
              if (soundEnabled) playSound('match');
            }

            // Draw floating letter envelope
            ctx.save();
            ctx.translate(letter.x, letter.y + Math.sin(g.frame * 0.1) * 3);
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 1.5;
            ctx.fillRect(-10, -7, 20, 14);
            ctx.strokeRect(-10, -7, 20, 14);
            ctx.beginPath();
            ctx.moveTo(-10, -7);
            ctx.lineTo(0, 1);
            ctx.lineTo(10, -7);
            ctx.stroke();
            // Tiny blue stamp
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(4, -5, 4, 4);
            ctx.restore();
          }

          if (letter.x < -40) {
            g.letters.splice(i, 1);
          }
        }
      }

      // Draw Ground
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, height - 30, width, 30);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, height - 30, width, 3);

      // Draw Bird (Blue Messenger Bird with White Badge & Letter)
      const birdX = 80;
      const birdY = g.birdY;
      const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, g.birdVelocity * 0.08));

      ctx.save();
      ctx.translate(birdX, birdY);
      ctx.rotate(rotation);

      // Outer White Circle Badge
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#dbeafe';
      ctx.stroke();

      // Bird Blue Body
      ctx.fillStyle = '#0084ff';
      ctx.beginPath();
      ctx.arc(-2, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // Wing (flaps when jumping)
      const wingYOffset = gameState === 'playing' && g.birdVelocity < 0 ? -4 : 1;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(-4, wingYOffset, 7, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(7, -2);
      ctx.lineTo(13, 1);
      ctx.lineTo(7, 4);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#003366';
      ctx.beginPath();
      ctx.arc(4.8, -2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Carried Letter in foot
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.fillRect(1, 6, 9, 6);
      ctx.strokeRect(1, 6, 9, 6);

      ctx.restore();

      // Loop
      g.animationFrameId = requestAnimationFrame(render);
    };

    const endGame = () => {
      const g = gameRef.current;
      setGameState('gameover');
      if (soundEnabled) playSound('loss');
      if (g.score > highScore) {
        setHighScore(g.score);
        localStorage.setItem('birdflight_highscore', g.score.toString());
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
      {/* Top Controls & Back */}
      <div className="flex items-center justify-between w-full mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-[#8d90a0] hover:text-white px-2.5 py-1.5 rounded-xl bg-[#1c2028] border border-white/5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Récord: {highScore}</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-8 h-8 rounded-full bg-[#1c2028] text-[#8d90a0] hover:text-white flex items-center justify-center border border-white/5 cursor-pointer"
            title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#7bd0ff]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Canvas Game Stage */}
      <div
        onClick={jump}
        className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl bg-black cursor-pointer group"
      >
        <canvas
          ref={canvasRef}
          width={360}
          height={450}
          className="w-full h-full block"
        />

        {/* Live Score Overlay */}
        {gameState === 'playing' && (
          <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
            <div className="px-4 py-1.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 text-white font-extrabold text-2xl tracking-wider shadow-lg">
              {score}
            </div>
          </div>
        )}

        {/* Idle Start Overlay */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl shadow-blue-500/30 mb-3 animate-bounce">
              <span className="text-3xl">🕊️</span>
            </div>
            <h3 className="text-xl font-black text-white mb-1 tracking-tight">Pájaro Mensajero</h3>
            <p className="text-xs text-[#94a3b8] mb-5 max-w-[220px]">
              Toca la pantalla o presiona espacio para volar y entregar cartas esquivando obstáculos.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0084ff] to-[#00a6e0] text-white font-bold text-sm shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>¡Comenzar a Jugar!</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <span className="text-4xl mb-2">💥</span>
            <h3 className="text-xl font-black text-white mb-1">¡Fin del Vuelo!</h3>
            <div className="flex items-center gap-4 my-4 bg-[#141822]/80 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-[#8d90a0]">Puntuación</span>
                <span className="text-2xl font-black text-[#7bd0ff]">{score}</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-amber-400">Récord</span>
                <span className="text-2xl font-black text-amber-300">{highScore}</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0084ff] to-[#00a6e0] text-white font-bold text-sm shadow-lg shadow-blue-500/30 active:scale-95 transition-transform cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jugar de Nuevo</span>
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-[#8d90a0] mt-3 text-center">
        💡 Consejo: Toca la pantalla o usa la <kbd className="px-1.5 py-0.5 bg-[#1c2028] rounded border border-white/10 text-white font-mono text-[10px]">Barra Espaciadora</kbd> para elevar el vuelo.
      </p>
    </div>
  );
};
