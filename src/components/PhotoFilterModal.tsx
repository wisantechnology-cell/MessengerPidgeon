import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Upload,
  Image as ImageIcon,
  Camera,
  RefreshCw,
  Trash2,
  Check,
} from 'lucide-react';

interface PhotoFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendPhoto: (
    photoUrl: string,
    caption: string,
    filter: string,
    fileName: string
  ) => void;
  contactName?: string;
}

// Sample gallery illustrations/abstract imagery (no human portrait photos)
const SAMPLE_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    name: 'Atardecer_Montaña.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    name: 'Bosque_Niebla.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    name: 'Galaxia_Cosmica.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
    name: 'Cielo_Estrellado.jpg',
  },
];

export const PhotoFilterModal: React.FC<PhotoFilterModalProps> = ({
  isOpen,
  onClose,
  onSendPhoto,
  contactName = 'Contacto',
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string>(SAMPLE_PHOTOS[0].url);
  const [photoName, setPhotoName] = useState<string>(SAMPLE_PHOTOS[0].name);
  const [caption, setCaption] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start camera
  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    stopCamera();
    try {
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
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setCameraFacing(facing);
    } catch {
      // Fallback if camera is unavailable or denied in iframe
      setIsCameraActive(false);
    }
  };

  const handleCaptureCamera = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // If front camera, flip horizontally
        if (cameraFacing === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setSelectedPhoto(dataUrl);
        setPhotoName(`Camara_${Date.now()}.jpg`);
        stopCamera();
      }
    }
  };

  // Switch front/back camera
  const handleToggleFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    startCamera(nextFacing);
  };

  // Upload file from local device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedPhoto(reader.result);
          setPhotoName(file.name);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = () => {
    if (!selectedPhoto) return;
    onSendPhoto(selectedPhoto, caption.trim(), '', photoName);
    stopCamera();
    setCaption('');
    onClose();
  };

  // Clean up stream on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[#181d28] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#141822]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2563eb]/20 text-[#38bdf8] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 id="photo-modal-title" className="text-sm font-bold text-[#dfe2ee]">
                Enviar Foto
              </h2>
              <p className="text-[11px] text-[#8d90a0]">Para: {contactName}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="Cerrar modal de foto"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#8d90a0] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Main Visual Preview / Live Camera */}
          <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 shadow-inner">
            {isCameraActive ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    cameraFacing === 'user' ? 'scale-x-[-1]' : ''
                  }`}
                />
                {/* Camera controls overlay */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-6 z-20">
                  <button
                    onClick={handleToggleFacing}
                    title="Girar cámara"
                    className="w-11 h-11 rounded-full bg-black/60 text-white border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all active:scale-95"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleCaptureCamera}
                    title="Capturar foto"
                    className="w-16 h-16 rounded-full bg-white p-1 shadow-2xl active:scale-90 transition-all cursor-pointer"
                  >
                    <div className="w-full h-full rounded-full border-2 border-black bg-white flex items-center justify-center" />
                  </button>

                  <button
                    onClick={stopCamera}
                    title="Cancelar cámara"
                    className="w-11 h-11 rounded-full bg-black/60 text-white border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all active:scale-95"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={selectedPhoto}
                  alt={photoName}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Mode Switchers: Camera / Upload from device */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (isCameraActive) {
                  stopCamera();
                } else {
                  startCamera('user');
                }
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isCameraActive
                  ? 'bg-[#2563eb] text-white border-blue-400 shadow-md'
                  : 'bg-[#212634] text-[#dfe2ee] border-white/10 hover:bg-[#2a3042]'
              }`}
            >
              <Camera className="w-4 h-4 text-[#38bdf8]" />
              <span>{isCameraActive ? 'Cámara Activa' : 'Abrir Cámara'}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#212634] hover:bg-[#2a3042] border border-white/10 text-[#dfe2ee] text-xs font-bold transition-all cursor-pointer active:scale-98"
            >
              <Upload className="w-4 h-4 text-[#7bd0ff]" />
              <span>Subir de Galería</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Presets Gallery quick picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#8d90a0]">Fotos de muestra:</span>
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_PHOTOS.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => {
                    stopCamera();
                    setSelectedPhoto(photo.url);
                    setPhotoName(photo.name);
                  }}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedPhoto === photo.url && !isCameraActive
                      ? 'border-[#38bdf8] scale-105 shadow-md ring-2 ring-[#38bdf8]/40'
                      : 'border-white/5 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedPhoto === photo.url && !isCameraActive && (
                    <div className="absolute inset-0 bg-[#38bdf8]/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Caption Input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#dfe2ee]">
              Pie de foto o mensaje (opcional):
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escribe algo sobre esta foto..."
              className="w-full bg-[#0f131c] text-xs text-[#dfe2ee] placeholder:text-[#8d90a0] px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 border-t border-white/5 bg-[#141822] flex items-center justify-between gap-3">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#8d90a0] hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleSend}
            disabled={isCameraActive}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#00a6e0] hover:from-[#1d4ed8] hover:to-[#0284c7] text-white text-xs font-bold shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Foto</span>
          </button>
        </div>
      </div>
    </div>
  );
};
