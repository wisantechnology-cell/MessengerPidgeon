import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Phone,
  User,
  Sparkles,
  Check,
  Search,
  MessageSquare,
  ShieldCheck,
  Heart,
  Briefcase,
  Star,
  Users,
  Smartphone,
  ArrowRight,
} from 'lucide-react';
import { ChatCategory } from '../types';
import { ensurePhoneStartsWith16 } from '../utils/phoneUtils';
import { createSvgAvatar } from '../utils/avatarUtils';

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
}

// Suggested contacts in the MessengerPidgeon network
const SUGGESTED_FRIENDS = [
  {
    name: 'David Silva',
    username: '@davidsilva',
    phone: '16 699 123 456',
    bio: 'Desarrollador Frontend & Entusiasta UI 🚀',
    avatarUrl: createSvgAvatar('D', '#2563eb'),
    category: 'work' as ChatCategory,
  },
  {
    name: 'Lucía Ramos',
    username: '@luciaramos',
    phone: '16 677 889 900',
    bio: 'Fotógrafa & Diseñadora Visual 📷✨',
    avatarUrl: createSvgAvatar('L', '#059669'),
    category: 'favorites' as ChatCategory,
  },
  {
    name: 'Mateo Morales',
    username: '@mateomorales',
    phone: '16 55 4123 8899',
    bio: 'Product Manager en Startup 📱',
    avatarUrl: createSvgAvatar('M', '#7c3aed'),
    category: 'all' as ChatCategory,
  },
  {
    name: 'Valentina Ríos',
    username: '@valerios',
    phone: '16 11 5566 7788',
    bio: 'Amante de la música y la tecnología 🎵',
    avatarUrl: createSvgAvatar('V', '#db2777'),
    category: 'favorites' as ChatCategory,
  },
];

const COUNTRY_CODES = [
  { code: '16', country: 'MessengerPidgeon Directo (16)', flag: '🕊️' },
  { code: '16 34', country: 'Región España (16 34)', flag: '🇪🇸' },
  { code: '16 52', country: 'Región México (16 52)', flag: '🇲🇽' },
  { code: '16 1', country: 'Región EE.UU. / CA (16 1)', flag: '🇺🇸' },
  { code: '16 54', country: 'Región Argentina (16 54)', flag: '🇦🇷' },
  { code: '16 57', country: 'Región Colombia (16 57)', flag: '🇨🇴' },
  { code: '16 56', country: 'Región Chile (16 56)', flag: '🇨🇱' },
  { code: '16 51', country: 'Región Perú (16 51)', flag: '🇵🇪' },
];

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onClose,
  onAddFriend,
}) => {
  const [method, setMethod] = useState<'phone' | 'name'>('phone');
  
  // Fields
  const [countryCode, setCountryCode] = useState<string>('16');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState<string>(
    '¡Hola! Te agregué a mis amigos en MessengerPidgeon 🕊️'
  );
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    createSvgAvatar('A', '#2563eb')
  );
  const [category, setCategory] = useState<ChatCategory>('friends');
  const [successFriendName, setSuccessFriendName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectSuggested = (suggested: (typeof SUGGESTED_FRIENDS)[0]) => {
    setName(suggested.name);
    setUsername(suggested.username);
    setPhoneNumber(suggested.phone.replace(/^16[\s-]*/, ''));
    setSelectedAvatar(suggested.avatarUrl);
    setCategory(suggested.category);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalName = name.trim();
    let finalPhone = phoneNumber.trim();

    if (method === 'phone') {
      if (!finalPhone) return;
      if (!finalPhone.startsWith('16')) {
        finalPhone = `${countryCode} ${finalPhone}`;
      }
      finalPhone = ensurePhoneStartsWith16(finalPhone);
      if (!finalName) {
        // Default name based on phone number if not given
        finalName = `Amigo (${finalPhone})`;
      }
    } else {
      if (!finalName) return;
      if (finalPhone) {
        finalPhone = ensurePhoneStartsWith16(finalPhone);
      }
    }

    const friendData: AddFriendData = {
      name: finalName,
      phone: finalPhone || undefined,
      username: username.trim() || undefined,
      avatarUrl: selectedAvatar,
      initialMessage: initialMessage.trim() || undefined,
      category,
    };

    onAddFriend(friendData);
    setSuccessFriendName(finalName);

    setTimeout(() => {
      setSuccessFriendName(null);
      // Reset form
      setPhoneNumber('');
      setName('');
      setUsername('');
      onClose();
    }, 1200);
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
                <h2 className="text-base font-bold text-[#dfe2ee]">Agregar Nuevo Amigo</h2>
                <span className="px-2 py-0.5 rounded-full bg-[#00a6e0]/20 text-[#7bd0ff] text-[10px] font-bold border border-[#00a6e0]/30">
                  Bird Network
                </span>
              </div>
              <p className="text-[11px] text-[#8d90a0]">
                Añade contactos por su número de teléfono o por su nombre en la app
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
          {/* Method Selection Tabs: Por Teléfono vs Por Nombre */}
          <div className="grid grid-cols-2 gap-2 bg-[#0c1017] p-1.5 rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => setMethod('phone')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                method === 'phone'
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#00a6e0] text-white shadow-md'
                  : 'text-[#8d90a0] hover:text-[#dfe2ee]'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Por Teléfono en la App</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('name')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                method === 'name'
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#00a6e0] text-white shadow-md'
                  : 'text-[#8d90a0] hover:text-[#dfe2ee]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Por Nombre o Usuario</span>
            </button>
          </div>

          {/* Quick suggestions bar */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#8d90a0] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#7bd0ff]" />
              <span>Amigos sugeridos en la red MessengerPidgeon</span>
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {SUGGESTED_FRIENDS.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggested(sug)}
                  className="px-3 py-2 rounded-2xl bg-[#1c212c] hover:bg-[#262c3a] border border-white/5 hover:border-[#38bdf8]/40 transition-all flex items-center gap-2 shrink-0 group active:scale-95 cursor-pointer text-left"
                >
                  <img
                    src={sug.avatarUrl}
                    alt={sug.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#dfe2ee] group-hover:text-[#7bd0ff] transition-colors leading-tight">
                      {sug.name}
                    </span>
                    <span className="text-[10px] text-[#8d90a0] leading-tight">
                      {sug.phone}
                    </span>
                  </div>
                  <UserPlus className="w-3.5 h-3.5 text-[#7bd0ff] opacity-60 group-hover:opacity-100 ml-1" />
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Conditional input based on method */}
            {method === 'phone' ? (
              <div className="flex flex-col gap-1.5 bg-[#181d28] p-3.5 rounded-2xl border border-white/5">
                <label className="text-xs font-bold text-[#dfe2ee] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#7bd0ff]" />
                  <span>Número de Teléfono en MessengerPidgeon:</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-[#0f131c] text-xs text-[#dfe2ee] px-2.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb] cursor-pointer"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-[#181d28] text-white">
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 612 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 bg-[#0f131c] text-sm text-[#dfe2ee] placeholder:text-[#8d90a0] px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
                <div className="mt-1 flex flex-col gap-1">
                  <label className="text-[11px] text-[#8d90a0]">
                    Nombre o Apodo del amigo (opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Laura Martínez, David..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-[#0f131c] text-xs text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 bg-[#181d28] p-3.5 rounded-2xl border border-white/5">
                <label className="text-xs font-bold text-[#dfe2ee] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#7bd0ff]" />
                  <span>Nombre del Amigo o Contacto:</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: David Silva, Sofia Benítez..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#0f131c] text-sm text-[#dfe2ee] placeholder:text-[#8d90a0] px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#8d90a0]">Usuario / Alias (opcional):</label>
                    <input
                      type="text"
                      placeholder="Ej: @davidsilva"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-[#0f131c] text-xs text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#8d90a0]">Teléfono (opcional):</label>
                    <input
                      type="tel"
                      placeholder="Ej: 16 612 000 000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-[#0f131c] text-xs text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                </div>
              </div>
            )}



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
                <span>Mensaje inicial de bienvenida (opcional):</span>
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
              className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-[#2563eb] via-[#00a6e0] to-[#0284c7] text-white text-xs font-bold shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
            >
              {successFriendName ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                  <span>¡{successFriendName} agregado a tus amigos!</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {method === 'phone'
                      ? 'Agregar Amigo por Teléfono'
                      : 'Agregar Amigo por Nombre'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
