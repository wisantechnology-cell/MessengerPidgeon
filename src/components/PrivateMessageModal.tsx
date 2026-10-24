import React, { useState } from 'react';
import { X, Lock, Key, Timer, ShieldCheck, Send } from 'lucide-react';
import { Chat, UserProfile } from '../types';

interface PrivateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  user: UserProfile;
  isNightMode?: boolean;
  onSendPrivateMessage: (chatId: string, text: string, pin: string, selfDestructSecs: number) => void;
}

export const PrivateMessageModal: React.FC<PrivateMessageModalProps> = ({
  isOpen,
  onClose,
  chat,
  user,
  isNightMode = false,
  onSendPrivateMessage,
}) => {
  if (!isOpen) return null;

  const [secretText, setSecretText] = useState<string>('');
  const [pin, setPin] = useState<string>('1234');
  const [timer, setTimer] = useState<number>(30); // 30 seconds self destruct
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretText.trim()) {
      setError('Por favor escribe el mensaje confidencial.');
      return;
    }
    if (!pin.trim() || pin.length < 3) {
      setError('El PIN debe tener al menos 3 dígitos.');
      return;
    }

    onSendPrivateMessage(chat.id, secretText.trim(), pin.trim(), timer);
    setSecretText('');
    setPin('1234');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-[420px] rounded-3xl p-6 border shadow-2xl flex flex-col gap-5 ${
        isNightMode ? 'bg-[#181c24] border-white/10 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Mensaje Privado Confidencial 🔒</h3>
              <p className="text-[11px] text-[#8d90a0]">Protegido con PIN y autodestrucción</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#8d90a0]">Mensaje Secreto</label>
            <textarea
              rows={3}
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              placeholder="Escribe información confidencial que solo este usuario pueda ver..."
              className="bg-[#121620] text-xs text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#8d90a0] flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>PIN de Desbloqueo</span>
              </label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1234"
                className="bg-[#121620] text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-amber-500 font-mono text-center tracking-widest"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#8d90a0] flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span>Autodestrucción</span>
              </label>
              <select
                value={timer}
                onChange={(e) => setTimer(Number(e.target.value))}
                className="bg-[#121620] text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-amber-500"
              >
                <option value={10}>10 segundos</option>
                <option value={30}>30 segundos</option>
                <option value={60}>1 minuto</option>
                <option value={300}>5 minutos</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-200 leading-relaxed">
            🛡️ <strong className="text-white">Seguridad PidgeX:</strong> El receptor deberá introducir el PIN correcto para descifrar el mensaje, el cual se autodestruirá automáticamente tras el tiempo seleccionado.
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer mt-1"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Mensaje Confidencial</span>
          </button>
        </form>
      </div>
    </div>
  );
};
