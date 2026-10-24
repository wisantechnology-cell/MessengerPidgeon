import React, { useState } from 'react';
import { X, MapPin, Send, Navigation } from 'lucide-react';
import { Chat, UserProfile } from '../types';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  user: UserProfile;
  isNightMode?: boolean;
  onSendLocation: (chatId: string, lat: number, lng: number, address: string) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  chat,
  user,
  isNightMode = false,
  onSendLocation,
}) => {
  if (!isOpen) return null;

  const [address, setAddress] = useState<string>('📍 Centro de la Ciudad, Calle Principal #123');
  const [lat] = useState<number>(19.4326);
  const [lng] = useState<number>(-99.1332);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendLocation(chat.id, lat, lng, address.trim() || 'Ubicación actual');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-[420px] rounded-3xl p-6 border shadow-2xl flex flex-col gap-5 ${
        isNightMode ? 'bg-[#181c24] border-white/10 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
      }`}>
        <div className="flex items-center justify-between border-b pb-3 border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Compartir Ubicación 📍</h3>
              <p className="text-[11px] text-[#8d90a0]">Envía tu posición GPS o punto de encuentro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Simulated Map Preview */}
          <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-white/10 bg-[#121620] flex items-center justify-center group">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative z-10 flex flex-col items-center gap-2 animate-bounce">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl ring-4 ring-red-500/30">
                <MapPin className="w-6 h-6 fill-white" />
              </div>
              <span className="text-[10px] font-mono font-bold bg-black/60 text-white px-2.5 py-1 rounded-full border border-white/10">
                Lat: {lat}, Lng: {lng}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#8d90a0]">Descripción de Ubicación / Dirección</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Cafetería Central, nos vemos en 10 min"
              className="bg-[#121620] text-xs text-white px-3.5 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-all cursor-pointer mt-1"
          >
            <Navigation className="w-4 h-4" />
            <span>Enviar Ubicación Actual</span>
          </button>
        </form>
      </div>
    </div>
  );
};
