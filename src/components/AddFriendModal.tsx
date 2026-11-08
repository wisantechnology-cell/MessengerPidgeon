import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Phone,
  Check,
  MessageSquare,
  Users,
  Star,
  Briefcase,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ChatCategory } from '../types';
import { ensurePhoneStartsWith16 } from '../utils/phoneUtils';
import { createSvgAvatar } from '../utils/avatarUtils';
import { findUserByPhone } from '../utils/phoneValidation';
import { CountryFlagBadge } from './CountryFlagBadge';

export interface AddFriendData {
  name: string;
  phone?: string;
  username?: string;
  avatarUrl: string;
  initialMessage?: string;
  category?: ChatCategory;
}

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (data: AddFriendData) => void;
  currentUserId?: string;
}

const COUNTRY_CODES = [
  { code: '16', country: 'PidgeX Directo (16)' },
  { code: '16 34', country: 'Región España (16 34)' },
  { code: '16 52', country: 'Región México (16 52)' },
  { code: '16 1', country: 'Región EE.UU. / CA (16 1)' },
  { code: '16 54', country: 'Región Argentina (16 54)' },
  { code: '16 57', country: 'Región Colombia (16 57)' },
  { code: '16 56', country: 'Región Chile (16 56)' },
  { code: '16 51', country: 'Región Perú (16 51)' },
];

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onClose,
  onAddFriend,
  currentUserId,
}) => {
  const [countryCode, setCountryCode] = useState<string>('16');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState<string>(
    '¡Hola! Te agregué a mis amigos en PidgeX.'
  );
  const [category, setCategory] = useState<ChatCategory>('friends');
  const [successFriendName, setSuccessFriendName] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let rawPhone = phoneNumber.trim();

    if (!rawPhone) {
      setErrorMessage('Por favor introduce un número de teléfono válido.');
      return;
    }

    if (!rawPhone.startsWith('16')) {
      rawPhone = `${countryCode} ${rawPhone}`;
    }
    const finalPhone = ensurePhoneStartsWith16(rawPhone);

    setIsSearching(true);
    let foundUser = null;
    try {
      foundUser = await findUserByPhone(finalPhone, currentUserId);
    } catch (err) {
      console.warn('Error checking friend by phone:', err);
    }
    setIsSearching(false);

    const friendName = (foundUser && foundUser.name) || `Contacto (${finalPhone})`;
    const friendAvatar = (foundUser && foundUser.avatarUrl) || createSvgAvatar(friendName, '#2563eb');
    const friendUsername = (foundUser && foundUser.username) || undefined;

    const friendData: AddFriendData = {
      name: friendName,
      phone: finalPhone,
      username: friendUsername,
      avatarUrl: friendAvatar,
      initialMessage: initialMessage.trim() || undefined,
      category,
    };

    onAddFriend(friendData);
    setSuccessFriendName(friendName);

    setTimeout(() => {
      setSuccessFriendName(null);
      setPhoneNumber('');
      setErrorMessage(null);
      onClose();
    }, 1000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#141822] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#181d28]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2563eb] to-[#00a6e0] text-white flex items-center justify-center shadow-lg shadow-blue-950/40">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#dfe2ee]">Agregar Amigo por Teléfono</h2>
                <span className="px-2 py-0.5 rounded-full bg-[#00a6e0]/20 text-[#7bd0ff] text-[10px] font-bold border border-[#00a6e0]/30">
                  Red Real PidgeX
                </span>
              </div>
              <p className="text-[11px] text-[#8d90a0]">
                Solo puedes agregar contactos si otra persona ya tiene registrado ese número en la red
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#8d90a0] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {/* Error Message when Phone Number does NOT exist or belongs to self */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-950/90 border border-red-500/60 text-red-200 text-xs font-bold flex items-start gap-2.5 animate-in fade-in zoom-in-95 shadow-xl">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-red-100">{errorMessage}</span>
                <span className="text-[10px] font-normal text-red-300 leading-snug">
                  Regla de PidgeX: Solo se permite agregar un contacto si un usuario real diferente ya tiene ese número registrado en la base de datos.
                </span>
              </div>
            </div>
          )}

          {/* Phone Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 bg-[#181d28] p-4 rounded-2xl border border-white/10">
              <label className="text-xs font-bold text-[#dfe2ee] flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#7bd0ff]" />
                <span>Número de Teléfono de otra persona:</span>
              </label>
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-1.5 bg-[#0f131c] px-2.5 py-2 rounded-xl border border-white/10">
                  <CountryFlagBadge countryCode={countryCode} />
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-transparent text-xs text-[#dfe2ee] focus:outline-none cursor-pointer"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-[#181d28] text-white">
                        {c.code} ({c.country.replace(/\(.*\)/, '').trim()})
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 612 345 678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 bg-[#0f131c] text-sm text-[#dfe2ee] placeholder:text-[#8d90a0] px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
                />
              </div>
              <p className="text-[10px] text-[#8d90a0] italic">
                El número debe estar previamente registrado por otro usuario real en la base de datos de PidgeX.
              </p>
            </div>

            {/* Category selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#dfe2ee]">Categoría de contacto:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('friends')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    category === 'friends' || category === 'all'
                      ? 'bg-[#2563eb]/20 border-[#38bdf8] text-[#7bd0ff]'
                      : 'bg-[#181d28] border-white/5 text-[#8d90a0]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Amigos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('favorites')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    category === 'favorites'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-[#181d28] border-white/5 text-[#8d90a0]'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>Favorito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('work')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    category === 'work'
                      ? 'bg-[#943fe2]/20 border-[#ddb7ff] text-[#ddb7ff]'
                      : 'bg-[#181d28] border-white/5 text-[#8d90a0]'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Trabajo</span>
                </button>
              </div>
            </div>

            {/* Initial Message */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#dfe2ee] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#7bd0ff]" />
                <span>Mensaje inicial (opcional):</span>
              </label>
              <input
                type="text"
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Escribe un mensaje de saludo..."
                className="bg-[#0f131c] text-xs text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSearching}
              className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#2563eb] via-[#00a6e0] to-[#0284c7] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verificando si alguien tiene este número...</span>
                </>
              ) : successFriendName ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                  <span>¡{successFriendName} agregado con éxito!</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Buscar y Agregar Contacto Registrado</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
