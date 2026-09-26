import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  X,
  Sparkles,
  ShieldCheck,
  Check,
  ChevronRight,
  UserCheck,
  Info,
} from 'lucide-react';
import { Chat, ChatCategory } from '../types';
import {
  PotentialAcquaintance,
  MutualFriendInfo,
  getEligiblePotentialAcquaintances,
} from '../data/potentialAcquaintances';
import { AddFriendData } from './AddFriendModal';

interface PotentialAcquaintancesSectionProps {
  chats: Chat[];
  onAddFriend: (data: AddFriendData) => void;
  onOpenAddFriend: () => void;
}

export const PotentialAcquaintancesSection: React.FC<PotentialAcquaintancesSectionProps> = ({
  chats,
  onAddFriend,
  onOpenAddFriend,
}) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('birdmessage_dismissed_potential_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState<MutualFriendInfo | null>(null);

  const eligibleAcquaintances = getEligiblePotentialAcquaintances(chats, dismissedIds);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem('birdmessage_dismissed_potential_v1', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = (info: MutualFriendInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    const { friend, mutualFriends } = info;
    const mutualName = mutualFriends[0]?.name || 'un amigo en común';
    
    onAddFriend({
      name: friend.name,
      phone: friend.phone,
      username: friend.username,
      avatarUrl: friend.avatarUrl,
      category: friend.category,
      initialMessage: `¡Hola ${friend.name}! Te vi en posibles conocidos porque somos amigos de ${mutualName}. ¡Encantado de conectar en MessengerPidgeon! 🕊️✨`,
    });

    setAddedIds((prev) => [...prev, friend.id]);
  };

  return (
    <section className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-[#141822]/80 backdrop-blur-xl border border-white/10 shadow-lg animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-[#dfe2ee]">Posibles conocidos</h3>
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-[#0084ff]/20 text-[#7bd0ff] border border-[#0084ff]/30">
                Amigos de tus amigos
              </span>
            </div>
          </div>
        </div>

        {eligibleAcquaintances.length > 0 && (
          <span className="text-[11px] font-medium text-[#8d90a0]">
            {eligibleAcquaintances.length}{' '}
            {eligibleAcquaintances.length === 1 ? 'sugerencia' : 'sugerencias'}
          </span>
        )}
      </div>

      {/* Subtitle Rule Note */}
      <p className="text-[11px] text-[#8d90a0] px-1 -mt-1 leading-tight">
        Personas que comparten amigos en común con tus contactos agregados.
      </p>

      {/* Content: If there are mutual connections */}
      {eligibleAcquaintances.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {eligibleAcquaintances.map((info) => {
            const { friend, mutualFriends } = info;
            const isAdded = addedIds.includes(friend.id);

            return (
              <div
                key={friend.id}
                onClick={() => setShowDetailsModal(info)}
                className="group relative flex flex-col justify-between p-3 rounded-xl bg-[#1a1f2c]/90 border border-white/10 hover:border-sky-500/40 hover:bg-[#202737] transition-all cursor-pointer shadow-sm active:scale-[0.99]"
              >
                {/* Dismiss button */}
                <button
                  onClick={(e) => handleDismiss(friend.id, e)}
                  title="Ocultar sugerencia"
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/5 hover:bg-white/15 text-[#8d90a0] hover:text-white flex items-center justify-center transition-colors z-10 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Main profile row */}
                <div className="flex items-start gap-2.5 pr-6">
                  <div className="relative shrink-0">
                    <img
                      src={friend.avatarUrl}
                      alt={friend.name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-sky-500/30 group-hover:ring-sky-400 transition-all"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0084ff] border-2 border-[#1a1f2c] flex items-center justify-center text-white text-[8px] font-bold">
                      ✓
                    </div>
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs text-white truncate group-hover:text-sky-300 transition-colors">
                        {friend.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8d90a0] truncate font-mono">
                      {friend.username}
                    </span>
                    <p className="text-[11px] text-[#dfe2ee]/90 line-clamp-1 mt-0.5">
                      {friend.bio}
                    </p>
                  </div>
                </div>

                {/* Mutual Friends Pill */}
                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {/* Mutual friend avatar stack */}
                    <div className="flex -space-x-1.5 shrink-0">
                      {mutualFriends.slice(0, 2).map((mf) => (
                        <img
                          key={mf.id}
                          src={mf.avatarUrl}
                          alt={mf.name}
                          title={`Amigo en común: ${mf.name}`}
                          className="w-4 h-4 rounded-full object-cover ring-1 ring-[#1a1f2c]"
                        />
                      ))}
                    </div>

                    <span className="text-[10px] font-medium text-sky-400 truncate">
                      {mutualFriends.length === 1
                        ? `Amigo de ${mutualFriends[0].name}`
                        : `${mutualFriends.length} amigos en común (${mutualFriends[0].name.split(' ')[0]}...)`}
                    </span>
                  </div>

                  {/* Add action */}
                  {isAdded ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Agregado</span>
                    </span>
                  ) : (
                    <button
                      onClick={(e) => handleAdd(info, e)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0084ff] hover:bg-[#0070db] text-white text-[11px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>+ Agregar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state when user has no mutual connections or hasn't added friends */
        <div className="flex flex-col items-center text-center p-4 rounded-xl bg-[#181d28]/70 border border-white/5 gap-2">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sky-400/80 mb-0.5">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0.5 max-w-sm">
            <span className="text-xs font-bold text-[#dfe2ee]">
              {chats.length === 0
                ? 'Agrega amigos para ver conexiones'
                : 'Sin nuevos amigos de amigos por ahora'}
            </span>
            <p className="text-[11px] text-[#8d90a0] leading-relaxed">
              {chats.length === 0
                ? 'Cuando agregues a tus primeros contactos en MessengerPidgeon, aquí se sugerirán automáticamente las personas que sean amigos de tus amigos.'
                : 'Solo te mostramos sugerencias cuando existe al menos un amigo en común con tus contactos agregados.'}
            </p>
          </div>

          {chats.length === 0 && (
            <button
              onClick={onOpenAddFriend}
              className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0084ff] hover:bg-[#0070db] text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Agregar mi primer amigo</span>
            </button>
          )}
        </div>
      )}

      {/* Detail Modal for mutual friend connections */}
      {showDetailsModal && (
        <div
          onClick={() => setShowDetailsModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#1c2230] border border-white/10 shadow-2xl p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={showDetailsModal.friend.avatarUrl}
                  alt={showDetailsModal.friend.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-sky-400"
                />
                <div className="flex flex-col">
                  <h4 className="font-bold text-base text-white flex items-center gap-1.5">
                    <span>{showDetailsModal.friend.name}</span>
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                  </h4>
                  <span className="text-xs text-sky-400 font-mono">
                    {showDetailsModal.friend.username}
                  </span>
                  <span className="text-[11px] text-[#8d90a0]">
                    {showDetailsModal.friend.phone}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#dfe2ee] bg-white/5 p-2.5 rounded-xl">
              {showDetailsModal.friend.bio}
            </p>

            {/* List of mutual friends */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-[#8d90a0] uppercase tracking-wider">
                Amigos en común ({showDetailsModal.mutualFriends.length}):
              </span>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                {showDetailsModal.mutualFriends.map((mf) => (
                  <div
                    key={mf.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5"
                  >
                    <img
                      src={mf.avatarUrl}
                      alt={mf.name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-sky-400/40"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs text-white truncate">{mf.name}</span>
                      <span className="text-[10px] text-sky-400 truncate">
                        Está en tus contactos agregados
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  handleDismiss(showDetailsModal.friend.id, {} as any);
                  setShowDetailsModal(null);
                }}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#8d90a0] hover:text-white transition-colors cursor-pointer"
              >
                Descartar
              </button>
              <button
                onClick={(e) => {
                  handleAdd(showDetailsModal, e);
                  setShowDetailsModal(null);
                }}
                className="flex-1 py-2 rounded-xl bg-[#0084ff] hover:bg-[#0070db] text-xs font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Agregar Amigo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
