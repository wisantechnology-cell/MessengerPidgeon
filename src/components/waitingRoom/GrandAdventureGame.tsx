import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Play, RotateCcw, Shield, Car, DollarSign, Zap, Footprints, Flame, HandMetal } from 'lucide-react';

interface GrandAdventureGameProps {
  onBack: () => void;
}

export const GrandAdventureGame: React.FC<GrandAdventureGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState<number>(0);
  const [money, setMoney] = useState<number>(150);
  const [health, setHealth] = useState<number>(100);
  const [isInVehicle, setIsInVehicle] = useState<boolean>(true);
  const [vehicleType, setVehicleType] = useState<'car' | 'moto'>('car');
  const [canSteal, setCanSteal] = useState<boolean>(false);
  const [missionText, setMissionText] = useState<string>('Misión: Conduce, róbate autos, golpea peatones y sobrevive en G.A.C');
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('gac_highscore') || '0', 10);
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const gameRef = useRef({
    x: 180,
    y: 420,
    speed: 5,
    score: 0,
    money: 150,
    health: 100,
    isInVehicle: true,
    vehicleType: 'car' as 'car' | 'moto',
    keys: {} as Record<string, boolean>,
    traffic: [] as {
      id: number;
      x: number;
      y: number;
      type: 'car' | 'moto' | 'cop' | 'npc' | 'money';
      speed: number;
      width: number;
      height: number;
      color: string;
      direction?: number;
    }[],
    punchCooldown: 0,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameRef.current.keys[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setMoney(150);
    setHealth(100);
    setIsInVehicle(true);
    setVehicleType('car');
    setMissionText('¡Bienvenido a G.A.C! Usa los controles para conducir o bájate a caminar.');
    gameRef.current = {
      x: 180,
      y: 420,
      speed: 5,
      score: 0,
      money: 150,
      health: 100,
      isInVehicle: true,
      vehicleType: 'car',
      keys: {},
      traffic: [
        { id: 1, x: 120, y: -100, type: 'car', speed: 4, width: 40, height: 70, color: '#3b82f6' },
        { id: 2, x: 260, y: -300, type: 'moto', speed: 6, width: 24, height: 50, color: '#10b981' },
        { id: 3, x: 80, y: -500, type: 'npc', speed: 2, width: 20, height: 35, color: '#f59e0b' },
        { id: 4, x: 200, y: -700, type: 'money', speed: 3, width: 30, height: 30, color: '#eab308' },
      ],
      punchCooldown: 0,
    };
  };

  const toggleVehicle = () => {
    const g = gameRef.current;
    g.isInVehicle = !g.isInVehicle;
    setIsInVehicle(g.isInVehicle);
    if (!g.isInVehicle) {
      setMissionText('A pie: Puedes golpear peatones 👊 o robar autos cercanos 🚗');
    } else {
      setMissionText(`Conduciendo ${g.vehicleType === 'car' ? 'Auto Deportivo' : 'Motocicleta'}`);
    }
  };

  const punchAction = () => {
    const g = gameRef.current;
    if (g.isInVehicle) return;
    // Punch nearby traffic or NPCs
    let hitSomething = false;
    g.traffic.forEach((item) => {
      const dist = Math.hypot(g.x - item.x, g.y - item.y);
      if (dist < 60) {
        hitSomething = true;
        g.score += 50;
        g.money += 20;
        setScore(g.score);
        setMoney(g.money);
        if (item.type === 'npc' || item.type === 'money') {
          item.y = -200; // respawn item
        }
      }
    });
    if (hitSomething) {
      setMissionText('¡Golpe exitoso! Has ganado dinero y respeto callejero.');
    } else {
      setMissionText('¡Golpe al aire! Acércate a peatones.');
    }
  };

  const stealVehicle = () => {
    const g = gameRef.current;
    if (g.isInVehicle) return;
    // Find closest car or moto
    let closestIndex = -1;
    let minDist = 999;
    g.traffic.forEach((item, idx) => {
      if (item.type === 'car' || item.type === 'moto' || item.type === 'cop') {
        const dist = Math.hypot(g.x - item.x, g.y - item.y);
        if (dist < minDist) {
          minDist = dist;
          closestIndex = idx;
        }
      }
    });

    if (closestIndex !== -1 && minDist < 80) {
      const target = g.traffic[closestIndex];
      g.isInVehicle = true;
      const newVehType = target.type === 'moto' ? 'moto' : 'car';
      g.vehicleType = newVehType;
      setIsInVehicle(true);
      setVehicleType(newVehType);
      g.traffic.splice(closestIndex, 1);
      g.score += 150;
      setScore(g.score);
      setMissionText(`¡Vehículo robado con éxito! Conduciendo ${newVehType === 'moto' ? 'Moto' : 'Auto'}`);
    } else {
      setMissionText('No hay ningún vehículo lo suficientemente cerca para robar.');
    }
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastSpawn = Date.now();

    const updateAndRender = () => {
      const g = gameRef.current;

      // Handle movement
      const moveSpeed = g.isInVehicle ? (g.vehicleType === 'moto' ? 7 : 5) : 3.5;
      if ((g.keys['ArrowLeft'] || g.keys['a'] || g.keys['A']) && g.x > 35) {
        g.x -= moveSpeed;
      }
      if ((g.keys['ArrowRight'] || g.keys['d'] || g.keys['D']) && g.x < canvas.width - 55) {
        g.x += moveSpeed;
      }
      if ((g.keys['ArrowUp'] || g.keys['w'] || g.keys['W']) && g.y > 40) {
        g.y -= moveSpeed;
      }
      if ((g.keys['ArrowDown'] || g.keys['s'] || g.keys['S']) && g.y < canvas.height - 80) {
        g.y += moveSpeed;
      }

      // Check if any car/moto is close enough to steal
      let nearbyVeh = false;
      if (!g.isInVehicle) {
        for (const item of g.traffic) {
          if (item.type === 'car' || item.type === 'moto' || item.type === 'cop') {
            if (Math.hypot(g.x - item.x, g.y - item.y) < 70) {
              nearbyVeh = true;
              break;
            }
          }
        }
      }
      setCanSteal(nearbyVeh);

      // Spawn traffic periodically
      if (Date.now() - lastSpawn > 1400) {
        lastSpawn = Date.now();
        const randX = Math.random() * (canvas.width - 100) + 30;
        const types: ('car' | 'moto' | 'cop' | 'npc' | 'money')[] = ['car', 'moto', 'cop', 'npc', 'money', 'car'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        g.traffic.push({
          id: Date.now(),
          x: randX,
          y: -90,
          type: chosenType,
          speed: chosenType === 'moto' ? 6 : chosenType === 'cop' ? 5.5 : chosenType === 'npc' ? 2 : 3.5,
          width: chosenType === 'moto' ? 26 : chosenType === 'npc' ? 22 : 42,
          height: chosenType === 'moto' ? 50 : chosenType === 'npc' ? 35 : 70,
          color: chosenType === 'cop' ? '#2563eb' : chosenType === 'moto' ? '#10b981' : chosenType === 'npc' ? '#f97316' : chosenType === 'money' ? '#eab308' : '#8b5cf6',
        });
      }

      // Render City Street & Sidewalks
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sidewalks
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 35, canvas.height);
      ctx.fillRect(canvas.width - 35, 0, 35, canvas.height);

      // Buildings along sidewalks (Neon lights)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 10, 31, 120);
      ctx.fillRect(canvas.width - 33, 10, 31, 120);
      ctx.fillRect(2, 200, 31, 140);
      ctx.fillRect(canvas.width - 33, 200, 31, 140);

      // Building Windows
      ctx.fillStyle = '#fde047';
      ctx.fillRect(8, 20, 8, 12);
      ctx.fillRect(20, 20, 8, 12);
      ctx.fillRect(canvas.width - 28, 20, 8, 12);
      ctx.fillRect(canvas.width - 16, 20, 8, 12);

      // Road lanes
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.setLineDash([25, 25]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 3, 0);
      ctx.lineTo(canvas.width / 3, canvas.height);
      ctx.moveTo((canvas.width / 3) * 2, 0);
      ctx.lineTo((canvas.width / 3) * 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Update and Draw Traffic & Obstacles
      for (let i = g.traffic.length - 1; i >= 0; i--) {
        const item = g.traffic[i];
        item.y += item.speed;

        // Draw item
        if (item.type === 'npc') {
          // Human Pedestrian NPC
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(item.x + item.width / 2, item.y + 10, 8, 0, Math.PI * 2); // head
          ctx.fill();
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(item.x + 4, item.y + 18, 14, 16); // body
        } else if (item.type === 'money') {
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(item.x + item.width / 2, item.y + 15, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px monospace';
          ctx.fillText('$', item.x + 9, item.y + 21);
        } else {
          // Car / Moto / Cop
          ctx.fillStyle = item.color;
          ctx.fillRect(item.x, item.y, item.width, item.height);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(item.x + 4, item.y + 12, item.width - 8, 16);
          if (item.type === 'cop') {
            ctx.fillStyle = Math.floor(Date.now() / 150) % 2 === 0 ? '#ef4444' : '#3b82f6';
            ctx.fillRect(item.x + item.width / 2 - 6, item.y - 6, 12, 6);
          }
        }

        // Collision Check with Player
        const playerBox = { x: g.x, y: g.y, w: g.isInVehicle ? 42 : 24, h: g.isInVehicle ? 70 : 40 };
        if (
          playerBox.x < item.x + item.width &&
          playerBox.x + playerBox.w > item.x &&
          playerBox.y < item.y + item.height &&
          playerBox.y + playerBox.h > item.y
        ) {
          if (item.type === 'money') {
            g.money += 50;
            g.score += 100;
            setMoney(g.money);
            setScore(g.score);
            g.traffic.splice(i, 1);
          } else if (g.isInVehicle) {
            // Crash vehicle
            g.health -= 20;
            setHealth(g.health);
            g.traffic.splice(i, 1);
            if (g.health <= 0) {
              setGameState('gameover');
              if (g.score > highScore) {
                setHighScore(g.score);
                localStorage.setItem('gac_highscore', g.score.toString());
              }
              return;
            }
          } else {
            // Hit by car on foot
            g.health -= 35;
            setHealth(g.health);
            g.traffic.splice(i, 1);
            if (g.health <= 0) {
              setGameState('gameover');
              return;
            }
          }
        }

        // Remove offscreen
        if (item.y > canvas.height + 60) {
          g.traffic.splice(i, 1);
          g.score += 15;
          setScore(g.score);
        }
      }

      // Draw Player (Vehicle or On Foot)
      if (g.isInVehicle) {
        // Draw Car / Moto
        ctx.fillStyle = g.vehicleType === 'moto' ? '#10b981' : '#ef4444';
        ctx.fillRect(g.x, g.y, g.vehicleType === 'moto' ? 24 : 42, 70);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(g.x + 4, g.y + 16, g.vehicleType === 'moto' ? 16 : 34, 18);
      } else {
        // Draw Player on foot (Character with fists)
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(g.x + 12, g.y + 10, 10, 0, Math.PI * 2); // head
        ctx.fill();
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(g.x + 4, g.y + 20, 16, 22); // body
      }

      animationFrameId = requestAnimationFrame(updateAndRender);
    };

    animationFrameId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, highScore]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-[500px] mx-auto bg-[#161b22] border border-white/10 rounded-3xl p-5 shadow-2xl text-[#dfe2ee] animate-in zoom-in-95 duration-200">
      {/* Game Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-1.5">
              <span>G.A.C</span>
              <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                Grand Adventure in the City
              </span>
            </h2>
            <p className="text-[11px] text-[#8d90a0]">Conduce, róbate autos, camina y golpea</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>{Math.max(score, highScore)}</span>
          </div>
        </div>
      </div>

      {gameState === 'menu' && (
        <div className="flex flex-col items-center text-center py-8 gap-5 bg-gradient-to-b from-[#1c2433] to-[#121824] rounded-2xl p-6 border border-white/5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-xl shadow-red-950/50 animate-bounce">
            <Car className="w-10 h-10" />
          </div>
          <div className="flex flex-col gap-1.5 max-w-sm">
            <h3 className="text-xl font-black text-white tracking-tight">Grand adventure in the city</h3>
            <p className="text-xs text-[#a6aab8] leading-relaxed">
              Explora la ciudad abierta: bájate del auto, camina por la banqueta, golpea peatones con 👊 y róbate autos o motos que pasen junto a ti 🚗💨.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 text-xs text-[#8d90a0] bg-black/30 px-4 py-3 rounded-xl border border-white/5">
            <span className="flex items-center gap-1">🚗 Robar autos y motos</span>
            <span className="flex items-center gap-1">🚶 Bajarse a caminar</span>
            <span className="flex items-center gap-1">👊 Botón de golpear</span>
          </div>

          <button
            onClick={startGame}
            className="w-full max-w-[240px] py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar G.A.C</span>
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex flex-col gap-3">
          {/* HUD Status Bar */}
          <div className="grid grid-cols-4 gap-1.5 bg-[#0d131f] p-2.5 rounded-2xl border border-white/10 text-center text-xs">
            <div className="flex flex-col">
              <span className="text-[#8d90a0] text-[10px]">Salud</span>
              <span className="font-bold text-red-400">{health}%</span>
            </div>
            <div className="flex flex-col border-x border-white/10">
              <span className="text-[#8d90a0] text-[10px]">Dinero</span>
              <span className="font-bold text-emerald-400">${money}</span>
            </div>
            <div className="flex flex-col border-r border-white/10">
              <span className="text-[#8d90a0] text-[10px]">Modo</span>
              <span className="font-bold text-cyan-400">{isInVehicle ? (vehicleType === 'moto' ? 'Moto' : 'Auto') : 'A Pie 🚶'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#8d90a0] text-[10px]">Puntaje</span>
              <span className="font-bold text-white">{score}</span>
            </div>
          </div>

          {/* Canvas Game Area */}
          <div className="relative flex justify-center bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <canvas
              ref={canvasRef}
              width={360}
              height={440}
              className="block w-full max-w-[360px] h-[380px] object-cover"
            />
          </div>

          <p className="text-center text-[11px] text-[#7bd0ff] font-medium bg-[#131b2c] p-2 rounded-xl border border-white/5">
            {missionText}
          </p>

          {/* Action Control Buttons (Bajarse/Subir, Golpear, Robar) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={toggleVehicle}
              className="py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md cursor-pointer"
            >
              {isInVehicle ? <Footprints className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
              <span>{isInVehicle ? 'Bajarse' : 'Subir Auto'}</span>
            </button>

            {!isInVehicle && (
              <button
                onClick={stealVehicle}
                className={`py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md cursor-pointer ${
                  canSteal ? 'bg-gradient-to-r from-emerald-600 to-teal-600 animate-pulse' : 'bg-gray-700 opacity-50'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>¡Robar Auto!</span>
              </button>
            )}

            {!isInVehicle && (
              <button
                onClick={punchAction}
                className="py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:opacity-95 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md cursor-pointer"
              >
                <HandMetal className="w-3.5 h-3.5" />
                <span>Golpear 👊</span>
              </button>
            )}
          </div>

          {/* Directional Move Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onMouseDown={() => (gameRef.current.keys['ArrowLeft'] = true)}
              onMouseUp={() => (gameRef.current.keys['ArrowLeft'] = false)}
              onTouchStart={() => (gameRef.current.keys['ArrowLeft'] = true)}
              onTouchEnd={() => (gameRef.current.keys['ArrowLeft'] = false)}
              className="py-2.5 bg-[#212836] hover:bg-[#2c3545] rounded-xl text-white text-xs font-bold"
            >
              ⬅️ Izq
            </button>
            <button
              onMouseDown={() => (gameRef.current.keys['ArrowUp'] = true)}
              onMouseUp={() => (gameRef.current.keys['ArrowUp'] = false)}
              onTouchStart={() => (gameRef.current.keys['ArrowUp'] = true)}
              onTouchEnd={() => (gameRef.current.keys['ArrowUp'] = false)}
              className="py-2.5 bg-[#212836] hover:bg-[#2c3545] rounded-xl text-white text-xs font-bold"
            >
              ⬆️ Arriba
            </button>
            <button
              onMouseDown={() => (gameRef.current.keys['ArrowRight'] = true)}
              onMouseUp={() => (gameRef.current.keys['ArrowRight'] = false)}
              onTouchStart={() => (gameRef.current.keys['ArrowRight'] = true)}
              onTouchEnd={() => (gameRef.current.keys['ArrowRight'] = false)}
              className="py-2.5 bg-[#212836] hover:bg-[#2c3545] rounded-xl text-white text-xs font-bold"
            >
              Der ➡️
            </button>
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="flex flex-col items-center text-center py-8 gap-5 bg-gradient-to-b from-[#221518] to-[#121824] rounded-2xl p-6 border border-red-500/20">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-2xl font-black">
            💥
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-black text-white">¡Fin de la Partida G.A.C!</h3>
            <p className="text-xs text-[#a6aab8]">Te has quedado sin salud en las calles de la ciudad.</p>
          </div>

          <div className="flex gap-4 bg-black/40 px-6 py-3 rounded-2xl border border-white/5">
            <div className="flex flex-col items-center">
              <span className="text-[11px] text-[#8d90a0]">Puntaje Final</span>
              <span className="text-lg font-black text-white">{score}</span>
            </div>
            <div className="w-[1px] bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[11px] text-[#8d90a0]">Dinero Obtenido</span>
              <span className="text-lg font-black text-emerald-400">${money}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full max-w-[280px]">
            <button
              onClick={startGame}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-95 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jugar de Nuevo</span>
            </button>
            <button
              onClick={() => setGameState('menu')}
              className="px-4 py-3 rounded-xl bg-[#212836] hover:bg-[#2c3545] text-white font-bold text-xs cursor-pointer"
            >
              Menú
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
