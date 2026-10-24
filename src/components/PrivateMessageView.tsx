import React, { useState, useEffect } from 'react';
import { Lock, Key, Timer, ShieldAlert, Check, Eye } from 'lucide-react';
import { PrivateMessageData } from '../types';

interface PrivateMessageViewProps {
  privateData: PrivateMessageData;
  isSender: boolean;
  onSelfDestruct?: () => void;
  isNightMode?: boolean;
}

export const PrivateMessageView: React.FC<PrivateMessageViewProps> = ({
  privateData,
  isSender,
  onSelfDestruct,
  isNightMode = false,
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(isSender);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isDestroyed, setIsDestroyed] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isUnlocked && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => {
          if (t && t <= 1) {
            clearInterval(interval);
            setIsDestroyed(true);
            if (onSelfDestruct) onSelfDestruct();
            return 0;
          }
          return t ? t - 1 : 0;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isUnlocked, timeLeft, onSelfDestruct]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === privateData.pin) {
      setIsUnlocked(true);
      setError(false);
      setTimeLeft(privateData.selfDestructSecs || 30);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (isDestroyed) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-black/40 border border-white/10 text-gray-400 text-xs italic">
        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
        <span>Mensaje privado autodestruido por seguridad.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 min-w-[240px] max-w-[280px]">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
          <Lock className="w-3.5 h-3.5" />
          <span>Mensaje Confidencial 🔒</span>
        </div>
        {timeLeft !== null && (
          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Timer className="w-3 h-3 animate-pulse" />
            <span>{timeLeft}s</span>
          </span>
        )}
      </div>

      {!isUnlocked ? (
        <form onSubmit={handleUnlock} className="flex flex-col gap-2 pt-1">
          <p className="text-xs text-gray-300">
            Este mensaje privado está protegido con PIN de seguridad.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="password"
              maxLength={6}
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              placeholder="Ingresa PIN"
              className={`bg-black/40 text-xs text-white px-3 py-2 rounded-xl border focus:outline-none font-mono tracking-widest flex-1 ${
                error ? 'border-red-500 ring-1 ring-red-500' : 'border-white/10 focus:border-amber-500'
              }`}
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow transition-colors cursor-pointer flex items-center gap-1"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Abrir</span>
            </button>
          </div>
          {error && <span className="text-[10px] font-bold text-red-400">PIN incorrecto. Inténtalo de nuevo.</span>}
        </form>
      ) : (
        <div className="flex flex-col gap-2 pt-1 animate-in fade-in duration-200">
          <p className="text-xs text-white bg-black/30 p-3 rounded-xl border border-white/10 leading-relaxed font-mono select-all">
            {privateData.text}
          </p>
          <span className="text-[10px] text-amber-300 italic flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>Desbloqueado. Se autodestruirá al terminar el temporizador.</span>
          </span>
        </div>
      )}
    </div>
  );
};
