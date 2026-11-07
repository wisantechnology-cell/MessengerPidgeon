import React, { useState, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, SkipForward, X, Sparkles, UserCheck, Users } from 'lucide-react';
import { UserProfile } from '../../types';
import { db, collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, onSnapshot } from '../../firebase';

interface OmegleGameProps {
  user: UserProfile;
  onClose: () => void;
  isNightMode?: boolean;
}

interface RealStranger {
  userId: string;
  name: string;
  avatarUrl: string;
}

export const OmegleGame: React.FC<OmegleGameProps> = ({
  user,
  onClose,
  isNightMode = true,
}) => {
  const [status, setStatus] = useState<'searching' | 'connected' | 'nobody'>('searching');
  const [currentStranger, setCurrentStranger] = useState<RealStranger | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let myQueueId: string | null = null;
    let unsubscribeMatch: (() => void) | null = null;

    const startSearch = async () => {
      if (!isMounted) return;
      setStatus('searching');
      setCurrentStranger(null);

      try {
        const q = query(collection(db, 'omegle_queue'), where('status', '==', 'searching'));
        const snapshot = await getDocs(q);
        const others = snapshot.docs.filter((d) => d.data().userId !== user.id);

        if (others.length > 0) {
          const matchDoc = others[0];
          const matchData = matchDoc.data();
          await updateDoc(doc(db, 'omegle_queue', matchDoc.id), {
            status: 'matched',
            matchedWith: user.id,
            matchName: user.name,
            matchAvatar: user.avatarUrl,
          });

          if (isMounted) {
            setCurrentStranger({
              userId: matchData.userId,
              name: matchData.name || 'Usuario PidgeX',
              avatarUrl: matchData.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            });
            setStatus('connected');
          }
        } else {
          const docRef = await addDoc(collection(db, 'omegle_queue'), {
            userId: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            status: 'searching',
            createdAt: Date.now(),
          });
          myQueueId = docRef.id;

          unsubscribeMatch = onSnapshot(doc(db, 'omegle_queue', myQueueId), (docSnap) => {
            if (!isMounted) return;
            const data = docSnap.data();
            if (data && data.status === 'matched' && data.matchedWith) {
              if (isMounted) {
                setCurrentStranger({
                  userId: data.matchedWith,
                  name: data.matchName || 'Usuario PidgeX',
                  avatarUrl: data.matchAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                });
                setStatus('connected');
              }
            }
          });

          const timeout = setTimeout(() => {
            if (isMounted && status === 'searching') {
              setStatus('nobody');
              if (myQueueId) {
                deleteDoc(doc(db, 'omegle_queue', myQueueId)).catch(() => {});
                myQueueId = null;
              }
            }
          }, 5000);

          return () => clearTimeout(timeout);
        }
      } catch (err) {
        console.error('Omegle real match error:', err);
        if (isMounted) setStatus('nobody');
      }
    };

    startSearch();

    return () => {
      isMounted = false;
      if (unsubscribeMatch) unsubscribeMatch();
      if (myQueueId) {
        deleteDoc(doc(db, 'omegle_queue', myQueueId)).catch(() => {});
      }
    };
  }, [user]);

  const handleRetry = () => {
    setStatus('searching');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className={`relative w-full max-w-3xl h-[80vh] rounded-3xl border shadow-2xl flex flex-col justify-between overflow-hidden ${
        isNightMode ? 'bg-[#0b0e14] border-white/15 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
      }`}>
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold">PidgeCam Real (Videollamada)</h3>
              <p className="text-[11px] text-[#8d90a0]">Conexiones en directo 100% video con usuarios reales</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón secreto sin función */}
            <button
              type="button"
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[10px] text-rose-300 font-mono select-none cursor-default opacity-80"
              title="Modo Secreto PidgeCam"
            >
              SEC-V9
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-gray-950 flex flex-col items-center justify-center p-6">
          {status === 'searching' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-rose-500/30 border-t-rose-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="w-8 h-8 text-rose-400 animate-pulse" />
                </div>
              </div>
              <h4 className="text-lg font-bold text-white">Buscando videollamada con usuario real...</h4>
              <p className="text-xs text-gray-400">Sincronizando cámara y red global PidgeX</p>
            </div>
          )}

          {status === 'nobody' && (
            <div className="flex flex-col items-center gap-4 text-center p-6">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                <Users className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-white">No hay nadie conectado en este momento</h4>
              <p className="text-xs text-gray-400 max-w-sm">
                Ningún otro usuario está buscando videollamada en este segundo. Inténtalo de nuevo más tarde.
              </p>
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer mt-2"
              >
                Buscar de nuevo
              </button>
            </div>
          )}

          {status === 'connected' && currentStranger && (
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black flex items-center justify-center">
              <img
                src={currentStranger.avatarUrl}
                alt={currentStranger.name}
                className={`w-full h-full object-cover filter contrast-115 ${isVideoOff ? 'blur-xl' : ''}`}
              />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>{currentStranger.name} (Videollamada en Vivo)</span>
              </div>

              <div className="absolute bottom-4 right-4 w-36 h-28 rounded-2xl bg-gray-900 border-2 border-white/20 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className={`w-full h-full object-cover ${isVideoOff ? 'blur-md' : ''}`}
                />
                <div className="absolute bottom-1 left-1 bg-black/60 px-2 py-0.5 rounded text-[9px] font-bold text-white">
                  Tú
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-2xl text-white transition-all cursor-pointer shadow-lg ${
                isMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-white/10 hover:bg-white/20 border border-white/10'
              }`}
              title={isMuted ? 'Activar micrófono' : 'Silenciar'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-3.5 rounded-2xl text-white transition-all cursor-pointer shadow-lg ${
                isVideoOff ? 'bg-red-600 hover:bg-red-500' : 'bg-white/10 hover:bg-white/20 border border-white/10'
              }`}
              title={isVideoOff ? 'Encender cámara' : 'Apagar cámara'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          </div>

          <button
            onClick={handleRetry}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-xs flex items-center gap-2 shadow-xl hover:scale-105 transition-all cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
            <span>Siguiente Extraño (Next)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
