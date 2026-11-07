import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  Trophy,
  Sparkles,
  Eraser,
  RotateCcw,
  Volume2,
  VolumeX,
  Send,
  CheckCircle2,
  Clock,
  Pencil,
  Eye,
  Trash2,
  Award,
  Check,
  Zap,
} from 'lucide-react';
import { playSound } from '../../utils/gameAudio';
import { PikitoMascot } from '../PikitoMascot';
import { PaletteVectorIcon } from '../CustomVectorIcons';

interface DrawGuessGameProps {
  onBack: () => void;
  groupName?: string;
}

interface GuessItem {
  id: string;
  sender: string;
  initial: string;
  isMe?: boolean;
  word: string;
  timestamp: string;
  isCorrect?: boolean;
}

const BRUSH_COLORS = [
  '#38bdf8', // Sky Blue
  '#ef4444', // Red
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#111827', // Black
];

const SIMULATED_GUESSES = [
  'Pájaro',
  'Casa',
  'Sol',
  'Coche',
  'Flor',
  'Árbol',
  'Perro',
  'Gato',
  'Avión',
  'Barco',
  'Corazón',
  'Estrella',
  'Manzana',
  'Pelota',
  'Mariposa',
];

const GROUP_MEMBERS = [
  { name: 'Ana (Amiga)', initial: 'A' },
  { name: 'Carlos (Líder)', initial: 'C' },
  { name: 'Sofía', initial: 'S' },
  { name: 'Mateo', initial: 'M' },
];

export const DibujaYAdivinaGame: React.FC<DrawGuessGameProps> = ({ onBack, groupName }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentColor, setCurrentColor] = useState<string>('#38bdf8');
  const [brushSize, setBrushSize] = useState<number>(4);
  const [isEraser, setIsEraser] = useState<boolean>(false);

  // Role and status
  const [role, setRole] = useState<'artist' | 'guesser'>('artist');
  const [drawerTopic, setDrawerTopic] = useState<string>('');
  const [guessInput, setGuessInput] = useState<string>('');
  const [guesses, setGuesses] = useState<GuessItem[]>([]);
  const [selectedWinner, setSelectedWinner] = useState<GuessItem | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [score, setScore] = useState<number>(0);
  const [roundEnded, setRoundEnded] = useState<boolean>(false);

  // Initialize Canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [role]);

  // Simulated group members guessing automatically when in artist role
  useEffect(() => {
    if (role !== 'artist' || roundEnded) return;

    const interval = setInterval(() => {
      const member = GROUP_MEMBERS[Math.floor(Math.random() * GROUP_MEMBERS.length)];
      const randomWord = SIMULATED_GUESSES[Math.floor(Math.random() * SIMULATED_GUESSES.length)];

      const newGuess: GuessItem = {
        id: Math.random().toString(),
        sender: member.name,
        initial: member.initial,
        word: randomWord,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setGuesses((prev) => [newGuess, ...prev.slice(0, 19)]);
    }, 4500);

    return () => clearInterval(interval);
  }, [role, roundEnded]);

  // Drawing Event Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (role !== 'artist' || roundEnded) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || role !== 'artist' || roundEnded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = isEraser ? '#0f172a' : currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Submit manual guess
  const handleSendGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || roundEnded) return;

    const newGuess: GuessItem = {
      id: Math.random().toString(),
      sender: 'Tú (Jugador)',
      initial: 'P',
      isMe: true,
      word: guessInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setGuesses((prev) => [newGuess, ...prev]);
    setGuessInput('');
    if (soundEnabled) playSound('click');
  };

  // Drawer chooses the correct word / winner!
  const handleSelectCorrectWord = (guess: GuessItem) => {
    if (roundEnded) return;

    setSelectedWinner(guess);
    setRoundEnded(true);
    setScore((s) => s + 200);

    if (soundEnabled) playSound('win');

    // Mark guess as correct
    setGuesses((prev) =>
      prev.map((g) => (g.id === guess.id ? { ...g, isCorrect: true } : g))
    );
  };

  // Start a new drawing round
  const resetRound = () => {
    setRoundEnded(false);
    setSelectedWinner(null);
    setGuesses([]);
    clearCanvas();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto p-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-[#8d90a0] hover:text-white px-3 py-1.5 rounded-xl bg-[#1c2028] border border-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Role Switcher */}
          <div className="flex bg-[#141822] p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => {
                setRole('artist');
                resetRound();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                role === 'artist' ? 'bg-[#2563eb] text-white' : 'text-[#8d90a0] hover:text-white'
              }`}
            >
              <Pencil className="w-3 h-3" />
              <span>Tú Dibujas</span>
            </button>
            <button
              onClick={() => {
                setRole('guesser');
                resetRound();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                role === 'guesser' ? 'bg-[#2563eb] text-white' : 'text-[#8d90a0] hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Adivinador</span>
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-8 h-8 rounded-full bg-[#1c2028] text-[#8d90a0] hover:text-white flex items-center justify-center border border-white/10 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#38bdf8]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full bg-[#141822] border border-white/10 rounded-3xl p-4 shadow-2xl flex flex-col gap-3">
        {/* Title & Info Banner */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/30 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{groupName || 'Dibuja y Adivina en Grupo'}</span>
            </span>
            <span className="text-xs font-extrabold text-amber-400">
              Puntos: {score} pts
            </span>
          </div>

          <button
            onClick={resetRound}
            className="px-2.5 py-1 rounded-xl bg-[#262a33] hover:bg-[#323742] text-xs font-bold text-white border border-white/10 cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Nuevo Dibujo</span>
          </button>
        </div>

        {/* Drawer Optional Topic or Instruction */}
        {role === 'artist' ? (
          <div className="p-2.5 rounded-xl bg-[#1c2028] border border-white/5 flex items-center gap-2 text-xs">
            <span className="text-[#8d90a0] font-semibold shrink-0">🎨 ¿Qué estás dibujando? (Opcional):</span>
            <input
              type="text"
              placeholder="Escribe lo que vas a dibujar..."
              value={drawerTopic}
              onChange={(e) => setDrawerTopic(e.target.value)}
              className="w-full bg-[#121620] text-xs text-[#38bdf8] font-bold px-2 py-1 rounded-lg border border-white/10 focus:outline-none"
            />
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-[#1c2028] border border-white/5 flex items-center justify-between text-xs">
            <span className="text-[#8d90a0] font-semibold flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Alguien está dibujando en el grupo...</span>
            </span>
            <span className="text-amber-400 font-bold">¡Intenta decir la palabra!</span>
          </div>
        )}

        {/* Canvas Area */}
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-inner bg-[#0f172a]">
          <canvas
            ref={canvasRef}
            width={500}
            height={375}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className={`w-full h-full touch-none ${
              role === 'artist' && !roundEnded ? 'cursor-crosshair' : 'cursor-default'
            }`}
          />

          {role === 'guesser' && (
            <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-sky-300 border border-sky-500/30 font-bold flex items-center gap-1">
              <Eye className="w-3 h-3 text-sky-400" />
              <span>Viendo lienzo en vivo</span>
            </div>
          )}
        </div>

        {/* Drawing Tools for Artist */}
        {role === 'artist' && !roundEnded && (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-[#1c2028] border border-white/5 gap-2">
            {/* Color Swatches */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {BRUSH_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCurrentColor(c);
                    setIsEraser(false);
                  }}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer shrink-0 ${
                    !isEraser && currentColor === c ? 'scale-125 border-white shadow-md' : 'border-black/40'
                  }`}
                />
              ))}
            </div>

            {/* Size & Clear Tools */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsEraser(!isEraser)}
                className={`p-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                  isEraser
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-[#262a33] border-white/10 text-[#8d90a0] hover:text-white'
                }`}
              >
                <Eraser className="w-4 h-4" />
              </button>
              <button
                onClick={clearCanvas}
                className="p-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold cursor-pointer hover:bg-red-500/30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Winner Banner when Selected */}
        {roundEnded && selectedWinner && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 flex flex-col items-center gap-2 text-center animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-sm">
              <Award className="w-5 h-5 text-amber-400" />
              <span>¡Palabra Correcta Elegida!</span>
            </div>
            <p className="text-xs text-emerald-100">
              <strong>{selectedWinner.sender}</strong> dijo <strong>"{selectedWinner.word}"</strong> y fue elegida como la correcta por el dibujante.
            </p>
            <button
              onClick={resetRound}
              className="mt-1 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Hacer Otro Dibujo</span>
            </button>
          </div>
        )}

        {/* Group Words & Guesses Section */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#8d90a0] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Palabras del Grupo e Intentos ({guesses.length})</span>
            </span>
            {role === 'artist' && !roundEnded && (
              <span className="text-[11px] text-amber-400 font-bold">
                Elige la palabra correcta
              </span>
            )}
          </div>

          {/* Guesses Log with "Elegir como Correcta" Buttons */}
          <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 p-2 rounded-2xl bg-[#1c2028] border border-white/5">
            {guesses.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8d90a0] flex flex-col items-center gap-1">
                <span>Aún no hay palabras. Los demás integrantes irán diciendo sus intentos...</span>
                {role === 'artist' && <span>(Comienza a dibujar en el lienzo para recibir palabras)</span>}
              </div>
            ) : (
              guesses.map((g) => (
                <div
                  key={g.id}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                    g.isCorrect
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
                      : 'bg-[#121620] border-white/5 text-[#dfe2ee]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {g.isMe ? (
                      <PikitoMascot size="xs" mood="happy" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-[10px] text-sky-300 shrink-0">
                        {g.initial}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-[#8d90a0] font-semibold truncate">
                        {g.sender} • {g.timestamp}
                      </span>
                      <span className="text-xs font-extrabold text-white tracking-wide truncate">
                        "{g.word}"
                      </span>
                    </div>
                  </div>

                  {/* Drawer chooses word */}
                  {role === 'artist' && !roundEnded && (
                    <button
                      onClick={() => handleSelectCorrectWord(g)}
                      className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-[11px] font-bold shadow-md cursor-pointer flex items-center gap-1 shrink-0 ml-2"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Elegir como Correcta</span>
                    </button>
                  )}

                  {g.isCorrect && (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Correcta</span>
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Manual Word Input Form */}
          <form onSubmit={handleSendGuess} className="flex gap-2 mt-1">
            <input
              type="text"
              placeholder="Decir o escribir una palabra..."
              disabled={roundEnded}
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              className="flex-1 bg-[#1c2028] text-xs text-white placeholder:text-[#8d90a0] px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
            />
            <button
              type="submit"
              disabled={!guessInput.trim() || roundEnded}
              className="px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Decir</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
