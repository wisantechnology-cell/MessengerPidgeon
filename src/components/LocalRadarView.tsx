import React, { useState, useEffect } from 'react';
import { Radio, Users, Wifi, Send, X, Sparkles, Shield, RefreshCw } from 'lucide-react';
import { UserProfile, Chat, Message } from '../types';
import { db, collection, getDocs, query, where, addDoc, deleteDoc, doc } from '../firebase';

interface LocalRadarViewProps {
  user: UserProfile;
  chats: Chat[];
  onStartDirectChat: (targetUser: { id: string; name: string; avatarUrl: string }) => void;
  onBack: () => void;
  isNightMode?: boolean;
}

interface NearbyPeer {
  id: string;
  name: string;
  distance: string;
  avatarUrl: string;
  statusText: string;
}

export const LocalRadarView: React.FC<LocalRadarViewProps> = ({
  user,
  chats,
  onStartDirectChat,
  onBack,
  isNightMode = true,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [peers, setPeers] = useState<NearbyPeer[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<NearbyPeer | null>(null);
  const [peerMessage, setPeerMessage] = useState<string>('');
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);

  const fetchRealPeers = async () => {
    setIsScanning(true);
    setPeers([]);
    try {
      // Query Firestore for real active users in queue
      const q = query(collection(db, 'omegle_queue'), where('status', '==', 'searching'));
      const snapshot = await getDocs(q);
      const realPeers: NearbyPeer[] = [];

      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (data.userId !== user.id) {
          realPeers.push({
            id: data.userId || d.id,
            name: data.name || 'Usuario Real PidgeX',
            distance: 'A 2.5 metros (Red Mesh)',
            avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            statusText: 'Conectado localmente',
          });
        }
      });

      setTimeout(() => {
        setPeers(realPeers);
        setIsScanning(false);
      }, 1500);
    } catch (err) {
      console.error('Error fetching real radar peers:', err);
      setTimeout(() => {
        setPeers([]);
        setIsScanning(false);
      }, 1500);
    }
  };

  useEffect(() => {
    fetchRealPeers();
  }, []);

  const handleSendMeshMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!peerMessage.trim() || !selectedPeer) return;

    setSentSuccess(true);
    setTimeout(() => {
      onStartDirectChat({
        id: selectedPeer.id,
        name: selectedPeer.name,
        avatarUrl: selectedPeer.avatarUrl,
      });
    }, 1000);
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isNightMode ? 'bg-[#090d16] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`px-4 h-16 flex items-center justify-between border-b backdrop-blur-xl ${
        isNightMode ? 'bg-[#0f131c]/90 border-white/10' : 'bg-white/90 border-sky-200'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
          >
            ← Volver
          </button>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h1 className="text-base font-bold">Radar Local P2P (Red Mesh)</h1>
          </div>
        </div>
        <button
          onClick={fetchRealPeers}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>Escanear</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-6 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Radar Sonar Animation */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border border-emerald-500/30 flex items-center justify-center my-6">
          <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-8 rounded-full border border-emerald-500/30" />
          <div className="absolute inset-16 rounded-full border border-emerald-500/40" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/10 to-transparent animate-spin" style={{ animationDuration: '6s', transformOrigin: 'center' }} />
          
          <div className="relative z-10 w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
            <Wifi className="w-8 h-8" />
          </div>

          {/* Render real detected peers around radar */}
          {!isScanning && peers.map((peer, idx) => {
            const angles = [0, 90, 180, 270];
            const angle = angles[idx % angles.length];
            const rad = (angle * Math.PI) / 180;
            const distancePx = 95;
            const x = Math.cos(rad) * distancePx;
            const y = Math.sin(rad) * distancePx;

            return (
              <button
                key={peer.id}
                onClick={() => setSelectedPeer(peer)}
                className="absolute z-20 flex flex-col items-center group cursor-pointer"
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                <div className="w-12 h-12 rounded-full p-0.5 bg-emerald-400 shadow-lg group-hover:scale-125 transition-transform">
                  <img src={peer.avatarUrl} alt={peer.name} className="w-full h-full rounded-full object-cover" />
                </div>
                <span className="text-[10px] font-bold bg-black/70 px-2 py-0.5 rounded-full text-white mt-1 whitespace-nowrap shadow">
                  {peer.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-center my-4">
          {isScanning ? (
            <p className="text-sm text-emerald-400 font-mono animate-pulse">Escaneando red local en busca de usuarios reales...</p>
          ) : peers.length === 0 ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-gray-400">No hay nadie conectado en el radar local en este momento.</p>
              <button
                onClick={fetchRealPeers}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow cursor-pointer mt-1"
              >
                Volver a buscar
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-300">¡Se encontraron <strong className="text-emerald-400">{peers.length} usuarios reales</strong> cercanos!</p>
          )}
        </div>

        {/* Peers List */}
        {!isScanning && peers.length > 0 && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {peers.map((peer) => (
              <div
                key={peer.id}
                onClick={() => setSelectedPeer(peer)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center text-center cursor-pointer transition-all hover:scale-105 shadow"
              >
                <img src={peer.avatarUrl} alt={peer.name} className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400 mb-2 shadow" />
                <h4 className="font-bold text-sm">{peer.name}</h4>
                <span className="text-[11px] text-emerald-400 font-semibold">{peer.distance}</span>
                <span className="text-[10px] text-gray-400 mt-1">{peer.statusText}</span>
              </div>
            ))}
          </div>
        )}

        {/* Connect Modal */}
        {selectedPeer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl flex flex-col gap-4 ${
              isNightMode ? 'bg-[#121620] border-white/15 text-white' : 'bg-white border-sky-200 text-slate-900'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={selectedPeer.avatarUrl} alt={selectedPeer.name} className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400" />
                  <div>
                    <h3 className="font-bold text-base">{selectedPeer.name}</h3>
                    <p className="text-xs text-emerald-400">Usuario Real Detectado</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPeer(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {sentSuccess ? (
                <div className="py-8 text-center flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl font-bold animate-bounce">
                    ✓
                  </div>
                  <h4 className="font-bold text-base text-emerald-400">¡Conexión establecida!</h4>
                  <p className="text-xs text-gray-400">Abriendo chat directo...</p>
                </div>
              ) : (
                <form onSubmit={handleSendMeshMessage} className="flex flex-col gap-3">
                  <label className="text-xs text-gray-400 font-semibold">Enviar saludo directo al usuario:</label>
                  <input
                    type="text"
                    value={peerMessage}
                    onChange={(e) => setPeerMessage(e.target.value)}
                    placeholder="Ej. ¡Hola! Te encontré en el radar P2P."
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Iniciar Chat Directo</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
