import React, { useState } from 'react';
import { X, UserPlus, Phone, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { ensurePhoneStartsWith16 } from '../utils/phoneUtils';
import { createSvgAvatar } from '../utils/avatarUtils';
import { findUserByPhone } from '../utils/phoneValidation';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (
    contactName: string,
    avatarUrl: string,
    initialMessage?: string,
    phone?: string
  ) => void;
  currentUserId?: string;
}

const COUNTRY_CODES = [
  { code: '16', country: 'PidgeX Directo (16)', flag: '🕊️' },
  { code: '16 34', country: 'Región España (16 34)', flag: '🇪🇸' },
  { code: '16 52', country: 'Región México (16 52)', flag: '🇲🇽' },
  { code: '16 1', country: 'Región EE.UU. / CA (16 1)', flag: '🇺🇸' },
  { code: '16 54', country: 'Región Argentina (16 54)', flag: '🇦🇷' },
  { code: '16 57', country: 'Región Colombia (16 57)', flag: '🇨🇴' },
  { code: '16 56', country: 'Región Chile (16 56)', flag: '🇨🇱' },
  { code: '16 51', country: 'Región Perú (16 51)', flag: '🇵🇪' },
];

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onCreateChat,
  currentUserId,
}) => {
  const [countryCode, setCountryCode] = useState<string>('16');
  const [phone, setPhone] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState<string>('¡Hola! Me alegro de contactar contigo en PidgeX 🕊️');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let rawPhone = phone.trim();
    if (!rawPhone) {
      setErrorMessage('Por favor introduce un número de teléfono válido.');
      return;
    }

    if (!rawPhone.startsWith('16')) {
      rawPhone = `${countryCode} ${rawPhone}`;
    }
    const finalPhone = ensurePhoneStartsWith16(rawPhone);

    setIsSearching(true);
    const foundUser = await findUserByPhone(finalPhone, currentUserId);
    setIsSearching(false);

    if (!foundUser) {
      setErrorMessage(
        `❌ El número "${finalPhone}" NO está registrado por ningún usuario real en PidgeX. No se ha creado ningún chat.`
      );
      return;
    }

    const contactName = foundUser.name || `Usuario (${finalPhone})`;
    const avatar = foundUser.avatarUrl || createSvgAvatar(contactName, '#0284c7');

    onCreateChat(contactName, avatar, initialMessage.trim() || undefined, finalPhone);
    setPhone('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1c2028] border border-white/10 rounded-2xl w-full max-w-md p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#7bd0ff]" />
            <span className="font-bold text-sm text-[#dfe2ee]">Nueva Conversación (Usuario Real)</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#262a33] text-[#8d90a0] hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/90 border border-red-500/60 text-red-200 text-xs font-bold flex items-start gap-2 shadow-lg">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span>{errorMessage}</span>
              <span className="text-[10px] font-normal text-red-300">
                PidgeX solo permite chatear con números que ya pertenecen a un usuario real registrado.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#8d90a0] font-semibold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#7bd0ff]" />
              <span>Número de Teléfono del Contacto Real</span>
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-[#181c24] text-xs text-[#dfe2ee] px-2.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb] cursor-pointer"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-[#181c24] text-white">
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                required
                placeholder="Ej: 612 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-[#181c24] text-sm text-[#dfe2ee] placeholder:text-[#8d90a0] px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#8d90a0] font-semibold flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#7bd0ff]" />
              <span>Primer mensaje (opcional)</span>
            </label>
            <input
              type="text"
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              className="bg-[#181c24] text-sm text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#00a6e0] hover:brightness-110 text-white text-xs font-bold shadow-md active:scale-98 transition-transform cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Verificando número real...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Iniciar Chat con Usuario Real</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
