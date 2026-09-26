import React, { useState } from 'react';
import { X, Search, UserPlus, Sparkles, Check, Phone, User, Smartphone } from 'lucide-react';
import { ensurePhoneStartsWith16 } from '../utils/phoneUtils';
import { createSvgAvatar } from '../utils/avatarUtils';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (
    contactName: string,
    avatarUrl: string,
    initialMessage?: string,
    phone?: string
  ) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onCreateChat,
}) => {
  const [method, setMethod] = useState<'name' | 'phone'>('name');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState<string>('¡Hola! Me alegro de contactar contigo.');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalName = name.trim();
    let finalPhone = phone.trim();

    if (method === 'phone') {
      if (!finalPhone) return;
      finalPhone = ensurePhoneStartsWith16(finalPhone);
      if (!finalName) {
        finalName = `Contacto (${finalPhone})`;
      }
    } else {
      if (!finalName) return;
      if (finalPhone) {
        finalPhone = ensurePhoneStartsWith16(finalPhone);
      }
    }

    const avatar = createSvgAvatar(finalName || 'U', '#0284c7');
    onCreateChat(finalName, avatar, initialMessage.trim(), finalPhone || undefined);
    setName('');
    setPhone('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1c2028] border border-white/10 rounded-2xl w-full max-w-md p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#7bd0ff]" />
            <span className="font-bold text-sm text-[#dfe2ee]">Nueva Conversación / Contacto</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#262a33] text-[#8d90a0] hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 bg-[#12161f] p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setMethod('name')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              method === 'name'
                ? 'bg-[#2563eb] text-white'
                : 'text-[#8d90a0] hover:text-[#dfe2ee]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Por Nombre</span>
          </button>
          <button
            type="button"
            onClick={() => setMethod('phone')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              method === 'phone'
                ? 'bg-[#2563eb] text-white'
                : 'text-[#8d90a0] hover:text-[#dfe2ee]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Por Teléfono</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {method === 'name' ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#8d90a0] font-semibold">Nombre del contacto</label>
              <input
                type="text"
                required
                placeholder="Ej: Laura Martínez, David..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#181c24] text-sm text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#8d90a0] font-semibold">Número de teléfono</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 16 612 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-[#181c24] text-sm text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#8d90a0] font-semibold">Nombre o Alias (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Laura..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#181c24] text-sm text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#8d90a0] font-semibold">Primer mensaje (opcional)</label>
            <input
              type="text"
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              className="bg-[#181c24] text-sm text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#00a6e0] text-white text-xs font-bold shadow-md active:scale-98 transition-transform cursor-pointer"
          >
            Comenzar Chat
          </button>
        </form>
      </div>
    </div>
  );
};
