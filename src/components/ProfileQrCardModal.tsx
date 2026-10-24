import React, { useState, useRef, useEffect } from 'react';
import { X, QrCode, Copy, Check, Camera, CameraOff, Sparkles, UserPlus, Shield } from 'lucide-react';
import { UserProfile, Chat } from '../types';

interface ProfileQrCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  isNightMode?: boolean;
  onAddScannedContact?: (name: string, username: string) => void;
}

export const ProfileQrCardModal: React.FC<ProfileQrCardModalProps> = ({
  isOpen,
  onClose,
  user,
  isNightMode = false,
  onAddScannedContact,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'my_qr' | 'scan'>('my_qr');
  const [copied, setCopied] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const profileUrl = `${window.location.origin}/?user=${encodeURIComponent(user.username || user.id)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Start Camera for scanning
  useEffect(() => {
    if (activeTab === 'scan') {
      setIsCameraActive(true);
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Fallback camera simulation if permission denied or unavailable
          setIsCameraActive(false);
        });
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleSimulateScan = () => {
    const scannedNames = ['Sofía PidgeX', 'Mateo Dev', 'Valentina Gamer', 'Lucas Tech'];
    const randomName = scannedNames[Math.floor(Math.random() * scannedNames.length)];
    const username = `@${randomName.toLowerCase().replace(/\s+/g, '')}`;

    setScanSuccess(randomName);
    if (onAddScannedContact) {
      onAddScannedContact(randomName, username);
    }
    setTimeout(() => {
      setScanSuccess(null);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`relative max-w-sm w-full rounded-3xl p-6 border shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200 overflow-hidden ${
        isNightMode ? 'bg-[#181c24] border-white/10 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
      }`}>
        {/* Background glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none" />

        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center cursor-pointer hover:bg-red-500/20 hover:text-red-400 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-black/10 dark:bg-white/5 p-1 rounded-2xl w-full mb-4 z-10">
          <button
            onClick={() => { setActiveTab('my_qr'); setScanSuccess(null); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'my_qr' ? 'bg-blue-600 text-white shadow' : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Mi Código QR</span>
          </button>
          <button
            onClick={() => { setActiveTab('scan'); setScanSuccess(null); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'scan' ? 'bg-blue-600 text-white shadow' : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Escanear QR</span>
          </button>
        </div>

        {activeTab === 'my_qr' ? (
          <>
            {/* Badge header */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-[#38bdf8] border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider mb-3 z-10">
              <QrCode className="w-3.5 h-3.5" />
              <span>Tarjeta Digital PidgeX</span>
            </div>

            {/* Avatar */}
            <div className="relative mb-2.5 z-10">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-500/40 shadow-xl"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#181c24]" />
            </div>

            <h3 className="text-lg font-black tracking-tight z-10">{user.name}</h3>
            <span className="text-xs text-blue-400 font-mono mt-0.5 z-10">{user.username || '@pidgeuser'}</span>

            {/* QR Code Visual Mock */}
            <div className="my-4 p-4 rounded-2xl bg-white text-black shadow-xl border-2 border-blue-500/30 flex flex-col items-center justify-center relative z-10">
              <div className="w-32 h-32 bg-slate-900 rounded-xl p-2.5 flex flex-col items-center justify-center text-white relative overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-1 p-2 opacity-90">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-sm ${i % 2 === 0 || i % 5 === 0 ? 'bg-white' : 'bg-blue-600'}`}
                    />
                  ))}
                </div>
                <div className="relative z-10 bg-white text-black font-black text-[10px] px-2 py-0.5 rounded shadow">
                  PidgeX QR
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-700 mt-2">Escanea para conectar</span>
            </div>

            {/* Copy link action */}
            <button
              onClick={handleCopyLink}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-[#38bdf8] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer z-10"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Enlace copiado al portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Enlace de Perfil</span>
                </>
              )}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center w-full gap-3 z-10">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black border-2 border-blue-500/40 shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isCameraActive && (
                <div className="absolute inset-0 bg-[#121620] flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <CameraOff className="w-10 h-10 text-red-400 opacity-80" />
                  <span className="text-xs text-[#8d90a0]">Cámara no disponible o simulada en este entorno web</span>
                </div>
              )}

              {/* Viewfinder laser scanner animation */}
              <div className="absolute inset-6 border-2 border-dashed border-blue-400/70 rounded-xl flex items-center justify-center pointer-events-none">
                <div className="w-full h-0.5 bg-red-500 animate-pulse shadow-[0_0_12px_#ef4444]" />
              </div>

              {scanSuccess && (
                <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-2 p-4 animate-in fade-in duration-200">
                  <UserPlus className="w-12 h-12 text-emerald-400 animate-bounce" />
                  <h4 className="text-sm font-bold text-white">¡Contacto Escaneado!</h4>
                  <p className="text-xs text-emerald-300">Añadiendo a {scanSuccess}...</p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-[#8d90a0] text-center">
              Apunta con la cámara hacia el código QR de otro usuario de PidgeX para agregarlo instantáneamente.
            </p>

            <button
              onClick={handleSimulateScan}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simular Escaneo Exitoso 📸</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
