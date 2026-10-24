import React, { useState } from 'react';
import {
  X,
  Users,
  Crown,
  UserPlus,
  UserMinus,
  ShieldCheck,
  Phone,
  Plus,
  LogOut,
  AlertCircle,
  Loader2,
  Check,
  ShieldAlert,
  MessageCircle,
} from 'lucide-react';
import { Chat, GroupMember, UserProfile } from '../types';
import { ensurePhoneStartsWith16 } from '../utils/phoneUtils';
import { createSvgAvatar } from '../utils/avatarUtils';
import { findUserByPhone } from '../utils/phoneValidation';

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  user: UserProfile;
  contacts: Chat[]; // available contacts
  onUpdateGroupMembers: (chatId: string, updatedMembers: GroupMember[]) => void;
  onLeaveGroup: (chatId: string) => void;
  onStartPrivateChat?: (member: GroupMember) => void;
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

export const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  isOpen,
  onClose,
  chat,
  user,
  contacts,
  onUpdateGroupMembers,
  onLeaveGroup,
  onStartPrivateChat,
}) => {
  const [showAddMemberSection, setShowAddMemberSection] = useState<boolean>(false);
  const [countryCode, setCountryCode] = useState<string>('16');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [isSearchingPhone, setIsSearchingPhone] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState<boolean>(false);

  if (!isOpen || chat.type !== 'group') return null;

  const groupMembers = chat.groupMembers || [
    {
      id: user.id || 'me',
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isLeader: true,
      joinedAt: 'Inicio',
    },
  ];

  // Determine if the current user is a Leader in this group
  const currentUserMember = groupMembers.find((m) => m.id === user.id || m.id === 'me');
  const isCurrentUserLeader = currentUserMember?.isLeader ?? true; // default true if creator

  // Available contacts not yet in group
  const availableContacts = contacts.filter(
    (c) =>
      !c.isBlocked &&
      c.isFriend !== false &&
      c.type === 'direct' &&
      !groupMembers.some((m) => m.id === c.id || (c.phone && m.phone === c.phone))
  );

  // Function to Add Member by Contact Selection
  const handleAddMemberFromContact = (contact: Chat) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const newMember: GroupMember = {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      avatarUrl: contact.avatarUrl,
      isLeader: false,
      addedBy: user.name,
      joinedAt: 'Hoy',
    };

    const updated = [...groupMembers, newMember];
    onUpdateGroupMembers(chat.id, updated);
    setSuccessMessage(`¡${contact.name} ha sido añadido al grupo!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Function to Add Member by Phone
  const handleAddMemberByPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    let rawPhone = phoneInput.trim();
    if (!rawPhone) {
      setErrorMessage('Introduce un número de teléfono válido.');
      return;
    }

    if (!rawPhone.startsWith('16')) {
      rawPhone = `${countryCode} ${rawPhone}`;
    }
    const finalPhone = ensurePhoneStartsWith16(rawPhone);

    if (groupMembers.some((m) => m.phone === finalPhone)) {
      setErrorMessage(`El número "${finalPhone}" ya pertenece a un miembro del grupo.`);
      return;
    }

    setIsSearchingPhone(true);
    const foundUser = await findUserByPhone(finalPhone, user.id);
    setIsSearchingPhone(false);

    if (!foundUser) {
      setErrorMessage(
        `❌ El número "${finalPhone}" no pertenece a un usuario registrado en PidgeX.`
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
      joinedAt: 'Hoy',
    };

    const updated = [...groupMembers, newMember];
    onUpdateGroupMembers(chat.id, updated);
    setPhoneInput('');
    setSuccessMessage(`¡${memberName} (${finalPhone}) se ha unido al grupo!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Toggle Leader Status (Promote / Demote)
  const handleToggleLeaderRole = (memberId: string) => {
    if (!isCurrentUserLeader) return;

    const updated = groupMembers.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          isLeader: !m.isLeader,
        };
      }
      return m;
    });

    onUpdateGroupMembers(chat.id, updated);
  };

  // Remove Member from Group
  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!isCurrentUserLeader) return;

    const updated = groupMembers.filter((m) => m.id !== memberId);
    onUpdateGroupMembers(chat.id, updated);
    setSuccessMessage(`Se ha eliminado a ${memberName} del grupo.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#1c2028] border border-white/10 rounded-2xl w-full max-w-lg p-5 flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <img
              src={chat.avatarUrl}
              alt={chat.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-400/40"
            />
            <div className="flex flex-col">
              <h3 className="font-bold text-base text-[#dfe2ee] flex items-center gap-2">
                <span>{chat.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <span>{groupMembers.length} Miembros</span>
                  <span>(Ilimitado ♾️)</span>
                </span>
              </h3>
              <p className="text-xs text-[#8d90a0]">
                {chat.description || 'Grupo oficial de PidgeX'}
              </p>
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
          <div className="p-3 rounded-xl bg-red-950/90 border border-red-500/60 text-red-200 text-xs font-bold flex items-center gap-2 shadow-lg">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Bar for Leaders */}
        {isCurrentUserLeader ? (
          <div className="p-3 rounded-xl bg-[#262a33] border border-sky-500/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#7bd0ff]">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Eres Líder de este Grupo</span>
              </div>
              <button
                onClick={() => setShowAddMemberSection(!showAddMemberSection)}
                className="px-3 py-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showAddMemberSection ? 'Cerrar Añadir' : '+ Incluir Gente'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#8d90a0]">
              Como líder puedes añadir miembros, promover a otros miembros como nuevos líderes o eliminarlos del grupo.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#262a33] border border-white/5 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#38bdf8] shrink-0" />
            <span className="text-xs text-[#8d90a0]">
              Eres miembro de este grupo. Los líderes pueden administrar integrantes.
            </span>
          </div>
        )}

        {/* Section: Add Members (If Leader expanded) */}
        {showAddMemberSection && isCurrentUserLeader && (
          <div className="p-3.5 rounded-xl bg-[#181c24] border border-white/10 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-150">
            <h4 className="text-xs font-bold text-[#dfe2ee] flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-[#38bdf8]" />
              <span>Incluir Gente al Grupo</span>
            </h4>

            {/* Add by phone input */}
            <form onSubmit={handleAddMemberByPhone} className="flex flex-col gap-2">
              <span className="text-[11px] text-[#8d90a0] font-semibold">
                Por Número de Teléfono:
              </span>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-[#262a33] text-xs text-[#dfe2ee] px-2 py-2 rounded-xl border border-white/10 focus:outline-none"
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
                  className="flex-1 bg-[#262a33] text-xs text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSearchingPhone || !phoneInput.trim()}
                  className="px-3 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isSearchingPhone ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Add from existing contacts */}
            {availableContacts.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10">
                <span className="text-[11px] text-[#8d90a0] font-semibold">
                  De tus contactos guardados:
                </span>
                <div className="max-h-28 overflow-y-auto flex flex-col gap-1">
                  {availableContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#262a33] hover:bg-[#323742] transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={contact.avatarUrl}
                          alt={contact.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="text-xs font-semibold text-white truncate">
                          {contact.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddMemberFromContact(contact)}
                        className="px-2.5 py-1 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Agregar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Member List */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#8d90a0] uppercase tracking-wider">
              Lista de Integrantes ({groupMembers.length})
            </span>
            <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" />
              <span>{groupMembers.filter((m) => m.isLeader).length} Líderes</span>
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {groupMembers.map((member) => {
              const isSelf = member.id === user.id || member.id === 'me';

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#262a33] border border-white/5 gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#dfe2ee] truncate">
                          {member.name} {isSelf && '(Tú)'}
                        </span>
                        {member.isLeader && (
                          <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0">
                            <Crown className="w-3 h-3 text-amber-300" />
                            <span>Líder</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#8d90a0] truncate">
                        {member.phone || 'Integrante PidgeX'}
                      </span>
                    </div>
                  </div>

                  {/* Role and Actions Controls for Leaders */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isSelf && (
                      <button
                        onClick={() => {
                          if (onStartPrivateChat) onStartPrivateChat(member);
                          onClose();
                        }}
                        title="Enviar mensaje privado (Susurrar solo entre tú y este amigo)"
                        className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-white border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3 text-blue-400" />
                        <span>Susurrar</span>
                      </button>
                    )}

                    {isCurrentUserLeader && !isSelf && (
                      <>
                        {/* Toggle Leader Button */}
                        <button
                          onClick={() => handleToggleLeaderRole(member.id)}
                          title={
                            member.isLeader
                              ? "Quitar rol de líder"
                              : "Convertir en otro líder del grupo"
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            member.isLeader
                              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                              : 'bg-white/5 hover:bg-white/10 text-[#8d90a0] hover:text-amber-300 border border-white/10'
                          }`}
                        >
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>{member.isLeader ? 'Líder' : '+ Hacer Líder'}</span>
                        </button>

                        {/* Remove Member Button */}
                        <button
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          title="Eliminar del grupo"
                          className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 hover:text-red-200 border border-red-500/30 transition-all cursor-pointer"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave Group Section */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-[#8d90a0]">¿Ya no deseas estar en este grupo?</span>
          <button
            onClick={() => setShowLeaveConfirmation(true)}
            className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salirse del Grupo</span>
          </button>
        </div>

        {/* Leave Confirmation Dialog */}
        {showLeaveConfirmation && (
          <div className="p-4 rounded-2xl bg-red-950/95 border border-red-500/40 flex flex-col gap-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-200 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>¿Confirmas salirte del grupo?</span>
            </div>
            <p className="text-xs text-red-200/80 leading-relaxed">
              Al salirte de <strong className="text-white">{chat.name}</strong>, ya no verás las conversaciones futuras ni podrás enviar mensajes a este grupo.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowLeaveConfirmation(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#dfe2ee] hover:bg-white/10 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowLeaveConfirmation(false);
                  onLeaveGroup(chat.id);
                  onClose();
                }}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sí, Salirme</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
