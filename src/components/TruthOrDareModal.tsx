import React, { useState } from 'react';
import { X, Sparkles, Send, Flame, HelpCircle, Trophy } from 'lucide-react';
import { UserProfile } from '../types';

interface TruthOrDareModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  isNightMode?: boolean;
  onSendChallenge: (challengeText: string, type: 'truth' | 'dare') => void;
}

const TRUTHS = [
  "¿Cuál ha sido tu mayor vergüenza en público?",
  "Si pudieras viajar a cualquier lugar del mundo hoy, ¿a dónde irías?",
  "¿Cuál es tu recuerdo favorito de la infancia?",
  "¿Qué es lo más extraño que has comido?",
  "¿Cuál es tu mayor sueño por cumplir?",
];

const DARES = [
  "Manda una nota de voz imitando a tu animal favorito.",
  "Escribe un mensaje en mayúsculas diciendo '¡SOY EL REY DEL MUNDO!' en el grupo.",
  "Manda una foto haciendo una cara graciosa.",
  "Comparte el último emoji que usaste y explica por qué.",
  "Di 3 cosas que te hagan sonreír sin parar.",
];

export const TruthOrDareModal: React.FC<TruthOrDareModalProps> = ({
  isOpen,
  onClose,
  user,
  isNightMode = false,
  onSendChallenge,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'truth' | 'dare'>('truth');
  const [currentPrompt, setCurrentPrompt] = useState<string>(TRUTHS[0]);

  const handleShuffle = () => {
    const list = mode === 'truth' ? TRUTHS : DARES;
    const random = list[Math.floor(Math.random() * list.length)];
    setCurrentPrompt(random);
  };

  const handleSend = () => {
    onSendChallenge(currentPrompt, mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`relative max-w-md w-full rounded-3xl p-6 border shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200 ${
        isNightMode ? 'bg-[#181c24] border-white/10 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold">Verdad o Reto 🎯</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setMode('truth');
              setCurrentPrompt(TRUTHS[0]);
            }}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
              mode === 'truth' ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-black/10 dark:bg-white/5 border-white/10 text-[#8d90a0]'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Verdad 💡</span>
          </button>
          <button
            onClick={() => {
              setMode('dare');
              setCurrentPrompt(DARES[0]);
            }}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
              mode === 'dare' ? 'bg-orange-600 text-white border-orange-500 shadow-lg' : 'bg-black/10 dark:bg-white/5 border-white/10 text-[#8d90a0]'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Reto 🔥</span>
          </button>
        </div>

        {/* Prompt Card */}
        <div className={`relative p-5 rounded-2xl border text-center flex flex-col items-center gap-3 ${
          mode === 'truth' ? 'bg-blue-950/40 border-blue-500/30 text-blue-200' : 'bg-orange-950/40 border-orange-500/30 text-orange-200'
        }`}>
          <span className="text-xs font-bold uppercase tracking-wider opacity-80">
            {mode === 'truth' ? 'Pregunta de Verdad' : 'Desafío de Reto'}
          </span>
          <p className="text-sm font-bold text-white leading-relaxed">
            "{currentPrompt}"
          </p>
          <button
            onClick={handleShuffle}
            className="mt-1 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all cursor-pointer"
          >
            🎲 Cambiar Pregunta
          </button>
        </div>

        <button
          onClick={handleSend}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-1"
        >
          <Send className="w-4 h-4" />
          <span>Enviar Reto al Chat</span>
        </button>
      </div>
    </div>
  );
};
