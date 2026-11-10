import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  RefreshCw,
  Check,
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { PRESET_AVATARS } from '../utils/avatarUtils';

interface AvatarCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl: string;
  onSaveAvatar: (newAvatarUrl: string) => void;
}

// Helper to center-crop an image into a crisp square 400x400 JPEG
function processImageToSquare(dataUrl: string, size = 400): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export const AvatarCaptureModal: React.FC<AvatarCaptureModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  onSaveAvatar,
}) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'camera' | 'presets'>('gallery');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start camera stream
  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Tu navegador o dispositivo no permite acceso a la cámara.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('No se pudo acceder a la cámara. Por favor concede permisos o sube una foto de tu galería.');
      setIsCameraActive(false);
    }
  };

  // Manage camera lifecycle based on activeTab and modal state
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera(cameraFacing);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, cameraFacing]);

  // Handle file chosen from gallery/file explorer
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          const rawUrl = ev.target.result as string;
          const squareUrl = await processImageToSquare(rawUrl);
          setPreviewUrl(squareUrl);
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Capture instant photo from video stream
  const handleSnapPhoto = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // If front camera, mirror image for natural selfie feel
      if (cameraFacing === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);

      const rawSnap = canvas.toDataURL('image/jpeg', 0.92);
      const squareSnap = await processImageToSquare(rawSnap);
      setPreviewUrl(squareSnap);
      stopCamera();
    }
    setIsProcessing(false);
  };

  // Toggle front/back camera
  const handleSwitchFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
  };

  // Apply selected avatar
  const handleConfirmAvatar = () => {
    if (previewUrl) {
      onSaveAvatar(previewUrl);
      onClose();
    }
  };

  const handleSelectPreset = (url: string) => {
    setPreviewUrl(url);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#14171f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#181c26]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Foto de Perfil</h3>
              <p className="text-xs text-[#8d90a0]">
                Elige de tu galería o tómate una foto en vivo ahora
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation: Galería | Cámara en Vivo | Avatares */}
        <div className="p-3 border-b border-white/5 bg-[#10141d] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setActiveTab('gallery');
            }}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Tu Galería</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              setPreviewUrl(null);
            }}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'camera'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Tomar Foto Ahora</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('presets');
            }}
            className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Avatares</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col items-center justify-center min-h-[300px] max-h-[65vh] overflow-y-auto">
          {/* TAB 1: TU GALERÍA */}
          {activeTab === 'gallery' && (
            <div className="w-full flex flex-col items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="flex flex-col items-center gap-3 animate-in zoom-in-95 duration-150">
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Vista previa de perfil"
                      className="w-40 h-40 rounded-full object-cover ring-4 ring-cyan-500 shadow-2xl shadow-cyan-500/20"
                    />
                    <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  </div>
                  <span className="text-xs text-cyan-300 font-semibold">
                    Vista previa de tu nueva foto de perfil
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-gray-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Elegir otra imagen</span>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/30 p-8 rounded-3xl flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full bg-cyan-500/15 group-hover:bg-cyan-500/25 text-cyan-400 flex items-center justify-center transition-all group-hover:scale-110">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white">
                      Abrir Galería o Archivos
                    </h4>
                    <p className="text-xs text-[#8d90a0] mt-1 max-w-xs">
                      Toca aquí para seleccionar cualquier imagen o foto guardada en tu celular o computadora.
                    </p>
                  </div>
                  <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 mt-1">
                    Examinar fotos...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TOMAR FOTO AHORA (CÁMARA EN VIVO) */}
          {activeTab === 'camera' && (
            <div className="w-full flex flex-col items-center gap-4">
              {cameraError ? (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center flex flex-col items-center gap-2">
                  <p className="text-xs text-rose-200">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => startCamera(cameraFacing)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 cursor-pointer"
                  >
                    Reintentar
                  </button>
                </div>
              ) : previewUrl ? (
                /* Captured photo preview */
                <div className="flex flex-col items-center gap-3 animate-in zoom-in-95 duration-150">
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Foto tomada"
                      className="w-40 h-40 rounded-full object-cover ring-4 ring-emerald-500 shadow-2xl shadow-emerald-500/20"
                    />
                    <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  </div>
                  <span className="text-xs text-emerald-300 font-semibold">
                    ¡Foto capturada con éxito!
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      startCamera(cameraFacing);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-gray-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Tomar otra foto</span>
                  </button>
                </div>
              ) : (
                /* Live Camera Viewfinder with Circular Guide */
                <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden bg-black border border-white/15 flex items-center justify-center shadow-2xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      cameraFacing === 'user' ? '-scale-x-100' : ''
                    }`}
                  />

                  {/* Circular Face Framing Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-44 h-44 rounded-full border-2 border-dashed border-cyan-400/80 shadow-[0_0_20px_rgba(56,189,248,0.4)] animate-pulse" />
                  </div>

                  {/* Top Switch Camera Button */}
                  <button
                    type="button"
                    onClick={handleSwitchFacing}
                    title="Girar cámara (Frontal / Trasera)"
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  {/* Bottom Snap Shutter Button */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleSnapPhoto}
                      disabled={!isCameraActive || isProcessing}
                      className="group relative p-4 rounded-full bg-white text-black shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      title="Tomar foto ahora"
                    >
                      <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white">
                        <Camera className="w-5 h-5 stroke-[2.5]" />
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AVATARES PREESTABLECIDOS */}
          {activeTab === 'presets' && (
            <div className="w-full flex flex-col items-center gap-3">
              <span className="text-xs text-[#8d90a0]">
                O selecciona uno de los avatares oficiales de PidgeX:
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-56 overflow-y-auto p-1">
                {PRESET_AVATARS.map((avatar, idx) => {
                  const isSelected = (previewUrl || currentAvatarUrl) === avatar.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(avatar.url)}
                      className={`relative rounded-full p-1 transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'ring-4 ring-cyan-400 bg-cyan-500/20'
                          : 'ring-1 ring-white/10 hover:ring-white/40'
                      }`}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.name || `Avatar ${idx}`}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#181c26] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-gray-300 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmAvatar}
            disabled={!previewUrl}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Guardar como foto de perfil</span>
          </button>
        </div>
      </div>
    </div>
  );
};
