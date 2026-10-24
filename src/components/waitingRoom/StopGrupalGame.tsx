import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  Trophy,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Zap,
} from 'lucide-react';
import { playSound } from '../../utils/gameAudio';

interface StopGrupalGameProps {
  onBack: () => void;
  groupName?: string;
}

const LETTERS = ['M', 'C', 'P', 'S', 'A', 'R', 'L', 'F', 'B', 'T', 'G'];

interface CategoryInput {
  nombre: string;
  ciudad: string;
  animal: string;
  comida: string;
  cosa: string;
}

export const StopGrupalGame: React.FC<StopGrupalGameProps> = ({ onBack, groupName }) => {
  const [currentLetter, setCurrentLetter] = useState<string>('M');
  const [inputs, setInputs] = useState<CategoryInput>({
    nombre: '',
    ciudad: '',
    animal: '',
    comida: '',
    cosa: '',
  });
  const [isStopped, setIsStopped] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [roundScore, setRoundScore] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [stoppedBy, setStoppedBy] = useState<string | null>(null);

  // Group competitors list
  const [groupRankings, setGroupRankings] = useState<
    { name: string; avatar: string; score: number; isMe?: boolean }[]
  >([
    { name: 'Tú (Jugador)', avatar: '🕊️', score: 0, isMe: true },
    { name: 'Ana (Amiga)', avatar: '👩‍🎨', score: 0 },
    { name: 'Carlos (Líder)', avatar: '🚀', score: 0 },
    { name: 'Sofía', avatar: '⭐', score: 0 },
  ]);

  // Timer countdown
  useEffect(() => {
    if (isStopped) return;

    if (timeLeft <= 0) {
      handleStopGame('Tiempo Agotado');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isStopped]);

  const handleChange = (field: keyof CategoryInput, value: string) => {
    if (isStopped) return;
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleStopGame = (who: string = 'Tú') => {
    if (isStopped) return;
    setIsStopped(true);
    setStoppedBy(who);

    if (soundEnabled) playSound('win');

    // Calculate score
    let scoreAcc = 0;
    const requiredFirstChar = currentLetter.toLowerCase();

    Object.values(inputs).forEach((val) => {
      const clean = val.trim().toLowerCase();
      if (clean && clean.startsWith(requiredFirstChar)) {
        scoreAcc += 100; // 100 points per valid word
      }
    });

    // Time speed bonus
    const speedBonus = who === 'Tú' ? Math.max(0, timeLeft * 10) : 0;
    const finalRoundScore = scoreAcc + speedBonus;

    setRoundScore(finalRoundScore);
    setTotalScore((prev) => prev + finalRoundScore);

    // Update Rankings
    setGroupRankings((prev) =>
      prev
        .map((p) => {
          if (p.isMe) {
            return { ...p, score: p.score + finalRoundScore };
          } else {
            const botBonus = Math.floor(Math.random() * 300) + 150;
            return { ...p, score: p.score + botBonus };
          }
        })
        .sort((a, b) => b.score - a.score)
    );
  };

  const nextRound = () => {
    const nextL = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    setCurrentLetter(nextL);
    setInputs({ nombre: '', ciudad: '', animal: '', comida: '', cosa: '' });
    setIsStopped(false);
    setTimeLeft(35);
    setStoppedBy(null);
    setRoundScore(0);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-[#8d90a0] hover:text-white px-3 py-1.5 rounded-xl bg-[#1c2028] border border-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-bold flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{groupName || 'Tutti Frutti / STOP Grupal'}</span>
          </span>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-8 h-8 rounded-full bg-[#1c2028] text-[#8d90a0] hover:text-white flex items-center justify-center border border-white/10 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#38bdf8]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Game Card */}
      <div className="w-full bg-[#141822] border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
        {/* Letter Wheel Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2563eb]/20 via-[#38bdf8]/10 to-[#1c2028] border border-[#38bdf8]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2563eb] to-[#00a6e0] flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-sky-950/50">
              {currentLetter}
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-[#8d90a0] font-semibold">Letra de la Ronda:</span>
              <h3 className="text-lg font-black text-white">¡Todas con la letra "{currentLetter}"!</h3>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border ${
              timeLeft <= 5
                ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* Inputs List for Categories */}
        <div className="flex flex-col gap-2.5">
          {[
            { key: 'nombre', label: '👤 Nombre de Persona', placeholder: `Escribe un nombre...` },
            { key: 'ciudad', label: '🌍 Ciudad / País', placeholder: `Escribe una ciudad o país...` },
            { key: 'animal', label: '🦁 Animal', placeholder: `Escribe un animal...` },
            { key: 'comida', label: '🍕 Fruta / Comida', placeholder: `Escribe una fruta o comida...` },
            { key: 'cosa', label: '📦 Cosa / Objeto', placeholder: `Escribe un objeto...` },
          ].map((cat) => {
            const fieldKey = cat.key as keyof CategoryInput;
            const val = inputs[fieldKey];
            const isValid =
              isStopped && val.trim() && val.trim().toLowerCase().startsWith(currentLetter.toLowerCase());

            return (
              <div key={cat.key} className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#8d90a0] flex items-center justify-between">
                  <span>{cat.label}</span>
                  {isStopped && (
                    <span
                      className={`text-[10px] font-bold ${
                        isValid ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isValid ? '100 Pts ✔️' : '0 Pts ❌'}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  disabled={isStopped}
                  placeholder={cat.placeholder}
                  value={val}
                  onChange={(e) => handleChange(fieldKey, e.target.value)}
                  className={`w-full bg-[#1c2028] text-xs text-white placeholder:text-[#8d90a0] px-3.5 py-2.5 rounded-xl border transition-all ${
                    isStopped
                      ? isValid
                        ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-200 font-bold'
                        : 'border-red-500/30 bg-red-950/10 text-red-200'
                      : 'border-white/10 focus:outline-none focus:border-[#2563eb]'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Big STOP Button or Round Result */}
        {!isStopped ? (
          <button
            onClick={() => handleStopGame('Tú')}
            className="w-full mt-1 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:brightness-110 text-white text-sm font-black tracking-wider uppercase shadow-xl shadow-red-950/50 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5 fill-white" />
            <span>¡ B A S T A ! / ¡ S T O P !</span>
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-[#1c2028] border border-white/10 flex flex-col gap-3 text-center animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>¡Ronda Finalizada por {stoppedBy}!</span>
            </div>
            <p className="text-xs text-[#8d90a0]">
              Obtuviste <strong className="text-amber-400 text-sm">{roundScore} pts</strong> en esta ronda.
            </p>

            <button
              onClick={nextRound}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#00a6e0] hover:brightness-110 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Siguiente Ronda con Otra Letra ➔
            </button>
          </div>
        )}

        {/* Group Leaderboard */}
        <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#8d90a0] uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Puntaje de la Sala Grupal</span>
            </span>
            <span className="text-xs font-bold text-[#38bdf8]">Tu Total: {totalScore} pts</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {groupRankings.map((p, idx) => (
              <div
                key={p.name}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                  p.isMe
                    ? 'bg-[#2563eb]/20 border-[#38bdf8]/40 text-white font-bold'
                    : 'bg-[#1c2028] border-white/5 text-[#dfe2ee]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#8d90a0] text-xs">#{idx + 1}</span>
                  <span>{p.avatar}</span>
                  <span>{p.name}</span>
                </div>
                <span className="font-mono font-bold text-amber-400">{p.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
