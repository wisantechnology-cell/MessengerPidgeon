import React from 'react';
import { X, Shield, Phone, Mail, MessageCircle, UserCheck, Star } from 'lucide-react';
import { Chat, UserProfile } from '../types';

interface ContactProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Chat | null;
  user: UserProfile;
  isNightMode?: boolean;
  onStartChat?: (contact: Chat) => void;
}

export const ContactProfileModal: React.FC<ContactProfileModalProps> = ({
  isOpen,
  onClose,
  contact,
  user,
  isNightMode = false,
  onStartChat,
}) => {
  if (!isOpen || !contact) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`relative max-w-sm w-full rounded-3xl p-6 border shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200 ${
        isNightMode
          ? 'bg-[#181c24] border-white/10 text-white'
          : 'bg-white border-sky-200 text-[#0c2340]'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div className="relative mb-4">
          <img
            src={contact.avatarUrl}
            alt={contact.name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/30 shadow-2xl"
          />
          {contact.isOnline !== false && (
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#181c24]" />
          )}
        </div>

        {/* Name & Username */}
        <h3 className="text-xl font-black tracking-tight">{contact.name}</h3>
        <span className="text-xs text-blue-400 font-mono mt-0.5">{contact.username || `@${contact.name.toLowerCase().replace(/\s+/g, '')}`}</span>

        {/* Bio */}
        <p className="text-xs text-[#8d90a0] mt-3 italic max-w-xs leading-relaxed">
          "{contact.description || contact.statusText || 'Disponible en PidgeX • Conectando sin límites'}"
        </p>

        {/* Badges */}
        <div className="mt-4 flex items-center gap-2">
          {contact.isFriend && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Amigo
            </span>
          )}
          <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 text-xs font-semibold flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> PidgeX Verified
          </span>
        </div>

        {/* Phone & Info */}
        {contact.phone && (
          <div className="mt-5 w-full bg-black/5 dark:bg-white/5 p-3 rounded-2xl flex items-center justify-between text-xs">
            <span className="text-[#8d90a0]">Teléfono</span>
            <span className="font-mono font-bold">{contact.phone}</span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3 w-full">
          <button
            onClick={() => {
              onClose();
              if (onStartChat) onStartChat(contact);
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#38bdf8] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-102 active:scale-95 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar Mensaje</span>
          </button>
        </div>
      </div>
    </div>
  );
};
