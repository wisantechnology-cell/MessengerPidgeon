import React, { useState } from 'react';
import { X, Users, Phone, Check, Plus, AlertCircle, Loader2, Crown, Trash2, Sparkles } from 'lucide-react';
import { Chat, GroupMember, UserProfile } from '../types';
import { ensurePhoneStartsWith16 } from '../utils/phoneUtils';
import { createSvgAvatar } from '../utils/avatarUtils';
import { findUserByPhone } from '../utils/phoneValidation';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (
    groupName: string,
    members: GroupMember[],
    description?: string,
    groupAvatarUrl?: string
  ) => void;
  chats: Chat[];
  user: UserProfile;
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

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  chats,
  user,
}) => {
  const [groupName, setGroupName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('16');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [selectedFriends, setSelectedFriends] = useState<GroupMember[]>([
    {
      id: user.id || 'me',
      name: user.name || 'Tú (Creador)',
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isLeader: true, // El creador siempre es el primer líder
      joinedAt: 'Ahora',
    },
  ]);
  const [isSearchingPhone, setIsSearchingPhone] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter available friends from existing chats (not blocked)
  const availableFriends = chats.filter(
    (c) => !c.isBlocked && c.isFriend !== false && c.type === 'direct'
  );

  const toggleFriendSelection = (chat: Chat) => {
    const exists = selectedFriends.some((m) => m.id === chat.id || m.phone === chat.phone);
    if (exists) {
      // Remove unless it's the user creator
      if (chat.id === user.id || chat.id === 'me') return;
      setSelectedFriends((prev) => prev.filter((m) => m.id !== chat.id && m.phone !== chat.phone));
    } else {
      const newMember: GroupMember = {
        id: chat.id,
        name: chat.name,
        phone: chat.phone,
        avatarUrl: chat.avatarUrl,
        isLeader: false,
        addedBy: user.name,
        joinedAt: 'Ahora',
      };
      setSelectedFriends((prev) => [...prev, newMember]);
    }
  };

  const handleAddMemberByPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let rawPhone = phoneInput.trim();
    if (!rawPhone) {
      setErrorMessage('Por favor introduce un número de teléfono válido.');
      return;
    }

    if (!rawPhone.startsWith('16')) {
      rawPhone = `${countryCode} ${rawPhone}`;
    }
    const finalPhone = ensurePhoneStartsWith16(rawPhone);

    // Check if already added
    if (selectedFriends.some((m) => m.phone === finalPhone)) {
      setErrorMessage(`El número "${finalPhone}" ya está agregado a la lista de miembros.`);
      return;
    }

    setIsSearchingPhone(true);
    const foundUser = await findUserByPhone(finalPhone, user.id, user.phone);
    setIsSearchingPhone(false);

    if (!foundUser) {
      setErrorMessage(
        `❌ El número "${finalPhone}" NO pertenece a un usuario registrado en PidgeX. No se puede añadir al grupo.`
      );
      return;
    }

    const memberName = foundUser.name || `Contacto (${finalPhone})`;
    const memberAvatar = foundUser.avatarUrl || createSvgAvatar(memberName, '#00a6e0');

    const newMember: GroupMember = {
      id: foundUser.id || `member_${Date.now()}`,
      name: memberName,
      phone: finalPhone,
      avatarUrl: memberAvatar,
      isLeader: false,
      addedBy: user.name,
      joinedAt: 'Ahora',
    };

    setSelectedFriends((prev) => [...prev, newMember]);
    setPhoneInput('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setErrorMessage('Debes escribir un nombre para el grupo.');
      return;
    }

    if (selectedFriends.length < 2) {
      setErrorMessage('Debes añadir al menos 1 amigo o contacto además de ti para formar un grupo.');
      return;
    }

    const groupAvatar = createSvgAvatar(groupName.trim(), '#2563eb');
    onCreateGroup(groupName.trim(), selectedFriends, description.trim() || undefined, groupAvatar);
    
    // Reset form
    setGroupName('');
    setDescription('');
    setPhoneInput('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1c2028] border border-white/10 rounded-2xl w-full max-w-lg p-5 flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563eb] to-[#38bdf8] flex items-center justify-center text-white shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-[#dfe2ee]">Crear Nuevo Grupo</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold shadow-sm">
                  Gente Ilimitada ♾️
                </span>
              </div>
              <span className="text-[10px] text-[#8d90a0]">Agrega cuantos miembros desees sin restricciones ni límites</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#262a33] text-[#8d90a0] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/90 border border-red-500/60 text-red-200 text-xs font-bold flex items-start gap-2 shadow-lg">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {/* Group Details */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[#8d90a0] font-semibold">
              1. Nombre y Descripción del Grupo
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Grupo Ilimitado PidgeX, Amigos, Comunidad..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="bg-[#181c24] text-sm text-[#dfe2ee] placeholder:text-[#8d90a0] px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
            />
            <input
              type="text"
              placeholder="Descripción del grupo (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#181c24] text-xs text-[#dfe2ee] placeholder:text-[#8d90a0] px-3.5 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          {/* Add Member By Phone Section */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <label className="text-xs text-[#8d90a0] font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>2. Añadir miembro por Número de Teléfono</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">Sin Límite</span>
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-[#181c24] text-xs text-[#dfe2ee] px-2 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb] cursor-pointer"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-[#181c24] text-white">
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="Ej: 612 345 678"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="flex-1 bg-[#181c24] text-xs text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
              />
              <button
                type="button"
                onClick={handleAddMemberByPhone}
                disabled={isSearchingPhone || !phoneInput.trim()}
                className="px-3.5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isSearchingPhone ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Select from existing contacts with Bulk Select All */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#8d90a0] font-semibold">
                3. Seleccionar de tus Contactos ({availableFriends.length} disponibles)
              </label>
              {availableFriends.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const allSelected = availableFriends.every((f) =>
                      selectedFriends.some((m) => m.id === f.id || m.phone === f.phone)
                    );
                    if (allSelected) {
                      // Keep only self creator
                      setSelectedFriends([
                        {
                          id: user.id || 'me',
                          name: user.name || 'Tú (Creador)',
                          phone: user.phone,
                          avatarUrl: user.avatarUrl,
                          isLeader: true,
                          joinedAt: 'Ahora',
                        },
                      ]);
                    } else {
                      const newMembersList: GroupMember[] = [
                        {
                          id: user.id || 'me',
                          name: user.name || 'Tú (Creador)',
                          phone: user.phone,
                          avatarUrl: user.avatarUrl,
                          isLeader: true,
                          joinedAt: 'Ahora',
                        },
                        ...availableFriends.map((friend) => ({
                          id: friend.id,
                          name: friend.name,
                          phone: friend.phone,
                          avatarUrl: friend.avatarUrl,
                          isLeader: false,
                          addedBy: user.name,
                          joinedAt: 'Ahora',
                        })),
                      ];
                      setSelectedFriends(newMembersList);
                    }
                  }}
                  className="text-[11px] text-[#38bdf8] hover:text-[#7bd0ff] font-bold cursor-pointer transition-colors"
                >
                  {availableFriends.every((f) =>
                    selectedFriends.some((m) => m.id === f.id || m.phone === f.phone)
                  )
                    ? 'Deseleccionar Todos'
                    : '⚡ Seleccionar Todos mis Contactos'}
                </button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
              {availableFriends.length === 0 ? (
                <span className="text-xs text-[#8d90a0] italic p-2">
                  No tienes contactos guardados todavía. Puedes agregar cuántas personas desees introduciendo su número de teléfono arriba.
                </span>
              ) : (
                availableFriends.map((friend) => {
                  const isSelected = selectedFriends.some(
                    (m) => m.id === friend.id || m.phone === friend.phone
                  );
                  return (
                    <div
                      key={friend.id}
                      onClick={() => toggleFriendSelection(friend)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#2563eb]/20 border-[#38bdf8]/40 text-white'
                          : 'bg-[#181c24] border-white/5 hover:bg-[#262a33] text-[#dfe2ee]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={friend.avatarUrl}
                          alt={friend.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate">{friend.name}</span>
                          <span className="text-[10px] text-[#8d90a0] truncate">
                            {friend.phone || 'Contacto PidgeX'}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#2563eb] border-[#38bdf8] text-white'
                            : 'border-white/20'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Members list preview */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#dfe2ee] flex items-center gap-1.5">
                <span>Miembros Seleccionados ({selectedFriends.length}):</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Ilimitados ♾️
                </span>
              </span>
              <span className="text-[10px] text-[#38bdf8] font-bold">
                Líderes iniciales: {selectedFriends.filter((m) => m.isLeader).length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 bg-[#181c24] rounded-xl border border-white/5">
              {selectedFriends.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#262a33] border border-white/10 text-xs text-[#dfe2ee]"
                >
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="font-semibold truncate max-w-[120px]">{member.name}</span>
                  {member.isLeader && (
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                      <Crown className="w-3 h-3 text-amber-400" />
                      Líder
                    </span>
                  )}
                  {member.id !== user.id && member.id !== 'me' && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedFriends((prev) => prev.filter((m) => m.id !== member.id))
                      }
                      className="ml-0.5 text-[#8d90a0] hover:text-red-400 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Create Button */}
          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#00a6e0] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-sky-950/40 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Crear Grupo con {selectedFriends.length} Miembros (Ilimitado ♾️)</span>
          </button>
        </form>
      </div>
    </div>
  );
};
