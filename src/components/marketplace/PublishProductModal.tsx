import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Tag,
  DollarSign,
  MapPin,
  FileText,
  Check,
  Layers,
  HelpCircle,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import {
  MarketplaceCategory,
  MarketplaceProduct,
  ProductCondition,
  UserProfile,
} from '../../types';
import { ensurePhoneStartsWith16 } from '../../utils/phoneUtils';
import { DEFAULT_PIDGEON_AVATAR } from '../../utils/avatarUtils';

interface PublishProductModalProps {
  isOpen: boolean;
  user: UserProfile;
  isNightMode?: boolean;
  onClose: () => void;
  onPublish: (product: Omit<MarketplaceProduct, 'id' | 'createdAt'>) => void;
}

const CATEGORIES: { id: MarketplaceCategory; label: string; icon: string }[] = [
  { id: 'tech', label: 'Tecnología & Móviles', icon: '💻' },
  { id: 'gaming', label: 'Videojuegos & Consolas', icon: '🎮' },
  { id: 'fashion', label: 'Ropa & Calzado', icon: '👕' },
  { id: 'home', label: 'Hogar & Muebles', icon: '🛋️' },
  { id: 'sports', label: 'Deportes & Bicicletas', icon: '🚲' },
  { id: 'vehicles', label: 'Vehículos & Accesorios', icon: '🚗' },
  { id: 'food', label: 'Comida & Alimentos', icon: '🍔' },
  { id: 'books', label: 'Libros & Coleccionables', icon: '📚' },
];

const CONDITIONS: { id: ProductCondition; label: string; desc: string }[] = [
  { id: 'new', label: 'Nuevo', desc: 'Sin abrir, en su empaque original' },
  { id: 'like_new', label: 'Como nuevo', desc: 'Sin detalles de uso, impecable' },
  { id: 'good', label: 'Buen estado', desc: 'Funciona al 100%, desgaste mínimo' },
  { id: 'fair', label: 'Usado aceptable', desc: 'Con marcas de uso pero funcional' },
];

export const PublishProductModal: React.FC<PublishProductModalProps> = ({
  isOpen,
  user,
  isNightMode = false,
  onClose,
  onPublish,
}) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<MarketplaceCategory>('tech');
  const [condition, setCondition] = useState<ProductCondition>('like_new');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Madrid / Tu Ciudad');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stop camera stream if modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('No se pudo acceder a la cámara. Puedes subir una foto desde tu galería.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImageUrl(dataUrl);
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !description.trim()) {
      return;
    }

    const finalImage =
      imageUrl ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

    onPublish({
      title: title.trim(),
      price: parseFloat(price) || 0,
      currency: '$',
      description: description.trim(),
      category,
      condition,
      imageUrl: finalImage,
      location: location.trim() || 'Tu Ubicación',
      sellerId: user.id || 'current_user',
      sellerName: user.name || 'Tú',
      sellerAvatarUrl: user.avatarUrl || DEFAULT_PIDGEON_AVATAR,
      sellerUsername: user.username || '@yo',
      sellerPhone: ensurePhoneStartsWith16(user.phone || '16 600 000 000'),
      isAvailable: true,
    });

    // Reset form
    setTitle('');
    setPrice('');
    setDescription('');
    setImageUrl('');
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg max-h-[92vh] border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-auto ${
          isNightMode
            ? 'bg-[#141822] border-white/10 text-[#dfe2ee]'
            : 'bg-white border-sky-200 text-[#0c2340] shadow-sky-950/20'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isNightMode ? 'bg-[#10141c] border-white/10' : 'bg-sky-50/90 border-sky-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0084ff] to-cyan-400 flex items-center justify-center text-white shadow-md">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`font-bold text-base ${isNightMode ? 'text-white' : 'text-[#0c2340]'}`}>
                Vender en MessengerPidgeon Market
              </h3>
              <p className={`text-[11px] ${isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'}`}>
                Publica tu artículo y chatea con amigos interesados
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isNightMode
                ? 'bg-white/5 hover:bg-white/10 text-[#8d90a0] hover:text-white'
                : 'bg-sky-100/70 hover:bg-sky-200 text-sky-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Photo Section */}
          <div className="flex flex-col gap-2">
            <label className={`text-xs font-bold flex items-center justify-between ${
              isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'
            }`}>
              <span>Foto del producto *</span>
              {imageUrl && (
                <span className="text-[11px] font-normal text-emerald-500 flex items-center gap-1 font-semibold">
                  <Check className="w-3 h-3 stroke-[3]" /> Foto lista
                </span>
              )}
            </label>

            {/* Camera live preview */}
            {isCameraActive ? (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-sky-500/50">
                <video ref={videoRef} playsInline autoPlay className="w-full h-full object-cover" />
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-5 py-2 rounded-full bg-white text-black font-bold text-xs flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#0084ff]" />
                    <span>Tomar Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 rounded-full bg-black/60 text-white text-xs hover:bg-black/80 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : imageUrl ? (
              /* Uploaded / Captured Image Preview */
              <div className={`relative rounded-xl overflow-hidden group aspect-video border ${
                isNightMode ? 'bg-[#0d1017] border-white/10' : 'bg-slate-100 border-sky-200'
              }`}>
                <img
                  src={imageUrl}
                  alt="Vista previa del producto"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 rounded-lg bg-black/80 text-white text-xs font-semibold flex items-center gap-1 hover:bg-black cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Repetir con cámara</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-black/80 text-white text-xs font-semibold flex items-center gap-1 hover:bg-black cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cambiar imagen</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Action Pickers (Camera or File) */
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={startCamera}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed transition-all cursor-pointer group active:scale-[0.98] ${
                    isNightMode
                      ? 'bg-[#1c2230]/70 hover:bg-[#232a3b] border-sky-500/30 text-[#dfe2ee] hover:text-white'
                      : 'bg-sky-50/70 hover:bg-sky-100/70 border-sky-300 text-[#0c2340]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${
                    isNightMode ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-[#0284c7]'
                  }`}>
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold block">Tomar Foto</span>
                    <span className={`text-[10px] ${isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'}`}>
                      Usar cámara ahora
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed transition-all cursor-pointer group active:scale-[0.98] ${
                    isNightMode
                      ? 'bg-[#1c2230]/70 hover:bg-[#232a3b] border-white/15 text-[#dfe2ee] hover:text-white'
                      : 'bg-sky-50/70 hover:bg-sky-100/70 border-sky-300 text-[#0c2340]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${
                    isNightMode ? 'bg-white/5 text-[#8d90a0] group-hover:text-white' : 'bg-sky-100 text-[#476788]'
                  }`}>
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold block">Subir de Galería</span>
                    <span className={`text-[10px] ${isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'}`}>
                      JPG, PNG, WebP
                    </span>
                  </div>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {cameraError && (
              <p className="text-[11px] text-amber-500 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                {cameraError}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-bold flex items-center gap-1 ${
              isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'
            }`}>
              <Tag className={`w-3.5 h-3.5 ${isNightMode ? 'text-sky-400' : 'text-[#0284c7]'}`} />
              <span>Título del artículo *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Nintendo Switch OLED, Auriculares Sony, Bicicleta..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors ${
                isNightMode
                  ? 'bg-[#1c2230] border-white/10 text-white placeholder-[#686c7d] focus:border-[#0084ff]'
                  : 'bg-sky-50/40 border-sky-200 text-[#0c2340] placeholder-slate-400 focus:bg-white focus:border-[#0084ff]'
              }`}
            />
          </div>

          {/* Price & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-bold flex items-center gap-1 ${
                isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'
              }`}>
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>Precio ($) *</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-emerald-500">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={`w-full pl-7 pr-3 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition-colors ${
                    isNightMode
                      ? 'bg-[#1c2230] border-white/10 text-white placeholder-[#686c7d] focus:border-emerald-500'
                      : 'bg-sky-50/40 border-sky-200 text-[#0c2340] placeholder-slate-400 focus:bg-white focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-bold flex items-center gap-1 ${
                isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'
              }`}>
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Ubicación</span>
              </label>
              <input
                type="text"
                placeholder="Ciudad / Zona"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors ${
                  isNightMode
                    ? 'bg-[#1c2230] border-white/10 text-white placeholder-[#686c7d] focus:border-[#0084ff]'
                    : 'bg-sky-50/40 border-sky-200 text-[#0c2340] placeholder-slate-400 focus:bg-white focus:border-[#0084ff]'
                }`}
              />
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-bold flex items-center gap-1 ${
              isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'
            }`}>
              <Layers className={`w-3.5 h-3.5 ${isNightMode ? 'text-sky-400' : 'text-[#0284c7]'}`} />
              <span>Categoría</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs text-left transition-all cursor-pointer border ${
                    category === cat.id
                      ? isNightMode
                        ? 'bg-[#0084ff]/20 text-[#7bd0ff] border-[#0084ff]/40 font-bold shadow-sm'
                        : 'bg-[#0084ff] text-white border-[#0084ff] font-bold shadow-xs'
                      : isNightMode
                      ? 'bg-[#1c2230]/60 text-[#8d90a0] border-white/5 hover:bg-[#1c2230] hover:text-white'
                      : 'bg-sky-50/60 text-[#476788] border-sky-200/80 hover:bg-sky-100 hover:text-[#0c2340]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-bold ${isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'}`}>
              Estado del producto
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CONDITIONS.map((cond) => (
                <button
                  key={cond.id}
                  type="button"
                  onClick={() => setCondition(cond.id)}
                  className={`p-2 rounded-xl text-left transition-all cursor-pointer border flex flex-col ${
                    condition === cond.id
                      ? isNightMode
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-400 font-bold shadow-xs'
                      : isNightMode
                      ? 'bg-[#1c2230]/60 text-[#8d90a0] border-white/5 hover:bg-[#1c2230]'
                      : 'bg-sky-50/60 text-[#476788] border-sky-200/80 hover:bg-sky-100 hover:text-[#0c2340]'
                  }`}
                >
                  <span className="text-xs font-bold">{cond.label}</span>
                  <span className={`text-[10px] ${isNightMode ? 'opacity-75' : 'text-[#476788]'}`}>
                    {cond.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-bold flex items-center gap-1 ${
              isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'
            }`}>
              <FileText className={`w-3.5 h-3.5 ${isNightMode ? 'text-amber-400' : 'text-amber-600'}`} />
              <span>Descripción detallada *</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe detalles de uso, accesorios que incluye, motivo de venta, disponibilidad para entregas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors resize-none ${
                isNightMode
                  ? 'bg-[#1c2230] border-white/10 text-white placeholder-[#686c7d] focus:border-[#0084ff]'
                  : 'bg-sky-50/40 border-sky-200 text-[#0c2340] placeholder-slate-400 focus:bg-white focus:border-[#0084ff]'
              }`}
            />
          </div>

          {/* Action buttons */}
          <div className={`flex items-center gap-2 pt-2 border-t ${
            isNightMode ? 'border-white/10' : 'border-sky-100'
          }`}>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isNightMode
                  ? 'bg-white/5 hover:bg-white/10 text-[#8d90a0] hover:text-white'
                  : 'bg-sky-100 hover:bg-sky-200 text-[#476788] hover:text-[#0c2340]'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !price || !description.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#0084ff] to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Publicar Artículo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
